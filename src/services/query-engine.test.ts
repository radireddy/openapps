import { executeQuery, executeQueriesByTrigger } from './query-engine';
import { AppQuery } from '@/types';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('executeQuery', () => {
  describe('static queries', () => {
    it('parses static JSON data', async () => {
      const query: AppQuery = {
        id: 'q1',
        name: 'users',
        type: 'static',
        config: { staticData: '[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]' },
        trigger: 'manual',
      };

      const result = await executeQuery(query, {});
      expect(result.data).toEqual([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
      expect(result.loading).toBe(false);
      expect(result.error).toBeNull();
    });

    it('returns empty array for empty static data', async () => {
      const query: AppQuery = {
        id: 'q1',
        name: 'empty',
        type: 'static',
        config: { staticData: '[]' },
        trigger: 'manual',
      };

      const result = await executeQuery(query, {});
      expect(result.data).toEqual([]);
    });

    it('handles default empty static data', async () => {
      const query: AppQuery = {
        id: 'q1',
        name: 'empty',
        type: 'static',
        config: {},
        trigger: 'manual',
      };

      const result = await executeQuery(query, {});
      expect(result.data).toEqual([]);
    });

    it('applies response transform to static data', async () => {
      const query: AppQuery = {
        id: 'q1',
        name: 'users',
        type: 'static',
        config: {
          staticData: '[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]',
          responseTransform: 'data.filter(u => u.id === 1)',
        },
        trigger: 'manual',
      };

      const result = await executeQuery(query, {});
      expect(result.data).toEqual([{ id: 1, name: 'Alice' }]);
    });
  });

  describe('REST queries', () => {
    it('executes a GET request', async () => {
      const responseData = [{ id: 1, name: 'Alice' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(responseData),
      });

      const query: AppQuery = {
        id: 'q1',
        name: 'users',
        type: 'rest',
        config: { url: 'https://api.example.com/users', method: 'GET' },
        trigger: 'manual',
      };

      const result = await executeQuery(query, {});
      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'GET',
        headers: {},
      });
    });

    it('executes a POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ id: 3, name: 'Charlie' }),
      });

      const query: AppQuery = {
        id: 'q1',
        name: 'createUser',
        type: 'rest',
        config: {
          url: 'https://api.example.com/users',
          method: 'POST',
          body: '{"name": "Charlie"}',
        },
        trigger: 'manual',
      };

      const result = await executeQuery(query, {});
      expect(result.data).toEqual({ id: 3, name: 'Charlie' });
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name": "Charlie"}',
      });
    });

    it('resolves expressions in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ id: 1 }),
      });

      const query: AppQuery = {
        id: 'q1',
        name: 'user',
        type: 'rest',
        config: { url: 'https://api.example.com/users/{{userId}}', method: 'GET' },
        trigger: 'manual',
      };

      await executeQuery(query, { userId: 42 });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/42',
        expect.any(Object)
      );
    });

    it('resolves expressions in request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true }),
      });

      const query: AppQuery = {
        id: 'q1',
        name: 'update',
        type: 'rest',
        config: {
          url: 'https://api.example.com/users',
          method: 'POST',
          body: '{"name": "{{userName}}"}',
        },
        trigger: 'manual',
      };

      await executeQuery(query, { userName: 'Alice' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          body: '{"name": "Alice"}',
        })
      );
    });

    it('handles HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const query: AppQuery = {
        id: 'q1',
        name: 'users',
        type: 'rest',
        config: { url: 'https://api.example.com/users', method: 'GET' },
        trigger: 'manual',
      };

      const result = await executeQuery(query, {});
      expect(result.data).toBeNull();
      expect(result.error).toBe('HTTP 404: Not Found');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const query: AppQuery = {
        id: 'q1',
        name: 'users',
        type: 'rest',
        config: { url: 'https://api.example.com/users', method: 'GET' },
        trigger: 'manual',
      };

      const result = await executeQuery(query, {});
      expect(result.data).toBeNull();
      expect(result.error).toBe('Network error');
    });

    it('handles text responses when content-type is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('Hello World'),
      });

      const query: AppQuery = {
        id: 'q1',
        name: 'message',
        type: 'rest',
        config: { url: 'https://api.example.com/message', method: 'GET' },
        trigger: 'manual',
      };

      const result = await executeQuery(query, {});
      expect(result.data).toBe('Hello World');
    });

    it('errors when URL is missing', async () => {
      const query: AppQuery = {
        id: 'q1',
        name: 'noUrl',
        type: 'rest',
        config: { method: 'GET' },
        trigger: 'manual',
      };

      const result = await executeQuery(query, {});
      expect(result.error).toBe('Query URL is required for REST queries');
    });

    it('applies response transform to REST data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ results: [1, 2, 3], total: 3 }),
      });

      const query: AppQuery = {
        id: 'q1',
        name: 'data',
        type: 'rest',
        config: {
          url: 'https://api.example.com/data',
          method: 'GET',
          responseTransform: 'data.results',
        },
        trigger: 'manual',
      };

      const result = await executeQuery(query, {});
      expect(result.data).toEqual([1, 2, 3]);
    });
  });

  describe('disabled queries', () => {
    it('returns error for disabled queries', async () => {
      const query: AppQuery = {
        id: 'q1',
        name: 'disabled',
        type: 'static',
        config: { staticData: '[1,2,3]' },
        trigger: 'manual',
        enabled: false,
      };

      const result = await executeQuery(query, {});
      expect(result.data).toBeNull();
      expect(result.error).toBe('Query is disabled');
    });
  });

  describe('custom headers', () => {
    it('sends custom headers with REST requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      const query: AppQuery = {
        id: 'q1',
        name: 'auth',
        type: 'rest',
        config: {
          url: 'https://api.example.com/data',
          method: 'GET',
          headers: { 'Authorization': 'Bearer {{token}}' },
        },
        trigger: 'manual',
      };

      await executeQuery(query, { token: 'abc123' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          headers: { Authorization: 'Bearer abc123' },
        })
      );
    });
  });
});

