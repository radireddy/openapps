import { ComponentTemplate } from './types';
import { navbarTemplate } from './templates/navbar';
import { heroTemplate } from './templates/hero';
import { footerTemplate } from './templates/footer';
import { cardTemplate } from './templates/card';
import { authorCardTemplate } from './templates/authorCard';
import { ctaTemplate } from './templates/cta';

export const componentTemplates: ComponentTemplate[] = [
  navbarTemplate,
  heroTemplate,
  footerTemplate,
  cardTemplate,
  authorCardTemplate,
  ctaTemplate,
];

export function getTemplateById(id: string, customPresets?: ComponentTemplate[]): ComponentTemplate | undefined {
  return componentTemplates.find(t => t.id === id)
    || (customPresets || []).find(t => t.id === id);
}

export { flattenTemplate } from './insertTemplate';
export { componentTreeToTemplate } from './componentTreeToTemplate';
export type { ComponentTemplate, TemplateComponent } from './types';
