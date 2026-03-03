import { isComponentType, getTypedProps } from '../component-type-helpers';
import { ComponentType, AppComponent, InputProps, SwitchProps } from '@/types';

describe('component-type-helpers', () => {
  const makeComponent = (type: ComponentType, props: Record<string, any>): AppComponent => ({
    id: 'test-1',
    type,
    props: props as any,
    pageId: 'page-1',
  });

  describe('isComponentType', () => {
    it('returns true when component type matches', () => {
      const comp = makeComponent(ComponentType.INPUT, { placeholder: 'hi', width: 200, height: 40 });
      expect(isComponentType(comp, ComponentType.INPUT)).toBe(true);
    });

    it('returns false when component type does not match', () => {
      const comp = makeComponent(ComponentType.BUTTON, { text: 'Click', width: 100, height: 40, backgroundColor: '#000', textColor: '#fff', actionType: 'none' });
      expect(isComponentType(comp, ComponentType.INPUT)).toBe(false);
    });

    it('narrows props type via type guard', () => {
      const comp = makeComponent(ComponentType.SWITCH, { label: 'Toggle', width: 180, height: 30 });
      if (isComponentType(comp, ComponentType.SWITCH)) {
        // TypeScript should allow accessing SwitchProps fields
        const label: string = comp.props.label;
        expect(label).toBe('Toggle');
      }
    });
  });

  describe('getTypedProps', () => {
    it('returns typed props when type matches', () => {
      const comp = makeComponent(ComponentType.INPUT, { placeholder: 'Enter...', width: 200, height: 40 });
      const props = getTypedProps(comp, ComponentType.INPUT);
      expect(props.placeholder).toBe('Enter...');
    });

    it('throws when type does not match', () => {
      const comp = makeComponent(ComponentType.BUTTON, { text: 'Click', width: 100, height: 40, backgroundColor: '#000', textColor: '#fff', actionType: 'none' });
      expect(() => getTypedProps(comp, ComponentType.INPUT)).toThrow(
        'Expected component type "INPUT" but got "BUTTON"'
      );
    });
  });
});
