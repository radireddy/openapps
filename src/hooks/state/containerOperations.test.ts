import { reparentComponentInState, reorderComponentInState, moveComponentToParentInState, reassignSiblingOrders } from '@/hooks/state/containerOperations';
import { AppDefinition, AppComponent, ComponentType } from '@/types';

// Mock the component registry - mark CONTAINER as isContainer
jest.mock('@/components/component-registry/registry', () => ({
  componentRegistry: new Proxy({}, {
    get: (_target, prop) => {
      if (prop === ComponentType.CONTAINER) return { isContainer: true };
      if (prop === ComponentType.LIST) return { isContainer: true };
      return { isContainer: false };
    },
  }),
}));

const mockTheme = {
  colors: { primary: '#000', onPrimary: '#fff', secondary: '#000', onSecondary: '#fff', background: '#fff', surface: '#fff', text: '#000', border: '#e5e5e5' },
  font: { family: 'Arial' },
  border: { width: '1px', style: 'solid' },
  radius: { default: '4px' },
  spacing: { sm: '4px', md: '8px', lg: '16px' },
};

const makeState = (components: AppComponent[]): AppDefinition => ({
  id: 'app1',
  name: 'Test App',
  createdAt: '',
  lastModifiedAt: '',
  pages: [{ id: 'page1', name: 'Main Page' }],
  mainPageId: 'page1',
  components,
  dataStore: {},
  variables: [],
  theme: mockTheme as any,
});

const makeComponent = (overrides: Partial<AppComponent> & { id: string }): AppComponent => ({
  type: ComponentType.BUTTON,
  pageId: 'page1',
  props: { x: 0, y: 0, width: 100, height: 40, label: 'Button', order: 0 } as any,
  ...overrides,
} as AppComponent);

const makeContainer = (overrides: Partial<AppComponent> & { id: string }): AppComponent => ({
  type: ComponentType.CONTAINER,
  pageId: 'page1',
  props: { x: 0, y: 0, width: 400, height: 300, padding: '10', order: 0 } as any,
  ...overrides,
} as AppComponent);

