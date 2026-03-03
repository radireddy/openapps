import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import { storageService } from '@/storageService';
import { AppDefinition, AppTemplate, ComponentType } from 'types';

const mockApp: AppDefinition = {
  id: 'app1', name: 'My App', createdAt: '2023-01-01', lastModifiedAt: '2023-01-01',
  pages: [{ id: 'page1', name: 'Main Page' }], mainPageId: 'page1',
  components: [{ id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: {} as any }],
  dataStore: {}, variables: [], theme: {} as any
};

const mockTemplate: AppTemplate = {
  id: 'template1', name: 'My Template', description: '', imageUrl: '',
  appDefinition: {
    ...mockApp,
    id: 'template_app',
    pages: [{ id: 'page_t1', name: 'Template Page' }],
    mainPageId: 'page_t1',
    components: [
        { id: 'comp_t1', type: ComponentType.LABEL, pageId: 'page_t1', props: {} as any, parentId: null },
        { id: 'panel_t1', type: ComponentType.CONTAINER, pageId: 'page_t1', props: {} as any, parentId: null },
        { id: 'comp_t2', type: ComponentType.INPUT, pageId: 'page_t1', props: {} as any, parentId: 'panel_t1' },
    ]
  }
};

describe('storageService (with localStorage mock)', () => {
  let storage: Record<string, string> = {};

  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        // FIX: Add types to mock function parameters to avoid 'unknown' type errors.
        getItem: jest.fn((key: string) => storage[key] || null),
        setItem: jest.fn((key: string, value: string) => { storage[key] = value; }),
        removeItem: jest.fn((key: string) => { delete storage[key]; }),
        clear: jest.fn(() => { storage = {}; }),
      },
      writable: true,
    });
  });

  beforeEach(() => {
    storage = {};
    (window.localStorage.clear as jest.Mock)();
  });

  describe('Apps', () => {
    it('should save and retrieve an app', async () => {
      await storageService.saveApp(mockApp);
      const retrieved = await storageService.getApp('app1');
      expect(retrieved).toEqual(expect.objectContaining({ id: 'app1', name: 'My App' }));
      expect(window.localStorage.setItem).toHaveBeenCalledWith('gemini-low-code-app-app1', expect.any(String));
      expect(window.localStorage.setItem).toHaveBeenCalledWith('gemini-low-code-apps-index', expect.any(String));
    });

    it('should create a blank new app', async () => {
      const newApp = await storageService.createApp('New Blank App');
      expect(newApp.name).toBe('New Blank App');
      expect(newApp.components).toEqual([]);
      expect(newApp.pages.length).toBe(1);
      
      const allApps = await storageService.getAllAppsMetadata();
      expect(allApps.length).toBe(1);
    });

    it('should create an app from a template with regenerated IDs', async () => {
        const newApp = await storageService.createApp('App from Template', mockTemplate.appDefinition);
        
        expect(newApp.name).toBe('App from Template');
        expect(newApp.id).not.toBe(mockTemplate.appDefinition.id);
        
        // Check page IDs
        expect(newApp.pages[0].id).not.toBe(mockTemplate.appDefinition.pages[0].id);
        expect(newApp.mainPageId).toBe(newApp.pages[0].id);
        
        // Check component IDs and references
        const newLabel = newApp.components.find(c => c.type === ComponentType.LABEL)!;
        const newPanel = newApp.components.find(c => c.type === ComponentType.CONTAINER)!;
        const newInput = newApp.components.find(c => c.type === ComponentType.INPUT)!;

        expect(newLabel.id).not.toBe('comp_t1');
        expect(newPanel.id).not.toBe('panel_t1');
        expect(newInput.id).not.toBe('comp_t2');
        
        expect(newInput.parentId).toBe(newPanel.id); // Parent ID reference must be updated
        expect(newInput.pageId).toBe(newApp.pages[0].id); // Page ID reference must be updated
    });

    it('should delete an app', async () => {
      await storageService.saveApp(mockApp);
      let allApps = await storageService.getAllAppsMetadata();
      expect(allApps.length).toBe(1);

      await storageService.deleteApp('app1');
      allApps = await storageService.getAllAppsMetadata();
      expect(allApps.length).toBe(0);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('gemini-low-code-app-app1');
    });

    it('should import a single app', async () => {
      const jsonString = JSON.stringify(mockApp);
      await storageService.importApps(jsonString);
      const allApps = await storageService.getAllAppsMetadata();
      expect(allApps.length).toBe(1);
      // Imported apps get a timestamp appended to avoid name conflicts
      expect(allApps[0].name).toContain('My App');
      expect(allApps[0].name).toMatch(/My App \(Imported \d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\)/);
    });

    it('should import a full backup, adding new apps', async () => {
        // Setup initial state with one app
        const existingApp = { ...mockApp, id: 'existing_app', name: 'Existing App' };
        await storageService.saveApp(existingApp);
        const beforeImport = await storageService.getAllAppsMetadata();
        expect(beforeImport.length).toBe(1);

        const backupApps = [
            { ...mockApp, id: 'backup1', name: 'Backup App 1' },
            { ...mockApp, id: 'backup2', name: 'Backup App 2' },
        ];
        const jsonString = JSON.stringify(backupApps);
        await storageService.importApps(jsonString);

        const allApps = await storageService.getAllAppsMetadata();
        // Should have 3 apps total: 1 existing + 2 imported
        expect(allApps.length).toBe(3);
        
        // Imported apps get a timestamp appended
        // Check that both backup apps were imported (with timestamp in name)
        const backupApp1 = allApps.find(app => app.name && app.name.includes('Backup App 1'));
        const backupApp2 = allApps.find(app => app.name && app.name.includes('Backup App 2'));
        
        expect(backupApp1).toBeDefined();
        expect(backupApp2).toBeDefined();
        // Verify they have the imported timestamp format
        if (backupApp1) {
            expect(backupApp1.name).toMatch(/Backup App 1 \(Imported \d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\)/);
        }
        if (backupApp2) {
            expect(backupApp2.name).toMatch(/Backup App 2 \(Imported \d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\)/);
        }
    });
  });

  describe('Templates', () => {
    it('should save and retrieve a template', async () => {
        await storageService.saveTemplate(mockTemplate);
        const templates = await storageService.getAllTemplates();
        expect(templates.length).toBe(1);
        expect(templates[0].name).toBe('My Template');
    });

    it('should delete a template', async () => {
        await storageService.saveTemplate(mockTemplate);
        expect((await storageService.getAllTemplates()).length).toBe(1);
        
        await storageService.deleteTemplate('template1');
        expect((await storageService.getAllTemplates()).length).toBe(0);
    });
  });
});