import { renderHook, act } from '@testing-library/react';
import { useQueryExecution } from './useQueryExecution';
import { AppQuery } from '@/types';
import { useRuntimeStore } from '@/stores/runtimeStore';

// Mock the query engine
jest.mock('@/services/query-engine', () => ({
  executeQuery: jest.fn().mockResolvedValue({
    data: [{ id: 1, name: 'Alice' }],
    loading: false,
    error: null,
  }),
}));

const { executeQuery: mockExecuteQuery } = require('@/services/query-engine');

beforeEach(() => {
  mockExecuteQuery.mockClear();
  // Reset the runtime store
  useRuntimeStore.getState().reset();
});

describe('useQueryExecution', () => {
  const baseQuery: AppQuery = {
    id: 'q1',
    name: 'users',
    type: 'static',
    config: { staticData: '[{"id": 1}]' },
    trigger: 'manual',
  };

  it('does not execute queries when disabled', () => {
    const queries: AppQuery[] = [{ ...baseQuery, trigger: 'onMount' }];
    renderHook(() => useQueryExecution(queries, {}, false));

    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });

  it('executes onMount queries when enabled', async () => {
    const queries: AppQuery[] = [{ ...baseQuery, trigger: 'onMount' }];
    renderHook(() => useQueryExecution(queries, {}, true));

    // Wait for the async execution
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
    expect(mockExecuteQuery).toHaveBeenCalledWith(queries[0], {});
  });

  it('does not execute disabled queries', async () => {
    const queries: AppQuery[] = [{ ...baseQuery, trigger: 'onMount', enabled: false }];
    renderHook(() => useQueryExecution(queries, {}, true));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });

  it('executes manual queries via runQuery', async () => {
    const queries: AppQuery[] = [baseQuery];
    const { result } = renderHook(() => useQueryExecution(queries, {}, true));

    await act(async () => {
      await result.current.runQuery('users');
    });

    expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
    expect(mockExecuteQuery).toHaveBeenCalledWith(baseQuery, {});
  });

  it('warns when running a non-existent query', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const queries: AppQuery[] = [baseQuery];
    const { result } = renderHook(() => useQueryExecution(queries, {}, true));

    await act(async () => {
      await result.current.runQuery('nonexistent');
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('nonexistent')
    );
    warnSpy.mockRestore();
  });

  it('stores query results in the runtime store', async () => {
    const queries: AppQuery[] = [{ ...baseQuery, trigger: 'onMount' }];
    renderHook(() => useQueryExecution(queries, {}, true));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    const queryResults = useRuntimeStore.getState().queryResults;
    expect(queryResults['users']).toBeDefined();
    expect(queryResults['users'].data).toEqual([{ id: 1, name: 'Alice' }]);
  });

  it('does not execute queries when queries array is undefined', () => {
    renderHook(() => useQueryExecution(undefined, {}, true));
    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });
});
