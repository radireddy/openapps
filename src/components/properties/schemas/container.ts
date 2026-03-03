/**
 * Container Property Schema
 * 
 * Uses base container properties - all container features are inherited automatically.
 * No custom properties needed for the base Container component.
 */

import { ComponentType } from '../../../types';
import { ComponentPropertySchema } from '../metadata';
import { createBaseContainerSchema } from './base-container';

/**
 * Container property schema
 * Uses base container properties - no custom properties needed
 */
export const containerSchema: ComponentPropertySchema = createBaseContainerSchema(
  ComponentType.CONTAINER
);
