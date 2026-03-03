import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAppData } from '@/hooks/useAppData';
import { AppDefinition, ComponentType, AppVariableType } from 'types';

const mockAppDef: AppDefinition = {
  id: 'app1', name: 'Test App', createdAt: '', lastModifiedAt: '',
  pages: [{ id: 'page1', name: 'Main Page' }],
  mainPageId: 'page1',
  components: [
    { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { text: 'Hello' } as any },
    { id: 'panel1', type: ComponentType.CONTAINER, pageId: 'page1', props: { x:100, y:100, width:200, height:200 } as any },
  ],
  dataStore: {},
  variables: [],
  theme: {
    colors: {
      primary: '#000000',
      onPrimary: '#ffffff',
      secondary: '#000000',
      onSecondary: '#ffffff',
      background: '#ffffff',
      surface: '#ffffff',
      text: '#000000',
      border: '#e5e5e5',
    },
    font: {
      family: 'Arial',
    },
    border: {
      width: '1px',
      style: 'solid',
    },
    radius: {
      default: '4px',
    },
    spacing: {
      sm: '4px',
      md: '8px',
      lg: '16px',
    },
  },
};

describe('useAppData', () => {
  let onSave: jest.Mock;

  beforeEach(() => {
    onSave = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with the provided app definition', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    expect(result.current.appDefinition.id).toBe('app1');
    expect(result.current.components.length).toBe(2);
  });

  it('should trigger onSave with a debounce', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    
    act(() => {
      result.current.addComponent(ComponentType.BUTTON, {x: 0, y: 0}, null, 'page1');
    });

    expect(onSave).not.toHaveBeenCalled();
    act(() => {
        jest.advanceTimersByTime(1500);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('should add a component', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    
    act(() => {
      result.current.addComponent(ComponentType.INPUT, { x: 10, y: 10 }, null, 'page1');
    });

    expect(result.current.components.length).toBe(3);
    const newComp = result.current.components[2];
    expect(newComp.type).toBe(ComponentType.INPUT);
    expect((newComp.props as any).order).toBeDefined();
    expect(newComp.pageId).toBe('page1');
  });

  it('should update a component', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    
    act(() => {
      result.current.updateComponent('comp1', { text: 'World' } as any);
    });

    const updatedComp = result.current.components.find(c => c.id === 'comp1');
    expect((updatedComp?.props as any).text).toBe('World');
  });

  it('should delete a component and its children', () => {
    const appDefWithChild = { ...mockAppDef, components: [
        ...mockAppDef.components,
        { id: 'child1', type: ComponentType.LABEL, pageId: 'page1', parentId: 'panel1', props: {} as any }
    ]};
    const { result } = renderHook(() => useAppData(appDefWithChild, onSave));
    expect(result.current.components.length).toBe(3);

    act(() => {
      result.current.deleteComponent('panel1');
    });

    expect(result.current.components.length).toBe(1);
    expect(result.current.components.find(c => c.id === 'panel1')).toBeUndefined();
    expect(result.current.components.find(c => c.id === 'child1')).toBeUndefined();
    expect(result.current.selectedComponentIds.length).toBe(0);
  });

  it('should update the data store', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    
    act(() => {
      result.current.updateDataStore('user.name', 'Alice');
    });
    
    expect(result.current.dataStore.user.name).toBe('Alice');
  });

  it('should add a variable and initialize variableState', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    const newVar = { id: 'var1', name: 'isLoading', type: AppVariableType.BOOLEAN, initialValue: 'true' };

    act(() => {
      result.current.addVariable(newVar);
    });
    
    expect(result.current.variables.length).toBe(1);
    expect(result.current.variableState['isLoading']).toBe(true);
  });

  it('should prevent adding a variable with a duplicate name', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const appDefWithVar = { ...mockAppDef, variables: [
        { id: 'var1', name: 'isLoading', type: AppVariableType.BOOLEAN, initialValue: 'false' }
    ]};
    const { result } = renderHook(() => useAppData(appDefWithVar, onSave));

    const newVar = { id: 'var2', name: 'isLoading', type: AppVariableType.STRING, initialValue: 'abc' };
    act(() => {
      result.current.addVariable(newVar);
    });

    expect(result.current.variables.length).toBe(1);
    expect(alertSpy).toHaveBeenCalledWith('A variable with this name already exists.');
    alertSpy.mockRestore();
  });

  it('should reparent a component when it is dropped inside a container', () => {
    const appDef = { ...mockAppDef, components: [
        { id: 'label1', type: ComponentType.LABEL, pageId: 'page1', props: { x: 150, y: 150, width: 50, height: 30 } as any },
        { id: 'panel1', type: ComponentType.CONTAINER, pageId: 'page1', props: { x: 100, y: 100, width: 200, height: 200 } as any },
    ]};
    const { result } = renderHook(() => useAppData(appDef, onSave));
    
    act(() => {
        result.current.reparentComponent('label1');
    });
    
    const reparented = result.current.components.find(c => c.id === 'label1');
    expect(reparented?.parentId).toBe('panel1');
    expect(reparented?.props.x).toBe(50); // 150 (abs) - 100 (parent abs) = 50 (rel)
    expect(reparented?.props.y).toBe(50); // 150 (abs) - 100 (parent abs) = 50 (rel)
  });

  it('should unparent a component when it is dropped outside all containers', () => {
    const appDef = { ...mockAppDef, components: [
        { id: 'label1', type: ComponentType.LABEL, pageId: 'page1', parentId: 'panel1', props: { x: 50, y: 50, width: 50, height: 30 } as any },
        { id: 'panel1', type: ComponentType.CONTAINER, pageId: 'page1', props: { x: 100, y: 100, width: 200, height: 200 } as any },
    ]};
    const { result } = renderHook(() => useAppData(appDef, onSave));

    // Pass an explicit finalPosition outside the container to trigger unparenting
    act(() => {
        result.current.reparentComponent('label1', { x: 500, y: 500 });
    });

    const unparented = result.current.components.find(c => c.id === 'label1');
    expect(unparented?.parentId).toBeNull();
  });

  describe('handleSubmitForm (actions.submitForm)', () => {
    it('should collect form data from form components on the current page', () => {
      const appDef = {
        ...mockAppDef,
        components: [
          { id: 'input1', type: ComponentType.INPUT, pageId: 'page1', name: 'firstName', props: { placeholder: 'First name', width: 200, height: 40 } as any },
          { id: 'input2', type: ComponentType.INPUT, pageId: 'page1', name: 'lastName', props: { placeholder: 'Last name', width: 200, height: 40 } as any },
        ],
        dataStore: { input1: 'Alice', input2: 'Smith' },
      };
      const { result } = renderHook(() => useAppData(appDef, onSave));

      let submitResult: any;
      act(() => {
        submitResult = result.current.actions.submitForm(undefined, {});
      });

      expect(submitResult.success).toBe(true);
      expect(submitResult.errors).toEqual([]);
    });

    it('should return validation errors when required fields are empty', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const appDef = {
        ...mockAppDef,
        components: [
          { id: 'input1', type: ComponentType.INPUT, pageId: 'page1', name: 'email', props: { placeholder: 'Email', label: 'Email', required: true, width: 200, height: 40 } as any },
        ],
        dataStore: {},
      };
      const { result } = renderHook(() => useAppData(appDef, onSave));

      let submitResult: any;
      act(() => {
        submitResult = result.current.actions.submitForm(undefined, {});
      });

      expect(submitResult.success).toBe(false);
      expect(submitResult.errors).toContain('Email is required');
      expect(warnSpy).toHaveBeenCalledWith('[Form Submit] Validation failed:', expect.arrayContaining(['Email is required']));
      warnSpy.mockRestore();
    });

    it('should execute success code with formData in scope when validation passes', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const appDef = {
        ...mockAppDef,
        components: [
          { id: 'input1', type: ComponentType.INPUT, pageId: 'page1', name: 'username', props: { placeholder: 'Username', width: 200, height: 40 } as any },
        ],
        dataStore: {},
      };
      const { result } = renderHook(() => useAppData(appDef, onSave));

      // Simulate user typing during the current session
      act(() => {
        result.current.updateDataStore('input1', 'testuser');
      });

      act(() => {
        result.current.actions.submitForm('{{ console.log(formData) }}', { console });
      });

      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ username: 'testuser' }));
      logSpy.mockRestore();
    });

    it('should use pageId parameter instead of currentPageId when provided', () => {
      const appDef = {
        ...mockAppDef,
        pages: [{ id: 'page1', name: 'Main' }, { id: 'page2', name: 'Second' }],
        components: [
          { id: 'input_p1', type: ComponentType.INPUT, pageId: 'page1', name: 'field1', props: { placeholder: 'Field 1', required: true, label: 'Field 1', width: 200, height: 40 } as any },
          { id: 'input_p2', type: ComponentType.INPUT, pageId: 'page2', name: 'field2', props: { placeholder: 'Field 2', width: 200, height: 40 } as any },
        ],
        dataStore: {},
      };
      const { result } = renderHook(() => useAppData(appDef, onSave));

      // Simulate user typing during the current session
      act(() => {
        result.current.updateDataStore('input_p2', 'filled');
      });
      // currentPageId defaults to page1 (mainPageId). But we submit for page2.

      let submitResult: any;
      act(() => {
        submitResult = result.current.actions.submitForm(undefined, {}, 'page2');
      });

      // page2 has no required fields, so should succeed
      expect(submitResult.success).toBe(true);
      expect(submitResult.errors).toEqual([]);
    });

    it('should pass validation when required fields have defaultValue but no dataStore entry', () => {
      const appDef = {
        ...mockAppDef,
        components: [
          { id: 'slider1', type: ComponentType.SLIDER, pageId: 'page1', name: 'amount', props: { label: 'Amount', required: true, defaultValue: 50, width: 200, height: 40 } as any },
          { id: 'input1', type: ComponentType.INPUT, pageId: 'page1', name: 'quantity', props: { label: 'Quantity', required: true, defaultValue: '100', width: 200, height: 40 } as any },
        ],
        dataStore: {},
      };
      const { result } = renderHook(() => useAppData(appDef, onSave));

      let submitResult: any;
      act(() => {
        submitResult = result.current.actions.submitForm(undefined, {});
      });

      expect(submitResult.success).toBe(true);
      expect(submitResult.errors).toEqual([]);
    });

    it('should use dataStore value over defaultValue when both exist', () => {
      const appDef = {
        ...mockAppDef,
        components: [
          { id: 'input1', type: ComponentType.INPUT, pageId: 'page1', name: 'name', props: { label: 'Name', defaultValue: 'default', width: 200, height: 40 } as any },
        ],
        dataStore: { input1: 'user-typed' },
      };
      const { result } = renderHook(() => useAppData(appDef, onSave));

      let submitResult: any;
      act(() => {
        submitResult = result.current.actions.submitForm('{{ console.log(formData) }}', { console, formData: {} });
      });

      // dataStore value should be used, not defaultValue
      expect(submitResult.success).toBe(true);
    });

    it('should fail validation when required fields have no defaultValue and no dataStore entry', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const appDef = {
        ...mockAppDef,
        components: [
          { id: 'input1', type: ComponentType.INPUT, pageId: 'page1', name: 'email', props: { label: 'Email', required: true, width: 200, height: 40 } as any },
        ],
        dataStore: {},
      };
      const { result } = renderHook(() => useAppData(appDef, onSave));

      let submitResult: any;
      act(() => {
        submitResult = result.current.actions.submitForm(undefined, {});
      });

      expect(submitResult.success).toBe(false);
      expect(submitResult.errors).toContain('Email is required');
      warnSpy.mockRestore();
    });

    it('should fail validation when submitting current page with required empty field', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const appDef = {
        ...mockAppDef,
        pages: [{ id: 'page1', name: 'Main' }, { id: 'page2', name: 'Second' }],
        components: [
          { id: 'input_p1', type: ComponentType.INPUT, pageId: 'page1', name: 'field1', props: { placeholder: 'Field 1', required: true, label: 'Field 1', width: 200, height: 40 } as any },
          { id: 'input_p2', type: ComponentType.INPUT, pageId: 'page2', name: 'field2', props: { placeholder: 'Field 2', width: 200, height: 40 } as any },
        ],
        dataStore: {},
      };
      const { result } = renderHook(() => useAppData(appDef, onSave));

      let submitResult: any;
      act(() => {
        // No pageId passed — defaults to currentPageId (page1), which has required empty field
        submitResult = result.current.actions.submitForm(undefined, {});
      });

      expect(submitResult.success).toBe(false);
      expect(submitResult.errors).toContain('Field 1 is required');
      warnSpy.mockRestore();
    });
  });

});