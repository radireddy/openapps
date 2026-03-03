import { AppQuery, QueryConfig } from '@/types';
import { safeEval } from '@/expressions/engine';
import type { QueryResult } from '@/stores/runtimeStore';

/**
 * Resolve {{ }} expressions within a string using the given scope.
 * Returns the resolved string (or evaluated value for pure expressions).
 */
function resolveExpressions(value: string | undefined, scope: Record<string, any>): string {
  if (!value) return '';
  if (value.startsWith('{{') && value.endsWith('}}')) {
    const expr = value.substring(2, value.length - 2).trim();
    const result = safeEval(expr, scope);
    return result !== undefined ? String(result) : '';
  }
  return value.replace(/{{\s*(.*?)\s*}}/g, (_match, expression) => {
    const result = safeEval(expression, scope);
    return result !== undefined && result !== null ? String(result) : '';
  });
}

/**
 * Resolve all {{ }} expressions in query headers.
 */
function resolveHeaders(
  headers: Record<string, string> | undefined,
  scope: Record<string, any>
): Record<string, string> {
  if (!headers) return {};
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    resolved[key] = resolveExpressions(value, scope);
  }
  return resolved;
}

/**
 * Execute a REST query.
 */
async function executeRestQuery(
  config: QueryConfig,
  scope: Record<string, any>
): Promise<any> {
  const url = resolveExpressions(config.url, scope);
  if (!url) {
    throw new Error('Query URL is required for REST queries');
  }

  const method = config.method || 'GET';
  const headers = resolveHeaders(config.headers, scope);

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // Only add body for non-GET requests
  if (method !== 'GET' && config.body) {
    const resolvedBody = resolveExpressions(config.body, scope);
    fetchOptions.body = resolvedBody;
    // Default to JSON content type if not set
    if (!headers['Content-Type'] && !headers['content-type']) {
      fetchOptions.headers = { ...headers, 'Content-Type': 'application/json' };
    }
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Try to parse as JSON, fall back to text
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

/**
 * Execute a static data query (parses JSON string).
 */
function executeStaticQuery(config: QueryConfig, scope: Record<string, any>): any {
  const rawData = config.staticData || '[]';
  // Resolve expressions in static data (enables dynamic static data)
  const resolvedData = resolveExpressions(rawData, scope);
  try {
    return JSON.parse(resolvedData);
  } catch {
    // If it's not valid JSON after resolution, return as string
    return resolvedData;
  }
}

/**
 * Apply a response transform expression to the data.
 * The expression receives `data` in its scope.
 */
function applyTransform(data: any, transform: string | undefined, scope: Record<string, any>): any {
  if (!transform) return data;
  const transformScope = { ...scope, data };
  const result = safeEval(transform, transformScope);
  return result !== undefined ? result : data;
}

/**
 * Execute a single query and return the result.
 *
 * @param query - The query definition
 * @param scope - Current evaluation scope (for resolving expressions in config)
 * @returns A QueryResult object
 */
export async function executeQuery(
  query: AppQuery,
  scope: Record<string, any>
): Promise<QueryResult> {
  if (query.enabled === false) {
    return { data: null, loading: false, error: 'Query is disabled' };
  }

  try {
    let data: any;

    switch (query.type) {
      case 'rest':
        data = await executeRestQuery(query.config, scope);
        break;
      case 'static':
        data = executeStaticQuery(query.config, scope);
        break;
      default:
        throw new Error(`Unknown query type: ${query.type}`);
    }

    // Apply response transform if configured
    data = applyTransform(data, query.config.responseTransform, scope);

    return { data, loading: false, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[QueryEngine] Error executing query "${query.name}":`, errorMessage);
    return { data: null, loading: false, error: errorMessage };
  }
}

/**
 * Execute all queries matching a specific trigger type.
 *
 * @param queries - All query definitions
 * @param trigger - The trigger type to filter by
 * @param scope - Current evaluation scope
 * @param onResult - Callback to store each query result
 */
export async function executeQueriesByTrigger(
  queries: AppQuery[],
  trigger: AppQuery['trigger'],
  scope: Record<string, any>,
  onResult: (queryName: string, result: QueryResult) => void
): Promise<void> {
  const toExecute = queries.filter(q => q.trigger === trigger && q.enabled !== false);

  await Promise.all(
    toExecute.map(async (query) => {
      // Set loading state
      onResult(query.name, { data: null, loading: true, error: null });

      const result = await executeQuery(query, scope);
      onResult(query.name, result);
    })
  );
}
