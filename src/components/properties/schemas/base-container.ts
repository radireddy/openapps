/**
 * Base Container Property Definitions
 * 
 * This module provides reusable property definitions for container-based components.
 * Any component that extends Container will automatically get all these properties.
 * 
 * Usage:
 * ```tsx
 * import { createBaseContainerProperties, createBaseContainerSchema } from './base-container';
 * 
 * // Get base container properties
 * const baseProperties = createBaseContainerProperties(ComponentType.MY_CONTAINER);
 * 
 * // Add custom properties
 * const customProperties: PropertyMetadata[] = [
 *   // ... your custom properties
 * ];
 * 
 * // Create schema with base + custom properties
 * const myContainerSchema = createBaseContainerSchema(
 *   ComponentType.MY_CONTAINER,
 *   [...baseProperties, ...customProperties],
 *   customTabs,
 *   customGroups
 * );
 * ```
 */

import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyTab, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema, DEFAULT_GROUP_ORDER } from '../registry';
import { fontSizePresets, fontWeightPresets } from './typographyPresets';

/**
 * Options for customizing base container properties
 */
export interface BaseContainerPropertyOptions {
  /**
   * Component types that these properties apply to
   */
  applicableTo: ComponentType[];
  
  /**
   * Optional property overrides (properties with same id will override base properties)
   */
  propertyOverrides?: Partial<PropertyMetadata>[];
  
  /**
   * Optional additional properties to add
   */
  additionalProperties?: PropertyMetadata[];
}

/**
 * Creates base container property definitions that can be extended
 * 
 * These properties include:
 * - Basic: hidden, disabled, tooltip
 * - Layout: x, y, width, height, minWidth, maxWidth, minHeight, maxHeight
 * - Advanced: zIndex, className
 * - Styles: backgroundColor, backgroundImage, padding
 * - Events: onClick
 */
