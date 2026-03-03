/**
 * ComponentPalette Tests
 *
 * Verifies category assignment for components and that empty categories
 * are hidden from the palette UI.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentPalette } from '../ComponentPalette';

describe('ComponentPalette', () => {
  const renderPalette = () =>
    render(
      <ComponentPalette
        width={240}
        isCollapsed={false}
        onToggleCollapse={jest.fn()}
      />
    );

  it('renders Divider in Layout category', () => {
    renderPalette();

    // Expand the Layout category (exact match to avoid matching "Presets")
    const layoutButton = screen.getByRole('button', { name: /^Layout$/i });
    fireEvent.click(layoutButton);

    // Verify Divider palette item appears within the Layout section
    const dividerItem = screen.getByTestId('palette-item-DIVIDER');
    expect(dividerItem).toBeInTheDocument();
  });

  it('does not render categories with zero components', () => {
    renderPalette();

    // "Icons" and "Other" should not be rendered since they have no components
    expect(screen.queryByText('Icons')).not.toBeInTheDocument();
    expect(screen.queryByText('Other')).not.toBeInTheDocument();
  });

  it('renders non-empty categories', () => {
    renderPalette();

    // Category buttons have role="button" and aria-expanded attribute
    expect(screen.getByRole('button', { name: /^Input$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Display$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Layout$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Media$/i })).toBeInTheDocument();
  });

  it('calls onAddComponent when palette item is double-clicked', () => {
    const onAdd = jest.fn();
    render(
      <ComponentPalette
        width={240}
        isCollapsed={false}
        onToggleCollapse={jest.fn()}
        onAddComponent={onAdd}
      />
    );

    // Input category is expanded by default, find the Button item in Display
    const displayButton = screen.getByRole('button', { name: /Display/i });
    fireEvent.click(displayButton);

    const buttonItem = screen.getByTestId('palette-item-BUTTON');
    fireEvent.doubleClick(buttonItem);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith('BUTTON');
  });

  describe('Palette search (IMP-001)', () => {
    it('filters components by search query', () => {
      render(<ComponentPalette width={240} isCollapsed={false} onToggleCollapse={jest.fn()} />);
      const search = screen.getByTestId('palette-search');
      fireEvent.change(search, { target: { value: 'dat' } });
      // Verify Date Picker is visible
      expect(screen.getByText('Date Picker')).toBeInTheDocument();
      // Verify unrelated component is not visible
      expect(screen.queryByText('Button')).not.toBeInTheDocument();
    });

    it('shows no results message when search has no matches', () => {
      render(<ComponentPalette width={240} isCollapsed={false} onToggleCollapse={jest.fn()} />);
      const search = screen.getByTestId('palette-search');
      fireEvent.change(search, { target: { value: 'zzzzz' } });
      expect(screen.getByText('No components found')).toBeInTheDocument();
    });

    it('clears search and shows categories again', () => {
      render(<ComponentPalette width={240} isCollapsed={false} onToggleCollapse={jest.fn()} />);
      const search = screen.getByTestId('palette-search');
      fireEvent.change(search, { target: { value: 'dat' } });
      fireEvent.change(search, { target: { value: '' } });
      // Categories should be back - use the category button with aria-expanded
      expect(screen.getByRole('button', { name: /Input/ })).toBeInTheDocument();
    });
  });

  describe('Recent components (IMP-002)', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('shows recent section after double-clicking a component', () => {
      const onAdd = jest.fn();
      render(<ComponentPalette width={240} isCollapsed={false} onToggleCollapse={jest.fn()} onAddComponent={onAdd} />);
      // Double-click a component in the expanded Input category
      const item = screen.getByTestId('palette-item-INPUT');
      fireEvent.doubleClick(item);
      // Recent section should appear
      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    it('loads recent components from localStorage', () => {
      localStorage.setItem('palette:recent', JSON.stringify(['BUTTON']));
      render(<ComponentPalette width={240} isCollapsed={false} onToggleCollapse={jest.fn()} />);
      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    it('does not show recent section when search is active', () => {
      localStorage.setItem('palette:recent', JSON.stringify(['BUTTON']));
      render(<ComponentPalette width={240} isCollapsed={false} onToggleCollapse={jest.fn()} />);
      const search = screen.getByTestId('palette-search');
      fireEvent.change(search, { target: { value: 'button' } });
      expect(screen.queryByText('Recent')).not.toBeInTheDocument();
    });
  });
});
