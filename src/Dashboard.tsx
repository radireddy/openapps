import React, { useState, useEffect, useCallback, useRef } from 'react';
import { storageService } from '@/storageService';
import { AppMetadata, AppDefinition, GlobalTheme, AppTemplate, WidgetDefinition } from './types';
import { ComponentTemplate } from '@/components/component-templates/types';
import { WidgetCard } from '@/components/WidgetCard';
import { findWidgetUsages, WidgetUsage } from '@/utils/widgetUsageChecker';
import { CreateAppModal } from './CreateAppModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { RenameAppModal } from './RenameAppModal';
import { ThemeEditorModalNew as ThemeEditorModal } from './components/theme-editor';
import { SaveAsTemplateModal } from './components/SaveAsTemplateModal';
import { TemplateSelectionModal } from './components/TemplateSelectionModal';
import { TemplatePreviewModal } from './components/TemplatePreviewModal';
import { typography } from './constants';
import { ThemeToggle } from '@/theme';
import { generateTheme } from '@/services/ai/themeGenerationService';
import { generateTemplate } from '@/services/ai/templateGenerationService';
import { defaultLightTheme } from '@/theme-presets';
import { generateThumbnail } from '@/utils/generateThumbnail';
import { createRamotionBlogApp } from '@/templates/ramotion-blog-page';


interface DashboardProps {
  onEditApp: (app: AppMetadata) => void;
  onCreateApp: (app: AppMetadata) => void;
  onEditTemplate: (template: AppTemplate) => void;
  onRunApp?: (app: AppMetadata) => void;
  onEditWidget: (widget: WidgetDefinition) => void;
  onCreateWidget: () => void;
}

type DashboardTab = 'apps' | 'templates' | 'presets' | 'widgets' | 'themes';

// --- Helpers ---

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// Gradient colors for card preview headers based on app name hash
const GRADIENTS = [
  'from-blue-500/20 to-indigo-500/20',
  'from-emerald-500/20 to-teal-500/20',
  'from-orange-500/20 to-amber-500/20',
  'from-purple-500/20 to-pink-500/20',
  'from-rose-500/20 to-red-500/20',
  'from-cyan-500/20 to-sky-500/20',
];

function nameToGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

// --- App Card ---

