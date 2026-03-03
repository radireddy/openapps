import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentPalette } from './ComponentPalette';

describe('ComponentPalette', () => {
  test('defaults to expanding Input category and shows input items', async () => {
    render(<ComponentPalette width={240} isCollapsed={false} onToggleCollapse={jest.fn()} />);

    // The Input category should be expanded by default; Input plugin item should be present
    const inputItem = await screen.findByTestId('palette-item-INPUT');
    expect(inputItem).toBeInTheDocument();
  });

  test('only one category is open at a time', async () => {
    const user = userEvent.setup();
    render(<ComponentPalette width={240} isCollapsed={false} onToggleCollapse={jest.fn()} />);

    // Initially Input open
    expect(await screen.findByTestId('palette-item-INPUT')).toBeInTheDocument();

    // Click Media header to open it
    const mediaButton = screen.getByRole('button', { name: /Media/i });
    await user.click(mediaButton);

    // Media's image plugin should be visible
    const imageItem = await screen.findByTestId('palette-item-IMAGE');
    expect(imageItem).toBeInTheDocument();

    // Input item should no longer be visible (collapsed)
    const inputItems = screen.queryByTestId('palette-item-INPUT');
    expect(inputItems).not.toBeInTheDocument();
  });

  test('shows collapsed mini-aside when isCollapsed is true', () => {
    render(<ComponentPalette width={240} isCollapsed={true} onToggleCollapse={jest.fn()} />);

    const expandButton = screen.getByRole('button', { name: /Expand Components/i });
    expect(expandButton).toBeInTheDocument();
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });
});
