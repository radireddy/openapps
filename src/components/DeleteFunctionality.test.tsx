import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '@/Editor';
import { ComponentType, AppDefinition } from 'types';
import { storageService } from '@/storageService';
import '@testing-library/jest-dom';

// Mock storage service
jest.mock('@/storageService');
const mockedStorageService = storageService as jest.Mocked<typeof storageService>;

describe('Delete Functionality - All Components', () => {
  const mockOnBack = jest.fn();

  const createAppDefinition = (components: any[]): AppDefinition => ({
    id: 'app1',
    name: 'Test App',
    createdAt: '2024-01-01T00:00:00Z',
    lastModifiedAt: '2024-01-01T00:00:00Z',
    pages: [
      {
        id: 'page1',
        name: 'Page 1',
      },
    ],
    mainPageId: 'page1',
    components,
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
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorageService.getAllThemes.mockResolvedValue([]);
    mockedStorageService.getAllWidgetDefinitions.mockResolvedValue([]);
    mockedStorageService.getAllCustomPresets.mockResolvedValue([]);
    mockedStorageService.saveApp.mockResolvedValue(createAppDefinition([]));
  });

  const testDeleteForComponent = (
    componentType: ComponentType,
    componentName: string,
    defaultProps: any = {}
  ) => {
    describe(`${componentName} Component (${componentType})`, () => {
      it(`should delete ${componentName} when delete icon (X) is clicked`, async () => {
        const component = {
          id: 'comp1',
          type: componentType,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 100,
            height: 40,
            ...defaultProps,
          },
        };

        const appDefinition = createAppDefinition([component]);
        mockedStorageService.getApp.mockResolvedValue(appDefinition);

        render(<Editor appId="app1" onBack={mockOnBack} />);
        await screen.findByText('Test App');

        // Select the component by clicking it
        const componentElement = await screen.findByLabelText(`${componentType} component`);
        await userEvent.click(componentElement);

        // Wait for component to be selected (outline class)
        await waitFor(() => {
          expect(componentElement).toHaveClass('outline');
        });

        // Wait for delete button to appear
        const deleteButton = await screen.findByLabelText('Delete Component');
        expect(deleteButton).toBeInTheDocument();

        // Click the delete button
        await userEvent.click(deleteButton);

        // Verify component was deleted
        await waitFor(() => {
          expect(screen.queryByLabelText(`${componentType} component`)).not.toBeInTheDocument();
        }, { timeout: 2000 });
      });

      it(`should delete ${componentName} when Delete key is pressed`, async () => {
        const component = {
          id: 'comp1',
          type: componentType,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 100,
            height: 40,
            ...defaultProps,
          },
        };

        const appDefinition = createAppDefinition([component]);
        mockedStorageService.getApp.mockResolvedValue(appDefinition);

        render(<Editor appId="app1" onBack={mockOnBack} />);
        await screen.findByText('Test App');

        // Select the component by clicking it
        const componentElement = await screen.findByLabelText(`${componentType} component`);
        await userEvent.click(componentElement);

        // Wait for component to be selected (outline class)
        await waitFor(() => {
          expect(componentElement).toHaveClass('outline');
        });

        // Press Delete key (no need to focus canvas anymore with the fix)
        await userEvent.keyboard('{Delete}');

        // Verify component was deleted
        await waitFor(() => {
          expect(screen.queryByLabelText(`${componentType} component`)).not.toBeInTheDocument();
        }, { timeout: 2000 });
      });

      it(`should delete ${componentName} when Backspace key is pressed`, async () => {
        const component = {
          id: 'comp1',
          type: componentType,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 100,
            height: 40,
            ...defaultProps,
          },
        };

        const appDefinition = createAppDefinition([component]);
        mockedStorageService.getApp.mockResolvedValue(appDefinition);

        render(<Editor appId="app1" onBack={mockOnBack} />);
        await screen.findByText('Test App');

        // Select the component by clicking it
        const componentElement = await screen.findByLabelText(`${componentType} component`);
        await userEvent.click(componentElement);

        // Wait for component to be selected (outline class)
        await waitFor(() => {
          expect(componentElement).toHaveClass('outline');
        });

        // Press Backspace key
        await userEvent.keyboard('{Backspace}');

        // Verify component was deleted
        await waitFor(() => {
          expect(screen.queryByLabelText(`${componentType} component`)).not.toBeInTheDocument();
        }, { timeout: 2000 });
      });

      it(`should delete ${componentName} when disabled and delete icon is clicked`, async () => {
        const component = {
          id: 'comp1',
          type: componentType,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 100,
            height: 40,
            disabled: true,
            ...defaultProps,
          },
        };

        const appDefinition = createAppDefinition([component]);
        mockedStorageService.getApp.mockResolvedValue(appDefinition);

        render(<Editor appId="app1" onBack={mockOnBack} />);
        await screen.findByText('Test App');

        // Select the disabled component
        const componentElement = await screen.findByLabelText(`${componentType} component`);
        await userEvent.click(componentElement);

        // Wait for delete button to appear
        const deleteButton = await screen.findByLabelText('Delete Component');
        await userEvent.click(deleteButton);

        // Verify component was deleted
        await waitFor(() => {
          expect(screen.queryByLabelText(`${componentType} component`)).not.toBeInTheDocument();
        }, { timeout: 2000 });
      });

      it(`should delete ${componentName} when hidden and delete icon is clicked`, async () => {
        const component = {
          id: 'comp1',
          type: componentType,
          pageId: 'page1',
          props: {
            x: 0,
            y: 0,
            width: 100,
            height: 40,
            hidden: true,
            ...defaultProps,
          },
        };

        const appDefinition = createAppDefinition([component]);
        mockedStorageService.getApp.mockResolvedValue(appDefinition);

        render(<Editor appId="app1" onBack={mockOnBack} />);
        await screen.findByText('Test App');

        // Select the hidden component (should still be selectable)
        const componentElement = await screen.findByLabelText(`${componentType} component`);
        await userEvent.click(componentElement);

        // Wait for delete button to appear
        const deleteButton = await screen.findByLabelText('Delete Component');
        await userEvent.click(deleteButton);

        // Verify component was deleted
        await waitFor(() => {
          expect(screen.queryByLabelText(`${componentType} component`)).not.toBeInTheDocument();
        }, { timeout: 2000 });
      });
    });
  };

  // Test delete functionality for ALL component types
  testDeleteForComponent(ComponentType.BUTTON, 'Button', { text: 'Click Me', actionType: 'none' });
  testDeleteForComponent(ComponentType.INPUT, 'Input', { placeholder: 'Enter text' });
  testDeleteForComponent(ComponentType.CHECKBOX, 'Checkbox', { label: 'Check me' });
  testDeleteForComponent(ComponentType.SELECT, 'Select', { placeholder: 'Select option', options: 'Option1,Option2' });
  testDeleteForComponent(ComponentType.TEXTAREA, 'Textarea', { placeholder: 'Enter text' });
  testDeleteForComponent(ComponentType.SWITCH, 'Switch', { label: 'Toggle me' });
  testDeleteForComponent(ComponentType.RADIO_GROUP, 'RadioGroup', { options: 'Option1,Option2' });
  testDeleteForComponent(ComponentType.LABEL, 'Label', { text: 'Label Text', fontSize: 14, fontWeight: 'normal', color: '#000000' });
  testDeleteForComponent(ComponentType.TABLE, 'Table', { columns: 'Name:name,Age:age' });
  testDeleteForComponent(ComponentType.IMAGE, 'Image', { src: 'https://example.com/image.jpg', alt: 'Test image' });
  testDeleteForComponent(ComponentType.DIVIDER, 'Divider', { color: '#d1d5db' });
});

