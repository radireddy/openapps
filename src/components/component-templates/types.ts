import { ComponentType, ComponentProps } from '@/types';

/**
 * A template component in nested tree format.
 * Flattened into AppComponent[] at insertion time.
 */
export interface TemplateComponent {
  type: ComponentType;
  name: string;
  props: Partial<ComponentProps>;
  children?: TemplateComponent[];
}

/**
 * A pre-built component template that appears in the palette.
 */
export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  components: TemplateComponent[];
}
