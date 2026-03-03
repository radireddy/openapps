import { AppDefinition, AppMetadata, AppStorageService, GlobalTheme, Theme, AppComponent, AppPage, AppTemplate, WidgetDefinition } from '@/types';
import { ComponentTemplate } from '@/components/component-templates/types';
import { defaultLightTheme } from '@/theme-presets';
import { migrateTheme } from '@/utils/theme-migration';

const APPS_INDEX_KEY = 'gemini-low-code-apps-index';
const APP_DATA_PREFIX = 'gemini-low-code-app-';
const GLOBAL_THEMES_KEY = 'gemini-low-code-global-themes';
const APP_TEMPLATES_KEY = 'gemini-low-code-app-templates';
const WIDGET_DEFINITIONS_KEY = 'gemini-low-code-widget-definitions';
const CUSTOM_PRESETS_KEY = 'gemini-low-code-custom-presets';
const MIGRATION_FLAG_KEY = 'gemini-low-code-migration-complete-v3'; // Incremented for v2 theme

/**
 * Replaces old component/page IDs with new ones in all string values of an object.
 * Handles nested objects recursively (e.g. responsive props).
 * This ensures expressions like `dataStore.INPUT_principal_1` get updated
 * when component IDs are remapped to timestamp-based IDs.
 */
function remapIdsInObject(obj: any, idMap: Map<string, string>): void {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      let value = obj[key];
      for (const [oldId, newId] of idMap) {
        if (value.includes(oldId)) {
          value = value.split(oldId).join(newId);
        }
      }
      obj[key] = value;
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      remapIdsInObject(obj[key], idMap);
    }
  }
}

/**
 * Remaps dataStore keys from old component IDs to new ones.
 * Returns a new dataStore object with updated keys.
 */
function remapDataStoreKeys(dataStore: Record<string, any>, idMap: Map<string, string>): Record<string, any> {
  const newDataStore: Record<string, any> = {};
  for (const [key, value] of Object.entries(dataStore)) {
    const newKey = idMap.get(key) || key;
    newDataStore[newKey] = value;
  }
  return newDataStore;
}