const AppCard: React.FC<{
  app: AppMetadata;
  onEdit: () => void;
  onRun?: () => void;
  onDelete: () => void;
  onRename: () => void;
  onExport: () => void;
  onSaveAsTemplate: () => void;
}> = ({ app, onEdit, onRun, onDelete, onRename, onExport, onSaveAsTemplate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleActionClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  const gradient = nameToGradient(app.name);

  return (
    <div
      className="bg-ed-bg border border-ed-border rounded-xl shadow-ed-card hover:shadow-ed-card-hover ed-card-interactive flex flex-col group cursor-pointer"
      onClick={onEdit}
    >
      {/* Gradient preview header */}
      <div className={`h-24 rounded-t-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-2xl font-bold text-ed-text/20 select-none uppercase tracking-widest">
          {app.name.slice(0, 2)}
        </span>
      </div>

      <div className="p-4 flex-grow">
        <h3 className={`${typography.group} ${typography.bold} text-ed-text mb-1 truncate group-hover:text-ed-accent-text transition-colors`}>
          {app.name}
        </h3>
        <p className={`${typography.caption} text-ed-text-tertiary`}>
          Modified {relativeTime(app.lastModifiedAt)}
        </p>
      </div>

      <div className="border-t border-ed-border px-4 py-2.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover`}
          >
            Open
          </button>
          {onRun && (
            <button
              onClick={(e) => { e.stopPropagation(); onRun(); }}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-secondary border border-ed-border rounded-md hover:bg-ed-bg-hover`}
              title="Run app"
            >
              Run
            </button>
          )}
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            className="p-1.5 text-ed-text-secondary hover:bg-ed-bg-hover rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {isMenuOpen && (
            <div
              className="absolute bottom-full right-0 mb-2 w-48 bg-ed-bg rounded-lg shadow-ed-dropdown border border-ed-border z-10 py-1 animate-ed-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onRename); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Rename</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onSaveAsTemplate); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Save as Template</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onExport); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Export</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onDelete); }} className={`block px-4 py-2 ${typography.body} text-ed-danger hover:bg-ed-danger-muted`}>Delete</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Template Card ---

const TemplateCard: React.FC<{
  template: AppTemplate;
  onUse: () => void;
  onDelete: () => void;
  onExport: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onEditInEditor: () => void;
}> = ({ template, onUse, onDelete, onExport, onEdit, onPreview, onEditInEditor }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleActionClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  const gradient = nameToGradient(template.name);

  return (
    <div className="bg-ed-bg border border-ed-border rounded-xl shadow-ed-card hover:shadow-ed-card-hover ed-card-interactive flex flex-col group relative">
      {/* Thumbnail or gradient fallback — click opens preview */}
      <div className="cursor-pointer" onClick={onPreview}>
        {template.imageUrl ? (
          <div className="aspect-video bg-ed-bg-tertiary rounded-t-xl overflow-hidden">
            <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        ) : (
          <div className={`aspect-video rounded-t-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <svg className="w-10 h-10 text-ed-text/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className={`${typography.group} ${typography.bold} text-ed-text mb-1 truncate`}>{template.name}</h3>
        <p className={`${typography.caption} text-ed-text-secondary flex-grow line-clamp-2`}>{template.description}</p>
      </div>
      <div className="border-t border-ed-border px-3 py-2.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={onUse} className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover`}>
            Use Template
          </button>
          <button onClick={onPreview} className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-secondary border border-ed-border rounded-md hover:bg-ed-bg-hover`}>
            Preview
          </button>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            className="p-1.5 text-ed-text-secondary hover:bg-ed-bg-hover rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {isMenuOpen && (
            <div
              className="absolute bottom-full right-0 mb-2 w-48 bg-ed-bg rounded-lg shadow-ed-dropdown border border-ed-border z-10 py-1 animate-ed-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onEditInEditor); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Edit in Editor</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onEdit); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Edit Details</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onExport); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Export</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onDelete); }} className={`block px-4 py-2 ${typography.body} text-ed-danger hover:bg-ed-danger-muted`}>Delete</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sparkle Icon ---
const SparkleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

// --- AI Suggestion Pills ---
const AI_SUGGESTIONS = ['Contact form', 'Dashboard', 'Settings page', 'E-commerce storefront'];

// --- Dashboard Component ---

export const Dashboard: React.FC<DashboardProps> = ({ onEditApp, onCreateApp, onEditTemplate, onRunApp, onEditWidget, onCreateWidget }) => {
  const [apps, setApps] = useState<AppMetadata[]>([]);
  const [themes, setThemes] = useState<GlobalTheme[]>([]);
  const [templates, setTemplates] = useState<AppTemplate[]>([]);
  const [widgets, setWidgets] = useState<WidgetDefinition[]>([]);
  const [customPresets, setCustomPresets] = useState<ComponentTemplate[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<AppMetadata | null>(null);
  const [appToRename, setAppToRename] = useState<AppMetadata | null>(null);
  const [widgetToRename, setWidgetToRename] = useState<WidgetDefinition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const themeFileInputRef = useRef<HTMLInputElement>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const widgetFileInputRef = useRef<HTMLInputElement>(null);
  const presetFileInputRef = useRef<HTMLInputElement>(null);

  const [themeToEdit, setThemeToEdit] = useState<GlobalTheme | null>(null);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [isTemplateSelectionOpen, setIsTemplateSelectionOpen] = useState(false);
  const [appToSaveAsTemplate, setAppToSaveAsTemplate] = useState<AppMetadata | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<AppTemplate | null>(null);
  const [widgetToDelete, setWidgetToDelete] = useState<WidgetDefinition | null>(null);
  const [widgetDeleteUsages, setWidgetDeleteUsages] = useState<WidgetUsage[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AppTemplate | null>(null);

  const [aiThemePrompt, setAiThemePrompt] = useState('');
  const [aiThemeLoading, setAiThemeLoading] = useState(false);

  const [aiTemplatePrompt, setAiTemplatePrompt] = useState('');
  const [aiTemplateLoading, setAiTemplateLoading] = useState(false);
  const [aiTemplateError, setAiTemplateError] = useState('');
  const [templateToEdit, setTemplateToEdit] = useState<AppTemplate | null>(null);
  const [templateToPreview, setTemplateToPreview] = useState<AppTemplate | null>(null);
  const [templateAppDef, setTemplateAppDef] = useState<AppDefinition | null>(null);

  // New state for redesign
  const [activeTab, setActiveTab] = useState<DashboardTab>('apps');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiHeroPrompt, setAiHeroPrompt] = useState('');
  const [aiHeroLoading, setAiHeroLoading] = useState(false);
  const [aiHeroError, setAiHeroError] = useState('');

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    const [appMetadatas, globalThemes, appTemplates, widgetDefs, presetDefs] = await Promise.all([
      storageService.getAllAppsMetadata(),
      storageService.getAllThemes(),
      storageService.getAllTemplates(),
      storageService.getAllWidgetDefinitions(),
      storageService.getAllCustomPresets(),
    ]);
    appMetadatas.sort((a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime());
    setApps(appMetadatas);
    setThemes(globalThemes);
    // Add built-in templates
    const builtInTemplates: AppTemplate[] = [
      {
        id: 'builtin_ramotion_blog',
        name: 'Ramotion Blog Page',
        description: 'A professional blog article page inspired by Ramotion.com — with navigation, two-column layout, rich markdown content, images, and footer.',
        imageUrl: '',
        appDefinition: createRamotionBlogApp(),
      },
    ];
    const allTemplates = [...builtInTemplates, ...appTemplates];
    setTemplates(allTemplates);
    widgetDefs.sort((a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime());
    setWidgets(widgetDefs);
    setCustomPresets(presetDefs);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- AI Hero: auto-name and create app directly ---
  const handleAIHeroGenerate = async (prompt: string) => {
    if (!prompt.trim() || aiHeroLoading) return;
    setAiHeroLoading(true);
    setAiHeroError('');
    try {
      const template = await generateTemplate(prompt.trim());
      const appName = template.name || 'AI Generated App';
      const newApp = await storageService.createApp(appName, template.appDefinition);
      setAiHeroPrompt('');
      onCreateApp(newApp);
    } catch (err) {
      console.error('AI app generation failed:', err);
      setAiHeroError('Generation failed. Please try again.');
    } finally {
      setAiHeroLoading(false);
    }
  };

  const handleCreateNewApp = async (appName: string) => {
    const appDefToUse = selectedTemplate ? selectedTemplate.appDefinition : undefined;
    const newApp = await storageService.createApp(appName, appDefToUse);
    setIsCreateModalOpen(false);
    setSelectedTemplate(null);
    onCreateApp(newApp);
  };

  const handleConfirmDelete = async () => {
    if (!appToDelete) return;
    await storageService.deleteApp(appToDelete.id);
    setApps(prevApps => prevApps.filter(app => app.id !== appToDelete.id));
    setAppToDelete(null);
  };

  const handleRenameApp = async (newName: string) => {
    if (!appToRename) return;
    await storageService.renameApp(appToRename.id, newName);
    setAppToRename(null);
    fetchAllData();
  };

  const handleRenameWidget = async (newName: string) => {
    if (!widgetToRename) return;
    const updated: WidgetDefinition = { ...widgetToRename, name: newName, lastModifiedAt: new Date().toISOString() };
    await storageService.saveWidgetDefinition(updated);
    setWidgetToRename(null);
    fetchAllData();
  };

  const handleExportSingleApp = async (app: AppMetadata) => {
    const jsonString = await storageService.exportSingleApp(app.id);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const sanitizedAppName = app.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.href = url;
    a.download = `${sanitizedAppName}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    const jsonString = await storageService.exportAllApps();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini_apps_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const data = JSON.parse(text);

      // Smart detection: if it's an AppTemplate (has appDefinition key), extract and import as app
      if (!Array.isArray(data) && data.appDefinition && data.appDefinition.components) {
        const appDefJson = JSON.stringify(data.appDefinition);
        await storageService.importApps(appDefJson);
        alert('Template imported as a new app!');
      } else if (Array.isArray(data) && data.length > 0 && data[0].appDefinition) {
        // Array of AppTemplates — extract each appDefinition
        const appDefs = data.map((t: AppTemplate) => t.appDefinition);
        await storageService.importApps(JSON.stringify(appDefs));
        alert(`${data.length} template(s) imported as new apps!`);
      } else {
        const isArray = Array.isArray(data);
        await storageService.importApps(text);
        const message = isArray
          ? `${data.length} app(s) imported successfully as new apps!`
          : 'App imported successfully as a new app!';
        alert(message);
      }
      fetchAllData();
    } catch (error) {
      console.error("Failed to import apps:", error);
      alert(`Failed to import apps. Please make sure the file is valid. Error: ${error}`);
    }
    event.target.value = '';
  };

  const handleSaveTheme = async (theme: GlobalTheme) => {
    await storageService.saveTheme(theme);
    setIsThemeEditorOpen(false);
    setThemeToEdit(null);
    fetchAllData();
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (window.confirm("Are you sure you want to delete this theme? This cannot be undone.")) {
      await storageService.deleteTheme(themeId);
      fetchAllData();
    }
  };

  // Fetch app definition when "Save as Template" modal opens
  useEffect(() => {
    if (appToSaveAsTemplate && appToSaveAsTemplate.id !== '__blank__') {
      storageService.getApp(appToSaveAsTemplate.id).then(def => setTemplateAppDef(def));
    } else {
      setTemplateAppDef(null);
    }
  }, [appToSaveAsTemplate]);

  const handleSaveAsTemplate = async (templateData: Omit<AppTemplate, 'id' | 'appDefinition'>) => {
    if (!appToSaveAsTemplate) return;

    let appDef: AppDefinition | null;
    if (appToSaveAsTemplate.id === '__blank__') {
      // Create a blank AppDefinition for a new empty template
      const defaultPageId = `page_${Date.now()}`;
      appDef = {
        id: '',
        name: templateData.name,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        pages: [{ id: defaultPageId, name: 'Main Page' }],
        mainPageId: defaultPageId,
        components: [],
        dataStore: { selectedRecord: null },
        variables: [],
        theme: defaultLightTheme,
      };
    } else {
      appDef = await storageService.getApp(appToSaveAsTemplate.id);
    }
    if (!appDef) return;

    await storageService.saveTemplate({
      ...templateData,
      id: `template_${Date.now()}`,
      appDefinition: appDef,
    });
    setAppToSaveAsTemplate(null);
    fetchAllData();
  };

  const handleConfirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    await storageService.deleteTemplate(templateToDelete.id);
    setTemplateToDelete(null);
    fetchAllData();
  };

  const handleSelectTemplate = (template: AppTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateSelectionOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleAIThemeGenerate = async () => {
    if (!aiThemePrompt.trim() || aiThemeLoading) return;
    setAiThemeLoading(true);
    try {
      const result = await generateTheme(aiThemePrompt.trim());
      setAiThemePrompt('');
      setThemeToEdit(result);
      setIsThemeEditorOpen(true);
    } catch (err) {
      console.error('AI theme generation failed:', err);
    } finally {
      setAiThemeLoading(false);
    }
  };

  // --- Template Handlers ---

  const handleAITemplateGenerate = async () => {
    if (!aiTemplatePrompt.trim() || aiTemplateLoading) return;
    setAiTemplateLoading(true);
    setAiTemplateError('');
    try {
      const result = await generateTemplate(aiTemplatePrompt.trim());
      // Auto-generate thumbnail from the AI result
      let thumbnailUrl = '';
      try {
        thumbnailUrl = await generateThumbnail(result.appDefinition);
      } catch {
        // Thumbnail generation is best-effort; fall back to empty
      }
      const template: AppTemplate = {
        id: `template_${Date.now()}`,
        name: result.name || 'AI Generated Template',
        description: result.description || aiTemplatePrompt.trim(),
        imageUrl: thumbnailUrl,
        appDefinition: result.appDefinition,
      };
      await storageService.saveTemplate(template);
      setAiTemplatePrompt('');
      fetchAllData();
    } catch (err) {
      console.error('AI template generation failed:', err);
      setAiTemplateError('Generation failed. Please try again.');
    } finally {
      setAiTemplateLoading(false);
    }
  };

  const handleNewBlankTemplate = () => {
    setAppToSaveAsTemplate({ id: '__blank__', name: 'New Template', createdAt: '', lastModifiedAt: '' });
  };

  const handleExportSingleTemplate = async (template: AppTemplate) => {
    const jsonString = await storageService.exportTemplate(template.id);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const sanitizedName = template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.href = url;
    a.download = `${sanitizedName}_template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAllTemplates = async () => {
    const jsonString = await storageService.exportAllTemplates();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `templates_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTemplateFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      await storageService.importTemplates(text);
      alert('Template(s) imported successfully!');
      fetchAllData();
    } catch (error) {
      console.error("Failed to import templates:", error);
      alert(`Failed to import templates. Please make sure the file is valid. Error: ${error}`);
    }
    event.target.value = '';
  };

  const handleUpdateTemplateMetadata = async (templateData: Omit<AppTemplate, 'id' | 'appDefinition'>) => {
    if (!templateToEdit) return;
    try {
      await storageService.saveTemplate({
        ...templateToEdit,
        name: templateData.name,
        description: templateData.description,
        imageUrl: templateData.imageUrl,
      });
      setTemplateToEdit(null);
      fetchAllData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update template.');
    }
  };

  const handleThemeFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      let globalTheme: GlobalTheme;
      if (parsed.theme && parsed.name && parsed.type) {
        globalTheme = {
          ...parsed,
          id: `theme_${Date.now()}`,
          createdAt: new Date().toISOString(),
          lastModifiedAt: new Date().toISOString(),
        };
      } else if (parsed.colors && parsed.font && parsed.border && parsed.radius && parsed.spacing) {
        globalTheme = {
          id: `theme_${Date.now()}`,
          name: file.name.replace(/\.json$/i, ''),
          type: 'light',
          theme: parsed,
          createdAt: new Date().toISOString(),
          lastModifiedAt: new Date().toISOString(),
        };
      } else {
        alert('Invalid theme file. Expected a theme JSON with colors, font, border, radius, and spacing properties.');
        return;
      }
      await storageService.saveTheme(globalTheme);
      fetchAllData();
    } catch {
      alert('Invalid JSON file.');
    }
    event.target.value = '';
  };

  // --- Widget Handlers ---

  const handleDeleteWidget = async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    const usages = await findWidgetUsages(widgetId);
    setWidgetDeleteUsages(usages);
    setWidgetToDelete(widget);
  };

  const handleConfirmDeleteWidget = async () => {
    if (!widgetToDelete) return;
    await storageService.deleteWidgetDefinition(widgetToDelete.id);
    setWidgetToDelete(null);
    setWidgetDeleteUsages([]);
    fetchAllData();
  };

  const handleDuplicateWidget = async (widget: WidgetDefinition) => {
    const copy: WidgetDefinition = {
      ...JSON.parse(JSON.stringify(widget)),
      id: `widget_${Date.now()}`,
      name: `${widget.name} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };
    await storageService.saveWidgetDefinition(copy);
    fetchAllData();
  };

  const handleExportWidget = async (widget: WidgetDefinition) => {
    const jsonString = await storageService.exportWidgetDefinition(widget.id);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const sanitizedName = widget.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.href = url;
    a.download = `${sanitizedName}_widget.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleWidgetFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      await storageService.importWidgetDefinitions(text);
      alert('Widget(s) imported successfully!');
      fetchAllData();
    } catch (error) {
      console.error("Failed to import widgets:", error);
      alert(`Failed to import widgets. Please make sure the file is valid. Error: ${error}`);
    }
    event.target.value = '';
  };

  // --- Preset handlers ---

  const handleDeletePreset = async (id: string) => {
    await storageService.deleteCustomPreset(id);
    setCustomPresets(prev => prev.filter(p => p.id !== id));
  };

  const handleRenamePreset = async (id: string, newName: string) => {
    const updated = await storageService.renameCustomPreset(id, newName);
    setCustomPresets(prev => prev.map(p => p.id === id ? updated : p));
  };

  const handleExportPreset = async (id: string) => {
    const json = await storageService.exportCustomPreset(id);
    const preset = customPresets.find(p => p.id === id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preset-${preset?.name || id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllPresets = async () => {
    const json = await storageService.exportAllCustomPresets();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-presets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePresetFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      await storageService.importCustomPresets(text);
      const updated = await storageService.getAllCustomPresets();
      setCustomPresets(updated);
    } catch (error) {
      console.error("Failed to import presets:", error);
      alert(`Failed to import presets. Please make sure the file is valid. Error: ${error}`);
    }
    e.target.value = '';
  };

  // --- Filtering ---
  const query = searchQuery.toLowerCase();
  const filteredApps = query ? apps.filter(a => a.name.toLowerCase().includes(query)) : apps;
  const filteredTemplates = query ? templates.filter(t => t.name.toLowerCase().includes(query)) : templates;
  const filteredWidgets = query ? widgets.filter(w => w.name.toLowerCase().includes(query) || w.tags.some(t => t.toLowerCase().includes(query))) : widgets;
  const filteredThemes = query ? themes.filter(t => t.name.toLowerCase().includes(query)) : themes;
  const filteredPresets = query ? customPresets.filter(p => p.name.toLowerCase().includes(query)) : customPresets;

  // --- Tab action buttons ---
  const renderTabAction = () => {
    switch (activeTab) {
      case 'apps':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsTemplateSelectionOpen(true); }}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-secondary border border-ed-border rounded-lg hover:bg-ed-bg-hover`}
            >
              From Template
            </button>
            <button
              onClick={handleImportClick}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-secondary border border-ed-border rounded-lg hover:bg-ed-bg-hover`}
            >
              Import
            </button>
            <button
              onClick={() => { setSelectedTemplate(null); setIsCreateModalOpen(true); }}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-inverse bg-ed-accent rounded-lg hover:bg-ed-accent-hover flex items-center gap-1.5`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New App
            </button>
          </div>
        );
      case 'templates':
        return (
          <div className="flex items-center gap-2">
            {templates.length > 0 && (
              <button
                onClick={handleExportAllTemplates}
                className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-secondary border border-ed-border rounded-lg hover:bg-ed-bg-hover`}
              >
                Export All
              </button>
            )}
            <button
              onClick={() => templateFileInputRef.current?.click()}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-secondary border border-ed-border rounded-lg hover:bg-ed-bg-hover`}
            >
              Import
            </button>
            <button
              onClick={handleNewBlankTemplate}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-inverse bg-ed-accent rounded-lg hover:bg-ed-accent-hover flex items-center gap-1.5`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Template
            </button>
          </div>
        );
      case 'presets':
        return (
          <div className="flex items-center gap-2">
            {customPresets.length > 0 && (
              <button
                onClick={handleExportAllPresets}
                className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-secondary border border-ed-border rounded-lg hover:bg-ed-bg-hover`}
              >
                Export All
              </button>
            )}
            <button
              onClick={() => presetFileInputRef.current?.click()}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-secondary border border-ed-border rounded-lg hover:bg-ed-bg-hover`}
            >
              Import
            </button>
          </div>
        );
      case 'widgets':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => widgetFileInputRef.current?.click()}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-secondary border border-ed-border rounded-lg hover:bg-ed-bg-hover`}
            >
              Import
            </button>
            <button
              onClick={onCreateWidget}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-inverse bg-ed-accent rounded-lg hover:bg-ed-accent-hover flex items-center gap-1.5`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Widget
            </button>
          </div>
        );
      case 'themes':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => themeFileInputRef.current?.click()}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-secondary border border-ed-border rounded-lg hover:bg-ed-bg-hover`}
            >
              Import
            </button>
            <button
              onClick={() => { setThemeToEdit(null); setIsThemeEditorOpen(true); }}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-inverse bg-ed-accent rounded-lg hover:bg-ed-accent-hover flex items-center gap-1.5`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Theme
            </button>
          </div>
        );
    }
  };

  // --- Tab content renderers ---

  const renderAppsContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-ed-bg border border-ed-border rounded-xl overflow-hidden">
              <div className="h-24 ed-skeleton" />
              <div className="p-4">
                <div className="h-5 w-3/4 rounded ed-skeleton mb-2" />
                <div className="h-3 w-1/2 rounded ed-skeleton" />
              </div>
              <div className="border-t border-ed-border px-4 py-2.5">
                <div className="h-8 w-16 rounded ed-skeleton" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredApps.length === 0) {
      return (
        <div className="text-center py-16 px-6 border-2 border-dashed border-ed-border rounded-xl">
          <svg className="mx-auto h-12 w-12 text-ed-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h3 className={`${typography.heading} ${typography.semibold} text-ed-text`}>
            {searchQuery ? 'No matching apps' : 'No applications yet'}
          </h3>
          <p className="mt-2 text-ed-text-secondary">
            {searchQuery ? 'Try a different search term.' : 'Create your first app using AI above or click "+ New App".'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredApps.map(app => (
          <AppCard
            key={app.id}
            app={app}
            onEdit={() => onEditApp(app)}
            onRun={onRunApp ? () => onRunApp(app) : undefined}
            onDelete={() => setAppToDelete(app)}
            onRename={() => setAppToRename(app)}
            onExport={() => handleExportSingleApp(app)}
            onSaveAsTemplate={() => setAppToSaveAsTemplate(app)}
          />
        ))}
      </div>
    );
  };

  const AI_TEMPLATE_SUGGESTIONS = ['Login form', 'Admin dashboard', 'Survey wizard', 'Product catalog'];

  const renderTemplatesContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="bg-ed-bg border border-ed-border rounded-xl p-5">
            <div className="h-5 w-48 rounded ed-skeleton mb-3" />
            <div className="h-20 w-full rounded ed-skeleton" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2].map(i => (
              <div key={i} className="bg-ed-bg border border-ed-border rounded-xl overflow-hidden">
                <div className="aspect-video ed-skeleton" />
                <div className="p-4">
                  <div className="h-5 w-3/4 rounded ed-skeleton mb-2" />
                  <div className="h-4 w-full rounded ed-skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* AI Template Generation Card */}
        <div className="bg-ed-bg border border-ed-border rounded-xl p-5 relative overflow-hidden">
          {aiTemplateLoading && (
            <div className="absolute inset-0 bg-ed-bg/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 rounded-xl">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-ed-border" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#a855f7] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <SparkleIcon className="w-5 h-5 text-[#a855f7]" />
                </div>
              </div>
              <p className={`${typography.body} ${typography.semibold} text-ed-text`}>Generating your template...</p>
              <p className={`${typography.caption} text-ed-text-tertiary`}>AI is crafting components and layout</p>
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#a855f7]/10 flex items-center justify-center flex-shrink-0">
              <SparkleIcon className="w-4 h-4 text-[#a855f7]" />
            </div>
            <div>
              <h3 className={`${typography.body} ${typography.semibold} text-ed-text`}>Generate template with AI</h3>
              <p className={`${typography.caption} text-ed-text-tertiary`}>Describe the template and AI will create it as a reusable starting point</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiTemplatePrompt}
              onChange={(e) => { setAiTemplatePrompt(e.target.value); setAiTemplateError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAITemplateGenerate(); } }}
              placeholder="e.g., A multi-step registration form with progress bar..."
              disabled={aiTemplateLoading}
              className={`flex-1 px-3 py-2 ${typography.body} bg-ed-bg-secondary border border-ed-border rounded-lg text-ed-text placeholder-ed-text-tertiary focus:outline-none focus:ring-2 focus:ring-[#a855f7]/30 focus:border-[#a855f7]/50 disabled:opacity-50`}
            />
            <button
              onClick={handleAITemplateGenerate}
              disabled={aiTemplateLoading || !aiTemplatePrompt.trim()}
              className={`px-4 py-2 ${typography.body} ${typography.semibold} bg-ed-accent text-ed-text-inverse rounded-lg hover:bg-ed-accent-hover disabled:opacity-50 flex items-center gap-2 transition-colors flex-shrink-0`}
            >
              <SparkleIcon className="w-4 h-4" />
              Generate
            </button>
          </div>
          {aiTemplateError && (
            <p className={`mt-2 ${typography.body} text-ed-danger`}>{aiTemplateError}</p>
          )}
          {/* Suggestion pills */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`${typography.caption} text-ed-text-tertiary`}>Try:</span>
            {AI_TEMPLATE_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => { setAiTemplatePrompt(suggestion); }}
                disabled={aiTemplateLoading}
                className={`px-3 py-1 ${typography.caption} text-ed-text-secondary bg-ed-bg-secondary border border-ed-border rounded-full hover:border-ed-accent/50 hover:text-ed-accent-text transition-colors disabled:opacity-50`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Templates grid */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handleSelectTemplate(template)}
                onDelete={() => setTemplateToDelete(template)}
                onExport={() => handleExportSingleTemplate(template)}
                onEdit={() => setTemplateToEdit(template)}
                onPreview={() => setTemplateToPreview(template)}
                onEditInEditor={() => onEditTemplate(template)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 border-2 border-dashed border-ed-border rounded-xl">
            <svg className="mx-auto h-12 w-12 text-ed-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
            </svg>
            <h3 className={`${typography.heading} ${typography.semibold} text-ed-text`}>
              {searchQuery ? 'No matching templates' : 'No templates yet'}
            </h3>
            <p className="mt-2 text-ed-text-secondary">
              {searchQuery ? 'Try a different search term.' : 'Generate a template with AI above, create a new one, or import from a file.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderThemesContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {/* AI theme generate skeleton */}
          <div className="bg-ed-bg border border-ed-border rounded-xl p-5">
            <div className="h-5 w-48 rounded ed-skeleton mb-3" />
            <div className="h-20 w-full rounded ed-skeleton" />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* AI Theme Generation Card */}
        <div className="bg-ed-bg border border-ed-border rounded-xl p-5 relative overflow-hidden">
          {aiThemeLoading && (
            <div className="absolute inset-0 bg-ed-bg/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 rounded-xl">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-ed-border" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#a855f7] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <SparkleIcon className="w-5 h-5 text-[#a855f7]" />
                </div>
              </div>
              <p className={`${typography.body} ${typography.semibold} text-ed-text`}>Generating your theme...</p>
              <p className={`${typography.caption} text-ed-text-tertiary`}>AI is crafting colors, typography, and tokens</p>
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#a855f7]/10 flex items-center justify-center flex-shrink-0">
              <SparkleIcon className="w-4 h-4 text-[#a855f7]" />
            </div>
            <div>
              <h3 className={`${typography.body} ${typography.semibold} text-ed-text`}>Generate with AI</h3>
              <p className={`${typography.caption} text-ed-text-tertiary`}>Describe your theme in natural language</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiThemePrompt}
              onChange={(e) => setAiThemePrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAIThemeGenerate(); } }}
              placeholder="e.g., A warm sunset theme with orange tones, dark background..."
              disabled={aiThemeLoading}
              className={`flex-1 px-3 py-2 ${typography.body} bg-ed-bg-secondary border border-ed-border rounded-lg text-ed-text placeholder-ed-text-tertiary focus:outline-none focus:ring-2 focus:ring-[#a855f7]/30 focus:border-[#a855f7]/50 disabled:opacity-50`}
            />
            <button
              onClick={handleAIThemeGenerate}
              disabled={aiThemeLoading || !aiThemePrompt.trim()}
              className={`px-4 py-2 ${typography.body} ${typography.semibold} bg-ed-accent text-ed-text-inverse rounded-lg hover:bg-ed-accent-hover disabled:opacity-50 flex items-center gap-2 transition-colors flex-shrink-0`}
            >
              <SparkleIcon className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>

        {/* Themes list */}
        {filteredThemes.length > 0 ? (
          <div className="bg-ed-bg border border-ed-border rounded-xl shadow-ed-sm">
            <ul role="list" className="divide-y divide-ed-border">
              {filteredThemes.map((theme) => (
                <li key={theme.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-ed-text">{theme.name}</span>
                    <span className={`${typography.caption} ${typography.bold} px-2 py-0.5 rounded-full ${theme.type === 'dark' ? 'bg-ed-bg-surface text-ed-text' : 'bg-ed-bg-tertiary text-ed-text-secondary'}`}>
                      {theme.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => { setThemeToEdit(theme); setIsThemeEditorOpen(true); }} className={`${typography.body} ${typography.medium} text-ed-accent-text hover:text-ed-accent-hover`}>Edit</button>
                    <button onClick={() => handleDeleteTheme(theme.id)} className={`${typography.body} ${typography.medium} text-ed-danger hover:opacity-80`}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-16 px-6 border-2 border-dashed border-ed-border rounded-xl">
            <svg className="mx-auto h-12 w-12 text-ed-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
            </svg>
            <h3 className={`${typography.heading} ${typography.semibold} text-ed-text`}>
              {searchQuery ? 'No matching themes' : 'No themes yet'}
            </h3>
            <p className="mt-2 text-ed-text-secondary">
              {searchQuery ? 'Try a different search term.' : 'Create a global theme to easily apply styles across your apps.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderWidgetsContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-ed-bg border border-ed-border rounded-xl overflow-hidden">
              <div className="h-24 ed-skeleton" />
              <div className="p-4">
                <div className="h-5 w-3/4 rounded ed-skeleton mb-2" />
                <div className="h-3 w-1/2 rounded ed-skeleton" />
              </div>
              <div className="border-t border-ed-border px-4 py-2.5">
                <div className="h-8 w-16 rounded ed-skeleton" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredWidgets.length === 0) {
      return (
        <div className="text-center py-16 px-6 border-2 border-dashed border-ed-border rounded-xl">
          <svg className="mx-auto h-12 w-12 text-ed-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
          <h3 className={`${typography.heading} ${typography.semibold} text-ed-text`}>
            {searchQuery ? 'No matching widgets' : 'No widgets yet'}
          </h3>
          <p className="mt-2 text-ed-text-secondary">
            {searchQuery ? 'Try a different search term.' : 'Create reusable widgets to use across your apps.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredWidgets.map(widget => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            onEdit={() => onEditWidget(widget)}
            onDelete={() => handleDeleteWidget(widget.id)}
            onDuplicate={() => handleDuplicateWidget(widget)}
            onExport={() => handleExportWidget(widget)}
            onRename={() => setWidgetToRename(widget)}
          />
        ))}
      </div>
    );
  };

  // --- Preset card (inline) ---

  const countTemplateComponents = (components: ComponentTemplate['components']): number => {
    let count = 0;
    for (const c of components) {
      count += 1;
      if (c.children) count += countTemplateComponents(c.children);
    }
    return count;
  };

  const PresetCard: React.FC<{ preset: ComponentTemplate }> = ({ preset }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(preset.name);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setIsMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleActionClick = (action: () => void) => {
      action();
      setIsMenuOpen(false);
    };

    const handleRenameSubmit = () => {
      const trimmed = editName.trim();
      if (trimmed && trimmed !== preset.name) {
        handleRenamePreset(preset.id, trimmed);
      }
      setIsEditing(false);
    };

    const gradient = nameToGradient(preset.name);
    const componentCount = countTemplateComponents(preset.components);

    return (
      <div className="bg-ed-bg border border-ed-border rounded-xl shadow-ed-card hover:shadow-ed-card-hover ed-card-interactive flex flex-col group relative">
        {/* Gradient header */}
        <div className={`h-24 rounded-t-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <svg className="w-10 h-10 text-ed-text/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        {/* Body */}
        <div className="p-4 flex-grow flex flex-col">
          {isEditing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setIsEditing(false); }}
              className={`${typography.group} ${typography.bold} text-ed-text mb-1 bg-ed-bg-secondary border border-ed-border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-ed-accent/30 w-full`}
            />
          ) : (
            <h3
              className={`${typography.group} ${typography.bold} text-ed-text mb-1 truncate cursor-pointer`}
              onDoubleClick={() => { setEditName(preset.name); setIsEditing(true); }}
              title="Double-click to rename"
            >
              {preset.name}
            </h3>
          )}
          <p className={`${typography.caption} text-ed-text-secondary flex-grow`}>
            {preset.description || `${componentCount} component${componentCount !== 1 ? 's' : ''}`}
          </p>
          {preset.description && (
            <p className={`${typography.caption} text-ed-text-tertiary mt-1`}>
              {componentCount} component{componentCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {/* Footer */}
        <div className="border-t border-ed-border px-3 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportPreset(preset.id)}
              className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-secondary border border-ed-border rounded-md hover:bg-ed-bg-hover`}
            >
              Export
            </button>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              className="p-1.5 text-ed-text-secondary hover:bg-ed-bg-hover rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {isMenuOpen && (
              <div
                className="absolute bottom-full right-0 mb-2 w-48 bg-ed-bg rounded-lg shadow-ed-dropdown border border-ed-border z-10 py-1 animate-ed-fade-in-up"
                onClick={(e) => e.stopPropagation()}
              >
                <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(() => { setEditName(preset.name); setIsEditing(true); }); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Rename</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(() => handleExportPreset(preset.id)); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Export</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(() => handleDeletePreset(preset.id)); }} className={`block px-4 py-2 ${typography.body} text-ed-danger hover:bg-ed-danger-muted`}>Delete</a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Presets content renderer ---

  const renderPresetsContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-ed-bg border border-ed-border rounded-xl overflow-hidden">
              <div className="h-24 ed-skeleton" />
              <div className="p-4">
                <div className="h-5 w-3/4 rounded ed-skeleton mb-2" />
                <div className="h-3 w-1/2 rounded ed-skeleton" />
              </div>
              <div className="border-t border-ed-border px-4 py-2.5">
                <div className="h-8 w-16 rounded ed-skeleton" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredPresets.length === 0) {
      return (
        <div className="text-center py-16 px-6 border-2 border-dashed border-ed-border rounded-xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-ed-text-tertiary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <h3 className={`${typography.heading} ${typography.semibold} text-ed-text`}>
            {searchQuery ? 'No matching presets' : 'No presets yet'}
          </h3>
          <p className="mt-2 text-ed-text-secondary">
            {searchQuery ? 'Try a different search term.' : 'Right-click any container on the canvas and select "Save as Preset"'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredPresets.map(preset => (
          <PresetCard key={preset.id} preset={preset} />
        ))}
      </div>
    );
  };

  const tabs: { key: DashboardTab; label: string; count: number }[] = [
    { key: 'apps', label: 'My Apps', count: apps.length },
    { key: 'templates', label: 'Templates', count: templates.length },
    { key: 'presets', label: 'Presets', count: customPresets.length },
    { key: 'widgets', label: 'Widgets', count: widgets.length },
    { key: 'themes', label: 'Themes', count: themes.length },
  ];

  return (
    <div className="min-h-screen bg-ed-bg-secondary">
      {/* --- Simplified Header --- */}
      <header className="bg-ed-bg border-b border-ed-border shadow-ed-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-ed-accent" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 15C5.34315 15 4 16.3431 4 18V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V18C20 16.3431 18.6569 15 17 15H7Z" fill="currentColor" opacity="0.4"/>
              <path d="M16.5 3H7.5C6.67157 3 6 3.67157 6 4.5V15H18V4.5C18 3.67157 17.3284 3 16.5 3Z" fill="currentColor"/>
            </svg>
            <h1 className={`${typography.heading} ${typography.bold} text-ed-text`}>App Designer</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              title="Export All Apps"
              className="p-2 text-ed-text-secondary hover:bg-ed-bg-hover rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l4 4m0 0l4-4m-4 4V4" />
              </svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
            <input type="file" ref={themeFileInputRef} accept=".json" onChange={handleThemeFileImport} className="hidden" />
            <input type="file" ref={templateFileInputRef} accept=".json" onChange={handleTemplateFileImport} className="hidden" />
            <input type="file" ref={widgetFileInputRef} accept=".json" onChange={handleWidgetFileImport} className="hidden" />
            <input type="file" ref={presetFileInputRef} accept=".json" onChange={handlePresetFileImport} className="hidden" />
            <div className="w-px h-5 bg-ed-border mx-1" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* --- AI Hero Section --- */}
        <div className="bg-ed-bg border border-ed-border rounded-xl p-6 mb-6 relative overflow-hidden">
          {/* Loading overlay */}
          {aiHeroLoading && (
            <div className="absolute inset-0 bg-ed-bg/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 rounded-xl">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-ed-border" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-ed-accent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <SparkleIcon className="w-6 h-6 text-ed-accent" />
                </div>
              </div>
              <p className={`${typography.group} ${typography.semibold} text-ed-text`}>Creating your app...</p>
              <p className={`${typography.body} text-ed-text-tertiary`}>AI is generating components and layout</p>
            </div>
          )}

          <div className="flex items-center gap-2 mb-1">
            <SparkleIcon className="w-5 h-5 text-ed-accent" />
            <h2 className={`${typography.group} ${typography.semibold} text-ed-text`}>Create an app with AI</h2>
          </div>
          <p className={`${typography.body} text-ed-text-tertiary mb-4`}>Describe what you want to build and AI will generate it instantly</p>

          <div className="flex gap-2">
            <input
              type="text"
              value={aiHeroPrompt}
              onChange={(e) => { setAiHeroPrompt(e.target.value); setAiHeroError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAIHeroGenerate(aiHeroPrompt); } }}
              placeholder="Describe what you want to build..."
              disabled={aiHeroLoading}
              className={`flex-1 px-4 py-2.5 ${typography.body} bg-ed-bg-secondary border border-ed-border rounded-lg text-ed-text placeholder-ed-text-tertiary focus:outline-none focus:ring-2 focus:ring-ed-accent/30 focus:border-ed-accent/50 disabled:opacity-50`}
            />
            <button
              onClick={() => handleAIHeroGenerate(aiHeroPrompt)}
              disabled={aiHeroLoading || !aiHeroPrompt.trim()}
              className={`px-5 py-2.5 ${typography.body} ${typography.semibold} bg-ed-accent text-ed-text-inverse rounded-lg hover:bg-ed-accent-hover disabled:opacity-50 flex items-center gap-2 transition-colors flex-shrink-0`}
            >
              <SparkleIcon className="w-4 h-4" />
              Generate
            </button>
          </div>

          {aiHeroError && (
            <p className={`mt-2 ${typography.body} text-ed-danger`}>{aiHeroError}</p>
          )}

          {/* Suggestion pills */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`${typography.caption} text-ed-text-tertiary`}>Try:</span>
            {AI_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleAIHeroGenerate(suggestion)}
                disabled={aiHeroLoading}
                className={`px-3 py-1 ${typography.caption} text-ed-text-secondary bg-ed-bg-secondary border border-ed-border rounded-full hover:border-ed-accent/50 hover:text-ed-accent-text transition-colors disabled:opacity-50`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* --- Tab Navigation --- */}
        <div className="flex items-center justify-between mb-5 border-b border-ed-border">
          <div className="flex items-center gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }}
                className={`px-4 py-2.5 ${typography.body} ${typography.semibold} border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-ed-accent text-ed-accent-text'
                    : 'border-transparent text-ed-text-secondary hover:text-ed-text hover:border-ed-border'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 ${typography.caption} px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-ed-accent/10 text-ed-accent-text' : 'bg-ed-bg-tertiary text-ed-text-tertiary'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 pb-1">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ed-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className={`pl-8 pr-3 py-1.5 w-48 ${typography.body} bg-ed-bg border border-ed-border rounded-lg text-ed-text placeholder-ed-text-tertiary focus:outline-none focus:ring-2 focus:ring-ed-accent/30 focus:border-ed-accent/50`}
              />
            </div>
            {renderTabAction()}
          </div>
        </div>

        {/* --- Tab Content --- */}
        {activeTab === 'apps' && renderAppsContent()}
        {activeTab === 'templates' && renderTemplatesContent()}
        {activeTab === 'presets' && renderPresetsContent()}
        {activeTab === 'widgets' && renderWidgetsContent()}
        {activeTab === 'themes' && renderThemesContent()}
      </main>

      {/* --- Modals --- */}
      {isCreateModalOpen && (
        <CreateAppModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateNewApp}
        />
      )}
      {appToDelete && (
        <DeleteConfirmationModal
          appName={appToDelete.name}
          onClose={() => setAppToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
      {templateToDelete && (
        <DeleteConfirmationModal
          appName={`${templateToDelete.name} (Template)`}
          onClose={() => setTemplateToDelete(null)}
          onConfirm={handleConfirmDeleteTemplate}
        />
      )}
      {widgetToDelete && (
        <DeleteConfirmationModal
          appName={`${widgetToDelete.name} (Widget)`}
          onClose={() => { setWidgetToDelete(null); setWidgetDeleteUsages([]); }}
          onConfirm={handleConfirmDeleteWidget}
          message={
            widgetDeleteUsages.length > 0 ? (
              <>
                <p>
                  This widget is used in <strong>{widgetDeleteUsages.length} app(s)</strong>:{' '}
                  {widgetDeleteUsages.map(u => u.appName).join(', ')}.
                </p>
                <p className="mt-1">
                  Deleting it will break those instances. Are you sure?
                </p>
              </>
            ) : undefined
          }
        />
      )}
      {appToRename && (
        <RenameAppModal
          currentName={appToRename.name}
          onClose={() => setAppToRename(null)}
          onSave={handleRenameApp}
        />
      )}
      {widgetToRename && (
        <RenameAppModal
          currentName={widgetToRename.name}
          onClose={() => setWidgetToRename(null)}
          onSave={handleRenameWidget}
          title="Rename Widget"
        />
      )}
      {isThemeEditorOpen && (
        <ThemeEditorModal
          theme={themeToEdit}
          onClose={() => { setIsThemeEditorOpen(false); setThemeToEdit(null); }}
          onSave={handleSaveTheme}
        />
      )}
      {appToSaveAsTemplate && (
        <SaveAsTemplateModal
          appName={appToSaveAsTemplate.name}
          onClose={() => setAppToSaveAsTemplate(null)}
          onSave={handleSaveAsTemplate}
          appDefinition={templateAppDef || undefined}
        />
      )}
      {templateToEdit && (
        <SaveAsTemplateModal
          appName={templateToEdit.name}
          initialDescription={templateToEdit.description}
          initialImageUrl={templateToEdit.imageUrl}
          onClose={() => setTemplateToEdit(null)}
          onSave={handleUpdateTemplateMetadata}
          appDefinition={templateToEdit.appDefinition}
        />
      )}
      {isTemplateSelectionOpen && (
        <TemplateSelectionModal
          templates={templates}
          onClose={() => setIsTemplateSelectionOpen(false)}
          onSelect={handleSelectTemplate}
        />
      )}
      {templateToPreview && (
        <TemplatePreviewModal
          template={templateToPreview}
          onClose={() => setTemplateToPreview(null)}
          onUseTemplate={() => {
            const t = templateToPreview;
            setTemplateToPreview(null);
            handleSelectTemplate(t);
          }}
          onEditTemplate={() => {
            const t = templateToPreview;
            setTemplateToPreview(null);
            onEditTemplate(t);
          }}
        />
      )}
    </div>
  );
};
