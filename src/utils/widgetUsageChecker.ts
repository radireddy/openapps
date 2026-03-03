import { storageService } from '@/storageService';
import { ComponentType, CustomWidgetProps } from '@/types';

export interface WidgetUsage {
  appId: string;
  appName: string;
  componentCount: number;
}

/**
 * Scans all saved apps for instances of a given widget definition.
 * Returns a list of apps that contain CUSTOM_WIDGET components
 * referencing the specified widgetId.
 */
export async function findWidgetUsages(widgetId: string): Promise<WidgetUsage[]> {
  const usages: WidgetUsage[] = [];
  const allApps = await storageService.getAllAppsMetadata();

  for (const meta of allApps) {
    const app = await storageService.getApp(meta.id);
    if (!app) continue;

    const widgetInstances = app.components.filter(
      c => c.type === ComponentType.CUSTOM_WIDGET &&
        (c.props as CustomWidgetProps).widgetDefinitionId === widgetId
    );

    if (widgetInstances.length > 0) {
      usages.push({
        appId: meta.id,
        appName: meta.name,
        componentCount: widgetInstances.length,
      });
    }
  }

  return usages;
}
