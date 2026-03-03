import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TablePlugin } from '@/components/component-registry/Table';
import { ComponentType, ActionHandlers } from 'types';

const TableRenderer = TablePlugin.renderer;

// ── Shared fixtures ──────────────────────────────────────────────────────────

const mockActions: ActionHandlers = {
  createRecord: jest.fn<any>(),
  updateRecord: jest.fn<any>(),
  deleteRecord: jest.fn<any>(),
  selectRecord: jest.fn<any>(),
  updateVariable: jest.fn<any>(),
  submitForm: jest.fn<any>(),
};

const sampleData = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin', age: 30 },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User', age: 25 },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', role: 'User', age: 35 },
];

const baseProps = {
  width: 600 as number | string,
  height: 400 as number | string,
  columns: 'Name:name,Email:email,Role:role',
  rowSelectAction: 'none' as const,
  data: '{{users}}',
};

const baseScope = { users: sampleData };

function renderTable(propOverrides: Record<string, any> = {}, scopeOverrides: Record<string, any> = {}, modeOverride: 'edit' | 'preview' = 'preview') {
  const component = { id: 'tbl1', type: ComponentType.TABLE, props: { ...baseProps, ...propOverrides } };
  const scope = { ...baseScope, ...scopeOverrides };
  return render(
    <TableRenderer component={component} mode={modeOverride} actions={mockActions} evaluationScope={scope} />
  );
}

// ── Mock ResizeObserver ──────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  // @ts-ignore
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// ═══════════════════════════════════════════════════════════════════════════════
// DATA BINDING
// ═══════════════════════════════════════════════════════════════════════════════

