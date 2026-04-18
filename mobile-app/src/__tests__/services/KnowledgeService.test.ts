import knowledgeService from '../../services/KnowledgeService';
import type {KnowledgeChunk, KnowledgeItem} from '../../types';

describe('KnowledgeService', () => {
  describe('detectFileType', () => {
    it('should detect supported document types', () => {
      expect(knowledgeService.detectFileType('notes.md')).toBe('md');
      expect(knowledgeService.detectFileType('report.docx')).toBe('docx');
      expect(knowledgeService.detectFileType('sheet.xlsx')).toBe('xlsx');
      expect(knowledgeService.detectFileType('photo.png')).toBe('image');
    });
  });

  describe('extractTextFromHtml', () => {
    it('should remove tags, scripts, and styles', () => {
      const html = `
        <html>
          <head>
            <style>body { color: red; }</style>
            <script>console.log('ignore');</script>
            <title>Example</title>
          </head>
          <body>
            <h1>Hello</h1>
            <p>World &amp; beyond</p>
          </body>
        </html>
      `;

      const text = knowledgeService.extractTextFromHtml(html).replace(/\s+/g, ' ');
      expect(text).toContain('Hello World & beyond');
    });
  });

  describe('getRelevantContext', () => {
    it('should rank matching chunks for the active project only', () => {
      const items: KnowledgeItem[] = [
        {
          id: 'item_1',
          projectId: 'project_1',
          title: 'Deployment Guide',
          sourceType: 'file',
          fileType: 'md',
          status: 'ready',
          summary: 'Deployment instructions',
          preview: 'Use release build with optimized threading.',
          contentLength: 48,
          chunkCount: 1,
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'item_2',
          projectId: 'project_2',
          title: 'Other Project',
          sourceType: 'file',
          fileType: 'md',
          status: 'ready',
          summary: 'Other project summary',
          preview: 'Unrelated',
          contentLength: 9,
          chunkCount: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      ];
      const chunks: KnowledgeChunk[] = [
        {
          id: 'chunk_1',
          itemId: 'item_1',
          projectId: 'project_1',
          text: 'Use release build with optimized threading for Android deployment.',
          keywords: ['release', 'build', 'optimized', 'threading', 'android', 'deployment'],
          tokenEstimate: 10,
        },
        {
          id: 'chunk_2',
          itemId: 'item_2',
          projectId: 'project_2',
          text: 'Unrelated information.',
          keywords: ['unrelated', 'information'],
          tokenEstimate: 3,
        },
      ];

      const citations = knowledgeService.getRelevantContext(
        'project_1',
        'How should I optimize Android release build threading?',
        items,
        chunks,
        3,
      );

      expect(citations).toHaveLength(1);
      expect(citations[0].title).toBe('Deployment Guide');
    });
  });
});