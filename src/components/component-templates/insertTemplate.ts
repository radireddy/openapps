import { AppComponent, ComponentProps } from '@/types';
import { TemplateComponent } from './types';

let counter = 0;

function generateId(type: string): string {
  return `${type}_${Date.now()}_${++counter}`;
}

export function flattenTemplate(
  templateComponents: TemplateComponent[],
  pageId: string,
  parentId: string | null = null,
  startOrder: number = 0
): AppComponent[] {
  const result: AppComponent[] = [];

  templateComponents.forEach((tc, index) => {
    const id = generateId(tc.type);
    const component: AppComponent = {
      id,
      type: tc.type,
      name: tc.name,
      props: {
        ...tc.props,
        order: startOrder + index,
      } as ComponentProps,
      parentId,
      pageId,
    };
    result.push(component);

    if (tc.children && tc.children.length > 0) {
      const childComponents = flattenTemplate(tc.children, pageId, id, 0);
      result.push(...childComponents);
    }
  });

  return result;
}
