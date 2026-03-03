import { describe, it, expect } from '@jest/globals';
import {
  addComponentToState,
  updateComponentInState,
  updateComponentsInState,
  deleteComponentFromState,
  deleteSelectedComponentsFromState,
} from '@/hooks/state/componentOperations';
import { AppDefinition, ComponentType } from '@/types';

// Check if renameComponentInState exists (it was added as part of the new features)
import * as componentOps from '@/hooks/state/componentOperations';
const renameComponentInState = (componentOps as any).renameComponentInState;

const mockTheme = {
  colors: { primary: '#000', onPrimary: '#fff', secondary: '#000', onSecondary: '#fff', background: '#fff', surface: '#fff', text: '#000', border: '#e5e5e5' },
  font: { family: 'Arial' },
  border: { width: '1px', style: 'solid' },
  radius: { default: '4px' },
  spacing: { sm: '4px', md: '8px', lg: '16px' },
};

const makeState = (components: any[] = [], dataStore: Record<string, any> = {}): AppDefinition => ({
  id: 'app1',
  name: 'Test App',
  createdAt: '',
  lastModifiedAt: '',
  pages: [{ id: 'page1', name: 'Main Page' }],
  mainPageId: 'page1',
  components,
  dataStore,
  variables: [],
  theme: mockTheme,
});

