import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '@/Editor';
import { storageService } from '@/storageService';
import { AppDefinition, ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

// Polyfill ResizeObserver for JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

jest.mock('@/storageService');

const mockApp: AppDefinition = {
  id: 'app1',
  name: 'Test App',
  createdAt: new Date().toISOString(),
  lastModifiedAt: new Date().toISOString(),
  pages: [{ id: 'page1', name: 'Main Page' }],
  mainPageId: 'page1',
  components: [
    { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { text: 'Hello', x: 10, y: 10, width: 100, height: 30 } as any },
  ],
  dataStore: {},
  variables: [],
  theme: {
    colors: {
      primary: '#000000',
      onPrimary: '#ffffff',
      secondary: '#000000',
      onSecondary: '#ffffff',
      background: '#ffffff',
      surface: '#ffffff',
      text: '#000000',
      border: '#e5e5e5',
    },
    font: {
      family: 'Arial',
    },
    border: {
      width: '1px',
      style: 'solid',
    },
    radius: {
      default: '4px',
    },
    spacing: {
      sm: '4px',
      md: '8px',
      lg: '16px',
    },
  },
};

const mockedStorageService = storageService as jest.Mocked<typeof storageService>;

describe('Editor', () => {
  beforeEach(() => {
    mockedStorageService.getApp.mockResolvedValue(mockApp);
    mockedStorageService.getAllThemes.mockResolvedValue([]);
    mockedStorageService.getAllWidgetDefinitions.mockResolvedValue([]);
    mockedStorageService.getAllCustomPresets.mockResolvedValue([]);
    mockedStorageService.saveApp.mockResolvedValue(mockApp);
  });

  it('should show a loading state and then render the editor', async () => {
    render(<Editor appId="app1" onBack={() => {}} />);
    expect(screen.getByText('Loading Editor...')).toBeInTheDocument();
    expect(await screen.findByText('Test App')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Explorer' })).toBeInTheDocument();
    expect(screen.getByLabelText('Application design canvas')).toBeInTheDocument();
  });

  it('should switch between editor and preview modes', async () => {
    render(<Editor appId="app1" onBack={() => {}} />);
    await screen.findByText('Test App');
    
    // Check for an element specific to the editor (activity bar button)
    expect(screen.getByRole('button', { name: 'Components' })).toBeInTheDocument();

    // Switch to preview
    const previewButton = screen.getByRole('button', { name: /Preview/i });
    await userEvent.click(previewButton);

    // Check for an element specific to the preview
    expect(await screen.findByLabelText('Preview')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Components' })).not.toBeInTheDocument();

    // Switch back to editor
    const editorButton = screen.getByRole('button', { name: /Editor/i });
    await userEvent.click(editorButton);
    expect(await screen.findByRole('button', { name: 'Components' })).toBeInTheDocument();
  });

  it('should call onBack when the back button is clicked', async () => {
    const onBack = jest.fn();
    render(<Editor appId="app1" onBack={onBack} />);
    await screen.findByText('Test App');
    
    const backButton = screen.getByRole('button', { name: /Apps/i });
    await userEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should open AI chat panel when the AI button is clicked', async () => {
    render(<Editor appId="app1" onBack={() => {}} />);
    await screen.findByText('Test App');

    const aiButton = screen.getByTestId('ai-chat-button');
    await userEvent.click(aiButton);

    expect(screen.getByTestId('ai-chat-box')).toBeInTheDocument();
    expect(screen.getByTestId('ai-chat-input')).toBeInTheDocument();
  });

  it('should delete a selected component when delete key is pressed', async () => {
    render(<Editor appId="app1" onBack={() => {}} />);
    await screen.findByText('Test App');
    
    // Simulate selecting the component
    const component = await screen.findByLabelText('LABEL component');
    await userEvent.click(component);

    // Wait for the component to be selected (it should have the outline class)
    await waitFor(() => {
      const selectedComponent = screen.getByLabelText('LABEL component');
      expect(selectedComponent).toHaveClass('outline');
    });

    // Ensure focus is on the canvas (required for delete handler to work)
    const canvas = screen.getByTestId('canvas');
    canvas.focus();

    // Press delete key
    await userEvent.keyboard('{Delete}');

    // The component should be gone
    await waitFor(() => {
        expect(screen.queryByLabelText('LABEL component')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

   it('should switch between left panel tabs', async () => {
    render(<Editor appId="app1" onBack={() => {}} />);
    await screen.findByText('Test App');
    
    expect(screen.getByRole('heading', {name: 'Explorer'})).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', {name: 'Components'}));
    expect(await screen.findByRole('heading', {name: 'Components'})).toBeInTheDocument();
    expect(screen.queryByRole('heading', {name: 'Explorer'})).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', {name: 'State'}));
    expect(await screen.findByText('App State')).toBeInTheDocument();
  });
});