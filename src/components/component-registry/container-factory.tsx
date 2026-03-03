/**
 * Container Component Factory
 * 
 * This factory function makes it easy to create new container-based components
 * that automatically inherit all Container features:
 * - All container properties
 * - Container rendering behavior
 * - Container drag-and-drop behavior
 * - Container property panel structure
 */

import React from 'react';
import { ComponentType, ContainerProps, ComponentPlugin } from '../../types';
import { createBaseContainerRenderer, BaseContainerRendererOptions } from './base-container';
import { createBaseContainerSchema } from '../properties/schemas/base-container';
import { PropertyMetadata, PropertyTab, PropertyGroup } from '../properties/metadata';
import { commonStylingProps } from '../../constants';

/**
 * Options for creating a container-based component
 */
export interface CreateContainerComponentOptions {
  /**
   * The component type (must be a new ComponentType enum value)
   */
  type: ComponentType;
  
  /**
   * Display label in the component palette
   */
  label: string;
  
  /**
   * Icon element to display in the palette
   */
  icon: React.ReactElement;
  
  /**
   * Default props for the component
   * All ContainerProps are available
   */
  defaultProps?: Partial<ContainerProps>;
  
  /**
   * Optional custom renderer options
   */
  rendererOptions?: BaseContainerRendererOptions;
  
  /**
   * Optional additional properties beyond base container properties
   */
  additionalProperties?: PropertyMetadata[];
  
  /**
   * Optional custom tabs (will be merged with base container tabs)
   */
  customTabs?: PropertyTab[];
  
  /**
   * Optional custom groups (will be merged with base container groups)
   */
  customGroups?: PropertyGroup[];
  
  /**
   * Optional property overrides (properties with same id will override base properties)
   */
  propertyOverrides?: Partial<PropertyMetadata>[];
}

/**
 * Creates a complete container-based component plugin
 * 
 * This function:
 * 1. Creates a renderer using base container renderer
 * 2. Creates a property schema using base container properties
 * 3. Sets up the component plugin with all necessary configurations
 * 4. Registers the component as a container (isContainer: true)
 */
export function createContainerComponent(
  options: CreateContainerComponentOptions
): ComponentPlugin {
  const {
    type,
    label,
    icon,
    defaultProps = {},
    rendererOptions = {},
    additionalProperties = [],
    customTabs = [],
    customGroups = [],
    propertyOverrides = [],
  } = options;
  
  // Create renderer with optional customizations
  const ContainerRenderer = createBaseContainerRenderer(rendererOptions);
  
  // Create property schema with base container properties + custom properties
  const schema = createBaseContainerSchema(
    type,
    additionalProperties,
    customTabs,
    customGroups
  );
  
  // Merge default props with common styling props
  const mergedDefaultProps: Partial<ContainerProps> = {
    ...commonStylingProps,
    width: '100%',
    height: 'auto',
    backgroundColor: 'transparent',
    borderWidth: '0px',
    borderColor: 'transparent',
    borderRadius: '{{theme.radius.default}}',
    padding: '{{theme.spacing.sm}}',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: '12px',
    ...defaultProps,
    // Cast borderStyle to any to allow theme expressions
    borderStyle: (defaultProps.borderStyle ?? commonStylingProps.borderStyle) as any,
  };
  
  // Create the component plugin
  const plugin: ComponentPlugin = {
    type,
    isContainer: true, // All container-based components are containers
    paletteConfig: {
      label,
      icon,
      defaultProps: mergedDefaultProps,
    },
    renderer: (props: any) => (
      <ContainerRenderer
        component={props.component}
        children={props.children}
        mode={props.mode}
        actions={props.actions}
        evaluationScope={props.evaluationScope}
        onClick={props.onClick}
      />
    ),
    properties: () => {
      // Properties are handled by metadata-driven system
      // The schema is registered separately via registerPropertySchema
      return null;
    },
  };
  
  return plugin;
}

