import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectPlugin } from '@/components/component-registry/Select';
import { ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const SelectRenderer = SelectPlugin.renderer;
const SelectProperties = SelectPlugin.properties;

describe('SelectPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'select1',
      type: ComponentType.SELECT,
      props: {
        x: 0, y: 0, width: 200, height: 40,
        placeholder: 'Choose one...',
        options: 'Apple,Banana,Orange',
      },
    };

    it('should render with placeholder and options', () => {
      render(<SelectRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Choose one...')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });

    it('should show the selected value from dataStore', () => {
      // Components now use their ID as the dataStore key
      render(<SelectRenderer component={baseComponent} mode="preview" dataStore={{ select1: 'Banana' }} evaluationScope={{}} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('Banana');
    });

    it('should call onUpdateDataStore when an option is selected', async () => {
      const onUpdateDataStore = jest.fn();
      render(<SelectRenderer component={baseComponent} mode="preview" dataStore={{}} onUpdateDataStore={onUpdateDataStore} evaluationScope={{}} />);
      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, 'Orange');
      // Components now use their ID as the dataStore key
      expect(onUpdateDataStore).toHaveBeenCalledWith('select1', 'Orange');
    });
  });
  
  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(<SelectProperties />);
      expect(container.innerHTML).toBe('');
    });
  });
});