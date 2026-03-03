import { DependencyGraph, dependencyGraph } from './dependency-graph';

describe('DependencyGraph', () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  describe('register and unregister', () => {
    it('registers an expression with explicit deps', () => {
      graph.register('Input1:disabled', '{{$vars.isLocked}}', ['$vars']);
      expect(graph.size).toBe(1);
    });

    it('registers an expression and auto-parses deps when none provided', () => {
      graph.register('Input1:label', 'firstName + " " + lastName');
      expect(graph.size).toBe(1);
      // Should detect firstName and lastName as deps
      const affected = graph.getAffected(new Set(['firstName']));
      expect(affected.has('Input1:label')).toBe(true);
    });

    it('unregisters an expression and cleans up reverse deps', () => {
      graph.register('Input1:disabled', 'isLocked', ['isLocked']);
      graph.register('Input2:disabled', 'isLocked', ['isLocked']);
      expect(graph.size).toBe(2);

      graph.unregister('Input1:disabled');
      expect(graph.size).toBe(1);

      const affected = graph.getAffected(new Set(['isLocked']));
      expect(affected.has('Input1:disabled')).toBe(false);
      expect(affected.has('Input2:disabled')).toBe(true);
    });

    it('handles re-registration (updates deps)', () => {
      graph.register('Input1:label', 'firstName', ['firstName']);
      graph.register('Input1:label', 'lastName', ['lastName']);

      // Should no longer be affected by firstName
      expect(graph.getAffected(new Set(['firstName'])).has('Input1:label')).toBe(false);
      // Should now be affected by lastName
      expect(graph.getAffected(new Set(['lastName'])).has('Input1:label')).toBe(true);
    });

    it('unregistering a non-existent key is a no-op', () => {
      graph.unregister('nonexistent');
      expect(graph.size).toBe(0);
    });
  });

  describe('getAffected', () => {
    it('returns all expressions affected by a changed scope key', () => {
      graph.register('Input1:disabled', 'isLocked', ['isLocked']);
      graph.register('Input2:disabled', 'isLocked', ['isLocked']);
      graph.register('Label1:text', 'userName', ['userName']);

      const affected = graph.getAffected(new Set(['isLocked']));
      expect(affected.size).toBe(2);
      expect(affected.has('Input1:disabled')).toBe(true);
      expect(affected.has('Input2:disabled')).toBe(true);
      expect(affected.has('Label1:text')).toBe(false);
    });

    it('returns empty set when no expressions depend on the changed key', () => {
      graph.register('Input1:disabled', 'isLocked', ['isLocked']);
      const affected = graph.getAffected(new Set(['unrelatedKey']));
      expect(affected.size).toBe(0);
    });

    it('handles multiple changed keys', () => {
      graph.register('Input1:disabled', 'isLocked', ['isLocked']);
      graph.register('Label1:text', 'userName', ['userName']);
      graph.register('Label2:text', 'isLocked && userName', ['isLocked', 'userName']);

      const affected = graph.getAffected(new Set(['isLocked', 'userName']));
      expect(affected.size).toBe(3);
    });
  });

  describe('caching', () => {
    it('caches and retrieves a result at the current scope version', () => {
      const version = graph.bumpVersion();
      graph.cacheResult('Input1:disabled', true, version);

      const result = graph.getCachedResult('Input1:disabled', version);
      expect(result.hit).toBe(true);
      expect(result.result).toBe(true);
    });

    it('returns cache miss when scope version differs', () => {
      const v1 = graph.bumpVersion();
      graph.cacheResult('Input1:disabled', true, v1);

      const v2 = graph.bumpVersion();
      const result = graph.getCachedResult('Input1:disabled', v2);
      expect(result.hit).toBe(false);
      expect(result.result).toBeUndefined();
    });

    it('returns cache miss for non-existent key', () => {
      const result = graph.getCachedResult('nonexistent', 1);
      expect(result.hit).toBe(false);
    });

    it('caches various value types including undefined and null', () => {
      const version = graph.bumpVersion();

      graph.cacheResult('key1', undefined, version);
      expect(graph.getCachedResult('key1', version)).toEqual({ hit: true, result: undefined });

      graph.cacheResult('key2', null, version);
      expect(graph.getCachedResult('key2', version)).toEqual({ hit: true, result: null });

      graph.cacheResult('key3', '', version);
      expect(graph.getCachedResult('key3', version)).toEqual({ hit: true, result: '' });

      graph.cacheResult('key4', 0, version);
      expect(graph.getCachedResult('key4', version)).toEqual({ hit: true, result: 0 });
    });

    it('removes cache when expression is unregistered', () => {
      const version = graph.bumpVersion();
      graph.register('Input1:disabled', 'isLocked', ['isLocked']);
      graph.cacheResult('Input1:disabled', true, version);

      graph.unregister('Input1:disabled');
      const result = graph.getCachedResult('Input1:disabled', version);
      expect(result.hit).toBe(false);
    });
  });

  describe('version management', () => {
    it('starts at version 0', () => {
      expect(graph.version).toBe(0);
    });

    it('increments version on each bump', () => {
      expect(graph.bumpVersion()).toBe(1);
      expect(graph.bumpVersion()).toBe(2);
      expect(graph.bumpVersion()).toBe(3);
      expect(graph.version).toBe(3);
    });
  });

  describe('clear', () => {
    it('removes all registrations, caches, and resets version', () => {
      graph.register('key1', 'a + b', ['a', 'b']);
      graph.register('key2', 'c', ['c']);
      graph.bumpVersion();
      graph.cacheResult('key1', 42, graph.version);

      graph.clear();

      expect(graph.size).toBe(0);
      expect(graph.version).toBe(0);
      expect(graph.getAffected(new Set(['a'])).size).toBe(0);
      expect(graph.getCachedResult('key1', 1).hit).toBe(false);
    });
  });

  describe('singleton export', () => {
    it('exports a module-level singleton', () => {
      expect(dependencyGraph).toBeInstanceOf(DependencyGraph);
    });

    afterEach(() => {
      dependencyGraph.clear();
    });
  });
});
