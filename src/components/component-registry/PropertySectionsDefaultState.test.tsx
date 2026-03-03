import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react';

import { ButtonPlugin } from '@/components/component-registry/Button';
import { ContainerPlugin } from '@/components/component-registry/Container';
import { InputPlugin } from '@/components/component-registry/Input';

describe('Property Sections Default State', () => {
  it('all component plugins delegate properties to PropertiesPanelCore', () => {
    // After the property system unification, all plugins return null from properties.
    // Property editing is handled by the metadata-driven PropertiesPanelCore.
    const plugins = [ButtonPlugin, ContainerPlugin, InputPlugin];
    plugins.forEach(plugin => {
      const { container } = render(<plugin.properties />);
      expect(container.innerHTML).toBe('');
    });
  });
});
