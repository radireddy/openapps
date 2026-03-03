import { useEffect, useRef, useCallback } from 'react';
import { AppQuery } from '@/types';
import { executeQuery } from '@/services/query-engine';
import { useRuntimeStore } from '@/stores/runtimeStore';

/**
 * Hook that manages query lifecycle: onMount execution, dependency-change
 * re-execution, refresh intervals, and cleanup.
 *
 * @param queries - Array of query definitions from AppDefinition
 * @param scope - Current evaluation scope (for resolving expressions in query configs)
 * @param enabled - Whether query execution is active (false in edit mode)
 */
export function useQueryExecution(
  queries: AppQuery[] | undefined,
  scope: Record<string, any>,
  enabled: boolean
) {
  const setQueryResult = useRuntimeStore(s => s.setQueryResult);
  const intervalRefs = useRef<Map<string, number>>(new Map());
  const mountedRef = useRef(false);
  const prevDepsRef = useRef<Map<string, string>>(new Map());

  // Run a single query and store the result
  const runQuery = useCallback(async (query: AppQuery) => {
    if (!enabled) return;
    setQueryResult(query.name, { data: null, loading: true, error: null });
    const result = await executeQuery(query, scope);
    setQueryResult(query.name, result);
  }, [enabled, scope, setQueryResult]);

  // Run a query by name
  const runQueryByName = useCallback(async (queryName: string) => {
    if (!queries) return;
    const query = queries.find(q => q.name === queryName);
    if (query) {
      await runQuery(query);
    } else {
      console.warn(`[useQueryExecution] Query "${queryName}" not found`);
    }
  }, [queries, runQuery]);

  // Execute onMount queries when the hook first becomes enabled
  useEffect(() => {
    if (!enabled || !queries || mountedRef.current) return;
    mountedRef.current = true;

    const onMountQueries = queries.filter(
      q => q.trigger === 'onMount' && q.enabled !== false
    );
    onMountQueries.forEach(q => runQuery(q));
  }, [enabled, queries, runQuery]);

  // Handle dependency-change queries: re-execute when their watched scope keys change
  useEffect(() => {
    if (!enabled || !queries) return;

    const depChangeQueries = queries.filter(
      q => q.trigger === 'onDependencyChange' && q.enabled !== false && q.dependsOn && q.dependsOn.length > 0
    );

    depChangeQueries.forEach(query => {
      // Compute a snapshot of the current dependency values
      const depSnapshot = (query.dependsOn || [])
        .map(key => JSON.stringify(scope[key] ?? null))
        .join('|');

      const prevSnapshot = prevDepsRef.current.get(query.id);

      if (prevSnapshot !== undefined && prevSnapshot !== depSnapshot) {
        // Dependencies changed — re-execute
        runQuery(query);
      }

      prevDepsRef.current.set(query.id, depSnapshot);
    });
  }, [enabled, queries, scope, runQuery]);

  // Set up refresh intervals
  useEffect(() => {
    if (!enabled || !queries) return;

    // Clear any existing intervals for queries that no longer exist or changed
    const currentQueryIds = new Set(queries.map(q => q.id));
    for (const [id, intervalId] of intervalRefs.current.entries()) {
      if (!currentQueryIds.has(id)) {
        window.clearInterval(intervalId);
        intervalRefs.current.delete(id);
      }
    }

    // Set up new intervals
    queries.forEach(query => {
      if (
        query.refreshInterval &&
        query.refreshInterval > 0 &&
        query.enabled !== false &&
        !intervalRefs.current.has(query.id)
      ) {
        const intervalId = window.setInterval(() => {
          runQuery(query);
        }, query.refreshInterval);
        intervalRefs.current.set(query.id, intervalId);
      }
    });

    // Cleanup on unmount
    return () => {
      for (const intervalId of intervalRefs.current.values()) {
        window.clearInterval(intervalId);
      }
      intervalRefs.current.clear();
    };
  }, [enabled, queries, runQuery]);

  // Reset mounted state when disabled
  useEffect(() => {
    if (!enabled) {
      mountedRef.current = false;
      prevDepsRef.current.clear();
    }
  }, [enabled]);

  return { runQuery: runQueryByName };
}
