import { renderHook } from '@testing-library/react';
import { useComponentLifecycle } from '../useComponentLifecycle';
import { safeEval } from '@/expressions/engine';

jest.mock('@/expressions/engine', () => ({
  safeEval: jest.fn(),
}));

const mockedSafeEval = safeEval as jest.MockedFunction<typeof safeEval>;

describe('useComponentLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes onMount expression in preview mode', () => {
    renderHook(() =>
      useComponentLifecycle({
        componentId: 'comp-1',
        onMount: '{{ console.log("mounted") }}',
        onUnmount: undefined,
        evaluationScope: { dataStore: {} },
        actions: undefined,
        mode: 'preview',
      })
    );

    expect(mockedSafeEval).toHaveBeenCalledTimes(1);
    expect(mockedSafeEval).toHaveBeenCalledWith(
      'console.log("mounted")',
      expect.objectContaining({ componentId: 'comp-1', dataStore: {} })
    );
  });

  it('does not execute onMount in edit mode', () => {
    renderHook(() =>
      useComponentLifecycle({
        componentId: 'comp-1',
        onMount: '{{ console.log("mounted") }}',
        onUnmount: undefined,
        evaluationScope: {},
        actions: undefined,
        mode: 'edit',
      })
    );

    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('executes onUnmount expression when component unmounts in preview', () => {
    const { unmount } = renderHook(() =>
      useComponentLifecycle({
        componentId: 'comp-1',
        onMount: undefined,
        onUnmount: '{{ cleanup() }}',
        evaluationScope: { cleanup: jest.fn() },
        actions: undefined,
        mode: 'preview',
      })
    );

    expect(mockedSafeEval).not.toHaveBeenCalled();

    unmount();

    expect(mockedSafeEval).toHaveBeenCalledTimes(1);
    expect(mockedSafeEval).toHaveBeenCalledWith(
      'cleanup()',
      expect.objectContaining({ componentId: 'comp-1' })
    );
  });

  it('does not execute onUnmount in edit mode', () => {
    const { unmount } = renderHook(() =>
      useComponentLifecycle({
        componentId: 'comp-1',
        onMount: undefined,
        onUnmount: '{{ cleanup() }}',
        evaluationScope: {},
        actions: undefined,
        mode: 'edit',
      })
    );

    unmount();
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('handles expressions without {{ }} wrappers', () => {
    renderHook(() =>
      useComponentLifecycle({
        componentId: 'comp-1',
        onMount: 'console.log("mounted")',
        onUnmount: undefined,
        evaluationScope: {},
        actions: undefined,
        mode: 'preview',
      })
    );

    expect(mockedSafeEval).toHaveBeenCalledWith(
      'console.log("mounted")',
      expect.anything()
    );
  });

  it('does not throw when expression evaluation fails', () => {
    mockedSafeEval.mockImplementation(() => {
      throw new Error('eval error');
    });

    expect(() => {
      renderHook(() =>
        useComponentLifecycle({
          componentId: 'comp-1',
          onMount: '{{ badCode }}',
          onUnmount: undefined,
          evaluationScope: {},
          actions: undefined,
          mode: 'preview',
        })
      );
    }).not.toThrow();
  });

  it('does nothing when onMount/onUnmount are undefined', () => {
    const { unmount } = renderHook(() =>
      useComponentLifecycle({
        componentId: 'comp-1',
        onMount: undefined,
        onUnmount: undefined,
        evaluationScope: {},
        actions: undefined,
        mode: 'preview',
      })
    );

    unmount();
    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('does nothing when onMount is empty string', () => {
    renderHook(() =>
      useComponentLifecycle({
        componentId: 'comp-1',
        onMount: '',
        onUnmount: undefined,
        evaluationScope: {},
        actions: undefined,
        mode: 'preview',
      })
    );

    expect(mockedSafeEval).not.toHaveBeenCalled();
  });

  it('passes actions into the evaluation scope', () => {
    const mockActions = { updateVariable: jest.fn() };

    renderHook(() =>
      useComponentLifecycle({
        componentId: 'comp-1',
        onMount: '{{ actions.updateVariable("x", 1) }}',
        onUnmount: undefined,
        evaluationScope: {},
        actions: mockActions,
        mode: 'preview',
      })
    );

    expect(mockedSafeEval).toHaveBeenCalledWith(
      'actions.updateVariable("x", 1)',
      expect.objectContaining({ actions: mockActions })
    );
  });
});
