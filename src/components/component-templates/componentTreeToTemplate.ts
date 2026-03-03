import { AppComponent } from '@/types';
import { TemplateComponent } from './types';

/**
 * Converts a flat AppComponent subtree (rooted at `rootId`) into a nested
 * TemplateComponent tree — the reverse of `flattenTemplate()`.
 *
 * Strips runtime IDs (id, pageId, parentId) and `order` prop,
 * keeping only type, name, props, and children structure.
 */
export function componentTreeToTemplate(
  rootId: string,
  allComponents: AppComponent[]
): TemplateComponent[] {
  const root = allComponents.find(c => c.id === rootId);
  if (!root) return [];

  function convert(component: AppComponent): TemplateComponent {
    const children = allComponents
      .filter(c => c.parentId === component.id)
      .sort((a, b) => ((a.props as any).order ?? 0) - ((b.props as any).order ?? 0));

    // Strip runtime-only props
    const { order, ...cleanProps } = component.props as any;

    const tc: TemplateComponent = {
      type: component.type,
      name: component.name,
      props: cleanProps,
    };

    if (children.length > 0) {
      tc.children = children.map(convert);
    }

    return tc;
  }

  return [convert(root)];
}
