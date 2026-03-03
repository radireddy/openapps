import React, { useState, useCallback, useEffect } from 'react';
import { Dashboard } from '@/Dashboard';
import { Editor } from '@/Editor';
import { RunMode } from '@/RunMode';
import { AppMetadata, AppTemplate, AppDefinition, WidgetDefinition } from '@/types';
import { storageService } from '@/storageService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'run'>('dashboard');
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [currentWidgetId, setCurrentWidgetId] = useState<string | null>(null);
  const [runAppDefinition, setRunAppDefinition] = useState<AppDefinition | null>(null);

  const handleEditApp = useCallback((app: AppMetadata) => {
    setCurrentTemplateId(null);
    setCurrentWidgetId(null);
    setCurrentAppId(app.id);
    setCurrentView('editor');
  }, []);

  const handleCreateApp = useCallback((app: AppMetadata) => {
    setCurrentTemplateId(null);
    setCurrentWidgetId(null);
    setCurrentAppId(app.id);
    setCurrentView('editor');
  }, []);

  const handleEditTemplate = useCallback((template: AppTemplate) => {
    setCurrentAppId(null);
    setCurrentWidgetId(null);
    setCurrentTemplateId(template.id);
    setCurrentView('editor');
  }, []);

  const handleEditWidget = useCallback((widget: WidgetDefinition) => {
    setCurrentAppId(null);
    setCurrentTemplateId(null);
    setCurrentWidgetId(widget.id);
    setCurrentView('editor');
  }, []);

  const handleCreateWidget = useCallback(async () => {
    const widget: WidgetDefinition = {
      id: `widget_${Date.now()}`,
      name: 'Untitled Widget',
      description: '',
      icon: 'Box',
      tags: [],
      inputs: [],
      outputs: [],
      components: [],
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };
    await storageService.saveWidgetDefinition(widget);
    setCurrentAppId(null);
    setCurrentTemplateId(null);
    setCurrentWidgetId(widget.id);
    setCurrentView('editor');
  }, []);

  const handleRunApp = useCallback((app: AppMetadata) => {
    setCurrentAppId(app.id);
    setCurrentView('run');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setCurrentAppId(null);
    setCurrentTemplateId(null);
    setCurrentWidgetId(null);
    setRunAppDefinition(null);
    setCurrentView('dashboard');
  }, []);

  // Load app definition for run mode
  useEffect(() => {
    if (currentView === 'run' && currentAppId) {
      storageService.getApp(currentAppId).then(appDef => {
        if (appDef) {
          setRunAppDefinition(appDef);
        } else {
          console.error('[App] Could not load app for run mode:', currentAppId);
          setCurrentView('dashboard');
        }
      });
    }
  }, [currentView, currentAppId]);

  if (currentView === 'run' && runAppDefinition) {
    return (
      <RunMode
        appDefinition={runAppDefinition}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'editor' && (currentAppId || currentTemplateId || currentWidgetId)) {
    return (
      <Editor
        appId={currentAppId ?? undefined}
        templateId={currentTemplateId ?? undefined}
        widgetId={currentWidgetId ?? undefined}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <Dashboard
      onEditApp={handleEditApp}
      onCreateApp={handleCreateApp}
      onEditTemplate={handleEditTemplate}
      onRunApp={handleRunApp}
      onEditWidget={handleEditWidget}
      onCreateWidget={handleCreateWidget}
    />
  );
};

export default App;
