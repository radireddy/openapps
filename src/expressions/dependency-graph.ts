import { parseDependencies } from './engine';

/**
 * Expression Dependency Graph
 *
 * Tracks which expressions depend on which scope keys, enabling:
 * 1. Selective re-evaluation: only re-evaluate expressions whose dependencies changed
 * 2. Result caching: skip safeEval when scope version hasn't changed for relevant deps
 *
 * This is a module-level singleton — not React state — so it adds zero render overhead.
 */
class DependencyGraph {
  /** expression key → set of scope keys it depends on */
  private deps = new Map<string, Set<string>>();

  /** scope key → set of expression keys that depend on it (reverse index) */
  private reverseDeps = new Map<string, Set<string>>();

  /** expression key → cached result + scope version when it was computed */
  private cache = new Map<string, { result: any; scopeVersion: number }>();

  /** Monotonically increasing counter, bumped on each scope rebuild */
  private _version = 0;

  /**
   * Register an expression and its dependencies.
   * If the expression was already registered, updates its deps.
   */
  register(key: string, expression: string, deps?: string[]): void {
    // Unregister old deps first to keep reverse index clean
    this.unregisterReverseDeps(key);

    const depSet = new Set(deps ?? parseDependencies(expression));
    this.deps.set(key, depSet);

    // Build reverse index
    for (const dep of depSet) {
      let set = this.reverseDeps.get(dep);
      if (!set) {
        set = new Set();
        this.reverseDeps.set(dep, set);
      }
      set.add(key);
    }
  }

  /**
   * Unregister an expression (e.g., when a component unmounts).
   */
  unregister(key: string): void {
    this.unregisterReverseDeps(key);
    this.deps.delete(key);
    this.cache.delete(key);
  }

  /**
   * Given a set of scope keys that changed, return the set of expression keys
   * that need re-evaluation.
   */
  getAffected(changedKeys: Set<string>): Set<string> {
    const affected = new Set<string>();
    for (const key of changedKeys) {
      const exprs = this.reverseDeps.get(key);
      if (exprs) {
        for (const expr of exprs) {
          affected.add(expr);
        }
      }
    }
    return affected;
  }

  /**
   * Cache the result of evaluating an expression at a given scope version.
   */
  cacheResult(key: string, result: any, scopeVersion: number): void {
    this.cache.set(key, { result, scopeVersion });
  }

  /**
   * Retrieve a cached result if the scope version matches.
   */
  getCachedResult(key: string, scopeVersion: number): { hit: boolean; result: any } {
    const cached = this.cache.get(key);
    if (cached && cached.scopeVersion === scopeVersion) {
      return { hit: true, result: cached.result };
    }
    return { hit: false, result: undefined };
  }

  /**
   * Bump the scope version counter. Returns the new version.
   * Called each time `buildEvaluationScope` produces a new scope object.
   */
  bumpVersion(): number {
    return ++this._version;
  }

  /** Current scope version (read-only). */
  get version(): number {
    return this._version;
  }

  /**
   * Clear all registrations, caches, and reset the version counter.
   * Useful for testing or when switching apps.
   */
  clear(): void {
    this.deps.clear();
    this.reverseDeps.clear();
    this.cache.clear();
    this._version = 0;
  }

  /** Number of registered expressions (for diagnostics/testing). */
  get size(): number {
    return this.deps.size;
  }

  // ── Private ──────────────────────────────────────────────

  /** Remove a key from all reverse-dep sets it belongs to. */
  private unregisterReverseDeps(key: string): void {
    const oldDeps = this.deps.get(key);
    if (oldDeps) {
      for (const dep of oldDeps) {
        const set = this.reverseDeps.get(dep);
        if (set) {
          set.delete(key);
          if (set.size === 0) {
            this.reverseDeps.delete(dep);
          }
        }
      }
    }
  }
}

/** Module-level singleton instance. */
export const dependencyGraph = new DependencyGraph();
export { DependencyGraph };
