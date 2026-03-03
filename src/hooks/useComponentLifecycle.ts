import { useEffect, useRef } from 'react';
import { safeEval } from '@/expressions/engine';

interface UseComponentLifecycleOptions {
  componentId: string;
  onMount?: string;
  onUnmount?: string;
  evaluationScope: Record<string, any>;
  actions?: any;
  mode: 'edit' | 'preview';
}

/**
 * Executes onMount/onUnmount lifecycle expressions in preview mode.
 * Does nothing in edit mode.
 *
 * - onMount runs once when the component first mounts in preview
 * - onUnmount runs on cleanup when the component unmounts in preview
 * - Scope is stored in a ref to avoid stale closures
 * - Expression strings are NOT in the deps array to prevent re-runs
 */
export function useComponentLifecycle({
  componentId,
  onMount,
  onUnmount,
  evaluationScope,
  actions,
  mode,
}: UseComponentLifecycleOptions): void {
  // Store latest scope + actions in refs to avoid stale closures
  const scopeRef = useRef(evaluationScope);
  const actionsRef = useRef(actions);
  scopeRef.current = evaluationScope;
  actionsRef.current = actions;

  // Store expression strings in refs so they don't trigger re-runs
  const onMountRef = useRef(onMount);
  const onUnmountRef = useRef(onUnmount);
  onMountRef.current = onMount;
  onUnmountRef.current = onUnmount;

  useEffect(() => {
    if (mode !== 'preview') return;

    // Execute onMount expression
    const mountExpr = onMountRef.current;
    if (mountExpr && typeof mountExpr === 'string') {
      try {
        const expr = mountExpr.startsWith('{{') && mountExpr.endsWith('}}')
          ? mountExpr.substring(2, mountExpr.length - 2).trim()
          : mountExpr;
        if (expr) {
          safeEval(expr, {
            ...scopeRef.current,
            actions: actionsRef.current,
            componentId,
          });
        }
      } catch (error) {
        console.error(`[Lifecycle] onMount error for ${componentId}:`, error);
      }
    }

    // Cleanup: execute onUnmount expression
    return () => {
      const unmountExpr = onUnmountRef.current;
      if (unmountExpr && typeof unmountExpr === 'string') {
        try {
          const expr = unmountExpr.startsWith('{{') && unmountExpr.endsWith('}}')
            ? unmountExpr.substring(2, unmountExpr.length - 2).trim()
            : unmountExpr;
          if (expr) {
            safeEval(expr, {
              ...scopeRef.current,
              actions: actionsRef.current,
              componentId,
            });
          }
        } catch (error) {
          console.error(`[Lifecycle] onUnmount error for ${componentId}:`, error);
        }
      }
    };
  }, [mode, componentId]); // Intentionally excludes expression strings to prevent re-run loops
}