describe('executeQueriesByTrigger', () => {
  it('executes only queries matching the trigger type', async () => {
    const queries: AppQuery[] = [
      { id: 'q1', name: 'onMount1', type: 'static', config: { staticData: '["a"]' }, trigger: 'onMount' },
      { id: 'q2', name: 'manual1', type: 'static', config: { staticData: '["b"]' }, trigger: 'manual' },
      { id: 'q3', name: 'onMount2', type: 'static', config: { staticData: '["c"]' }, trigger: 'onMount' },
    ];

    const results: Record<string, any> = {};
    await executeQueriesByTrigger(queries, 'onMount', {}, (name, result) => {
      results[name] = result;
    });

    // Should have executed onMount queries only
    expect(Object.keys(results)).toContain('onMount1');
    expect(Object.keys(results)).toContain('onMount2');
    // manual1 should have loading=true or final result, but it shouldn't be called
    expect(results['manual1']).toBeUndefined();
  });

  it('skips disabled queries', async () => {
    const queries: AppQuery[] = [
      { id: 'q1', name: 'active', type: 'static', config: { staticData: '["a"]' }, trigger: 'onMount' },
      { id: 'q2', name: 'disabled', type: 'static', config: { staticData: '["b"]' }, trigger: 'onMount', enabled: false },
    ];

    const results: Record<string, any> = {};
    await executeQueriesByTrigger(queries, 'onMount', {}, (name, result) => {
      results[name] = result;
    });

    // Active query should have data
    const activeResult = results['active'];
    expect(activeResult).toBeDefined();
    // The final result for 'active' (after loading=true then data)
    // Since both calls happen, we get the last one
    expect(activeResult.error).toBeNull();
  });

  it('sets loading state before execution', async () => {
    const queries: AppQuery[] = [
      { id: 'q1', name: 'test', type: 'static', config: { staticData: '["data"]' }, trigger: 'onMount' },
    ];

    const calls: Array<{ name: string; loading: boolean }> = [];
    await executeQueriesByTrigger(queries, 'onMount', {}, (name, result) => {
      calls.push({ name, loading: result.loading });
    });

    // First call should be loading=true, second should be loading=false
    expect(calls.length).toBe(2);
    expect(calls[0]).toEqual({ name: 'test', loading: true });
    expect(calls[1]).toEqual({ name: 'test', loading: false });
  });
});
