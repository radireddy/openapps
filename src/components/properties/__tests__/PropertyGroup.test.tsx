/**
 * PropertyGroup Tests
 *
 * Tests for collapsible group state persistence via localStorage (IMP-003),
 * expression indicator styling (IMP-007), regex preset rendering (IMP-005),
 * and AllowCustomDropdown behavior.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertyGroup, AllowCustomDropdown, CUSTOM_SENTINEL } from '../PropertyGroup';
import type { PropertyGroup as PropertyGroupType, PropertyMetadata, PropertyContext } from '../metadata';

// Helper to create a minimal group definition
const createGroup = (overrides: Partial<PropertyGroupType> = {}): PropertyGroupType => ({
  id: 'testGroup',
  label: 'Test Group',
  tab: 'General',
  collapsible: true,
  defaultCollapsed: false,
  ...overrides,
});

// Helper to create a minimal property
const createProperty = (overrides: Partial<PropertyMetadata> = {}): PropertyMetadata => ({
  id: 'testProp',
  label: 'Test Property',
  type: 'string',
  defaultValue: '',
  group: 'testGroup',
  tab: 'General',
  ...overrides,
});

const defaultContext: PropertyContext = {};

const defaultHandlers = {
  context: defaultContext,
  onUpdate: jest.fn() as jest.MockedFunction<(id: string, value: any) => void>,
  getValue: jest.fn().mockReturnValue('') as jest.MockedFunction<(id: string) => any>,
  getError: jest.fn().mockReturnValue(undefined) as jest.MockedFunction<(id: string) => string | undefined>,
  isMixed: jest.fn().mockReturnValue(false) as jest.MockedFunction<(id: string) => boolean>,
};

describe('PropertyGroup collapse persistence (IMP-003)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists collapsed state to localStorage when toggled', () => {
    const group = createGroup({ id: 'myGroup', defaultCollapsed: false });
    const properties = [createProperty({ group: 'myGroup' })];

    render(
      <PropertyGroup
        group={group}
        properties={properties}
        {...defaultHandlers}
      />
    );

    // Initially open (defaultCollapsed: false), so aria-expanded should be true
    const toggleButton = screen.getByRole('button', { name: /test group/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // Click to collapse
    fireEvent.click(toggleButton);
    expect(localStorage.getItem('propcollapse:myGroup')).toBe('false');

    // Click again to expand
    fireEvent.click(toggleButton);
    expect(localStorage.getItem('propcollapse:myGroup')).toBe('true');
  });

  it('restores collapsed state from localStorage on mount', () => {
    localStorage.setItem('propcollapse:testGroup', 'false');

    const group = createGroup({ id: 'testGroup', defaultCollapsed: false });
    const properties = [createProperty()];

    render(
      <PropertyGroup
        group={group}
        properties={properties}
        {...defaultHandlers}
      />
    );

    // Should start collapsed because localStorage says 'false'
    const toggleButton = screen.getByRole('button', { name: /test group/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('restores expanded state from localStorage on mount even if defaultCollapsed is true', () => {
    localStorage.setItem('propcollapse:expandedGroup', 'true');

    const group = createGroup({ id: 'expandedGroup', defaultCollapsed: true });
    const properties = [createProperty({ group: 'expandedGroup' })];

    render(
      <PropertyGroup
        group={group}
        properties={properties}
        {...defaultHandlers}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /test group/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('uses defaultCollapsed when no localStorage entry exists', () => {
    const group = createGroup({ id: 'newGroup', defaultCollapsed: true });
    const properties = [createProperty({ group: 'newGroup' })];

    render(
      <PropertyGroup
        group={group}
        properties={properties}
        {...defaultHandlers}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /test group/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    // No localStorage entry should have been set yet (only set on toggle)
    expect(localStorage.getItem('propcollapse:newGroup')).toBeNull();
  });
});

describe('Expression indicator (IMP-007)', () => {
  it('renders accent left border when property value contains expression syntax', () => {
    const group = createGroup();
    const properties = [createProperty({ id: 'exprProp', type: 'expression', supportsExpression: true })];

    const getValue = jest.fn().mockReturnValue('{{user.name}}') as jest.MockedFunction<(id: string) => any>;

    const { container } = render(
      <PropertyGroup
        group={group}
        properties={properties}
        {...defaultHandlers}
        getValue={getValue}
      />
    );

    // Find the wrapper div with the expression indicator style
    const expressionWrapper = container.querySelector('[style*="border-left"]');
    expect(expressionWrapper).not.toBeNull();
    expect(expressionWrapper).toHaveStyle({ borderLeft: '2px solid' });
  });

  it('does not render accent left border when property value has no expression syntax', () => {
    const group = createGroup();
    const properties = [createProperty({ id: 'plainProp', type: 'string' })];

    const getValue = jest.fn().mockReturnValue('plain text') as jest.MockedFunction<(id: string) => any>;

    const { container } = render(
      <PropertyGroup
        group={group}
        properties={properties}
        {...defaultHandlers}
        getValue={getValue}
      />
    );

    const expressionWrapper = container.querySelector('[style*="border-left"]');
    expect(expressionWrapper).toBeNull();
  });
});

describe('Regex presets (IMP-005)', () => {
  it('renders preset buttons when property has presets defined', () => {
    const group = createGroup();
    const properties = [createProperty({
      id: 'pattern',
      type: 'string',
      presets: [
        { label: 'Email', value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
        { label: 'Phone', value: '^[\\d\\-\\+\\(\\)\\s]+$' },
        { label: 'URL', value: '^https?:\\/\\/.+' },
      ],
    })];

    render(
      <PropertyGroup
        group={group}
        properties={properties}
        {...defaultHandlers}
      />
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('URL')).toBeInTheDocument();
  });

  it('calls onUpdate with preset value when preset button is clicked', () => {
    const onUpdate = jest.fn() as jest.MockedFunction<(id: string, value: any) => void>;
    const group = createGroup();
    const presetValue = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
    const properties = [createProperty({
      id: 'pattern',
      type: 'string',
      presets: [
        { label: 'Email', value: presetValue },
      ],
    })];

    render(
      <PropertyGroup
        group={group}
        properties={properties}
        {...defaultHandlers}
        onUpdate={onUpdate}
      />
    );

    fireEvent.click(screen.getByText('Email'));
    expect(onUpdate).toHaveBeenCalledWith('pattern', presetValue);
  });

  it('does not render preset buttons when property has no presets', () => {
    const group = createGroup();
    const properties = [createProperty({
      id: 'name',
      type: 'string',
    })];

    const { container } = render(
      <PropertyGroup
        group={group}
        properties={properties}
        {...defaultHandlers}
      />
    );

    // No preset buttons should exist
    const presetButtons = container.querySelectorAll('button[title]');
    // Only the toggle button should be present, no preset buttons
    const allButtons = container.querySelectorAll('button');
    // The first button is the group toggle button
    expect(allButtons.length).toBe(1); // Only the collapse toggle
  });

  it('shows preset value as tooltip on hover', () => {
    const group = createGroup();
    const presetValue = '^\\d+$';
    const properties = [createProperty({
      id: 'pattern',
      type: 'string',
      presets: [
        { label: 'Numbers only', value: presetValue },
      ],
    })];

    render(
      <PropertyGroup
        group={group}
        properties={properties}
        {...defaultHandlers}
      />
    );

    const presetButton = screen.getByText('Numbers only');
    expect(presetButton).toHaveAttribute('title', presetValue);
  });
});

// Helper to create a minimal PropertyMetadata for AllowCustomDropdown tests
const createDropdownProp = (overrides: Partial<PropertyMetadata> = {}): PropertyMetadata => ({
  id: 'fontSize',
  label: 'Font Size',
  type: 'dropdown',
  defaultValue: '16px',
  group: 'typography',
  tab: 'General',
  ...overrides,
});

const presetOptions = [
  { value: '12px', label: 'Small (12px)' },
  { value: '14px', label: 'Medium (14px)' },
  { value: '16px', label: 'Large (16px)' },
];

describe('AllowCustomDropdown', () => {
  it('renders a dropdown with "Custom..." option appended when allowCustom is true', () => {
    const onChange = jest.fn();

    render(
      <AllowCustomDropdown
        prop={createDropdownProp()}
        value="14px"
        options={presetOptions}
        onChange={onChange}
      />
    );

    // The dropdown should contain all preset options plus Custom...
    const select = screen.getByRole('combobox');
    const optionElements = select.querySelectorAll('option');
    const optionLabels = Array.from(optionElements).map(o => o.textContent);

    expect(optionLabels).toContain('Small (12px)');
    expect(optionLabels).toContain('Medium (14px)');
    expect(optionLabels).toContain('Large (16px)');
    expect(optionLabels).toContain('Custom...');
    expect(optionElements.length).toBe(presetOptions.length + 1);
  });

  it('calls onChange with preset value when a preset is selected', () => {
    const onChange = jest.fn();

    render(
      <AllowCustomDropdown
        prop={createDropdownProp()}
        value="14px"
        options={presetOptions}
        onChange={onChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '12px' } });

    expect(onChange).toHaveBeenCalledWith('12px');
  });

  it('reveals a text input when "Custom..." is selected', () => {
    const onChange = jest.fn();

    render(
      <AllowCustomDropdown
        prop={createDropdownProp()}
        value="14px"
        options={presetOptions}
        onChange={onChange}
      />
    );

    // Initially no text input should be visible (value matches a preset)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    // Select the Custom... option
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: CUSTOM_SENTINEL } });

    // Text input should now be visible
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows custom input initially when value does not match any preset option', () => {
    const onChange = jest.fn();

    render(
      <AllowCustomDropdown
        prop={createDropdownProp()}
        value="1.25rem"
        options={presetOptions}
        onChange={onChange}
      />
    );

    // Since "1.25rem" is not in presetOptions, custom input should be shown
    const textInput = screen.getByRole('textbox');
    expect(textInput).toBeInTheDocument();
    expect(textInput).toHaveValue('1.25rem');

    // The dropdown should show the Custom... sentinel value
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue(CUSTOM_SENTINEL);
  });

  it('calls onChange when typing in the custom input', () => {
    const onChange = jest.fn();

    render(
      <AllowCustomDropdown
        prop={createDropdownProp()}
        value="1.25rem"
        options={presetOptions}
        onChange={onChange}
      />
    );

    const textInput = screen.getByRole('textbox');
    fireEvent.change(textInput, { target: { value: '2rem' } });

    expect(onChange).toHaveBeenCalledWith('2rem');
  });

  it('resets showCustomInput to false when value changes externally to a preset', () => {
    const onChange = jest.fn();

    // Start with a custom (non-preset) value
    const { rerender } = render(
      <AllowCustomDropdown
        prop={createDropdownProp()}
        value="1.25rem"
        options={presetOptions}
        onChange={onChange}
      />
    );

    // Custom input should be shown initially
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    // Simulate external change (e.g., undo/redo) to a preset value
    rerender(
      <AllowCustomDropdown
        prop={createDropdownProp()}
        value="14px"
        options={presetOptions}
        onChange={onChange}
      />
    );

    // Custom input should be hidden because "14px" matches a preset
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    // Dropdown should now show the preset value
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('14px');
  });
});
