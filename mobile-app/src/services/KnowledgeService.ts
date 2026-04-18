import DocumentPicker, {
  type DocumentPickerResponse,
} from 'react-native-document-picker';
import {launchImageLibrary, type Asset} from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import JSZip from 'jszip';

import type {
  KnowledgeChunk,
  KnowledgeCitation,
  KnowledgeFileType,
  KnowledgeItem,
  KnowledgeSourceType,
  ProjectMemory,
} from '../types';

interface IndexedKnowledge {
  item: KnowledgeItem;
  chunks: KnowledgeChunk[];
}

interface KnowledgeSourceInput {
  projectId: string;
  title: string;
  sourceType: KnowledgeSourceType;
  fileType: KnowledgeFileType;
  text?: string;
  uri?: string;
  summaryPrefix?: string;
  errorMessage?: string;
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'has',
  'have',
  'how',
  'in',
  'into',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'this',
  'to',
  'was',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'will',
  'with',
]);

class KnowledgeService {
  createProject(name: string, description: string): ProjectMemory {
    const now = Date.now();

    return {
      id: `project_${now}`,
      name: name.trim(),
      description: description.trim(),
      createdAt: now,
      updatedAt: now,
    };
  }

  async pickDocument(): Promise<DocumentPickerResponse> {
    return DocumentPicker.pickSingle({
      type: [DocumentPicker.types.allFiles],
      copyTo: 'cachesDirectory',
      mode: 'import',
      presentationStyle: 'fullScreen',
    });
  }

