import { ComponentType, PaletteComponent } from './types';
import React from 'react';

// Common icon style
const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

// Global Typography Configuration
// Follows UX best practices and accessibility standards (WCAG 2.1)
// Based on Material Design, Apple HIG, and modern design systems
// This configuration can be changed in one place to affect the entire application
// Individual components can override these values when needed
export const typography = {
  // Text sizes - Hierarchical scale following 1.2x ratio (major third)
  // Captions and meta text (IDs, timestamps, secondary info)
  caption: 'text-[10px]',
  
  // Small labels and component/item names (palette items, tree nodes)
  label: 'text-[11px]',
  
  // Body text and form labels (input labels, property labels)
  body: 'text-[12px]',
  
  // Subsection titles (property group titles, category names in palette)
  subsection: 'text-[13px]',
  
  // Section headings (panel titles like "Components", "Properties", "Explorer")
  section: 'text-[14px]',
  
  // Group/Category headings (larger category titles, major sections)
  group: 'text-[16px]',
  
  // Page/App headings (main page titles, app names)
  heading: 'text-[18px]',
  
  // Large headings (dashboard title, major page headers)
  title: 'text-[20px]',
  
  // Font weights
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  
  // Line heights (if needed)
  leading: {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
} as const;

// Typography utility function to get text size class
// Allows for easy override when needed
export const getTextSize = (size: 'caption' | 'label' | 'body' | 'subsection' | 'section' | 'group' | 'heading' | 'title', override?: string): string => {
  return override || typography[size];
};

export const commonStylingProps = {
  opacity: 1,
  boxShadow: '',
  borderRadius: '{{theme.radius.default}}',
  borderWidth: '{{theme.border.width}}',
  borderColor: '{{theme.colors.border}}',
  borderStyle: '{{theme.border.style}}',
};

export const commonInputStylingProps = {
  ...commonStylingProps,
  backgroundColor: '{{theme.colors.surface}}',
  color: '{{theme.colors.text}}',
  fontFamily: '{{theme.typography.fontFamily}}',
  fontSize: '{{theme.typography.fontSizeSm}}',
  fontWeight: '{{theme.typography.fontWeightNormal}}',
};

// Form size variants for consistent sizing across form components
export const formSizeVariants = {
  sm: { fontSize: '{{theme.typography.fontSizeXs}}', padding: '4px 8px', height: 32 },
  md: { fontSize: '{{theme.typography.fontSizeSm}}', padding: '8px', height: 40 },
  lg: { fontSize: '{{theme.typography.fontSizeMd}}', padding: '8px 12px', height: 48 },
};

// Feature flag to enable/disable UiPath SDK initialization
// Set to false to disable SDK initialization
export const ENABLE_UIPATH_SDK = true;
