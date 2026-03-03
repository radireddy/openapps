import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { ComponentType, TableProps, ComponentPlugin, ActionHandlers } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { safeEval } from '../../expressions/engine';
import { get } from '../../utils/data-helpers';
import { commonStylingProps } from '../../constants';
import { useDisplayStyle } from './useDisplayStyle';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ParsedColumn {
  header: string;
  key: string;
}

function parseColumns(str: string): ParsedColumn[] {
  if (!str) return [];
  return str.split(',').map(c => {
    const [header, key] = c.split(':');
    return { header: header.trim(), key: key ? key.trim() : header.trim().toLowerCase() };
  });
}

function parseColumnSet(value: string | undefined, allKeys: string[]): Set<string> {
  if (!value) return new Set<string>();
  const trimmed = value.trim();
  if (trimmed === '*') return new Set(allKeys);
  return new Set(trimmed.split(',').map(k => k.trim()).filter(Boolean));
}

// ── Constants ────────────────────────────────────────────────────────────────

const BUFFER_ROWS = 5;
const MIN_COL_WIDTH = 60;

// ── Renderer ─────────────────────────────────────────────────────────────────

const TableRenderer: React.FC<{
  component: { id?: string; props: TableProps };
  mode: 'edit' | 'preview';
  actions?: ActionHandlers;
  evaluationScope: Record<string, any>;
}> = ({ component, mode, actions, evaluationScope }) => {
  const p = component.props;

  // ── Data binding (follow List component pattern) ───────────────────────
  const dataExpression = useJavaScriptRenderer(p.data, evaluationScope, '');
  const rawData = useMemo(() => {
    if (Array.isArray(dataExpression)) return dataExpression;
    if (typeof dataExpression === 'string') {
      try {
        const expr = dataExpression.startsWith('{{') && dataExpression.endsWith('}}')
          ? dataExpression.substring(2, dataExpression.length - 2).trim()
          : dataExpression;
        if (!expr) return [];
        const result = safeEval(expr, evaluationScope);
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [dataExpression, evaluationScope]);

  // ── Sample data fallback ───────────────────────────────────────────────
  const sampleData = useMemo(() => {
    if (!(p as any).sampleData) return null;
    try { return JSON.parse((p as any).sampleData); } catch { return null; }
  }, [(p as any).sampleData]);

  // Use sampleData as fallback when no real data
  const data = rawData.length > 0 ? rawData : (sampleData || rawData);

  // ── Column parsing ─────────────────────────────────────────────────────
  const columns = useMemo(() => parseColumns(p.columns), [p.columns]);
  const allColumnKeys = useMemo(() => columns.map(c => c.key), [columns]);

  // ── Expression-evaluated props ─────────────────────────────────────────
  const headerBg = useJavaScriptRenderer(p.headerBackgroundColor, evaluationScope, '#f9fafb');
  const rowBorder = useJavaScriptRenderer(p.rowBorderColor, evaluationScope, '#e5e7eb');
  const fontSizeVal = useJavaScriptRenderer(p.fontSize, evaluationScope, '');
  const colorVal = useJavaScriptRenderer(p.color, evaluationScope, '');
  const stripedColorVal = useJavaScriptRenderer(p.stripedColor, evaluationScope, '#f9fafb');
  const emptyText = useJavaScriptRenderer(p.emptyStateText, evaluationScope, 'No records found');

  const selectedRecord = get(evaluationScope, p.selectedRecordKey || '');
  const { borderShadowStyle } = useDisplayStyle(p, evaluationScope);

  // Theme colors
  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;
  const themeSurfaceColor = themeColors?.surface || '#fff';
  const themeBorderColor = themeColors?.border;
  const themePrimaryColor = themeColors?.primary || '#3b82f6';
  const themeHoverColor = themeColors?.hover || '#f3f4f6';

  // ── Feature flags ──────────────────────────────────────────────────────
  const resizable = p.resizable !== false;
  const stickyHeader = p.stickyHeader !== false;
  const striped = p.striped === true;
  const showRowNumbers = p.showRowNumbers === true;
  const showSearch = p.showSearch === true;
  const ROW_HEIGHT = p.rowHeight && p.rowHeight > 0 ? p.rowHeight : 40;

  const sortableSet = useMemo(() => parseColumnSet(p.sortableColumns, allColumnKeys), [p.sortableColumns, allColumnKeys]);
  const filterableSet = useMemo(() => parseColumnSet(p.filterableColumns, allColumnKeys), [p.filterableColumns, allColumnKeys]);

  // ── Search / filter state ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    const filterKeys = filterableSet.size > 0 ? Array.from(filterableSet) : allColumnKeys;
    return data.filter((row: any) =>
      filterKeys.some(key => {
        const val = get(row, key, '');
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, searchQuery, filterableSet, allColumnKeys]);

  // ── Sort state ─────────────────────────────────────────────────────────
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const handleSort = useCallback((key: string) => {
    if (!sortableSet.has(key)) return;
    if (sortColumn !== key) {
      setSortColumn(key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortColumn(null);
      setSortDirection(null);
    }
  }, [sortColumn, sortDirection, sortableSet]);

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;
    const sorted = [...filteredData];
    sorted.sort((a: any, b: any) => {
      const aVal = get(a, sortColumn, '');
      const bVal = get(b, sortColumn, '');
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      const isNumeric = !isNaN(aNum) && !isNaN(bNum) && aVal !== '' && bVal !== '';
      let cmp: number;
      if (isNumeric) {
        cmp = aNum - bNum;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredData, sortColumn, sortDirection]);

  // ── Column resize state ────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  // Initialize column widths
  useEffect(() => {
    if (!containerRef.current || columns.length === 0) return;
    const totalWidth = containerRef.current.clientWidth;
    const numExtraCols = showRowNumbers ? 1 : 0;
    const colCount = columns.length + numExtraCols;
    const baseWidth = Math.max(MIN_COL_WIDTH, Math.floor(totalWidth / colCount));
    const widths: Record<string, number> = {};
    if (showRowNumbers) widths['__rowNum'] = 50;
    columns.forEach(col => { widths[col.key] = baseWidth; });
    setColumnWidths(widths);
  }, [columns, showRowNumbers]);

  const handleResizeStart = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[key] || MIN_COL_WIDTH;
    resizingRef.current = { key, startX, startWidth };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const newWidth = Math.max(MIN_COL_WIDTH, resizingRef.current.startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [resizingRef.current!.key]: newWidth }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths]);

  // ── Virtual scrolling state ────────────────────────────────────────────
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const scrollRaf = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(() => {
      setScrollTop(target.scrollTop);
    });
  }, []);

  // ── Compute visible rows ───────────────────────────────────────────────
  const totalRows = sortedData.length;
  const totalHeight = totalRows * ROW_HEIGHT;
  // Account for header height and search bar in the scroll container
  const headerHeight = 36; // approx header row height
  const searchBarHeight = showSearch ? 40 : 0;

  const { startIndex, endIndex, visibleRows } = useMemo(() => {
    if (mode === 'edit') {
      // In edit mode, show up to 5 sample rows without virtualization
      const sample = sortedData.slice(0, 5);
      return { startIndex: 0, endIndex: sample.length, visibleRows: sample };
    }
    const scrollableHeight = containerHeight - headerHeight - searchBarHeight;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
    const end = Math.min(totalRows, Math.ceil((scrollTop + scrollableHeight) / ROW_HEIGHT) + BUFFER_ROWS);
    return { startIndex: start, endIndex: end, visibleRows: sortedData.slice(start, end) };
  }, [sortedData, scrollTop, containerHeight, ROW_HEIGHT, totalRows, mode, headerHeight, searchBarHeight]);

  // ── Row click handler ──────────────────────────────────────────────────
  const handleRowClick = useCallback((row: any) => {
    if (mode === 'preview' && p.rowSelectAction === 'updateDataStore' && p.selectedRecordKey && actions) {
      actions.selectRecord(p.selectedRecordKey, row);
    }
  }, [mode, p.rowSelectAction, p.selectedRecordKey, actions]);

  // ── Sort indicator ─────────────────────────────────────────────────────
  const renderSortIndicator = (key: string) => {
    if (!sortableSet.has(key)) return null;
    const isActive = sortColumn === key;
    if (isActive) {
      return (
        <span data-testid={`sort-indicator-${key}`} style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={themePrimaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {sortDirection === 'asc'
              ? <path d="M18 15l-6-6-6 6" />
              : <path d="M6 9l6 6 6-6" />
            }
          </svg>
        </span>
      );
    }
    return (
      <span data-testid={`sort-indicator-${key}`} style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', opacity: 0.3 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 10l5-5 5 5" />
          <path d="M7 14l5 5 5-5" />
        </svg>
      </span>
    );
  };

  // ── Styles ─────────────────────────────────────────────────────────────
  const outerStyle: React.CSSProperties = {
    ...borderShadowStyle,
    borderStyle: p.borderStyle as any,
    width: '100%',
    height: '100%',
    overflow: 'auto',
    position: 'relative',
    backgroundColor: themeSurfaceColor,
    color: colorVal ? String(colorVal) : (themeTextColor || undefined),
    ...(fontSizeVal ? { fontSize: typeof fontSizeVal === 'number' ? `${fontSizeVal}px` : fontSizeVal } : {}),
  };

  const headerCellStyle = (key: string): React.CSSProperties => ({
    padding: '10px 14px',
    backgroundColor: String(headerBg),
    borderBottom: `1px solid ${rowBorder}`,
    fontWeight: 600,
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: themeTextColor || '#6b7280',
    position: 'relative',
    width: columnWidths[key] || 'auto',
    minWidth: MIN_COL_WIDTH,
    cursor: sortableSet.has(key) ? 'pointer' : 'default',
    userSelect: 'none',
    whiteSpace: 'nowrap' as const,
    transition: 'color 0.15s ease',
    ...(stickyHeader ? { position: 'sticky' as const, top: 0, zIndex: 10 } : {}),
  });

  const cellStyle = (key: string): React.CSSProperties => ({
    padding: '10px 14px',
    width: columnWidths[key] || 'auto',
    minWidth: MIN_COL_WIDTH,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    fontSize: '0.875rem',
  });

  const hasData = totalRows > 0;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={outerStyle}
      onScroll={handleScroll}
      data-testid="table-container"
    >
      {/* Search bar */}
      {showSearch && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${rowBorder}`, position: stickyHeader ? 'sticky' : undefined, top: 0, zIndex: 11, backgroundColor: themeSurfaceColor }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={themeTextColor ? `${themeTextColor}50` : '#9ca3af'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={p.searchPlaceholder || 'Search...'}
              data-testid="table-search-input"
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                border: `1px solid ${themeBorderColor || '#e5e7eb'}`,
                borderRadius: 8,
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: themeSurfaceColor,
                color: themeTextColor || undefined,
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = themePrimaryColor;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${themePrimaryColor}15`;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = themeBorderColor || '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {showRowNumbers && (
              <th
                style={{
                  ...headerCellStyle('__rowNum'),
                  width: columnWidths['__rowNum'] || 50,
                  textAlign: 'center',
                }}
              >
                #
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                scope="col"
                style={headerCellStyle(col.key)}
                onClick={() => handleSort(col.key)}
                data-testid={`header-${col.key}`}
                onMouseEnter={e => {
                  if (sortableSet.has(col.key)) {
                    (e.currentTarget as HTMLTableCellElement).style.color = themeTextColor || '#111827';
                  }
                }}
                onMouseLeave={e => {
                  if (sortableSet.has(col.key)) {
                    (e.currentTarget as HTMLTableCellElement).style.color = themeTextColor || '#6b7280';
                  }
                }}
              >
                {col.header}
                {renderSortIndicator(col.key)}
                {/* Resize handle */}
                {resizable && (
                  <div
                    data-testid={`resize-handle-${col.key}`}
                    onMouseDown={e => handleResizeStart(e, col.key)}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '20%',
                      bottom: '20%',
                      width: 3,
                      cursor: 'col-resize',
                      borderRadius: 2,
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={e => { (e.target as HTMLDivElement).style.backgroundColor = themePrimaryColor; }}
                    onMouseLeave={e => { (e.target as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
      </table>

      {/* Virtualized body */}
      {hasData ? (
        <div
          data-testid="table-body-spacer"
          style={{
            position: 'relative',
            height: mode === 'edit' ? visibleRows.length * ROW_HEIGHT : totalHeight,
            width: '100%',
          }}
        >
          {visibleRows.map((row: any, i: number) => {
            const actualIndex = mode === 'edit' ? i : startIndex + i;
            const isSelected = selectedRecord && selectedRecord === row;
            const isStriped = striped && actualIndex % 2 === 1;

            const rowStyle: React.CSSProperties = {
              position: mode === 'edit' ? 'relative' : 'absolute',
              top: mode === 'edit' ? undefined : actualIndex * ROW_HEIGHT,
              left: 0,
              width: '100%',
              height: ROW_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${rowBorder}40`,
              backgroundColor: isSelected ? `${themePrimaryColor}20` : isStriped ? String(stripedColorVal) : themeSurfaceColor,
              cursor: mode === 'preview' && p.rowSelectAction !== 'none' ? 'pointer' : 'default',
              transition: 'background-color 0.15s ease, transform 0.15s ease',
            };

            return (
              <div
                key={row.id ?? actualIndex}
                style={rowStyle}
                data-testid={`table-row-${actualIndex}`}
                onClick={() => handleRowClick(row)}
                onMouseEnter={e => {
                  if (mode === 'preview' && !isSelected) {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.backgroundColor = themeHoverColor;
                    el.style.transform = 'translateX(2px)';
                  }
                }}
                onMouseLeave={e => {
                  if (mode === 'preview' && !isSelected) {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.backgroundColor =
                      isStriped ? String(stripedColorVal) : themeSurfaceColor;
                    el.style.transform = 'translateX(0)';
                  }
                }}
              >
                {showRowNumbers && (
                  <div style={{ ...cellStyle('__rowNum'), width: columnWidths['__rowNum'] || 50, textAlign: 'center', color: themeTextColor ? `${themeTextColor}60` : '#9ca3af', fontSize: '0.75rem' }}>
                    {actualIndex + 1}
                  </div>
                )}
                {columns.map(col => (
                  <div key={col.key} style={cellStyle(col.key)}>
                    {String(get(row, col.key, ''))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          data-testid="table-empty-state"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 20px',
            color: themeTextColor ? `${themeTextColor}60` : '#9ca3af',
            fontSize: '0.875rem',
            gap: 8,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>{emptyText || 'No records found'}</span>
        </div>
      )}
    </div>
  );
};

// ── Plugin ────────────────────────────────────────────────────────────────────

export const TablePlugin: ComponentPlugin = {
  type: ComponentType.TABLE,
  paletteConfig: {
    label: 'Table',
    icon: React.createElement(
      'svg',
      { style: iconStyle, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
      React.createElement('path', { d: 'M4 8h16M4 12h16M4 16h16', stroke: 'currentColor', strokeWidth: '2' }),
      React.createElement('rect', { x: '3', y: '4', width: '18', height: '16', rx: '2', stroke: 'currentColor', strokeWidth: '2' }),
    ),
    defaultProps: {
      ...commonStylingProps,
      columns: 'Name:name,Email:email,Role:role',
      rowSelectAction: 'none',
      width: '100%',
      height: 400,
      headerBackgroundColor: '{{theme.colors.surfaceVariant}}',
      rowBorderColor: '{{theme.colors.border}}',
      data: '{{[]}}',
      emptyStateText: 'No records found',
      showSearch: false,
      resizable: true,
      rowHeight: 40,
      striped: false,
      showRowNumbers: false,
      stickyHeader: true,
    },
  },
  renderer: TableRenderer,
  properties: () => null,
};
