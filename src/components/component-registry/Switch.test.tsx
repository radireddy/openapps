import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SwitchPlugin } from '@/components/component-registry/Switch';
import { ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const SwitchRenderer = SwitchPlugin.renderer;
const SwitchProperties = SwitchPlugin.properties;

describe('SwitchPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'switch1',
      type: ComponentType.SWITCH,
      props: {
        x: 0, y: 0, width: 180, height: 30,
        label: 'Enable Feature',
      },
    };

    it('should render with label and be unchecked by default', () => {
      render(<SwitchRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const switchEl = screen.getByRole('switch', { name: 'Enable Feature' });
      expect(switchEl).toBeInTheDocument();
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    });

    it('should be checked if the dataStore value is true', () => {
      // Components now use their ID as the dataStore key
      render(<SwitchRenderer component={baseComponent} mode="preview" dataStore={{ switch1: true }} evaluationScope={{}} />);
      const switchEl = screen.getByRole('switch', { name: 'Enable Feature' });
      expect(switchEl).toHaveAttribute('aria-checked', 'true');
    });

    it('should call onUpdateDataStore when clicked', async () => {
      const onUpdateDataStore = jest.fn();
      render(<SwitchRenderer component={baseComponent} mode="preview" dataStore={{ switch1: false }} onUpdateDataStore={onUpdateDataStore} evaluationScope={{}} />);
      
      const switchEl = screen.getByRole('switch', { name: 'Enable Feature' });
      await userEvent.click(switchEl);

      // Components now use their ID as the dataStore key
      expect(onUpdateDataStore).toHaveBeenCalledWith('switch1', true);
    });

    it('should be selectable in edit mode (not disabled)', () => {
      render(<SwitchRenderer component={baseComponent} mode="edit" dataStore={{}} evaluationScope={{}} />);
      const switchEl = screen.getByRole('switch', { name: 'Enable Feature' });
      // In edit mode, components should be selectable, so they should NOT be disabled
      expect(switchEl).not.toBeDisabled();
    });
  });

  describe('Properties', () => {
    it('should delegate to PropertiesPanelCore (plugin returns null)', () => {
      const { container } = render(<SwitchProperties />);
      expect(container.innerHTML).toBe('');
    });
  });
});