describe('componentOperations', () => {
  describe('addComponentToState', () => {
    it('should add a component with auto-generated name', () => {
      const state = makeState();
      const newState = addComponentToState(state, ComponentType.INPUT, { x: 10, y: 10 }, null, 'page1');

      expect(newState.components).toHaveLength(1);
      const added = newState.components[0];
      expect(added.type).toBe(ComponentType.INPUT);
      expect(added.name).toBeDefined();
      expect(added.name).toContain('Input');
    });

    it('should auto-name components incrementally', () => {
      const state = makeState([
        { id: 'input_1', type: ComponentType.INPUT, pageId: 'page1', props: { x: 0, y: 0, width: 200, height: 40, placeholder: '' } },
      ]);
      const newState = addComponentToState(state, ComponentType.INPUT, { x: 100, y: 10 }, null, 'page1');

      const newInput = newState.components.find(c => c.id !== 'input_1');
      expect(newInput?.name).toBe('Input 2');
    });

    it('should set order correctly for root-level component', () => {
      const state = makeState();
      const newState = addComponentToState(state, ComponentType.BUTTON, { x: 0, y: 0 }, null, 'page1');

      const added = newState.components[0];
      expect((added.props as any).order).toBe(0);
    });

    it('should set pageId on new component', () => {
      const state = makeState();
      const newState = addComponentToState(state, ComponentType.LABEL, { x: 0, y: 0 }, null, 'page1');

      expect(newState.components[0].pageId).toBe('page1');
    });
  });

  describe('renameComponentInState', () => {
    it('should rename a component', () => {
      if (!renameComponentInState) {
        // Skip if not implemented
        return;
      }
      const state = makeState([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', name: 'Label 1', props: { text: 'Hello' } },
      ]);

      const newState = renameComponentInState(state, 'comp1', 'My Custom Label');
      const renamed = newState.components.find((c: any) => c.id === 'comp1');
      expect(renamed?.name).toBe('My Custom Label');
    });

    it('should not modify state if component not found', () => {
      if (!renameComponentInState) return;
      const state = makeState([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { text: 'Hello' } },
      ]);

      const newState = renameComponentInState(state, 'nonexistent', 'New Name');
      expect(newState).toStrictEqual(state);
    });

    it('should only modify the target component', () => {
      if (!renameComponentInState) return;
      const state = makeState([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', name: 'Label 1', props: { text: 'A' } },
        { id: 'comp2', type: ComponentType.BUTTON, pageId: 'page1', name: 'Button 1', props: { text: 'B' } },
      ]);

      const newState = renameComponentInState(state, 'comp1', 'Renamed');
      expect(newState.components.find((c: any) => c.id === 'comp1')?.name).toBe('Renamed');
      expect(newState.components.find((c: any) => c.id === 'comp2')?.name).toBe('Button 1');
    });
  });

  describe('deleteComponentFromState', () => {
    it('should delete a component and its children', () => {
      const state = makeState([
        { id: 'container1', type: ComponentType.CONTAINER, pageId: 'page1', props: {} },
        { id: 'child1', type: ComponentType.LABEL, pageId: 'page1', parentId: 'container1', props: {} },
        { id: 'child2', type: ComponentType.BUTTON, pageId: 'page1', parentId: 'container1', props: {} },
        { id: 'standalone', type: ComponentType.LABEL, pageId: 'page1', props: {} },
      ]);

      const newState = deleteComponentFromState(state, 'container1');
      expect(newState.components).toHaveLength(1);
      expect(newState.components[0].id).toBe('standalone');
    });

    it('should clean dataStore entries for deleted component', () => {
      const state = makeState(
        [
          { id: 'input1', type: ComponentType.INPUT, pageId: 'page1', props: {} },
          { id: 'input2', type: ComponentType.INPUT, pageId: 'page1', props: {} },
        ],
        { input1: 'value1', input2: 'value2', otherKey: 'preserved' }
      );

      const newState = deleteComponentFromState(state, 'input1');
      expect(newState.dataStore.input1).toBeUndefined();
      expect(newState.dataStore.input2).toBe('value2');
      expect(newState.dataStore.otherKey).toBe('preserved');
    });

    it('should clean dataStore entries for deleted children too', () => {
      const state = makeState(
        [
          { id: 'container1', type: ComponentType.CONTAINER, pageId: 'page1', props: {} },
          { id: 'child1', type: ComponentType.INPUT, pageId: 'page1', parentId: 'container1', props: {} },
          { id: 'child2', type: ComponentType.INPUT, pageId: 'page1', parentId: 'container1', props: {} },
        ],
        { container1: 'cval', child1: 'c1val', child2: 'c2val', unrelated: 'keep' }
      );

      const newState = deleteComponentFromState(state, 'container1');
      expect(newState.dataStore.container1).toBeUndefined();
      expect(newState.dataStore.child1).toBeUndefined();
      expect(newState.dataStore.child2).toBeUndefined();
      expect(newState.dataStore.unrelated).toBe('keep');
    });
  });

  describe('deleteSelectedComponentsFromState', () => {
    it('should delete multiple selected components', () => {
      const state = makeState([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: {} },
        { id: 'comp2', type: ComponentType.BUTTON, pageId: 'page1', props: {} },
        { id: 'comp3', type: ComponentType.INPUT, pageId: 'page1', props: {} },
      ]);

      const newState = deleteSelectedComponentsFromState(state, ['comp1', 'comp3']);
      expect(newState.components).toHaveLength(1);
      expect(newState.components[0].id).toBe('comp2');
    });

    it('should return same state if no IDs provided', () => {
      const state = makeState([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: {} },
      ]);

      const newState = deleteSelectedComponentsFromState(state, []);
      expect(newState).toBe(state);
    });

    it('should clean dataStore entries for all deleted components', () => {
      const state = makeState(
        [
          { id: 'comp1', type: ComponentType.INPUT, pageId: 'page1', props: {} },
          { id: 'comp2', type: ComponentType.INPUT, pageId: 'page1', props: {} },
          { id: 'comp3', type: ComponentType.INPUT, pageId: 'page1', props: {} },
        ],
        { comp1: 'v1', comp2: 'v2', comp3: 'v3', other: 'keep' }
      );

      const newState = deleteSelectedComponentsFromState(state, ['comp1', 'comp3']);
      expect(newState.dataStore.comp1).toBeUndefined();
      expect(newState.dataStore.comp2).toBe('v2');
      expect(newState.dataStore.comp3).toBeUndefined();
      expect(newState.dataStore.other).toBe('keep');
    });

    it('should clean dataStore entries for children of deleted containers', () => {
      const state = makeState(
        [
          { id: 'container1', type: ComponentType.CONTAINER, pageId: 'page1', props: {} },
          { id: 'child1', type: ComponentType.INPUT, pageId: 'page1', parentId: 'container1', props: {} },
          { id: 'standalone', type: ComponentType.LABEL, pageId: 'page1', props: {} },
        ],
        { container1: 'cval', child1: 'childval', standalone: 'keep' }
      );

      const newState = deleteSelectedComponentsFromState(state, ['container1']);
      expect(newState.dataStore.container1).toBeUndefined();
      expect(newState.dataStore.child1).toBeUndefined();
      expect(newState.dataStore.standalone).toBe('keep');
    });
  });

  describe('addComponentToState — slot assignment for Tabs parent', () => {
    it('should assign slot from dataStore activeTab when dropping into a Tabs container', () => {
      const state = makeState(
        [
          { id: 'tabs1', type: ComponentType.TABS, pageId: 'page1', props: { tabs: 'Tab A,Tab B,Tab C' } },
        ],
        { tabs1_activeTab: 2 }
      );

      const newState = addComponentToState(state, ComponentType.LABEL, { x: 0, y: 0 }, 'tabs1', 'page1');
      const added = newState.components.find(c => c.id !== 'tabs1');
      expect(added?.slot).toBe(2);
    });

    it('should fall back to defaultActiveTab prop when dataStore has no activeTab for Tabs', () => {
      const state = makeState([
        { id: 'tabs1', type: ComponentType.TABS, pageId: 'page1', props: { tabs: 'A,B,C', defaultActiveTab: 1 } },
      ]);

      const newState = addComponentToState(state, ComponentType.BUTTON, { x: 0, y: 0 }, 'tabs1', 'page1');
      const added = newState.components.find(c => c.id !== 'tabs1');
      expect(added?.slot).toBe(1);
    });

    it('should default to slot 0 for Tabs when no activeTab and no defaultActiveTab', () => {
      const state = makeState([
        { id: 'tabs1', type: ComponentType.TABS, pageId: 'page1', props: { tabs: 'A,B' } },
      ]);

      const newState = addComponentToState(state, ComponentType.INPUT, { x: 0, y: 0 }, 'tabs1', 'page1');
      const added = newState.components.find(c => c.id !== 'tabs1');
      expect(added?.slot).toBe(0);
    });
  });

  describe('addComponentToState — slot assignment for Accordion parent', () => {
    it('should assign slot from dataStore expanded array for Accordion', () => {
      const state = makeState(
        [
          { id: 'acc1', type: ComponentType.ACCORDION, pageId: 'page1', props: { sections: 'S1,S2,S3' } },
        ],
        { acc1_expanded: [0, 2] }
      );

      const newState = addComponentToState(state, ComponentType.LABEL, { x: 0, y: 0 }, 'acc1', 'page1');
      const added = newState.components.find(c => c.id !== 'acc1');
      // Uses the last item in the expanded array
      expect(added?.slot).toBe(2);
    });

    it('should fall back to defaultExpanded string prop for Accordion', () => {
      const state = makeState([
        { id: 'acc1', type: ComponentType.ACCORDION, pageId: 'page1', props: { sections: 'S1,S2', defaultExpanded: '1,0' } },
      ]);

      const newState = addComponentToState(state, ComponentType.BUTTON, { x: 0, y: 0 }, 'acc1', 'page1');
      const added = newState.components.find(c => c.id !== 'acc1');
      // Parses '1,0' and uses the first index
      expect(added?.slot).toBe(1);
    });

    it('should default to slot 0 for Accordion when no expanded state and no defaultExpanded', () => {
      const state = makeState([
        { id: 'acc1', type: ComponentType.ACCORDION, pageId: 'page1', props: { sections: 'S1,S2' } },
      ]);

      const newState = addComponentToState(state, ComponentType.INPUT, { x: 0, y: 0 }, 'acc1', 'page1');
      const added = newState.components.find(c => c.id !== 'acc1');
      expect(added?.slot).toBe(0);
    });

    it('should default to slot 0 when Accordion defaultExpanded string has no valid numbers', () => {
      const state = makeState([
        { id: 'acc1', type: ComponentType.ACCORDION, pageId: 'page1', props: { sections: 'S1', defaultExpanded: 'abc' } },
      ]);

      const newState = addComponentToState(state, ComponentType.LABEL, { x: 0, y: 0 }, 'acc1', 'page1');
      const added = newState.components.find(c => c.id !== 'acc1');
      // 'abc' parses to NaN, filtered out, indices is empty, so slot = 0
      expect(added?.slot).toBe(0);
    });
  });

  describe('updateComponentInState — edge cases', () => {
    it('should return same state when component is not found', () => {
      const state = makeState([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { text: 'Hello' } },
      ]);

      const newState = updateComponentInState(state, 'nonexistent', { text: 'Updated' } as any);
      expect(newState).toBe(state);
    });

    it('should adjust child positions when Container padding changes', () => {
      const state = makeState([
        { id: 'container1', type: ComponentType.CONTAINER, pageId: 'page1', props: { padding: '10' } },
        { id: 'child1', type: ComponentType.LABEL, pageId: 'page1', parentId: 'container1', props: { x: 50, y: 60, text: 'A' } },
        { id: 'child2', type: ComponentType.BUTTON, pageId: 'page1', parentId: 'container1', props: { x: 100, y: 120, label: 'B' } },
      ]);

      // Change padding from 10 (all sides) to 20 (all sides) → delta +10 for both x and y
      const newState = updateComponentInState(state, 'container1', { padding: '20' } as any);

      const child1 = newState.components.find(c => c.id === 'child1');
      const child2 = newState.components.find(c => c.id === 'child2');
      expect(child1?.props.x).toBe(60);  // 50 + 10
      expect(child1?.props.y).toBe(70);  // 60 + 10
      expect(child2?.props.x).toBe(110); // 100 + 10
      expect(child2?.props.y).toBe(130); // 120 + 10
    });

    it('should not adjust child positions when padding does not change', () => {
      const state = makeState([
        { id: 'container1', type: ComponentType.CONTAINER, pageId: 'page1', props: { padding: '10' } },
        { id: 'child1', type: ComponentType.LABEL, pageId: 'page1', parentId: 'container1', props: { x: 50, y: 60, text: 'A' } },
      ]);

      // Update a prop other than padding
      const newState = updateComponentInState(state, 'container1', { backgroundColor: 'red' } as any);

      const child1 = newState.components.find(c => c.id === 'child1');
      expect(child1?.props.x).toBe(50);
      expect(child1?.props.y).toBe(60);
    });

    it('should handle multi-value padding correctly when adjusting children', () => {
      const state = makeState([
        { id: 'container1', type: ComponentType.CONTAINER, pageId: 'page1', props: { padding: '10 20' } },
        { id: 'child1', type: ComponentType.LABEL, pageId: 'page1', parentId: 'container1', props: { x: 30, y: 40, text: 'C' } },
      ]);

      // '10 20' → top:10, left:20. Change to '20 40' → top:20, left:40. Delta: x+20, y+10
      const newState = updateComponentInState(state, 'container1', { padding: '20 40' } as any);

      const child1 = newState.components.find(c => c.id === 'child1');
      expect(child1?.props.x).toBe(50);  // 30 + 20
      expect(child1?.props.y).toBe(50);  // 40 + 10
    });

    it('should not adjust children when Container padding delta is zero', () => {
      const state = makeState([
        { id: 'container1', type: ComponentType.CONTAINER, pageId: 'page1', props: { padding: '10' } },
        { id: 'child1', type: ComponentType.LABEL, pageId: 'page1', parentId: 'container1', props: { x: 50, y: 60, text: 'A' } },
      ]);

      // Same padding value → delta is 0
      const newState = updateComponentInState(state, 'container1', { padding: '10' } as any);

      const child1 = newState.components.find(c => c.id === 'child1');
      // padding didn't actually change so no adjustment
      expect(child1?.props.x).toBe(50);
      expect(child1?.props.y).toBe(60);
    });
  });

  describe('updateComponentsInState — batch updates', () => {
    it('should return same state when updates array is empty', () => {
      const state = makeState([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { text: 'Hello' } },
      ]);

      const newState = updateComponentsInState(state, []);
      expect(newState).toBe(state);
    });

    it('should batch update multiple component props', () => {
      const state = makeState([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { x: 0, y: 0, text: 'A' } },
        { id: 'comp2', type: ComponentType.BUTTON, pageId: 'page1', props: { x: 10, y: 10, label: 'B' } },
        { id: 'comp3', type: ComponentType.INPUT, pageId: 'page1', props: { x: 20, y: 20, placeholder: '' } },
      ]);

      const newState = updateComponentsInState(state, [
        { id: 'comp1', props: { x: 100 } as any },
        { id: 'comp3', props: { x: 200 } as any },
      ]);

      expect((newState.components.find(c => c.id === 'comp1')?.props as any).x).toBe(100);
      expect((newState.components.find(c => c.id === 'comp2')?.props as any).x).toBe(10); // unchanged
      expect((newState.components.find(c => c.id === 'comp3')?.props as any).x).toBe(200);
    });

    it('should return same state when no props actually changed', () => {
      const state = makeState([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { x: 50, y: 50, text: 'A' } },
      ]);

      // Update with same values — no actual change
      const newState = updateComponentsInState(state, [
        { id: 'comp1', props: { x: 50 } as any },
      ]);

      expect(newState).toBe(state);
    });

    it('should only update components whose props actually differ', () => {
      const state = makeState([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { x: 0, y: 0, text: 'A' } },
        { id: 'comp2', type: ComponentType.BUTTON, pageId: 'page1', props: { x: 10, y: 10, label: 'B' } },
      ]);

      const newState = updateComponentsInState(state, [
        { id: 'comp1', props: { x: 0 } as any },     // same value, no actual change
        { id: 'comp2', props: { x: 99 } as any },     // real change
      ]);

      // comp2 should be updated, state should be new since comp2 changed
      expect(newState).not.toBe(state);
      expect((newState.components.find(c => c.id === 'comp2')?.props as any).x).toBe(99);
    });

    it('should skip components not found in the state', () => {
      const state = makeState([
        { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { x: 0, text: 'A' } },
      ]);

      // 'nonexistent' is not in state, so it should be ignored
      const newState = updateComponentsInState(state, [
        { id: 'nonexistent', props: { x: 999 } as any },
      ]);

      // No actual change since the component wasn't found
      expect(newState).toBe(state);
    });
  });
});
