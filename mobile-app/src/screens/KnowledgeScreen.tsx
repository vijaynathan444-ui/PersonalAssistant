import React, {useMemo, useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import knowledgeService from '../services/KnowledgeService';
import {useAppStore} from '../store/useAppStore';
import type {KnowledgeItem, ProjectMemory} from '../types';

const KnowledgeScreen: React.FC = () => {
  const {
    projects,
    activeProjectId,
    knowledgeItems,
    knowledgeChunks,
    addProject,
    setProjects,
    setActiveProjectId,
    setKnowledgeItems,
    setKnowledgeChunks,
    settings,
  } = useAppStore();

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [researchQuery, setResearchQuery] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const activeProject =
    projects.find(project => project.id === activeProjectId) ?? null;
  const activeItems = useMemo(
    () => knowledgeItems.filter(item => item.projectId === activeProjectId),
    [knowledgeItems, activeProjectId],
  );
  const readyItemCount = activeItems.filter(item => item.status === 'ready').length;

  const updateProjectTimestamp = (project: ProjectMemory | null) => {
    if (!project) {
      return;
    }

    const updatedProjects = projects.map(entry =>
      entry.id === project.id
        ? {
            ...entry,
            updatedAt: Date.now(),
          }
        : entry,
    );
    setProjects(updatedProjects);
  };

  const appendIndexedKnowledge = (item: KnowledgeItem, chunksToAdd: typeof knowledgeChunks) => {
    setKnowledgeItems([...knowledgeItems, item]);
    setKnowledgeChunks([...knowledgeChunks, ...chunksToAdd]);
    updateProjectTimestamp(activeProject);
  };

  const ensureActiveProject = (): ProjectMemory | null => {
    if (activeProject) {
      return activeProject;
    }

    Alert.alert('Create a project first', 'Project memory needs a project container before importing sources.');
    return null;
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      Alert.alert('Project name required', 'Add a short project name before creating it.');
      return;
    }

    const project = knowledgeService.createProject(projectName, projectDescription);
    addProject(project);
    setActiveProjectId(project.id);
    setProjectName('');
    setProjectDescription('');
  };

  const handleImportDocument = async () => {
    const project = ensureActiveProject();
    if (!project) {
      return;
    }

    try {
      setBusyAction('file');
      const file = await knowledgeService.pickDocument();
      const indexed = await knowledgeService.ingestDocument(project.id, file);
      appendIndexedKnowledge(indexed.item, indexed.chunks);
      Alert.alert('Imported', `${indexed.item.title} was added to ${project.name}.`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancel')) {
        return;
      }

      Alert.alert('Import failed', error instanceof Error ? error.message : 'File import failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleImportImage = async () => {
    const project = ensureActiveProject();
    if (!project) {
      return;
    }

    try {
      setBusyAction('image');
      const image = await knowledgeService.pickImage();
      if (!image) {
        return;
      }

      const indexed = await knowledgeService.ingestImage(project.id, image);
      appendIndexedKnowledge(indexed.item, indexed.chunks);
      Alert.alert('Imported', `${indexed.item.title} was saved as an image source.`);
    } catch (error) {
      Alert.alert('Image import failed', error instanceof Error ? error.message : 'Image import failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddWebPage = async () => {
    const project = ensureActiveProject();
    if (!project) {
      return;
    }

    if (!settings.webAccessEnabled) {
      Alert.alert('Web access disabled', 'Enable web access in settings to import web pages or research results.');
      return;
    }

    if (!webUrl.trim()) {
      Alert.alert('URL required', 'Paste a page URL before importing it.');
      return;
    }

    try {
      setBusyAction('web');
      const indexed = await knowledgeService.ingestWebPage(project.id, webUrl);
      appendIndexedKnowledge(indexed.item, indexed.chunks);
      setWebUrl('');
    } catch (error) {
      Alert.alert('Web import failed', error instanceof Error ? error.message : 'Web page import failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleResearchQuery = async () => {
    const project = ensureActiveProject();
    if (!project) {
      return;
    }

    if (!settings.webAccessEnabled) {
      Alert.alert('Web access disabled', 'Enable web access in settings to run web research.');
      return;
    }

    if (!researchQuery.trim()) {
      Alert.alert('Query required', 'Enter a research query before running web search.');
      return;
    }

    try {
      setBusyAction('research');
      const indexed = await knowledgeService.ingestWebSearch(project.id, researchQuery);
      appendIndexedKnowledge(indexed.item, indexed.chunks);
      setResearchQuery('');
    } catch (error) {
      Alert.alert('Research failed', error instanceof Error ? error.message : 'Web research failed.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Project memory</Text>
          <Text style={styles.heroTitle}>Keep files, web notes, and research attached to a project.</Text>
          <Text style={styles.heroText}>
            Chat uses the active project as retrieval context. Ready sources are searchable. Metadata-only
            sources stay visible so you know what still needs deeper extraction.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Create Project</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Project name"
            placeholderTextColor="#6d8aa3"
            value={projectName}
            onChangeText={setProjectName}
          />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Short description, goals, or scope"
            placeholderTextColor="#6d8aa3"
            value={projectDescription}
            onChangeText={setProjectDescription}
            multiline
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateProject}>
            <Text style={styles.primaryButtonText}>Create project</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Projects</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectRow}>
          {projects.map(project => {
            const itemCount = knowledgeItems.filter(item => item.projectId === project.id).length;
            const isActive = project.id === activeProjectId;

            return (
              <TouchableOpacity
                key={project.id}
                style={[styles.projectCard, isActive && styles.projectCardActive]}
                onPress={() => setActiveProjectId(project.id)}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectDescription} numberOfLines={3}>
                  {project.description || 'No description yet.'}
                </Text>
                <Text style={styles.projectMeta}>{itemCount} sources</Text>
              </TouchableOpacity>
            );
          })}
          {projects.length === 0 && (
            <View style={styles.emptyProjectCard}>
              <Text style={styles.emptyProjectTitle}>No projects yet</Text>
              <Text style={styles.emptyProjectText}>Create one above to start building project memory.</Text>
            </View>
          )}
        </ScrollView>

        <Text style={styles.sectionTitle}>Import Sources</Text>
        <View style={styles.card}>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleImportDocument}
              disabled={busyAction !== null}>
              <Text style={styles.secondaryButtonText}>
                {busyAction === 'file' ? 'Importing...' : 'Add file'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleImportImage}
              disabled={busyAction !== null}>
              <Text style={styles.secondaryButtonText}>
                {busyAction === 'image' ? 'Importing...' : 'Add image'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Searchable now: markdown, text, CSV, JSON, DOCX, XLSX, web pages, and web research notes. PDF and
            images are stored in this build as metadata-only sources.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="https://example.com/article"
            placeholderTextColor="#6d8aa3"
            value={webUrl}
            onChangeText={setWebUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAddWebPage}
            disabled={busyAction !== null}>
            <Text style={styles.primaryButtonText}>
              {busyAction === 'web' ? 'Saving web page...' : 'Add web page'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Research query"
            placeholderTextColor="#6d8aa3"
            value={researchQuery}
            onChangeText={setResearchQuery}
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleResearchQuery}
            disabled={busyAction !== null}>
            <Text style={styles.primaryButtonText}>
              {busyAction === 'research' ? 'Researching...' : 'Run web research'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Active Library</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active project</Text>
            <Text style={styles.statValue}>{activeProject?.name ?? 'None'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Searchable</Text>
            <Text style={styles.statValue}>{readyItemCount}</Text>
          </View>
        </View>

        {activeItems.map(item => (
          <View key={item.id} style={styles.libraryCard}>
            <View style={styles.libraryHeader}>
              <View style={styles.statusPillRow}>
                <Text style={styles.libraryTitle}>{item.title}</Text>
                <View style={[styles.statusPill, item.status === 'ready' ? styles.statusReady : styles.statusMuted]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.libraryMeta}>
                {item.sourceType} • {item.fileType} • {item.chunkCount} chunks
              </Text>
            </View>
            <Text style={styles.librarySummary}>{item.summary}</Text>
            <Text style={styles.libraryPreview} numberOfLines={4}>
              {item.preview}
            </Text>
          </View>
        ))}

        {activeItems.length === 0 && (
          <View style={styles.emptyLibraryCard}>
            <Text style={styles.emptyProjectTitle}>Nothing indexed yet</Text>
            <Text style={styles.emptyProjectText}>
              Import files or web content into the active project, then ask chat questions against that memory.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#12324d',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#29597f',
  },
  heroEyebrow: {
    color: '#9dd7ff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  heroText: {
    color: '#c2d7ea',
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: '#d6ecff',
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#11263a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#223d56',
  },
  input: {
    backgroundColor: '#0a1724',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#23435f',
  },
  multilineInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#ff7a59',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#09131d',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1e4665',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#dff3ff',
    fontWeight: '700',
    fontSize: 14,
  },
  helperText: {
    color: '#93b4cf',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  projectRow: {
    gap: 12,
    paddingRight: 8,
  },
  projectCard: {
    width: 220,
    backgroundColor: '#11263a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#223d56',
  },
  projectCardActive: {
    backgroundColor: '#1f3f5d',
    borderColor: '#64b3f4',
  },
  projectName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  projectDescription: {
    color: '#aec8db',
    marginTop: 8,
    lineHeight: 18,
    fontSize: 13,
  },
  projectMeta: {
    color: '#7ec8ff',
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyProjectCard: {
    width: 220,
    backgroundColor: '#11263a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#37536b',
  },
  emptyProjectTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyProjectText: {
    color: '#9fb7c8',
    marginTop: 8,
    lineHeight: 18,
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#11263a',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#223d56',
  },
  statLabel: {
    color: '#8fb1c8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  libraryCard: {
    backgroundColor: '#11263a',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#223d56',
  },
  libraryHeader: {
    marginBottom: 10,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  libraryTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  libraryMeta: {
    color: '#7ea4c1',
    marginTop: 6,
    fontSize: 12,
  },
  librarySummary: {
    color: '#d7e9f7',
    fontSize: 14,
    lineHeight: 20,
  },
  libraryPreview: {
    color: '#9db5c8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusReady: {
    backgroundColor: '#215c40',
  },
  statusMuted: {
    backgroundColor: '#4a3247',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyLibraryCard: {
    marginTop: 4,
    backgroundColor: '#11263a',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#37536b',
  },
});

export default KnowledgeScreen;