describe('reassignSiblingOrders', () => {
  it('assigns contiguous order values to siblings', () => {
    const components = [
      makeComponent({ id: 'btn1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 5 } as any }),
      makeComponent({ id: 'btn2', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 10 } as any }),
      makeComponent({ id: 'btn3', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 15 } as any }),
    ];
    const result = reassignSiblingOrders(components, null, 'page1');
    expect((result[0].props as any).order).toBe(0);
    expect((result[1].props as any).order).toBe(1);
    expect((result[2].props as any).order).toBe(2);
  });

  it('does not modify components in different parent groups', () => {
    const container = makeContainer({ id: 'cont1' });
    const child = makeComponent({ id: 'child1', parentId: 'cont1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 5 } as any });
    const root = makeComponent({ id: 'btn1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 0 } as any });
    const result = reassignSiblingOrders([container, child, root], null, 'page1');
    // root and container are root-level, child is inside cont1
    const childResult = result.find(c => c.id === 'child1');
    expect((childResult!.props as any).order).toBe(5); // untouched
  });
});

describe('reorderComponentInState', () => {
  it('returns original state when component not found', () => {
    const state = makeState([makeComponent({ id: 'btn1' })]);
    const result = reorderComponentInState(state, 'nonexistent', 0, null, 'page1');
    expect(result).toBe(state);
  });

  it('returns original state when component is on a different page', () => {
    const component = makeComponent({ id: 'btn1', pageId: 'page2' });
    const state = makeState([component]);
    const result = reorderComponentInState(state, 'btn1', 0, null, 'page1');
    expect(result).toBe(state);
  });

  it('reorders root-level components by updating props.order', () => {
    const btn1 = makeComponent({ id: 'btn1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 0 } as any });
    const btn2 = makeComponent({ id: 'btn2', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 1 } as any });
    const btn3 = makeComponent({ id: 'btn3', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 2 } as any });
    const state = makeState([btn1, btn2, btn3]);

    // Move btn3 to position 0
    const result = reorderComponentInState(state, 'btn3', 0, null, 'page1');
    const r1 = result.components.find(c => c.id === 'btn3');
    const r2 = result.components.find(c => c.id === 'btn1');
    const r3 = result.components.find(c => c.id === 'btn2');
    expect((r1!.props as any).order).toBe(0);
    expect((r2!.props as any).order).toBe(1);
    expect((r3!.props as any).order).toBe(2);
  });

  it('reorders components within a parent container', () => {
    const container = makeContainer({ id: 'cont1' });
    const btn1 = makeComponent({ id: 'btn1', parentId: 'cont1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 0 } as any });
    const btn2 = makeComponent({ id: 'btn2', parentId: 'cont1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 1 } as any });
    const btn3 = makeComponent({ id: 'btn3', parentId: 'cont1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 2 } as any });
    const state = makeState([container, btn1, btn2, btn3]);

    // Move btn3 to position 0 within cont1
    const result = reorderComponentInState(state, 'btn3', 0, 'cont1', 'page1');
    const r3 = result.components.find(c => c.id === 'btn3');
    const r1 = result.components.find(c => c.id === 'btn1');
    const r2 = result.components.find(c => c.id === 'btn2');
    expect((r3!.props as any).order).toBe(0);
    expect((r1!.props as any).order).toBe(1);
    expect((r2!.props as any).order).toBe(2);
  });

  it('clamps index to valid range', () => {
    const btn1 = makeComponent({ id: 'btn1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 0 } as any });
    const btn2 = makeComponent({ id: 'btn2', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 1 } as any });
    const state = makeState([btn1, btn2]);

    // Index way beyond range - should move btn1 to the end
    const result = reorderComponentInState(state, 'btn1', 999, null, 'page1');
    const r1 = result.components.find(c => c.id === 'btn1');
    const r2 = result.components.find(c => c.id === 'btn2');
    expect((r1!.props as any).order).toBe(1);
    expect((r2!.props as any).order).toBe(0);
  });

  it('clamps negative index to 0', () => {
    const btn1 = makeComponent({ id: 'btn1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 0 } as any });
    const btn2 = makeComponent({ id: 'btn2', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 1 } as any });
    const state = makeState([btn1, btn2]);

    const result = reorderComponentInState(state, 'btn2', -5, null, 'page1');
    const r2 = result.components.find(c => c.id === 'btn2');
    const r1 = result.components.find(c => c.id === 'btn1');
    expect((r2!.props as any).order).toBe(0);
    expect((r1!.props as any).order).toBe(1);
  });

  it('preserves order when moving to same position', () => {
    const btn1 = makeComponent({ id: 'btn1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 0 } as any });
    const btn2 = makeComponent({ id: 'btn2', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 1 } as any });
    const btn3 = makeComponent({ id: 'btn3', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 2 } as any });
    const state = makeState([btn1, btn2, btn3]);

    // Move btn2 to position 1 (same position)
    const result = reorderComponentInState(state, 'btn2', 1, null, 'page1');
    expect((result.components.find(c => c.id === 'btn1')!.props as any).order).toBe(0);
    expect((result.components.find(c => c.id === 'btn2')!.props as any).order).toBe(1);
    expect((result.components.find(c => c.id === 'btn3')!.props as any).order).toBe(2);
  });
});

describe('moveComponentToParentInState', () => {
  it('returns original state when component not found', () => {
    const state = makeState([makeComponent({ id: 'btn1' })]);
    const result = moveComponentToParentInState(state, 'nonexistent', null, null, 'page1');
    expect(result).toBe(state);
  });

  it('returns original state when component is on different page', () => {
    const state = makeState([makeComponent({ id: 'btn1', pageId: 'page2' })]);
    const result = moveComponentToParentInState(state, 'btn1', null, null, 'page1');
    expect(result).toBe(state);
  });

  it('returns original state when parent is same and no reorder', () => {
    const container = makeContainer({ id: 'cont1' });
    const btn1 = makeComponent({ id: 'btn1', parentId: 'cont1' });
    const state = makeState([container, btn1]);
    const result = moveComponentToParentInState(state, 'btn1', 'cont1', null, 'page1');
    expect(result).toBe(state);
  });

  it('prevents moving component into itself', () => {
    const container = makeContainer({ id: 'cont1' });
    const state = makeState([container]);
    const result = moveComponentToParentInState(state, 'cont1', 'cont1', null, 'page1');
    expect(result).toBe(state);
  });

  it('prevents moving component into its own descendant', () => {
    const outer = makeContainer({ id: 'outer' });
    const inner = makeContainer({ id: 'inner', parentId: 'outer' });
    const state = makeState([outer, inner]);
    // Moving outer into inner would create a cycle
    const result = moveComponentToParentInState(state, 'outer', 'inner', null, 'page1');
    expect(result).toBe(state);
  });

  it('returns original state when new parent does not exist', () => {
    const btn1 = makeComponent({ id: 'btn1' });
    const state = makeState([btn1]);
    const result = moveComponentToParentInState(state, 'btn1', 'nonexistent', null, 'page1');
    expect(result).toBe(state);
  });

  it('returns original state when new parent is not a container', () => {
    const btn1 = makeComponent({ id: 'btn1' });
    const btn2 = makeComponent({ id: 'btn2' });
    const state = makeState([btn1, btn2]);
    // btn2 is a BUTTON, not a container
    const result = moveComponentToParentInState(state, 'btn1', 'btn2', null, 'page1');
    expect(result).toBe(state);
  });

  it('returns original state when new parent is on different page', () => {
    const container = makeContainer({ id: 'cont1', pageId: 'page2' });
    const btn1 = makeComponent({ id: 'btn1' });
    const state = makeState([container, btn1]);
    const result = moveComponentToParentInState(state, 'btn1', 'cont1', null, 'page1');
    expect(result).toBe(state);
  });

  it('moves root component into a container', () => {
    const container = makeContainer({
      id: 'cont1',
      props: { x: 50, y: 50, width: 400, height: 300, padding: '10', order: 0 } as any,
    });
    const btn1 = makeComponent({
      id: 'btn1',
      props: { x: 70, y: 80, width: 100, height: 40, label: 'Button', order: 1 } as any,
    });
    const state = makeState([container, btn1]);

    const result = moveComponentToParentInState(state, 'btn1', 'cont1', null, 'page1');
    const movedComponent = result.components.find(c => c.id === 'btn1');

    expect(movedComponent).toBeDefined();
    expect(movedComponent!.parentId).toBe('cont1');
    // New position should be relative to container's content area
    expect(movedComponent!.props.x).toBe(10);
    expect(movedComponent!.props.y).toBe(20);
  });

  it('moves component from container to root (null parent)', () => {
    const container = makeContainer({
      id: 'cont1',
      props: { x: 50, y: 50, width: 400, height: 300, padding: '10', order: 0 } as any,
    });
    const btn1 = makeComponent({
      id: 'btn1',
      parentId: 'cont1',
      props: { x: 10, y: 20, width: 100, height: 40, label: 'Button', order: 0 } as any,
    });
    const state = makeState([container, btn1]);

    const result = moveComponentToParentInState(state, 'btn1', null, null, 'page1');
    const movedComponent = result.components.find(c => c.id === 'btn1');

    expect(movedComponent).toBeDefined();
    expect(movedComponent!.parentId).toBeNull();
    expect(movedComponent!.props.x).toBe(70);
    expect(movedComponent!.props.y).toBe(80);
  });

  it('moves component with specified index and sets correct order', () => {
    const container = makeContainer({ id: 'cont1' });
    const existingChild = makeComponent({ id: 'child1', parentId: 'cont1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 0 } as any });
    const btn1 = makeComponent({
      id: 'btn1',
      props: { x: 60, y: 60, width: 100, height: 40, label: 'Button', order: 1 } as any,
    });
    const state = makeState([container, existingChild, btn1]);

    const result = moveComponentToParentInState(state, 'btn1', 'cont1', 0, 'page1');
    const movedComponent = result.components.find(c => c.id === 'btn1');
    const existingChildResult = result.components.find(c => c.id === 'child1');

    expect(movedComponent!.parentId).toBe('cont1');
    // btn1 inserted at index 0, should have order 0
    expect((movedComponent!.props as any).order).toBe(0);
    // child1 was at order 0, should now be order 1
    expect((existingChildResult!.props as any).order).toBe(1);
  });

  it('reassigns order in old parent after move', () => {
    const container = makeContainer({ id: 'cont1' });
    const child0 = makeComponent({ id: 'child0', parentId: 'cont1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 0 } as any });
    const child1 = makeComponent({ id: 'child1', parentId: 'cont1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 1 } as any });
    const child2 = makeComponent({ id: 'child2', parentId: 'cont1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 2 } as any });
    const state = makeState([container, child0, child1, child2]);

    // Move child1 to root
    const result = moveComponentToParentInState(state, 'child1', null, null, 'page1');
    // Old parent siblings should have contiguous order
    const c0 = result.components.find(c => c.id === 'child0');
    const c2 = result.components.find(c => c.id === 'child2');
    expect((c0!.props as any).order).toBe(0);
    expect((c2!.props as any).order).toBe(1);
  });
});

describe('reparentComponentInState with targetContainerId', () => {
  it('moves a root component into a container when targetContainerId is provided', () => {
    const container = makeContainer({ id: 'cont1' });
    const btn1 = makeComponent({ id: 'btn1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 1 } as any });
    const state = makeState([container, btn1]);

    const result = reparentComponentInState(state, 'btn1', undefined, 'cont1');
    const moved = result.state.components.find(c => c.id === 'btn1');

    expect(result.changed).toBe(true);
    expect(moved!.parentId).toBe('cont1');
  });

  it('moves a component out of a container to root when targetContainerId is null', () => {
    const container = makeContainer({ id: 'cont1' });
    const btn1 = makeComponent({ id: 'btn1', parentId: 'cont1' });
    const state = makeState([container, btn1]);

    const result = reparentComponentInState(state, 'btn1', undefined, null);
    const moved = result.state.components.find(c => c.id === 'btn1');

    expect(result.changed).toBe(true);
    expect(moved!.parentId).toBeNull();
  });

  it('returns unchanged when targetContainerId matches current parent', () => {
    const container = makeContainer({ id: 'cont1' });
    const btn1 = makeComponent({ id: 'btn1', parentId: 'cont1' });
    const state = makeState([container, btn1]);

    const result = reparentComponentInState(state, 'btn1', undefined, 'cont1');
    expect(result.changed).toBe(false);
  });

  it('returns unchanged when component is at root and targetContainerId is null', () => {
    const btn1 = makeComponent({ id: 'btn1' });
    const state = makeState([btn1]);

    const result = reparentComponentInState(state, 'btn1', undefined, null);
    expect(result.changed).toBe(false);
  });

  it('rejects reparent to a non-container component', () => {
    const btn1 = makeComponent({ id: 'btn1' });
    const btn2 = makeComponent({ id: 'btn2' });
    const state = makeState([btn1, btn2]);

    const result = reparentComponentInState(state, 'btn1', undefined, 'btn2');
    expect(result.changed).toBe(false);
  });

  it('rejects reparent to a nonexistent container', () => {
    const btn1 = makeComponent({ id: 'btn1' });
    const state = makeState([btn1]);

    const result = reparentComponentInState(state, 'btn1', undefined, 'nonexistent');
    expect(result.changed).toBe(false);
  });

  it('rejects reparent that would create circular reference', () => {
    const outer = makeContainer({ id: 'outer' });
    const inner = makeContainer({ id: 'inner', parentId: 'outer' });
    const state = makeState([outer, inner]);

    const result = reparentComponentInState(state, 'outer', undefined, 'inner');
    expect(result.changed).toBe(false);
  });

  it('rejects reparent to a container on a different page', () => {
    const container = makeContainer({ id: 'cont1', pageId: 'page2' });
    const btn1 = makeComponent({ id: 'btn1' });
    const state = makeState([container, btn1]);

    const result = reparentComponentInState(state, 'btn1', undefined, 'cont1');
    expect(result.changed).toBe(false);
  });

  it('sets correct order when moving into a container with existing children', () => {
    const container = makeContainer({ id: 'cont1' });
    const child1 = makeComponent({ id: 'child1', parentId: 'cont1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 0 } as any });
    const child2 = makeComponent({ id: 'child2', parentId: 'cont1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 1 } as any });
    const btn1 = makeComponent({ id: 'btn1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 2 } as any });
    const state = makeState([container, child1, child2, btn1]);

    const result = reparentComponentInState(state, 'btn1', undefined, 'cont1');
    const moved = result.state.components.find(c => c.id === 'btn1');

    expect(result.changed).toBe(true);
    expect(moved!.parentId).toBe('cont1');
    // Should be appended after existing 2 children
    expect((moved!.props as any).order).toBe(2);
  });

  it('reassigns order in old parent group after reparent', () => {
    const container = makeContainer({ id: 'cont1', props: { x: 0, y: 0, width: 400, height: 300, padding: '10', order: 0 } as any });
    const btn1 = makeComponent({ id: 'btn1', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 1 } as any });
    const btn2 = makeComponent({ id: 'btn2', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 2 } as any });
    const btn3 = makeComponent({ id: 'btn3', props: { x: 0, y: 0, width: 100, height: 40, label: 'B', order: 3 } as any });
    const state = makeState([container, btn1, btn2, btn3]);

    // Move btn1 to container - old root siblings (container, btn2, btn3) should get contiguous order
    const result = reparentComponentInState(state, 'btn1', undefined, 'cont1');
    const cont = result.state.components.find(c => c.id === 'cont1');
    const b2 = result.state.components.find(c => c.id === 'btn2');
    const b3 = result.state.components.find(c => c.id === 'btn3');
    // After btn1 removal from root: container=0, btn2=1, btn3=2
    expect((cont!.props as any).order).toBe(0);
    expect((b2!.props as any).order).toBe(1);
    expect((b3!.props as any).order).toBe(2);
  });

  it('returns unchanged for nonexistent component', () => {
    const state = makeState([makeComponent({ id: 'btn1' })]);
    const result = reparentComponentInState(state, 'nonexistent', undefined, 'cont1');
    expect(result.changed).toBe(false);
  });
});