  async pickImage(): Promise<Asset | null> {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      includeBase64: false,
    });

    if (result.didCancel || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0] ?? null;
  }

  async ingestDocument(
    projectId: string,
    file: DocumentPickerResponse,
  ): Promise<IndexedKnowledge> {
    const title = file.name ?? 'Imported file';
    const fileType = this.detectFileType(title, file.type);
    const uri = file.fileCopyUri ?? file.uri;

    if (!uri) {
      return this.createIndexedKnowledge({
        projectId,
        title,
        sourceType: 'file',
        fileType,
        errorMessage: 'File URI was not available after import.',
      });
    }

    if (fileType === 'image') {
      return this.createIndexedKnowledge({
        projectId,
        title,
        sourceType: 'image',
        fileType,
        uri,
        summaryPrefix:
          'Image imported. OCR is not enabled in this build, so this item is stored as metadata only.',
      });
    }

    if (fileType === 'pdf') {
      return this.createIndexedKnowledge({
        projectId,
        title,
        sourceType: 'file',
        fileType,
        uri,
        summaryPrefix:
          'PDF imported. Reliable on-device PDF extraction is not enabled in this build, so this item is stored as metadata only.',
      });
    }

    try {
      const text = await this.extractFileText(uri, fileType);
      return this.createIndexedKnowledge({
        projectId,
        title,
        sourceType: 'file',
        fileType,
        text,
        uri,
      });
    } catch (error) {
      return this.createIndexedKnowledge({
        projectId,
        title,
        sourceType: 'file',
        fileType,
        uri,
        errorMessage:
          error instanceof Error ? error.message : 'Failed to process file.',
      });
    }
  }

  async ingestImage(projectId: string, image: Asset): Promise<IndexedKnowledge> {
    const title = image.fileName ?? 'Image';

    return this.createIndexedKnowledge({
      projectId,
      title,
      sourceType: 'image',
      fileType: 'image',
      uri: image.uri,
      summaryPrefix:
        'Image imported. OCR is not enabled in this build, so this item is stored as metadata only.',
    });
  }

  async ingestWebPage(projectId: string, url: string): Promise<IndexedKnowledge> {
    const targetUrl = url.trim();
    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const text = this.extractTextFromHtml(html);

    return this.createIndexedKnowledge({
      projectId,
      title: this.extractPageTitle(html) || targetUrl,
      sourceType: 'web-page',
      fileType: 'html',
      text,
      uri: targetUrl,
    });
  }

  async ingestWebSearch(projectId: string, query: string): Promise<IndexedKnowledge> {
    const trimmed = query.trim();
    const endpoint =
      `https://api.duckduckgo.com/?q=${encodeURIComponent(trimmed)}` +
      '&format=json&no_redirect=1&no_html=1&skip_disambig=0';
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      Heading?: string;
      AbstractText?: string;
      RelatedTopics?: Array<{Text?: string} | {Topics?: Array<{Text?: string}>}>;
    };

    const related = (payload.RelatedTopics ?? []).flatMap(item => {
      if ('Topics' in item && item.Topics) {
        return item.Topics.map(topic => topic.Text).filter(Boolean) as string[];
      }

      return 'Text' in item && item.Text ? [item.Text] : [];
    });

    const sections = [
      payload.Heading ? `Heading: ${payload.Heading}` : '',
      payload.AbstractText ? `Summary: ${payload.AbstractText}` : '',
      related.length > 0 ? `Related notes:\n- ${related.slice(0, 8).join('\n- ')}` : '',
    ].filter(Boolean);

    const text = sections.join('\n\n').trim();

    return this.createIndexedKnowledge({
      projectId,
      title: `Web research: ${trimmed}`,
      sourceType: 'web-search',
      fileType: 'html',
      text,
      uri: endpoint,
    });
  }

  getRelevantContext(
    projectId: string | null,
    query: string,
    items: KnowledgeItem[],
    chunks: KnowledgeChunk[],
    topK: number,
  ): KnowledgeCitation[] {
    if (!projectId || !query.trim()) {
      return [];
    }

    const tokens = this.tokenize(query);
    if (tokens.length === 0) {
      return [];
    }

    return chunks
      .filter(chunk => chunk.projectId === projectId)
      .map(chunk => {
        const overlap = chunk.keywords.filter(keyword => tokens.includes(keyword)).length;
        const exactBonus = chunk.text.toLowerCase().includes(query.trim().toLowerCase()) ? 3 : 0;
        const densityBonus = Math.min(chunk.keywords.length, 12) / 12;
        const score = overlap * 2 + exactBonus + densityBonus;
        const item = items.find(entry => entry.id === chunk.itemId);

        if (!item || score <= 0) {
          return null;
        }

        return {
          itemId: item.id,
          title: item.title,
          sourceType: item.sourceType,
          fileType: item.fileType,
          excerpt: chunk.text,
          score,
        } satisfies KnowledgeCitation;
      })
      .filter(Boolean)
      .sort((left, right) => (right?.score ?? 0) - (left?.score ?? 0))
      .slice(0, topK) as KnowledgeCitation[];
  }

  detectFileType(fileName: string, mimeType?: string | null): KnowledgeFileType {
    const lower = fileName.toLowerCase();
    const lowerMime = mimeType?.toLowerCase() ?? '';

    if (lower.endsWith('.md') || lowerMime.includes('markdown')) return 'md';
    if (lower.endsWith('.txt') || lowerMime.startsWith('text/plain')) return 'txt';
    if (lower.endsWith('.csv') || lowerMime.includes('csv')) return 'csv';
    if (lower.endsWith('.json') || lowerMime.includes('json')) return 'json';
    if (lower.endsWith('.docx') || lowerMime.includes('wordprocessingml')) return 'docx';
    if (lower.endsWith('.xlsx') || lowerMime.includes('spreadsheetml')) return 'xlsx';
    if (lower.endsWith('.pdf') || lowerMime.includes('pdf')) return 'pdf';
    if (
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.webp') ||
      lowerMime.startsWith('image/')
    ) {
      return 'image';
    }

    return 'unknown';
  }

  extractTextFromHtml(html: string): string {
    const withoutScripts = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ');

    return this.normalizeText(
      withoutScripts
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&#39;/gi, "'")
        .replace(/&quot;/gi, '"'),
    );
  }

  private async extractFileText(
    uri: string,
    fileType: KnowledgeFileType,
  ): Promise<string> {
    const path = this.normalizeLocalPath(uri);

    if (fileType === 'md' || fileType === 'txt' || fileType === 'csv' || fileType === 'json') {
      const text = await RNFS.readFile(path, 'utf8');
      return this.normalizeText(text);
    }

    if (fileType === 'docx') {
      const base64 = await RNFS.readFile(path, 'base64');
      return this.extractDocxText(base64);
    }

    if (fileType === 'xlsx') {
      const base64 = await RNFS.readFile(path, 'base64');
      return this.extractXlsxText(base64);
    }

    throw new Error('This file type is not indexed in the current build.');
  }

  private async extractDocxText(base64: string): Promise<string> {
    const zip = await JSZip.loadAsync(base64, {base64: true});
    const file = zip.file('word/document.xml');

    if (!file) {
      throw new Error('DOCX document.xml was not found.');
    }

    const xml = await file.async('text');
    const text = xml
      .replace(/<w:p[^>]*>/g, '\n')
      .replace(/<w:tab\/?\s*>/g, ' ')
      .replace(/<[^>]+>/g, ' ');

    return this.normalizeText(text);
  }

  private async extractXlsxText(base64: string): Promise<string> {
    const zip = await JSZip.loadAsync(base64, {base64: true});
    const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('text');
    const sharedStrings = this.parseSharedStrings(sharedStringsXml ?? '');
    const worksheetFiles = Object.keys(zip.files).filter(name => /xl\/worksheets\/sheet\d+\.xml/.test(name));
    const rows: string[] = [];

    for (const sheetName of worksheetFiles) {
      const xml = await zip.file(sheetName)?.async('text');
      if (!xml) {
        continue;
      }

      const cellValues = Array.from(xml.matchAll(/<c[^>]*?(?:t="(.*?)")?[^>]*>([\s\S]*?)<\/c>/g));
      for (const match of cellValues) {
        const cellType = match[1] ?? '';
        const cellBody = match[2] ?? '';

        if (cellType === 's') {
          const indexMatch = cellBody.match(/<v>(\d+)<\/v>/);
          const sharedIndex = indexMatch ? parseInt(indexMatch[1], 10) : -1;
          if (sharedIndex >= 0 && sharedStrings[sharedIndex]) {
            rows.push(sharedStrings[sharedIndex]);
          }
          continue;
        }

        const inlineString = cellBody.match(/<t[^>]*>([\s\S]*?)<\/t>/);
        if (inlineString?.[1]) {
          rows.push(inlineString[1]);
          continue;
        }

        const value = cellBody.match(/<v>([\s\S]*?)<\/v>/);
        if (value?.[1]) {
          rows.push(value[1]);
        }
      }
    }

    return this.normalizeText(rows.join('\n'));
  }

  private parseSharedStrings(xml: string): string[] {
    return Array.from(xml.matchAll(/<si>([\s\S]*?)<\/si>/g)).map(match =>
      this.normalizeText(match[1].replace(/<[^>]+>/g, ' ')),
    );
  }

  private createIndexedKnowledge(input: KnowledgeSourceInput): IndexedKnowledge {
    const now = Date.now();
    const itemId = `knowledge_${now}_${Math.floor(Math.random() * 1000)}`;
    const text = this.normalizeText(input.text ?? '');
    const hasSearchableText = text.length > 0;
    const chunks = hasSearchableText
      ? this.createChunks(text, input.projectId, itemId)
      : [];
    const summary = input.errorMessage
      ? input.errorMessage
      : input.summaryPrefix || this.summarize(text);

    return {
      item: {
        id: itemId,
        projectId: input.projectId,
        title: input.title,
        sourceType: input.sourceType,
        fileType: input.fileType,
        status: input.errorMessage
          ? 'failed'
          : hasSearchableText
            ? 'ready'
            : 'metadata-only',
        uri: input.uri,
        summary,
        preview: hasSearchableText ? text.slice(0, 220) : summary,
        contentLength: text.length,
        chunkCount: chunks.length,
        createdAt: now,
        updatedAt: now,
        errorMessage: input.errorMessage,
      },
      chunks,
    };
  }

  private createChunks(text: string, projectId: string, itemId: string): KnowledgeChunk[] {
    const maxCharacters = 600;
    const overlapCharacters = 120;
    const chunks: KnowledgeChunk[] = [];
    let start = 0;

    while (start < text.length) {
      const rawChunk = text.slice(start, start + maxCharacters).trim();
      if (rawChunk.length > 0) {
        chunks.push({
          id: `${itemId}_chunk_${chunks.length}`,
          itemId,
          projectId,
          text: rawChunk,
          keywords: this.tokenize(rawChunk),
          tokenEstimate: Math.ceil(rawChunk.length / 4),
        });
      }

      start += maxCharacters - overlapCharacters;
    }

    return chunks;
  }

  private tokenize(text: string): string[] {
    return Array.from(
      new Set(
        text
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(token => token.length > 2 && !STOP_WORDS.has(token)),
      ),
    );
  }

  private normalizeText(text: string): string {
    return text.replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
  }

  private summarize(text: string): string {
    if (!text) {
      return 'This item was saved without searchable text.';
    }

    const sentence = text.split(/(?<=[.!?])\s+/)[0] ?? text;
    return sentence.slice(0, 180).trim();
  }

  private extractPageTitle(html: string): string {
    const match = html.match(/<title>([\s\S]*?)<\/title>/i);
    return this.normalizeText(match?.[1] ?? '');
  }

  private normalizeLocalPath(uri: string): string {
    return uri.startsWith('file://') ? uri.replace('file://', '') : uri;
  }
}

export const knowledgeService = new KnowledgeService();
export default knowledgeService;