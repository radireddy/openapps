/**
 * Sample Value Generator
 * 
 * Generates sample test values based on property types.
 * Ensures consistent values across all tests.
 */

import { PropertyType } from '../../../../components/properties/metadata';
import { PropertyCapability } from './capability-matrix';

/**
 * Generates a sample value for a given property type
 */
export function getSampleValue(
  type: PropertyType,
  propertyId?: string,
  defaultValue?: any
): any {
  // If there's a default value, use it as a hint but ensure we return a different value for testing
  // This ensures we're actually testing property updates, not just defaults
  
  switch (type) {
    case 'boolean':
      // Return opposite of default if default exists, otherwise true
      return defaultValue !== undefined ? !defaultValue : true;
      
    case 'number':
      if (propertyId === 'rows') return 6;
      if (propertyId === 'maxLength') return 100;
      if (defaultValue !== undefined && typeof defaultValue === 'number') {
        return defaultValue + 42; // Return a different number
      }
      return 42;
      
    case 'string':
      // For specific property IDs, return more meaningful test values
      if (propertyId === 'placeholder') {
        return 'Test placeholder text';
      }
      if (propertyId === 'label' || propertyId === 'text') {
        return 'Test Label';
      }
      if (propertyId === 'options') {
        return 'Option 1,Option 2,Option 3';
      }
      if (propertyId === 'helpText') {
        return 'Enter your full name';
      }
      if (propertyId === 'prefixText') {
        return '$';
      }
      if (propertyId === 'suffixText') {
        return '.com';
      }
      if (propertyId === 'onLabel') {
        return 'ON';
      }
      if (propertyId === 'offLabel') {
        return 'OFF';
      }
      if (propertyId === 'description') {
        return 'Additional info';
      }
      if (propertyId === 'autoComplete') {
        return 'email';
      }
      if (propertyId === 'pattern') {
        return '[A-Za-z]+';
      }
      if (defaultValue !== undefined && typeof defaultValue === 'string') {
        // Return a different string
        return `Test ${defaultValue}`;
      }
      return 'test-value';
      
    case 'color':
      // Return a different color than default
      if (defaultValue === '#4f46e5') {
        return '#ef4444';
      }
      if (defaultValue === '#FFFFFF' || defaultValue === '#fff' || defaultValue === 'white') {
        return '#000000';
      }
      return '#3b82f6';
      
    case 'expression':
      // Return a simple expression for testing
      if (propertyId === 'value' || propertyId === 'defaultValue') {
        return '{{ "test-value" }}';
      }
      if (propertyId === 'disabled' || propertyId === 'hidden') {
        return '{{ true }}';
      }
      return '{{ "test" }}';
      
    case 'dropdown':
      // For dropdowns, return a valid option that differs from default
      if (propertyId === 'size') return 'lg';
      if (propertyId === 'validationTiming') return 'onChange';
      if (propertyId === 'resize') return 'both';
      if (propertyId === 'layout') return 'horizontal';
      if (propertyId === 'textTransform') return 'uppercase';
      if (propertyId === 'autoComplete') return 'email';
      if (defaultValue && typeof defaultValue === 'string') {
        return defaultValue === 'none' ? 'alert' : 'none';
      }
      return 'none';
      
    case 'date':
      return '2024-01-15';
      
    case 'time':
      return '14:30';
      
    case 'json':
      return JSON.stringify({ test: 'value' });
      
    case 'code':
      return 'console.log("test");';
      
    case 'composite':
      // For composite types, return a reasonable default structure
      return defaultValue || { top: 10, right: 10, bottom: 10, left: 10 };
      
    default:
      return 'test-value';
  }
}

/**
 * Gets a valid sample value for a property capability
 * This ensures the value is appropriate for the property's type and context
 */
export function getSampleValueForProperty(capability: PropertyCapability): any {
  return getSampleValue(
    capability.type,
    capability.id,
    capability.defaultValue
  );
}

/**
 * Gets a test value that should be different from the default
 * Useful for testing that property updates actually change the component
 */
export function getDifferentSampleValue(
  type: PropertyType,
  propertyId: string,
  currentValue: any
): any {
  const sample = getSampleValue(type, propertyId);
  
  // Ensure we return a different value
  if (sample === currentValue) {
    switch (type) {
      case 'boolean':
        return !currentValue;
      case 'number':
        return typeof currentValue === 'number' ? currentValue + 100 : 999;
      case 'string':
        return `${currentValue}-updated`;
      default:
        return `${sample}-modified`;
    }
  }
  
  return sample;
}