export function createBaseContainerProperties(
  applicableTo: ComponentType | ComponentType[],
  options: Partial<BaseContainerPropertyOptions> = {}
): PropertyMetadata[] {
  const types = Array.isArray(applicableTo) ? applicableTo : [applicableTo];
  const { propertyOverrides = [], additionalProperties = [] } = options;
  
  // Create a map of overrides by id
  const overrideMap = new Map<string, Partial<PropertyMetadata>>();
  propertyOverrides.forEach(override => {
    if (override.id) {
      overrideMap.set(override.id, override);
    }
  });
  
  // Base container properties
  const baseProperties: PropertyMetadata[] = [
    // General Tab - Basic group
    {
      id: 'hidden',
      label: 'Visibility',
      type: 'expression',
      defaultValue: '',
      supportsExpression: true,
      group: 'Basic',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 0,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'Expression to determine visibility (true = hidden, false = visible)',
      placeholder: 'e.g. {{!showContainer}}',
    },
    {
      id: 'disabled',
      label: 'Disabled',
      type: 'expression',
      defaultValue: '',
      supportsExpression: true,
      group: 'Basic',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 0,
      propertyOrder: 1,
      applicableTo: types,
      tooltip: 'Expression to determine if component is disabled',
      placeholder: 'e.g. {{table1.selectedRecord == null}}',
    },
    {
      id: 'tooltip',
      label: 'Tooltip',
      type: 'expression',
      defaultValue: '',
      supportsExpression: true,
      group: 'Basic',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 0,
      propertyOrder: 2,
      applicableTo: types,
      tooltip: 'Tooltip text shown on hover',
      placeholder: 'e.g. {{"Container tooltip"}}',
    },
    
    // General Tab - Layout group
    {
      id: 'order',
      label: 'Order',
      type: 'number',
      defaultValue: 0,
      supportsExpression: false,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'Flex order (controls rendering sequence within parent)',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    {
      id: 'width',
      label: 'Width',
      type: 'string',
      defaultValue: '100%',
      supportsExpression: false,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 1,
      applicableTo: types,
      tooltip: 'Width in pixels (px), percentage (%), or auto. Examples: 100%, 400px, auto',
      placeholder: 'e.g. 100% or 400px',
      helpText: 'px, %, auto, vh/vw, fit-content',
      validationRules: [{
        type: 'custom' as const,
        message: 'Use a valid CSS size: e.g. 100%, 400px, auto',
        validator: (value: any) => {
          if (!value || value === '') return true;
          if (typeof value === 'string' && value.startsWith('{{')) return true;
          const v = String(value).trim();
          return /^(auto|inherit|initial|unset|fit-content|min-content|max-content|\d+(\.\d+)?(px|%|em|rem|vh|vw|vmin|vmax|ch|ex)|calc\(.+\)|clamp\(.+\)|min\(.+\)|max\(.+\))$/i.test(v);
        },
      }],
      layoutHint: {
        maxWidth: '120px',
      },
    },
    {
      id: 'height',
      label: 'Height',
      type: 'string',
      defaultValue: 'auto',
      supportsExpression: false,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 2,
      applicableTo: types,
      tooltip: 'Height in pixels (px), percentage (%), or auto. Examples: auto, 300px, 50%',
      placeholder: 'e.g. auto or 300px',
      helpText: 'px, %, auto, vh/vw, fit-content',
      validationRules: [{
        type: 'custom' as const,
        message: 'Use a valid CSS size: e.g. 100%, 400px, auto',
        validator: (value: any) => {
          if (!value || value === '') return true;
          if (typeof value === 'string' && value.startsWith('{{')) return true;
          const v = String(value).trim();
          return /^(auto|inherit|initial|unset|fit-content|min-content|max-content|\d+(\.\d+)?(px|%|em|rem|vh|vw|vmin|vmax|ch|ex)|calc\(.+\)|clamp\(.+\)|min\(.+\)|max\(.+\))$/i.test(v);
        },
      }],
      layoutHint: {
        maxWidth: '120px',
      },
    },
    {
      id: 'minWidth',
      label: 'Min Width',
      type: 'number',
      defaultValue: undefined,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 3,
      applicableTo: types,
      tooltip: 'Minimum width in pixels',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    {
      id: 'maxWidth',
      label: 'Max Width',
      type: 'number',
      defaultValue: undefined,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 4,
      applicableTo: types,
      tooltip: 'Maximum width in pixels',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    {
      id: 'minHeight',
      label: 'Min Height',
      type: 'number',
      defaultValue: undefined,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 5,
      applicableTo: types,
      tooltip: 'Minimum height in pixels',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    {
      id: 'maxHeight',
      label: 'Max Height',
      type: 'number',
      defaultValue: undefined,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 6,
      applicableTo: types,
      tooltip: 'Maximum height in pixels',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    
    // General Tab - Container Layout group
    {
      id: 'flexDirection',
      label: 'Direction',
      type: 'dropdown',
      defaultValue: 'column',
      group: 'Container Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: DEFAULT_GROUP_ORDER['Container Layout'],
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'Main axis direction for child components',
      options: [
        { value: 'row', label: 'Row (→)' },
        { value: 'column', label: 'Column (↓)' },
        { value: 'row-reverse', label: 'Row Reverse (←)' },
        { value: 'column-reverse', label: 'Column Reverse (↑)' },
      ],
    },
    {
      id: 'flexWrap',
      label: 'Wrap',
      type: 'dropdown',
      defaultValue: 'nowrap',
      group: 'Container Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: DEFAULT_GROUP_ORDER['Container Layout'],
      propertyOrder: 1,
      applicableTo: types,
      tooltip: 'Whether children wrap to new lines',
      options: [
        { value: 'nowrap', label: 'No Wrap' },
        { value: 'wrap', label: 'Wrap' },
        { value: 'wrap-reverse', label: 'Wrap Reverse' },
      ],
    },
    {
      id: 'justifyContent',
      label: 'Justify',
      type: 'dropdown',
      defaultValue: 'flex-start',
      group: 'Container Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: DEFAULT_GROUP_ORDER['Container Layout'],
      propertyOrder: 2,
      applicableTo: types,
      tooltip: 'Alignment along the main axis',
      options: [
        { value: 'flex-start', label: 'Start' },
        { value: 'flex-end', label: 'End' },
        { value: 'center', label: 'Center' },
        { value: 'space-between', label: 'Space Between' },
        { value: 'space-around', label: 'Space Around' },
        { value: 'space-evenly', label: 'Space Evenly' },
      ],
    },
    {
      id: 'alignItems',
      label: 'Align Items',
      type: 'dropdown',
      defaultValue: 'stretch',
      group: 'Container Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: DEFAULT_GROUP_ORDER['Container Layout'],
      propertyOrder: 3,
      applicableTo: types,
      tooltip: 'Alignment along the cross axis',
      options: [
        { value: 'flex-start', label: 'Start' },
        { value: 'flex-end', label: 'End' },
        { value: 'center', label: 'Center' },
        { value: 'stretch', label: 'Stretch' },
        { value: 'baseline', label: 'Baseline' },
      ],
    },
    {
      id: 'gap',
      label: 'Gap',
      type: 'expression',
      defaultValue: '12px',
      supportsExpression: true,
      group: 'Container Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: DEFAULT_GROUP_ORDER['Container Layout'],
      propertyOrder: 4,
      applicableTo: types,
      tooltip: 'Space between child components (e.g. 8px, 1rem)',
      placeholder: 'e.g. 8px or {{theme.spacing.md}}',
    },

    // General Tab - Advanced group
    {
      id: 'zIndex',
      label: 'Z-Index',
      type: 'number',
      defaultValue: undefined,
      supportsExpression: true,
      group: 'Advanced',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 2,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'Z-index for layering (higher values appear on top)',
    },
    
    // Styles Tab - Color & Typography group
    {
      id: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '{{theme.colors.surface}}',
      supportsExpression: true,
      group: 'Color & Typography',
      tab: 'Styles',
      tabOrder: 2,
      groupOrder: 0,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'Background color',
    },
    {
      id: 'backgroundImage',
      label: 'Background Image',
      type: 'expression',
      defaultValue: '',
      supportsExpression: true,
      group: 'Color & Typography',
      tab: 'Styles',
      tabOrder: 2,
      groupOrder: 0,
      propertyOrder: 1,
      applicableTo: types,
      tooltip: 'Background image URL',
      placeholder: 'e.g. {{"/images/bg.png"}}',
    },
    {
      id: 'backgroundSize',
      label: 'Background Size',
      type: 'dropdown',
      defaultValue: 'cover',
      group: 'Color & Typography',
      tab: 'Styles',
      tabOrder: 2,
      groupOrder: 0,
      propertyOrder: 2,
      applicableTo: types,
      tooltip: 'How the background image is sized',
      options: [
        { value: 'cover', label: 'Cover (fill area)' },
        { value: 'contain', label: 'Contain (fit inside)' },
        { value: 'auto', label: 'Auto (natural size)' },
        { value: '100% 100%', label: 'Stretch (fill exact)' },
      ],
    },
    {
      id: 'backgroundPosition',
      label: 'Background Position',
      type: 'dropdown',
      defaultValue: 'center',
      group: 'Color & Typography',
      tab: 'Styles',
      tabOrder: 2,
      groupOrder: 0,
      propertyOrder: 3,
      applicableTo: types,
      tooltip: 'Position of the background image',
      options: [
        { value: 'center', label: 'Center' },
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' },
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
        { value: 'top left', label: 'Top Left' },
        { value: 'top right', label: 'Top Right' },
        { value: 'bottom left', label: 'Bottom Left' },
        { value: 'bottom right', label: 'Bottom Right' },
      ],
    },
    {
      id: 'backgroundRepeat',
      label: 'Background Repeat',
      type: 'dropdown',
      defaultValue: 'no-repeat',
      group: 'Color & Typography',
      tab: 'Styles',
      tabOrder: 2,
      groupOrder: 0,
      propertyOrder: 4,
      applicableTo: types,
      tooltip: 'How the background image repeats',
      options: [
        { value: 'no-repeat', label: 'No Repeat' },
        { value: 'repeat', label: 'Repeat' },
        { value: 'repeat-x', label: 'Repeat X' },
        { value: 'repeat-y', label: 'Repeat Y' },
      ],
    },
    {
      id: 'backgroundOverlay',
      label: 'Background Overlay',
      type: 'color',
      defaultValue: '',
      supportsExpression: true,
      group: 'Color & Typography',
      tab: 'Styles',
      tabOrder: 2,
      groupOrder: 0,
      propertyOrder: 5,
      applicableTo: types,
      tooltip: 'Semi-transparent overlay for text readability (e.g., rgba(0,0,0,0.5))',
      placeholder: 'e.g. rgba(0,0,0,0.5)',
    },
    {
      id: 'backgroundAttachment',
      label: 'Background Scroll',
      type: 'dropdown',
      defaultValue: 'scroll',
      group: 'Color & Typography',
      tab: 'Styles',
      tabOrder: 2,
      groupOrder: 0,
      propertyOrder: 6,
      applicableTo: types,
      tooltip: 'Background scroll behavior',
      options: [
        { value: 'scroll', label: 'Scroll (normal)' },
        { value: 'fixed', label: 'Fixed (parallax)' },
      ],
    },
    {
      id: 'overflow',
      label: 'Overflow',
      type: 'dropdown',
      defaultValue: 'visible',
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 7,
      applicableTo: types,
      tooltip: 'How to handle content that overflows the container',
      options: [
        { value: 'visible', label: 'Visible' },
        { value: 'hidden', label: 'Hidden' },
        { value: 'scroll', label: 'Scroll' },
        { value: 'auto', label: 'Auto' },
      ],
    },

    {
      id: 'position',
      label: 'Position',
      type: 'dropdown',
      defaultValue: '',
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 8,
      applicableTo: types,
      tooltip: 'CSS position: sticky stays fixed during scroll, fixed stays at viewport position',
      options: [
        { value: '', label: 'Default (static)' },
        { value: 'relative', label: 'Relative' },
        { value: 'sticky', label: 'Sticky' },
        { value: 'fixed', label: 'Fixed' },
      ],
    },
    {
      id: 'positionTop',
      label: 'Top',
      type: 'expression',
      defaultValue: undefined,
      supportsExpression: true,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 9,
      applicableTo: types,
      tooltip: 'Top offset for sticky/fixed positioning (e.g., 0px)',
      placeholder: 'e.g. 0px',
      visibleIf: (props: any) => {
        const pos = (props as any).position;
        return pos === 'sticky' || pos === 'fixed';
      },
    },
    {
      id: 'positionBottom',
      label: 'Bottom',
      type: 'expression',
      defaultValue: undefined,
      supportsExpression: true,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 10,
      applicableTo: types,
      tooltip: 'Bottom offset for sticky/fixed positioning',
      placeholder: 'e.g. 0px',
      visibleIf: (props: any) => {
        const pos = (props as any).position;
        return pos === 'sticky' || pos === 'fixed';
      },
    },
    {
      id: 'positionLeft',
      label: 'Left',
      type: 'expression',
      defaultValue: undefined,
      supportsExpression: true,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 11,
      applicableTo: types,
      tooltip: 'Left offset for fixed positioning',
      placeholder: 'e.g. 0px',
      visibleIf: (props: any) => (props as any).position === 'fixed',
    },
    {
      id: 'positionRight',
      label: 'Right',
      type: 'expression',
      defaultValue: undefined,
      supportsExpression: true,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 12,
      applicableTo: types,
      tooltip: 'Right offset for fixed positioning',
      placeholder: 'e.g. 0px',
      visibleIf: (props: any) => (props as any).position === 'fixed',
    },
    {
      id: 'semanticTag',
      label: 'HTML Tag',
      type: 'dropdown',
      defaultValue: '',
      group: 'Advanced',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 2,
      propertyOrder: 1,
      applicableTo: types,
      tooltip: 'Semantic HTML element for SEO and accessibility',
      options: [
        { value: '', label: 'div (default)' },
        { value: 'nav', label: 'nav' },
        { value: 'main', label: 'main' },
        { value: 'section', label: 'section' },
        { value: 'article', label: 'article' },
        { value: 'aside', label: 'aside' },
        { value: 'header', label: 'header' },
        { value: 'footer', label: 'footer' },
      ],
    },

    // Styles Tab - Spacing group
    {
      id: 'padding',
      label: 'Padding',
      type: 'expression',
      defaultValue: '{{theme.spacing.sm}}',
      supportsExpression: true,
      group: 'Spacing',
      tab: 'Styles',
      tabOrder: 2,
      groupOrder: 1,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'Padding (top/right/bottom/left)',
      placeholder: 'e.g. 8px or {{theme.spacing.md}}',
    },
    
    // Styles Tab - Text Inheritance group
    {
      id: 'textColor',
      label: 'Text Color',
      type: 'color',
      supportsExpression: true,
      group: 'Text Inheritance',
      tab: 'Styles',
      tabOrder: 1,
      groupOrder: 1,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'Text color inherited by all child components that don\'t set their own',
      placeholder: 'Inherited from parent',
    },
    {
      id: 'textFontSize',
      label: 'Text Size',
      type: 'dropdown',
      supportsExpression: true,
      group: 'Text Inheritance',
      tab: 'Styles',
      tabOrder: 1,
      groupOrder: 1,
      propertyOrder: 1,
      applicableTo: types,
      tooltip: 'Font size inherited by all child components that don\'t set their own',
      allowCustom: true,
      options: fontSizePresets,
    },
    {
      id: 'textFontWeight',
      label: 'Text Weight',
      type: 'dropdown',
      supportsExpression: true,
      group: 'Text Inheritance',
      tab: 'Styles',
      tabOrder: 1,
      groupOrder: 1,
      propertyOrder: 2,
      applicableTo: types,
      tooltip: 'Font weight inherited by all child components that don\'t set their own',
      allowCustom: true,
      options: fontWeightPresets,
    },
    {
      id: 'textFontFamily',
      label: 'Text Font',
      type: 'string',
      supportsExpression: true,
      group: 'Text Inheritance',
      tab: 'Styles',
      tabOrder: 1,
      groupOrder: 1,
      propertyOrder: 3,
      applicableTo: types,
      tooltip: 'Font family inherited by all child components that don\'t set their own',
      placeholder: 'e.g. Inter, sans-serif',
    },

    // Events Tab - Events group
    {
      id: 'onClick',
      label: 'onClick',
      type: 'code',
      defaultValue: '',
      supportsExpression: true,
      group: 'Events',
      tab: 'Events',
      tabOrder: 4,
      groupOrder: 0,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'JavaScript expression to execute on click',
      placeholder: 'e.g. {{actions.updateVariable("count", count + 1)}}',
    },
  ];
  
  // Apply overrides
  const propertiesWithOverrides = baseProperties.map(prop => {
    const override = overrideMap.get(prop.id);
    if (override) {
      return { ...prop, ...override };
    }
    return prop;
  });
  
  // Add additional properties
  return [...propertiesWithOverrides, ...additionalProperties];
}

/**
 * Creates base container tabs
 */
export function createBaseContainerTabs(customTabs: PropertyTab[] = []): PropertyTab[] {
  const baseTabs: PropertyTab[] = [
    { id: 'General', label: 'General', order: 0 },
    { id: 'Styles', label: 'Styles', order: 1 },
    { id: 'Events', label: 'Events', order: 2 },
  ];
  
  // Merge with custom tabs (custom tabs override base tabs by id)
  const tabMap = new Map<string, PropertyTab>();
  baseTabs.forEach(tab => tabMap.set(tab.id, tab));
  customTabs.forEach(tab => tabMap.set(tab.id, tab));
  
  return Array.from(tabMap.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Creates base container groups
 */
export function createBaseContainerGroups(customGroups: PropertyGroup[] = []): PropertyGroup[] {
  const baseGroups: PropertyGroup[] = [
    { 
      id: 'Basic', 
      label: 'Basic', 
      tab: 'General', 
      order: DEFAULT_GROUP_ORDER['Basic'] ?? 0, 
      collapsible: true, 
      defaultCollapsed: false 
    },
    { 
      id: 'Layout', 
      label: 'Layout', 
      tab: 'General', 
      order: DEFAULT_GROUP_ORDER['Layout'] ?? 1, 
      collapsible: true, 
      defaultCollapsed: false 
    },
    { 
      id: 'Color & Typography', 
      label: 'Color & Typography', 
      tab: 'Styles', 
      order: DEFAULT_GROUP_ORDER['Color & Typography'] ?? 0, 
      collapsible: true, 
      defaultCollapsed: false 
    },
    { 
      id: 'Spacing', 
      label: 'Spacing', 
      tab: 'Styles', 
      order: DEFAULT_GROUP_ORDER['Spacing'] ?? 1, 
      collapsible: true, 
      defaultCollapsed: false 
    },
    { 
      id: 'Borders', 
      label: 'Borders', 
      tab: 'Styles', 
      order: DEFAULT_GROUP_ORDER['Borders'] ?? 2, 
      collapsible: true, 
      defaultCollapsed: false 
    },
    {
      id: 'Text Inheritance',
      label: 'Text Inheritance',
      tab: 'Styles',
      order: 1,
      collapsible: true,
      defaultCollapsed: true,
    },
    {
      id: 'Container Layout',
      label: 'Container Layout',
      tab: 'General',
      order: DEFAULT_GROUP_ORDER['Container Layout'] ?? 6,
      collapsible: true,
      defaultCollapsed: false,
    },
    {
      id: 'Advanced',
      label: 'Advanced',
      tab: 'General',
      order: 2,
      collapsible: true,
      defaultCollapsed: false
    },
    {
      id: 'Events',
      label: 'Events',
      tab: 'Events',
      order: 0,
      collapsible: true,
      defaultCollapsed: false
    },
  ];
  
  // Merge with custom groups (custom groups override base groups by id)
  const groupMap = new Map<string, PropertyGroup>();
  baseGroups.forEach(group => groupMap.set(group.id, group));
  customGroups.forEach(group => groupMap.set(group.id, group));
  
  return Array.from(groupMap.values());
}

/**
 * Creates a complete container property schema with base properties + custom properties
 */
export function createBaseContainerSchema(
  componentType: ComponentType,
  customProperties: PropertyMetadata[] = [],
  customTabs: PropertyTab[] = [],
  customGroups: PropertyGroup[] = []
): ComponentPropertySchema {
  // Get base container properties
  const baseProperties = createBaseContainerProperties(componentType);
  
  // Combine base and custom properties (custom properties override base by id)
  const allPropertiesMap = new Map<string, PropertyMetadata>();
  baseProperties.forEach(prop => allPropertiesMap.set(prop.id, prop));
  customProperties.forEach(prop => allPropertiesMap.set(prop.id, prop));
  const allProperties = Array.from(allPropertiesMap.values());
  
  // Get base tabs and groups
  const tabs = createBaseContainerTabs(customTabs);
  const groups = createBaseContainerGroups(customGroups);
  
  // Merge with common groups for Styles tab
  const allGroups = [...commonGroups.filter(g => g.tab === 'Styles'), ...groups];
  
  // Create schema
  return createPropertySchema(
    componentType,
    allProperties,
    tabs,
    allGroups
  );
}

