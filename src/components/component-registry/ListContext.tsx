/**
 * Context for List component to access allComponents and handlers
 * This allows the List renderer to access data it needs for template rendering
 */

import React from 'react';
import { AppComponent, ComponentProps, ComponentType, ActionHandlers, WidgetDefinition } from '../../types';

export interface ListContextValue {
  allComponents: AppComponent[];
  selectedComponentIds: string[];
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, newProps: Partial<ComponentProps>) => void;
  onUpdateComponents: (updates: Array<{ id: string; props: Partial<ComponentProps> }>) => void;
  onDelete: (id: string) => void;
  onDrop: (item: { type: ComponentType }, x: number, y: number, parentId: string | null) => void;
  onReparentCheck: (id: string, finalPosition?: { x: number; y: number }, targetContainerId?: string | null) => void;
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  actions?: ActionHandlers;
  currentComponentId?: string; // Optional: current component id (useful for List components)
  widgetDefinitions?: WidgetDefinition[];
}

export const ListContext = React.createContext<ListContextValue | null>(null);

export const useListContext = () => {
  const context = React.useContext(ListContext);
  if (!context) {
    throw new Error('useListContext must be used within ListContext.Provider');
  }
  return context;
};

