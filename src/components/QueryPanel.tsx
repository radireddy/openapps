import React, { useState, useEffect, useCallback } from 'react';
import { AppQuery, QueryType, QueryMethod } from '@/types';
import { useRuntimeStore } from '@/stores/runtimeStore';

interface QueryPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  queries: AppQuery[];
  onAddQuery: (query: AppQuery) => void;
  onUpdateQuery: (queryId: string, updates: Partial<AppQuery>) => void;
  onDeleteQuery: (queryId: string) => void;
  onRunQuery: (queryName: string) => Promise<void>;
}

const QUERY_TYPES: { value: QueryType; label: string }[] = [
  { value: 'rest', label: 'REST API' },
  { value: 'static', label: 'Static JSON' },
];

const HTTP_METHODS: QueryMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const TRIGGERS: { value: AppQuery['trigger']; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'onMount', label: 'On Mount' },
  { value: 'onDependencyChange', label: 'On Dependency Change' },
];

export const QueryPanel: React.FC<QueryPanelProps> = ({
  isCollapsed,
  onToggleCollapse,
  queries,
  onAddQuery,
  onUpdateQuery,
  onDeleteQuery,
  onRunQuery,
}) => {
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null);
  const [queryName, setQueryName] = useState('');
  const [queryType, setQueryType] = useState<QueryType>('rest');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<QueryMethod>('GET');
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [staticData, setStaticData] = useState('[]');
  const [responseTransform, setResponseTransform] = useState('');
  const [trigger, setTrigger] = useState<AppQuery['trigger']>('manual');
  const [dependsOn, setDependsOn] = useState('');
  const [refreshInterval, setRefreshInterval] = useState('0');

  // Runtime query results for status display
  const queryResults = useRuntimeStore(s => s.queryResults);

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingQueryId(null);
    setQueryName('');
    setQueryType('rest');
    setUrl('');
    setMethod('GET');
    setHeaders('');
    setBody('');
    setStaticData('[]');
    setResponseTransform('');
    setTrigger('manual');
    setDependsOn('');
    setRefreshInterval('0');
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editingQueryId) {
      const query = queries.find(q => q.id === editingQueryId);
      if (query) {
        setQueryName(query.name);
        setQueryType(query.type);
        setUrl(query.config.url || '');
        setMethod(query.config.method || 'GET');
        setHeaders(query.config.headers ? JSON.stringify(query.config.headers, null, 2) : '');
        setBody(query.config.body || '');
        setStaticData(query.config.staticData || '[]');
        setResponseTransform(query.config.responseTransform || '');
        setTrigger(query.trigger);
        setDependsOn((query.dependsOn || []).join(', '));
        setRefreshInterval(String(query.refreshInterval || 0));
        setShowForm(true);
      }
    }
  }, [editingQueryId, queries]);

  const handleSave = () => {
    if (!queryName.trim()) return;

    const parsedHeaders: Record<string, string> = {};
    if (headers.trim()) {
      try {
        Object.assign(parsedHeaders, JSON.parse(headers));
      } catch {
        // Invalid JSON headers — skip
      }
    }

    const queryData: Omit<AppQuery, 'id'> = {
      name: queryName.trim(),
      type: queryType,
      config: {
        url: queryType === 'rest' ? url : undefined,
        method: queryType === 'rest' ? method : undefined,
        headers: queryType === 'rest' && Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined,
        body: queryType === 'rest' && method !== 'GET' ? body : undefined,
        staticData: queryType === 'static' ? staticData : undefined,
        responseTransform: responseTransform || undefined,
      },
      trigger,
      dependsOn: dependsOn.trim() ? dependsOn.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      refreshInterval: parseInt(refreshInterval) || 0,
      enabled: true,
    };

    if (editingQueryId) {
      onUpdateQuery(editingQueryId, queryData);
    } else {
      onAddQuery({
        ...queryData,
        id: `query_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
    }
    resetForm();
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center pt-2">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-ed-text-secondary hover:text-ed-text rounded"
          title="Expand Queries"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 flex justify-between items-center">
        <span className="text-sm font-bold text-ed-text-secondary uppercase tracking-wider">Queries</span>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="p-1 text-ed-accent hover:bg-ed-accent-muted rounded"
            title="Add Query"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-3 bg-ed-bg-secondary border-b border-ed-border space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-ed-text">
              {editingQueryId ? 'Edit Query' : 'Add Query'}
            </span>
            <button onClick={resetForm} className="p-1 text-ed-text-secondary hover:text-ed-text rounded">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Name */}
          <input
            type="text"
            value={queryName}
            onChange={e => setQueryName(e.target.value)}
            placeholder="Query name (e.g., users)"
            autoFocus
            className="w-full px-2 py-1.5 text-xs bg-ed-bg border border-ed-border rounded-md text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
          />

          {/* Type */}
          <select
            value={queryType}
            onChange={e => setQueryType(e.target.value as QueryType)}
            className="w-full px-2 py-1.5 text-xs bg-ed-bg border border-ed-border rounded-md text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20"
          >
            {QUERY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* REST-specific fields */}
          {queryType === 'rest' && (
            <>
              <div className="flex gap-1.5">
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value as QueryMethod)}
                  className="px-2 py-1.5 text-xs bg-ed-bg border border-ed-border rounded-md text-ed-text w-20"
                >
                  {HTTP_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://api.example.com/data"
                  className="flex-1 px-2 py-1.5 text-xs bg-ed-bg border border-ed-border rounded-md text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20"
                />
              </div>
              <textarea
                value={headers}
                onChange={e => setHeaders(e.target.value)}
                placeholder='Headers JSON: {"Authorization": "Bearer ..."}'
                rows={2}
                className="w-full px-2 py-1.5 text-xs font-mono bg-ed-bg border border-ed-border rounded-md text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 resize-none"
              />
              {method !== 'GET' && (
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Request body (supports {{ expressions }})"
                  rows={3}
                  className="w-full px-2 py-1.5 text-xs font-mono bg-ed-bg border border-ed-border rounded-md text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 resize-none"
                />
              )}
            </>
          )}

          {/* Static-specific fields */}
          {queryType === 'static' && (
            <textarea
              value={staticData}
              onChange={e => setStaticData(e.target.value)}
              placeholder='[{"id": 1, "name": "Alice"}]'
              rows={4}
              className="w-full px-2 py-1.5 text-xs font-mono bg-ed-bg border border-ed-border rounded-md text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 resize-none"
            />
          )}

          {/* Response transform */}
          <input
            type="text"
            value={responseTransform}
            onChange={e => setResponseTransform(e.target.value)}
            placeholder="Response transform (e.g., data.results)"
            className="w-full px-2 py-1.5 text-xs font-mono bg-ed-bg border border-ed-border rounded-md text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20"
          />

          {/* Trigger */}
          <select
            value={trigger}
            onChange={e => setTrigger(e.target.value as AppQuery['trigger'])}
            className="w-full px-2 py-1.5 text-xs bg-ed-bg border border-ed-border rounded-md text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20"
          >
            {TRIGGERS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Depends on (for onDependencyChange) */}
          {trigger === 'onDependencyChange' && (
            <input
              type="text"
              value={dependsOn}
              onChange={e => setDependsOn(e.target.value)}
              placeholder="Scope keys (comma-separated)"
              className="w-full px-2 py-1.5 text-xs bg-ed-bg border border-ed-border rounded-md text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20"
            />
          )}

          {/* Refresh interval */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-ed-text-secondary whitespace-nowrap">Refresh (ms):</span>
            <input
              type="number"
              value={refreshInterval}
              onChange={e => setRefreshInterval(e.target.value)}
              min="0"
              step="1000"
              className="flex-1 px-2 py-1.5 text-xs bg-ed-bg border border-ed-border rounded-md text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={resetForm}
              className="flex-1 px-3 py-1.5 text-xs font-semibold text-ed-text bg-ed-bg-tertiary rounded-md hover:bg-ed-bg-hover"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!queryName.trim()}
              className="flex-1 px-3 py-1.5 text-xs font-semibold text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingQueryId ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Query List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {queries
          .filter(q => editingQueryId !== q.id)
          .map(query => {
            const result = queryResults[query.name];
            return (
              <div
                key={query.id}
                className="bg-ed-bg border border-ed-border rounded-md p-2.5"
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-ed-text truncate">{query.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-ed-bg-tertiary text-ed-text-tertiary uppercase">
                        {query.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-ed-text-tertiary mt-0.5 truncate">
                      {query.type === 'rest'
                        ? `${query.config.method || 'GET'} ${query.config.url || '—'}`
                        : 'Static JSON'}
                    </div>
                    {/* Status */}
                    {result && (
                      <div className="text-[10px] mt-1">
                        {result.loading && <span className="text-ed-accent">Loading...</span>}
                        {result.error && <span className="text-ed-danger truncate">{result.error}</span>}
                        {!result.loading && !result.error && result.data !== null && (
                          <span className="text-green-600">
                            {Array.isArray(result.data)
                              ? `${result.data.length} items`
                              : typeof result.data === 'object'
                                ? 'Object'
                                : String(result.data).substring(0, 30)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {/* Run button */}
                    <button
                      onClick={() => onRunQuery(query.name)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Run Query"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                    {/* Edit button */}
                    <button
                      onClick={() => setEditingQueryId(query.id)}
                      className="p-1 text-ed-text-tertiary hover:text-ed-text-secondary rounded"
                      title="Edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete query "${query.name}"?`)) {
                          onDeleteQuery(query.id);
                        }
                      }}
                      className="p-1 text-ed-text-tertiary hover:text-ed-danger rounded"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        {queries.length === 0 && !showForm && (
          <div className="text-center py-8 text-xs text-ed-text-tertiary">
            <svg className="mx-auto w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <p>No queries defined</p>
            <p className="mt-1">Add a query to fetch data</p>
          </div>
        )}
      </div>
    </div>
  );
};