// --- LocalStorage Implementation ---
const LocalStorageProvider: AppStorageService = {
  async getAllAppsMetadata() {
    const indexJson = localStorage.getItem(APPS_INDEX_KEY);
    if (!indexJson) {
      return [];
    }
    try {
      const index = JSON.parse(indexJson);
      return Array.isArray(index) ? index : [];
    } catch (error) {
      console.error("Failed to parse app index from localStorage. The data may be corrupted.", error);
      return [];
    }
  },

  async getApp(id) {
    const appDataJson = localStorage.getItem(`${APP_DATA_PREFIX}${id}`);
    if (!appDataJson) {
        return null;
    }
    try {
        const app = JSON.parse(appDataJson);
        
        // Migration for pages
        if (!app.pages || !app.mainPageId) {
            const defaultPageId = `page_migrated_${app.id}`;
            app.pages = [{ id: defaultPageId, name: 'Main Page' }];
            app.mainPageId = defaultPageId;
            app.components = (app.components || []).map((c: Omit<AppComponent, 'pageId'>) => ({ ...c, pageId: defaultPageId }));
        }

        // Migration for new theme structure (v1 → v2 with typography/shadow/transition)
        app.theme = migrateTheme(app.theme);
        return app;
    } catch (error) {
        console.error(`Failed to parse app data for ID ${id} from localStorage.`, error);
        return null;
    }
  },

  async saveApp(app) {
    const updatedApp = {
      ...app,
      lastModifiedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(`${APP_DATA_PREFIX}${app.id}`, JSON.stringify(updatedApp));

    const index: AppMetadata[] = await this.getAllAppsMetadata();
    const appIndex = index.findIndex(a => a.id === app.id);
    const metadata: AppMetadata = {
      id: updatedApp.id,
      name: updatedApp.name,
      createdAt: updatedApp.createdAt,
      lastModifiedAt: updatedApp.lastModifiedAt,
    };

    if (appIndex > -1) {
      index[appIndex] = metadata;
    } else {
      index.push(metadata);
    }
    localStorage.setItem(APPS_INDEX_KEY, JSON.stringify(index));
    
    return updatedApp;
  },

  async createApp(name, templateDefinition) {
    if (!templateDefinition) {
      // Create blank app
      const defaultPageId = `page_${Date.now()}`;
      const newApp: AppDefinition = {
        id: `app_${Date.now()}`,
        name: name,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        pages: [{ id: defaultPageId, name: 'Main Page' }],
        mainPageId: defaultPageId,
        components: [],
        dataStore: { selectedRecord: null },

        variables: [],
        theme: defaultLightTheme,
        integration: {
          accountName: '',
          tenantName: '',
          clientId: '',
          scope: '',
        },
      };
      return this.saveApp(newApp);
    }
    
    // --- Create from template ---
    const newAppDef = JSON.parse(JSON.stringify(templateDefinition)); // Deep copy

    const pageIdMap = new Map<string, string>();
    const componentIdMap = new Map<string, string>();

    newAppDef.pages.forEach((page: AppPage, index: number) => {
        const oldId = page.id;
        const newId = `page_${Date.now()}_${index}`;
        page.id = newId;
        pageIdMap.set(oldId, newId);
    });

    newAppDef.components.forEach((component: AppComponent, index: number) => {
        const oldId = component.id;
        const newId = `${component.type}_${Date.now()}_${index}`;
        component.id = newId;
        componentIdMap.set(oldId, newId);
    });

    // Merge both maps for expression remapping
    const allIdMap = new Map<string, string>([...componentIdMap, ...pageIdMap]);

    newAppDef.components.forEach((component: AppComponent) => {
        if (component.parentId) {
            component.parentId = componentIdMap.get(component.parentId) || null;
        }
        component.pageId = pageIdMap.get(component.pageId)!;
        // Remap old component/page IDs in all string props (expressions, action code, etc.)
        remapIdsInObject(component.props, allIdMap);
    });

    newAppDef.mainPageId = pageIdMap.get(newAppDef.mainPageId)!;

    // Remap dataStore keys from old component IDs to new ones
    if (newAppDef.dataStore) {
      newAppDef.dataStore = remapDataStoreKeys(newAppDef.dataStore, componentIdMap);
    }

    const finalApp: AppDefinition = {
      ...newAppDef,
      id: `app_${Date.now()}`,
      name: name,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };

    return this.saveApp(finalApp);
  },

  async deleteApp(id) {
    let index: AppMetadata[] = await this.getAllAppsMetadata();
    index = index.filter(a => a.id !== id);
    localStorage.setItem(APPS_INDEX_KEY, JSON.stringify(index));
    localStorage.removeItem(`${APP_DATA_PREFIX}${id}`);
  },

  async renameApp(id, newName) {
    const app = await this.getApp(id);
    if (!app) {
      throw new Error("App not found");
    }
    app.name = newName;
    const updatedApp = await this.saveApp(app);
    return {
      id: updatedApp.id,
      name: updatedApp.name,
      createdAt: updatedApp.createdAt,
      lastModifiedAt: updatedApp.lastModifiedAt,
    };
  },

  async exportSingleApp(id) {
    const app = await this.getApp(id);
    if (!app) {
      throw new Error("App not found for export");
    }
    return JSON.stringify(app, null, 2);
  },

  async exportAllApps() {
    const metadata = await this.getAllAppsMetadata();
    const allApps = await Promise.all(
      metadata.map(appMeta => this.getApp(appMeta.id))
    );
    const validApps = allApps.filter(app => app !== null);
    return JSON.stringify(validApps, null, 2);
  },

  async importApps(jsonString) {
    const dataToImport = JSON.parse(jsonString);
    
    // Helper function to create a new app with remapped IDs
    const createNewAppFromImport = (importedApp: AppDefinition, index: number): AppDefinition => {
      const newAppDef = JSON.parse(JSON.stringify(importedApp)); // Deep copy
      const baseTimestamp = Date.now() + index; // Add index to ensure unique timestamps
      
      // Generate new app ID
      const newAppId = `app_${baseTimestamp}`;
      
      // Remap page IDs
      const pageIdMap = new Map<string, string>();
      newAppDef.pages.forEach((page: AppPage, index: number) => {
        const oldId = page.id;
        const newId = `page_${baseTimestamp}_${index}`;
        page.id = newId;
        pageIdMap.set(oldId, newId);
      });
      
      // Remap component IDs
      const componentIdMap = new Map<string, string>();
      newAppDef.components.forEach((component: AppComponent, index: number) => {
        const oldId = component.id;
        const newId = `${component.type}_${baseTimestamp}_${index}`;
        component.id = newId;
        componentIdMap.set(oldId, newId);
      });
      
      // Merge both maps for expression remapping
      const allIdMap = new Map<string, string>([...componentIdMap, ...pageIdMap]);

      // Update component references
      newAppDef.components.forEach((component: AppComponent) => {
        if (component.parentId) {
          component.parentId = componentIdMap.get(component.parentId) || null;
        }
        if (component.pageId) {
          component.pageId = pageIdMap.get(component.pageId) || component.pageId;
        }
        // Remap old component/page IDs in all string props (expressions, action code, etc.)
        remapIdsInObject(component.props, allIdMap);
      });

      // Update main page ID
      if (newAppDef.mainPageId) {
        newAppDef.mainPageId = pageIdMap.get(newAppDef.mainPageId) || newAppDef.mainPageId;
      }

      // Remap dataStore keys from old component IDs to new ones
      if (newAppDef.dataStore) {
        newAppDef.dataStore = remapDataStoreKeys(newAppDef.dataStore, componentIdMap);
      }
      
      // Update app metadata with new ID, unique name, and timestamps
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2024-01-15T10-30-45
      const uniqueName = `${newAppDef.name} (Imported ${timestamp})`;
      
      const finalApp: AppDefinition = {
        ...newAppDef,
        id: newAppId,
        name: uniqueName,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
      };
      
      return finalApp;
    };
    
    if (!Array.isArray(dataToImport)) {
      // Single app import - always create new
      const app = dataToImport as AppDefinition;
      if (app.id && app.name && Array.isArray(app.components)) {
        const newApp = createNewAppFromImport(app, 0);
        await this.saveApp(newApp);
      } else {
        throw new Error("Invalid single app import file: Missing required properties.");
      }
      return;
    }
    
    // Full backup import - create new apps for each imported app
    const appsToImport: AppDefinition[] = dataToImport;
    
    for (let i = 0; i < appsToImport.length; i++) {
      const app = appsToImport[i];
      if (app.id && app.name && Array.isArray(app.components)) {
        const newApp = createNewAppFromImport(app, i);
        await this.saveApp(newApp);
      } else {
        console.warn("Skipping invalid app object during import:", app);
      }
    }
  },

  // --- Global Theme Methods ---
  async getAllThemes() {
    const themesJson = localStorage.getItem(GLOBAL_THEMES_KEY);
    return themesJson ? JSON.parse(themesJson) : [];
  },

  async saveTheme(theme) {
    const themes = await this.getAllThemes();
    const themeIndex = themes.findIndex(t => t.id === theme.id);
    if (themeIndex > -1) {
      themes[themeIndex] = theme;
    } else {
      themes.push(theme);
    }
    localStorage.setItem(GLOBAL_THEMES_KEY, JSON.stringify(themes));
    return theme;
  },

  async deleteTheme(themeId) {
    let themes = await this.getAllThemes();
    themes = themes.filter(t => t.id !== themeId);
    localStorage.setItem(GLOBAL_THEMES_KEY, JSON.stringify(themes));
  },

  async exportTheme(themeId) {
    const themes = await this.getAllThemes();
    const theme = themes.find(t => t.id === themeId);
    if (!theme) {
      throw new Error("Theme not found for export");
    }
    return JSON.stringify(theme, null, 2);
  },

  async importTheme(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed.theme || !parsed.name) {
      throw new Error("Invalid theme import: missing required properties (theme, name).");
    }
    const imported: GlobalTheme = {
      ...parsed,
      id: `theme_imported_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };
    return this.saveTheme(imported);
  },

  // --- App Template Methods ---
  async getAllTemplates() {
    const templatesJson = localStorage.getItem(APP_TEMPLATES_KEY);
    return templatesJson ? JSON.parse(templatesJson) : [];
  },

  async saveTemplate(template) {
    const templates = await this.getAllTemplates();
    const templateIndex = templates.findIndex(t => t.id === template.id);
    if (templateIndex > -1) {
      templates[templateIndex] = template;
    } else {
      templates.push(template);
    }
    try {
      localStorage.setItem(APP_TEMPLATES_KEY, JSON.stringify(templates));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Try using a smaller thumbnail image or delete unused templates to free up space.');
      }
      throw e;
    }
    return template;
  },

  async deleteTemplate(templateId) {
    let templates = await this.getAllTemplates();
    templates = templates.filter(t => t.id !== templateId);
    localStorage.setItem(APP_TEMPLATES_KEY, JSON.stringify(templates));
  },

  async exportTemplate(templateId) {
    const templates = await this.getAllTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error("Template not found for export");
    }
    return JSON.stringify(template, null, 2);
  },

  async exportAllTemplates() {
    const templates = await this.getAllTemplates();
    return JSON.stringify(templates, null, 2);
  },

  async importTemplates(jsonString) {
    const parsed = JSON.parse(jsonString);
    const items = Array.isArray(parsed) ? parsed : [parsed];

    for (const item of items) {
      let template: AppTemplate;

      if (item.appDefinition && item.name) {
        // Native AppTemplate format
        template = {
          ...item,
          id: `template_imported_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        };
      } else if (item.components && item.pages) {
        // AppDefinition format — wrap into AppTemplate
        template = {
          id: `template_imported_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: item.name || 'Imported Template',
          description: item.description || 'Imported from app definition',
          imageUrl: '',
          appDefinition: item as AppDefinition,
        };
      } else {
        console.warn("Skipping unrecognised import format:", item);
        continue;
      }

      await this.saveTemplate(template);
    }
  },

  // --- Widget Definition Methods ---
  async getAllWidgetDefinitions(): Promise<WidgetDefinition[]> {
    const json = localStorage.getItem(WIDGET_DEFINITIONS_KEY);
    return json ? JSON.parse(json) : [];
  },

  async getWidgetDefinition(id: string): Promise<WidgetDefinition | null> {
    const widgets = await this.getAllWidgetDefinitions();
    return widgets.find(w => w.id === id) || null;
  },

  async saveWidgetDefinition(widget: WidgetDefinition): Promise<WidgetDefinition> {
    const widgets = await this.getAllWidgetDefinitions();
    const index = widgets.findIndex(w => w.id === widget.id);
    if (index > -1) {
      widgets[index] = widget;
    } else {
      widgets.push(widget);
    }
    try {
      localStorage.setItem(WIDGET_DEFINITIONS_KEY, JSON.stringify(widgets));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Try deleting unused widgets to free up space.');
      }
      throw e;
    }
    return widget;
  },

  async deleteWidgetDefinition(widgetId: string): Promise<void> {
    let widgets = await this.getAllWidgetDefinitions();
    widgets = widgets.filter(w => w.id !== widgetId);
    localStorage.setItem(WIDGET_DEFINITIONS_KEY, JSON.stringify(widgets));
  },

  async exportWidgetDefinition(widgetId: string): Promise<string> {
    const widgets = await this.getAllWidgetDefinitions();
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) throw new Error('Widget not found for export');
    return JSON.stringify(widget, null, 2);
  },

  async exportAllWidgetDefinitions(): Promise<string> {
    const widgets = await this.getAllWidgetDefinitions();
    return JSON.stringify(widgets, null, 2);
  },

  async importWidgetDefinitions(jsonString: string): Promise<void> {
    const parsed = JSON.parse(jsonString);
    const items = Array.isArray(parsed) ? parsed : [parsed];

    for (const item of items) {
      if (item.components && item.inputs !== undefined && item.outputs !== undefined) {
        const widget: WidgetDefinition = {
          ...item,
          id: `widget_imported_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        };
        await this.saveWidgetDefinition(widget);
      } else {
        console.warn('Skipping unrecognised widget import format:', item);
      }
    }
  },

  // --- Custom Preset Methods ---
  async getAllCustomPresets(): Promise<ComponentTemplate[]> {
    const json = localStorage.getItem(CUSTOM_PRESETS_KEY);
    return json ? JSON.parse(json) : [];
  },

  async saveCustomPreset(preset: ComponentTemplate): Promise<ComponentTemplate> {
    const presets = await this.getAllCustomPresets();
    const index = presets.findIndex(p => p.id === preset.id);
    if (index > -1) {
      presets[index] = preset;
    } else {
      presets.push(preset);
    }
    try {
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Try deleting unused presets to free up space.');
      }
      throw e;
    }
    return preset;
  },

  async deleteCustomPreset(presetId: string): Promise<void> {
    let presets = await this.getAllCustomPresets();
    presets = presets.filter(p => p.id !== presetId);
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  },

  async renameCustomPreset(presetId: string, newName: string): Promise<ComponentTemplate> {
    const presets = await this.getAllCustomPresets();
    const preset = presets.find(p => p.id === presetId);
    if (!preset) {
      throw new Error('Preset not found');
    }
    preset.name = newName;
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
    return preset;
  },

  async exportCustomPreset(presetId: string): Promise<string> {
    const presets = await this.getAllCustomPresets();
    const preset = presets.find(p => p.id === presetId);
    if (!preset) {
      throw new Error('Preset not found for export');
    }
    return JSON.stringify(preset, null, 2);
  },

  async exportAllCustomPresets(): Promise<string> {
    const presets = await this.getAllCustomPresets();
    return JSON.stringify(presets, null, 2);
  },

  async importCustomPresets(jsonString: string): Promise<void> {
    const parsed = JSON.parse(jsonString);
    const items = Array.isArray(parsed) ? parsed : [parsed];

    for (const item of items) {
      if (item.name && Array.isArray(item.components)) {
        const preset: ComponentTemplate = {
          ...item,
          id: `preset_imported_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        };
        await this.saveCustomPreset(preset);
      } else {
        console.warn('Skipping unrecognised preset import format:', item);
      }
    }
  },
};

// --- One-Time Migration Logic ---
const runOneTimeMigration = async () => {
    if (localStorage.getItem(MIGRATION_FLAG_KEY)) {
        return;
    }
    
    const OLD_APP_KEY = 'gemini-low-code-app';
    const MIGRATED_APP_NAME = "Migrated Legacy App";
    
    try {
        const oldAppDataRaw = localStorage.getItem(OLD_APP_KEY);
        if (oldAppDataRaw) {
            const existingApps = await LocalStorageProvider.getAllAppsMetadata();
            if (!existingApps.some(app => app.name === MIGRATED_APP_NAME)) {
                const oldAppDefinition = JSON.parse(oldAppDataRaw);
                const defaultPageId = `page_migrated_${Date.now()}`;
                const migratedApp: AppDefinition = {
                    ...oldAppDefinition,
                    id: `app_migrated_${Date.now()}`,
                    name: MIGRATED_APP_NAME,
                    createdAt: new Date().toISOString(),
                    lastModifiedAt: new Date().toISOString(),
                    pages: [{ id: defaultPageId, name: 'Main Page' }],
                    mainPageId: defaultPageId,
                    components: (oldAppDefinition.components || []).map((c: any) => ({ ...c, pageId: defaultPageId })),
                    theme: oldAppDefinition.theme?.radius ? oldAppDefinition.theme : defaultLightTheme,
                };
                await LocalStorageProvider.saveApp(migratedApp);
            }
            localStorage.removeItem(OLD_APP_KEY);
        }
    } catch (error) {
        console.error("Failed to migrate legacy app:", error);
    } finally {
        localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    }
};

// --- Enhanced Provider with Migration ---
const createMigratedStorageService = (): AppStorageService => {
    let migrationPromise: Promise<void> | null = null;
    
    const ensureMigration = () => {
        if (!migrationPromise) {
            migrationPromise = runOneTimeMigration();
        }
        return migrationPromise;
    };
    
    const serviceWithMigration: AppStorageService = {} as any;
    for (const key of Object.keys(LocalStorageProvider)) {
        const method = key as keyof AppStorageService;
        (serviceWithMigration[method] as any) = async (...args: any[]) => {
            await ensureMigration();
            return (LocalStorageProvider[method] as any)(...args);
        };
    }
    return serviceWithMigration;
}

export const storageService: AppStorageService = createMigratedStorageService();
