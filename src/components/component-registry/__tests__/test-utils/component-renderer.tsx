/**
 * Component Renderer Factory
 * 
 * Factory functions for rendering components in tests.
 * Provides a consistent way to render any component from the registry.
 */

import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { ComponentType, AppComponent, Theme } from '../../../../types';
import { componentRegistry } from '../../registry';

/**
 * Default theme for testing - matches the default theme used in the app
 */
const defaultTestTheme: Theme = {
  colors: {
    primary: '#4F46E5',
    onPrimary: '#FFFFFF',
    secondary: '#06B6D4',
    onSecondary: '#FFFFFF',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#1A1A1A',
    border: '#D1D1D1',
    primaryLight: '#818CF8',
    primaryDark: '#3730A3',
    secondaryLight: '#22D3EE',
    secondaryDark: '#0E7490',
    error: '#DC2626',
    onError: '#FFFFFF',
    warning: '#F59E0B',
    onWarning: '#FFFFFF',
    success: '#10B981',
    onSuccess: '#FFFFFF',
    info: '#3B82F6',
    onInfo: '#FFFFFF',
    surfaceVariant: '#E5E7EB',
    onSurface: '#1F2937',
    onBackground: '#111827',
    hover: '#EEF2FF',
    focus: '#C7D2FE',
    disabled: '#9CA3AF',
    onDisabled: '#6B7280',
    outline: '#D1D5DB',
    shadow: 'rgba(0,0,0,0.1)',
    overlay: 'rgba(0,0,0,0.5)',
    link: '#4F46E5',
  },
  font: {
    family: 'Segoe UI, sans-serif',
  },
  border: {
    width: '1px',
    style: 'solid',
    widthThin: '1px',
    widthMedium: '2px',
    widthThick: '3px',
  },
  radius: {
    default: '4px',
    none: '0',
    sm: '2px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px',
    xxxxl: '96px',
  },
  typography: {
    fontFamily: 'Segoe UI, sans-serif',
    fontFamilyHeading: 'Segoe UI, sans-serif',
    fontFamilyMono: 'Consolas, monospace',
    fontSizeXs: '12px',
    fontSizeSm: '14px',
    fontSizeMd: '16px',
    fontSizeLg: '18px',
    fontSizeXl: '20px',
    fontSizeXxl: '24px',
    fontSizeXxxl: '30px',
    fontWeightLight: '300',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightSemibold: '600',
    fontWeightBold: '700',
    lineHeightTight: '1.25',
    lineHeightNormal: '1.5',
    lineHeightRelaxed: '1.75',
    letterSpacingTight: '-0.025em',
    letterSpacingNormal: '0',
    letterSpacingWide: '0.025em',
  },
  shadow: {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
    xl: '0 20px 25px rgba(0,0,0,0.1)',
    inner: 'inset 0 2px 4px rgba(0,0,0,0.06)',
  },
  transition: {
    durationFast: '150ms',
    durationNormal: '300ms',
    durationSlow: '500ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * Creates a default evaluation scope for tests
 * Includes theme and console for expression evaluation
 */
export function createDefaultEvaluationScope(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    console,
    theme: defaultTestTheme,
    ...overrides,
  };
}

/**
 * Props for rendering a component in test mode
 */
export interface RenderComponentOptions {
  /** Component definition */
  component: AppComponent;
  /** Evaluation scope for expressions */
  evaluationScope?: Record<string, any>;
  /** Render mode */
  mode?: 'preview' | 'edit';
  /** Data store */
  dataStore?: Record<string, any>;
  /** Action handlers */
  actionHandlers?: any;
}

/**
 * Result of rendering a component
 */
export interface RenderedComponent {
  /** Testing library render result */
  renderResult: RenderResult;
  /** The rendered DOM element */
  element: HTMLElement;
  /** The component definition */
  component: AppComponent;
}

/**
 * Gets default props for a component type
 */
export function getDefaultPropsForComponent(componentType: ComponentType): any {
  const plugin = componentRegistry[componentType];
  
  if (!plugin) {
    throw new Error(`Component plugin not found for type: ${componentType}`);
  }
  
  // Get default props from palette config
  const defaultProps = plugin.paletteConfig.defaultProps || {};
  
  // Ensure base props are always present
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    ...defaultProps,
  };
}

/**
 * Creates a component definition for testing
 */
export function createTestComponent(
  componentType: ComponentType,
  props: Partial<any> = {}
): AppComponent {
  const defaultProps = getDefaultPropsForComponent(componentType);
  
  return {
    id: `test-${componentType.toLowerCase()}-${Date.now()}`,
    type: componentType,
    props: {
      ...defaultProps,
      ...props,
    },
    pageId: 'test-page',
  };
}

/**
 * Renders a component using its plugin renderer
 */
export function renderComponent(options: RenderComponentOptions): RenderedComponent {
  const {
    component,
    evaluationScope,
    mode = 'preview',
    dataStore = {},
    actionHandlers,
  } = options;
  
  // Use provided evaluation scope or create default one with theme
  const scope = evaluationScope !== undefined 
    ? { ...createDefaultEvaluationScope(), ...evaluationScope }
    : createDefaultEvaluationScope();
  
  const plugin = componentRegistry[component.type];
  
  if (!plugin) {
    throw new Error(`Component plugin not found for type: ${component.type}`);
  }
  
  const Renderer = plugin.renderer;
  
  // Prepare props for the renderer
  const rendererProps: any = {
    component,
    evaluationScope: scope,
    mode,
    dataStore,
  };
  
  // Add action handlers if provided
  if (actionHandlers) {
    rendererProps.actionHandlers = actionHandlers;
  }
  
  // Render the component
  const renderResult = render(<Renderer {...rendererProps} />);
  
  // Get the root element
  const container = renderResult.container;
  const element = container.firstChild as HTMLElement;
  
  if (!element) {
    throw new Error(`Component ${component.type} did not render any element`);
  }
  
  return {
    renderResult,
    element: element as HTMLElement,
    component,
  };
}

/**
 * Updates a component's property and re-renders
 */
export function updateComponentProperty(
  rendered: RenderedComponent,
  propertyId: string,
  value: any,
  evaluationScope?: Record<string, any>
): RenderedComponent {
  const updatedComponent: AppComponent = {
    ...rendered.component,
    props: {
      ...rendered.component.props,
      [propertyId]: value,
    },
  };
  
  // Unmount previous render
  rendered.renderResult.unmount();
  
  // Render with updated props
  return renderComponent({
    component: updatedComponent,
    evaluationScope: evaluationScope || createDefaultEvaluationScope(),
    mode: 'preview',
  });
}