describe('Table data binding', () => {
  it('renders rows from data expression evaluated against evaluationScope', () => {
    renderTable();
    expect(screen.getByTestId('table-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('table-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('table-row-2')).toBeInTheDocument();
  });

  it('renders empty state when data returns empty array', () => {
    renderTable({}, { users: [] });
    expect(screen.getByTestId('table-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('renders empty state when data prop is absent', () => {
    renderTable({ data: undefined }, {});
    expect(screen.getByTestId('table-empty-state')).toBeInTheDocument();
  });

  it('handles non-array data gracefully', () => {
    renderTable({}, { users: 'not an array' });
    expect(screen.getByTestId('table-empty-state')).toBeInTheDocument();
  });

  it('renders custom emptyStateText', () => {
    renderTable({ emptyStateText: 'Nothing here!' }, { users: [] });
    expect(screen.getByText('Nothing here!')).toBeInTheDocument();
  });

  it('renders correct cell values using column keys', () => {
    renderTable();
    const row0 = screen.getByTestId('table-row-0');
    expect(row0).toHaveTextContent('Alice');
    expect(row0).toHaveTextContent('alice@example.com');
    expect(row0).toHaveTextContent('Admin');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN PARSING
// ═══════════════════════════════════════════════════════════════════════════════

describe('Table column parsing', () => {
  it('parses "Header:key" format correctly', () => {
    renderTable({ columns: 'Full Name:name,Address:email' });
    expect(screen.getByTestId('header-name')).toHaveTextContent('Full Name');
    expect(screen.getByTestId('header-email')).toHaveTextContent('Address');
  });

  it('uses header as key (lowercased) when key is omitted', () => {
    renderTable({ columns: 'Name,Email' }, { users: [{ name: 'Test', email: 'test@t.com' }] });
    expect(screen.getByTestId('header-name')).toHaveTextContent('Name');
    expect(screen.getByTestId('header-email')).toHaveTextContent('Email');
  });

  it('renders all column headers', () => {
    renderTable({ columns: 'A:a,B:b,C:c' }, { users: [{ a: 1, b: 2, c: 3 }] });
    expect(screen.getByTestId('header-a')).toBeInTheDocument();
    expect(screen.getByTestId('header-b')).toBeInTheDocument();
    expect(screen.getByTestId('header-c')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SORTING
// ═══════════════════════════════════════════════════════════════════════════════

describe('Table sorting', () => {
  it('shows no sort indicators when sortableColumns is not set', () => {
    renderTable();
    expect(screen.queryByTestId('sort-indicator-name')).not.toBeInTheDocument();
  });

  it('shows sort indicator on sortable column headers', () => {
    renderTable({ sortableColumns: 'name,email' });
    expect(screen.getByTestId('sort-indicator-name')).toBeInTheDocument();
    expect(screen.getByTestId('sort-indicator-email')).toBeInTheDocument();
    expect(screen.queryByTestId('sort-indicator-role')).not.toBeInTheDocument();
  });

  it('sorts ascending on first header click', () => {
    renderTable({ sortableColumns: '*' });
    fireEvent.click(screen.getByTestId('header-name'));
    const rows = screen.getAllByTestId(/^table-row-/);
    expect(rows[0]).toHaveTextContent('Alice');
    expect(rows[1]).toHaveTextContent('Bob');
    expect(rows[2]).toHaveTextContent('Charlie');
  });

  it('sorts descending on second click', () => {
    renderTable({ sortableColumns: '*' });
    const header = screen.getByTestId('header-name');
    fireEvent.click(header); // asc
    fireEvent.click(header); // desc
    const rows = screen.getAllByTestId(/^table-row-/);
    expect(rows[0]).toHaveTextContent('Charlie');
    expect(rows[1]).toHaveTextContent('Bob');
    expect(rows[2]).toHaveTextContent('Alice');
  });

  it('removes sort on third click', () => {
    renderTable({ sortableColumns: '*' });
    const header = screen.getByTestId('header-name');
    fireEvent.click(header); // asc
    fireEvent.click(header); // desc
    fireEvent.click(header); // none
    // Original order restored
    const rows = screen.getAllByTestId(/^table-row-/);
    expect(rows[0]).toHaveTextContent('Alice');
  });

  it('sorts numeric values numerically (not lexicographic)', () => {
    const numData = [
      { id: 1, val: 9 },
      { id: 2, val: 100 },
      { id: 3, val: 20 },
    ];
    renderTable(
      { columns: 'Val:val', sortableColumns: '*', data: '{{items}}' },
      { items: numData },
    );
    fireEvent.click(screen.getByTestId('header-val'));
    const rows = screen.getAllByTestId(/^table-row-/);
    expect(rows[0]).toHaveTextContent('9');
    expect(rows[1]).toHaveTextContent('20');
    expect(rows[2]).toHaveTextContent('100');
  });

  it('respects sortableColumns="*"', () => {
    renderTable({ sortableColumns: '*' });
    expect(screen.getByTestId('sort-indicator-name')).toBeInTheDocument();
    expect(screen.getByTestId('sort-indicator-email')).toBeInTheDocument();
    expect(screen.getByTestId('sort-indicator-role')).toBeInTheDocument();
  });

  it('does not sort non-sortable columns', () => {
    renderTable({ sortableColumns: 'email' });
    // Click non-sortable column header
    fireEvent.click(screen.getByTestId('header-name'));
    // Order unchanged
    const rows = screen.getAllByTestId(/^table-row-/);
    expect(rows[0]).toHaveTextContent('Alice');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FILTERING
// ═══════════════════════════════════════════════════════════════════════════════

describe('Table filtering', () => {
  it('does not render search bar when showSearch is false', () => {
    renderTable({ showSearch: false });
    expect(screen.queryByTestId('table-search-input')).not.toBeInTheDocument();
  });

  it('renders search bar when showSearch is true', () => {
    renderTable({ showSearch: true });
    expect(screen.getByTestId('table-search-input')).toBeInTheDocument();
  });

  it('filters rows by query across filterable columns', () => {
    renderTable({ showSearch: true, filterableColumns: '*' });
    const input = screen.getByTestId('table-search-input');
    fireEvent.change(input, { target: { value: 'alice' } });
    const rows = screen.getAllByTestId(/^table-row-/);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('Alice');
  });

  it('filters case-insensitively', () => {
    renderTable({ showSearch: true, filterableColumns: '*' });
    const input = screen.getByTestId('table-search-input');
    fireEvent.change(input, { target: { value: 'BOB' } });
    const rows = screen.getAllByTestId(/^table-row-/);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('Bob');
  });

  it('shows all rows when query is empty', () => {
    renderTable({ showSearch: true, filterableColumns: '*' });
    const input = screen.getByTestId('table-search-input');
    fireEvent.change(input, { target: { value: 'alice' } });
    expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(1);
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(3);
  });

  it('respects specific filterableColumns (not all)', () => {
    renderTable({ showSearch: true, filterableColumns: 'name' });
    const input = screen.getByTestId('table-search-input');
    // Search by email should not match since only 'name' is filterable
    fireEvent.change(input, { target: { value: '@example.com' } });
    expect(screen.queryByTestId('table-row-0')).not.toBeInTheDocument();
    expect(screen.getByTestId('table-empty-state')).toBeInTheDocument();
  });

  it('renders custom searchPlaceholder', () => {
    renderTable({ showSearch: true, searchPlaceholder: 'Find users...' });
    const input = screen.getByTestId('table-search-input');
    expect(input).toHaveAttribute('placeholder', 'Find users...');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN RESIZE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Table column resize', () => {
  it('renders resize handles when resizable=true', () => {
    renderTable({ resizable: true });
    expect(screen.getByTestId('resize-handle-name')).toBeInTheDocument();
    expect(screen.getByTestId('resize-handle-email')).toBeInTheDocument();
    expect(screen.getByTestId('resize-handle-role')).toBeInTheDocument();
  });

  it('does not render resize handles when resizable=false', () => {
    renderTable({ resizable: false });
    expect(screen.queryByTestId('resize-handle-name')).not.toBeInTheDocument();
  });

  it('starts resize on mousedown on handle', () => {
    renderTable({ resizable: true });
    const handle = screen.getByTestId('resize-handle-name');
    fireEvent.mouseDown(handle, { clientX: 100 });
    // Check that body cursor is set during resize
    expect(document.body.style.cursor).toBe('col-resize');
    // Clean up
    fireEvent.mouseUp(document);
  });

  it('enforces minimum column width', () => {
    renderTable({ resizable: true });
    const handle = screen.getByTestId('resize-handle-name');
    // Start resize at x=200, move left by 500px (should clamp to MIN_COL_WIDTH=60)
    fireEvent.mouseDown(handle, { clientX: 200 });
    fireEvent.mouseMove(document, { clientX: -300 });
    fireEvent.mouseUp(document);
    // No crash — component still renders
    expect(screen.getByTestId('header-name')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUAL SCROLLING
// ═══════════════════════════════════════════════════════════════════════════════

describe('Table virtual scrolling', () => {
  const largeData = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@test.com`,
    role: 'User',
  }));

  it('renders only visible rows for large datasets in preview mode', () => {
    renderTable({ data: '{{items}}' }, { items: largeData });
    const rows = screen.getAllByTestId(/^table-row-/);
    // Should not render all 100 rows — buffer + visible window
    expect(rows.length).toBeLessThan(100);
  });

  it('spacer height equals totalRows * rowHeight', () => {
    renderTable({ data: '{{items}}', rowHeight: 40 }, { items: largeData });
    const spacer = screen.getByTestId('table-body-spacer');
    // 100 rows * 40px = 4000px
    expect(spacer.style.height).toBe('4000px');
  });

  it('custom rowHeight prop is respected', () => {
    renderTable({ data: '{{items}}', rowHeight: 60 }, { items: largeData });
    const spacer = screen.getByTestId('table-body-spacer');
    expect(spacer.style.height).toBe('6000px');
  });

  it('all rows render when dataset fits viewport (edit mode)', () => {
    const smallData = [
      { id: 1, name: 'A', email: 'a@t.com', role: 'X' },
      { id: 2, name: 'B', email: 'b@t.com', role: 'Y' },
    ];
    renderTable({ data: '{{items}}' }, { items: smallData }, 'edit');
    const rows = screen.getAllByTestId(/^table-row-/);
    expect(rows).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROW SELECTION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Table row selection', () => {
  it('calls selectRecord on row click in preview mode with updateDataStore', () => {
    renderTable({ rowSelectAction: 'updateDataStore', selectedRecordKey: 'selected' });
    const row = screen.getByTestId('table-row-0');
    fireEvent.click(row);
    expect(mockActions.selectRecord).toHaveBeenCalledWith('selected', sampleData[0]);
  });

  it('does not call selectRecord in edit mode', () => {
    renderTable({ rowSelectAction: 'updateDataStore', selectedRecordKey: 'selected' }, {}, 'edit');
    const row = screen.getByTestId('table-row-0');
    fireEvent.click(row);
    expect(mockActions.selectRecord).not.toHaveBeenCalled();
  });

  it('does not call selectRecord when rowSelectAction is none', () => {
    renderTable({ rowSelectAction: 'none' });
    const row = screen.getByTestId('table-row-0');
    fireEvent.click(row);
    expect(mockActions.selectRecord).not.toHaveBeenCalled();
  });

  it('selected row has distinct background color', () => {
    const selectedRow = sampleData[1];
    renderTable(
      { rowSelectAction: 'updateDataStore', selectedRecordKey: 'selected' },
      { users: sampleData, selected: selectedRow },
    );
    const row = screen.getByTestId('table-row-1');
    // Theme-based: primary color at 20% opacity (#3b82f620 → rgba(59, 130, 246, 0.125))
    expect(row.style.backgroundColor).toBe('rgba(59, 130, 246, 0.125)');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL ENHANCEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Table visual enhancements', () => {
  it('applies striped background on odd rows when striped=true', () => {
    renderTable({ striped: true, stripedColor: '#f9fafb' });
    const row1 = screen.getByTestId('table-row-1'); // odd index
    // jsdom normalises hex to rgb
    expect(row1.style.backgroundColor).toBe('rgb(249, 250, 251)');
  });

  it('applies custom stripedColor', () => {
    renderTable({ striped: true, stripedColor: '#e0f2fe' });
    const row1 = screen.getByTestId('table-row-1');
    expect(row1.style.backgroundColor).toBe('rgb(224, 242, 254)');
  });

  it('shows row numbers when showRowNumbers=true', () => {
    renderTable({ showRowNumbers: true });
    const row0 = screen.getByTestId('table-row-0');
    expect(row0).toHaveTextContent('1');
    const row1 = screen.getByTestId('table-row-1');
    expect(row1).toHaveTextContent('2');
  });

  it('does not show row numbers by default', () => {
    renderTable();
    const row0 = screen.getByTestId('table-row-0');
    // Should not contain just "1" as first cell content (name is "Alice")
    const cells = row0.querySelectorAll('div');
    // First cell should be "Alice", not "1"
    expect(cells[0].textContent).toBe('Alice');
  });

  it('has sticky header by default', () => {
    renderTable();
    const header = screen.getByTestId('header-name');
    expect(header.style.position).toBe('sticky');
  });

  it('header uses evaluated background color expression', () => {
    renderTable({ headerBackgroundColor: '#ff0000' });
    const header = screen.getByTestId('header-name');
    // jsdom normalises hex colors to rgb()
    expect(header.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT MODE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Table edit mode', () => {
  it('renders column headers in edit mode', () => {
    renderTable({}, {}, 'edit');
    expect(screen.getByTestId('header-name')).toBeInTheDocument();
    expect(screen.getByTestId('header-email')).toBeInTheDocument();
    expect(screen.getByTestId('header-role')).toBeInTheDocument();
  });

  it('limits sample rows to 5 in edit mode', () => {
    const bigData = Array.from({ length: 20 }, (_, i) => ({
      id: i, name: `N${i}`, email: `e${i}@t.com`, role: 'R',
    }));
    renderTable({ data: '{{items}}' }, { items: bigData }, 'edit');
    const rows = screen.getAllByTestId(/^table-row-/);
    expect(rows).toHaveLength(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGIN CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

describe('TablePlugin configuration', () => {
  it('properties panel returns null (metadata-driven)', () => {
    const { container } = render(React.createElement(TablePlugin.properties));
    expect(container.innerHTML).toBe('');
  });

  it('has correct default props', () => {
    expect(TablePlugin.paletteConfig.defaultProps.data).toBe('{{[]}}');
    expect(TablePlugin.paletteConfig.defaultProps.rowHeight).toBe(40);
    expect(TablePlugin.paletteConfig.defaultProps.resizable).toBe(true);
    expect(TablePlugin.paletteConfig.defaultProps.stickyHeader).toBe(true);
    expect(TablePlugin.paletteConfig.defaultProps.height).toBe(400);
  });
});
