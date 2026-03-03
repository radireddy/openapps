import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroupPlugin } from '@/components/component-registry/RadioGroup';
import { ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const RadioGroupRenderer = RadioGroupPlugin.renderer;
const RadioGroupProperties = RadioGroupPlugin.properties;

describe('RadioGroupPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'radio1',
      type: ComponentType.RADIO_GROUP,
      props: {
        x: 0, y: 0, width: 150, height: 80,
        options: 'Admin,Editor,Viewer',
        groupLabel: 'User Role',
      },
    };

    it('should render all options', () => {
      render(<RadioGroupRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByLabelText('Admin')).toBeInTheDocument();
      expect(screen.getByLabelText('Editor')).toBeInTheDocument();
      expect(screen.getByLabelText('Viewer')).toBeInTheDocument();
    });

    it('should have the correct option checked based on dataStore', () => {
      // Components now use their ID as the dataStore key
      render(<RadioGroupRenderer component={baseComponent} mode="preview" dataStore={{ radio1: 'Editor' }} evaluationScope={{}} />);
      expect(screen.getByLabelText('Editor')).toBeChecked();
      expect(screen.getByLabelText('Admin')).not.toBeChecked();
    });

    it('should call onUpdateDataStore when a different option is clicked', async () => {
      const onUpdateDataStore = jest.fn();
      render(<RadioGroupRenderer component={baseComponent} mode="preview" dataStore={{ radio1: 'Editor' }} onUpdateDataStore={onUpdateDataStore} evaluationScope={{}} />);
      
      const adminRadio = screen.getByLabelText('Admin');
      await userEvent.click(adminRadio);

      // Components now use their ID as the dataStore key
      expect(onUpdateDataStore).toHaveBeenCalledWith('radio1', 'Admin');
    });

    it('should be selectable in edit mode (not disabled)', () => {
      render(<RadioGroupRenderer component={baseComponent} mode="edit" dataStore={{}} evaluationScope={{}} />);
      // In edit mode, components should be selectable, so they should NOT be disabled
      expect(screen.getByLabelText('Admin')).not.toBeDisabled();
    });
  });

  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(<RadioGroupProperties />);
      expect(container.innerHTML).toBe('');
    });
  });
});