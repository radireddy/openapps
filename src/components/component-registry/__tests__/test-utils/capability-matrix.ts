/**
 * Capability Matrix Generator
 * 
 * Automatically builds a capability matrix from the property registry.
 * This matrix defines which components support which properties and their expected behaviors.
 * 
 * The matrix is dynamically generated from the registered property schemas, ensuring
 * tests automatically cover new properties and components without manual updates.
 */

import { ComponentType } from '../../../../types';
import { propertyRegistry } from '../../../properties/registry';
import { PropertyType, PropertyMetadata } from '../../../properties/metadata';
import { registerAllPropertySchemas } from '../../../properties/schemas';

// Form components that should be tested
const FORM_COMPONENTS: ComponentType[] = [
  ComponentType.INPUT,
  ComponentType.BUTTON,
  ComponentType.CHECKBOX,
  ComponentType.SELECT,
  ComponentType.SWITCH,
  ComponentType.TEXTAREA,
  ComponentType.RADIO_GROUP,
  ComponentType.DATE_PICKER,
  ComponentType.TIME_PICKER,
  ComponentType.SLIDER,
  ComponentType.FILE_UPLOAD,
  ComponentType.RATING,
  ComponentType.PROGRESS,
];

/**
 * Expected effects that properties can have on components
 */
export type ExpectedEffect =
  | 'componentShouldBeDisabled'
  | 'componentShouldShowHide'
  | 'componentShouldHaveValue'
  | 'componentShouldHavePlaceholder'
  | 'componentShouldHaveLabel'
  | 'componentShouldHaveOptions'
  | 'componentShouldHaveColor'
  | 'componentShouldHaveText'
  | 'componentShouldHaveHelpText'
  | 'componentShouldBeReadOnly'
  | 'componentShouldHavePrefix'
  | 'componentShouldHaveSuffix'
  | 'componentShouldBeRequired';

/**
 * Property capability configuration
 */
export interface PropertyCapability {
  /** Property identifier */
  id: string;
  /** Property label */
  label: string;
  /** Property type */
  type: PropertyType;
  /** Default value */
  defaultValue?: any;
  /** Whether it supports expressions */
  supportsExpression?: boolean;
  /** Expected effects when this property is set */
  expectedEffects?: ExpectedEffect[];
  /** Whether this property has conditional visibility */
  hasConditionalVisibility?: boolean;
}

/**
 * Component capability configuration
 */
export interface ComponentCapability {
  /** Component type */
  componentType: ComponentType;
  /** All properties this component supports */
  properties: Record<string, PropertyCapability>;
}

/**
 * Capability matrix mapping component types to their capabilities
 */
export interface CapabilityMatrix {
  [componentType: string]: ComponentCapability;
}

/**
 * Maps property metadata types to expected effects
 */
function getExpectedEffectsForProperty(property: PropertyMetadata): ExpectedEffect[] {
  const effects: ExpectedEffect[] = [];
  
  // Map property IDs to expected effects
  if (property.id === 'disabled') {
    effects.push('componentShouldBeDisabled');
  }
  
  if (property.id === 'hidden') {
    effects.push('componentShouldShowHide');
  }
  
  if (property.id === 'value' || property.id === 'defaultValue') {
    effects.push('componentShouldHaveValue');
  }
  
  if (property.id === 'placeholder') {
    effects.push('componentShouldHavePlaceholder');
  }
  
  if (property.id === 'label' || property.id === 'groupLabel') {
    effects.push('componentShouldHaveLabel');
  }
  
  if (property.id === 'options') {
    effects.push('componentShouldHaveOptions');
  }
  
  if (property.id === 'backgroundColor' || property.id === 'textColor' || property.id === 'color' || property.id === 'borderColor') {
    effects.push('componentShouldHaveColor');
  }
  
  if (property.id === 'text') {
    effects.push('componentShouldHaveText');
  }

  if (property.id === 'helpText') {
    effects.push('componentShouldHaveHelpText');
  }

  if (property.id === 'readOnly') {
    effects.push('componentShouldBeReadOnly');
  }

  if (property.id === 'prefixText') {
    effects.push('componentShouldHavePrefix');
  }

  if (property.id === 'suffixText') {
    effects.push('componentShouldHaveSuffix');
  }

  if (property.id === 'required') {
    effects.push('componentShouldBeRequired');
  }

  return effects;
}

/**
 * Converts property metadata to capability configuration
 */
function propertyToCapability(property: PropertyMetadata): PropertyCapability {
  return {
    id: property.id,
    label: property.label,
    type: property.type,
    defaultValue: property.defaultValue,
    supportsExpression: property.supportsExpression,
    expectedEffects: getExpectedEffectsForProperty(property),
    hasConditionalVisibility: !!property.visibleIf || !!property.hidden,
  };
}

/**
 * Checks if a property is applicable to a component type
 */
function isPropertyApplicable(property: PropertyMetadata, componentType: ComponentType): boolean {
  if (property.applicableTo === 'all') {
    return true;
  }
  
  if (Array.isArray(property.applicableTo)) {
    return property.applicableTo.includes(componentType);
  }
  
  return false;
}

/**
 * Filters properties by component type, excluding conditionally visible properties that don't apply
 */
function getApplicableProperties(schema: any, componentType: ComponentType): PropertyMetadata[] {
  return schema.properties.filter((prop: PropertyMetadata) => {
    // Check if property is applicable
    if (!isPropertyApplicable(prop, componentType)) {
      return false;
    }
    
    // For now, include all properties even if they have conditional visibility
    // The test runner will handle conditional properties appropriately
    return true;
  });
}

/**
 * Builds the capability matrix from the property registry
 */
export function buildCapabilityMatrix(): CapabilityMatrix {
  // Ensure all property schemas are registered
  registerAllPropertySchemas();
  
  const matrix: CapabilityMatrix = {};
  
  // Build matrix for each form component
  for (const componentType of FORM_COMPONENTS) {
    const schema = propertyRegistry[componentType];
    
    if (!schema) {
      console.warn(`No property schema found for component type: ${componentType}`);
      continue;
    }
    
    // Get all applicable properties for this component
    const applicableProperties = getApplicableProperties(schema, componentType);
    
    // Build property capabilities
    const properties: Record<string, PropertyCapability> = {};
    
    for (const property of applicableProperties) {
      // Skip properties with conditional visibility for now (they're handled by visibleIf)
      // We'll test them separately in the main test file
      properties[property.id] = propertyToCapability(property);
    }
    
    matrix[componentType] = {
      componentType,
      properties,
    };
  }
  
  return matrix;
}

/**
 * Gets the capability matrix (rebuilds each time to ensure fresh data)
 * Note: Not cached to ensure it picks up any schema registrations that happen during test setup
 */
export function getCapabilityMatrix(): CapabilityMatrix {
  return buildCapabilityMatrix();
}

/**
 * Gets the form components list
 */
export function getFormComponents(): ComponentType[] {
  return FORM_COMPONENTS;
}

