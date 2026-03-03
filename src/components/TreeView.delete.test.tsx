import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TreeView } from '@/components/TreeView';
import { RenderedComponent } from '@/components/RenderedComponent';
import { ComponentType, AppDefinition } from 'types';
import '@testing-library/jest-dom';

// Helper component to test TreeView selection + delete button interaction
const TreeViewDeleteTestWrapper: React.FC<{
  appDefinition: AppDefinition;
  onDelete: (id: string) => void;
}> = ({ appDefinition, onDelete }) => {
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [components, setComponents] = useState(appDefinition.components);
  const currentPageId = appDefinition.pages[0]?.id || 'page1';

  const handleSelectComponent = (componentId: string, pageId: string) => {
    setSelectedComponentIds([componentId]);
  };

  const handleDelete = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setSelectedComponentIds(prev => prev.filter(selectedId => selectedId !== id));
    onDelete(id);
  };

  const handleSelect = (id: string, e: React.MouseEvent) => {
    setSelectedComponentIds([id]);
  };

  const pageComponents = components.filter(c => c.pageId === currentPageId);
  const rootComponents = pageComponents.filter(c => !c.parentId);

  return (
    <div>
      <TreeView
        isCollapsed={false}
        onToggleCollapse={jest.fn()}
        appDefinition={{ ...appDefinition, components }}
        currentPageId={currentPageId}
        selectedComponentIds={selectedComponentIds}
        onSelectPage={jest.fn()}
        onSelectComponent={handleSelectComponent}
      />
      <div data-testid="canvas">
        {rootComponents.map(comp => (
          <RenderedComponent
            key={comp.id}
            component={comp}
            allComponents={components}
            selectedComponentIds={selectedComponentIds}
            onSelect={handleSelect}
            onUpdate={jest.fn()}
            onUpdateComponents={jest.fn()}
            onDelete={handleDelete}
            onDrop={jest.fn()}
            onReparentCheck={jest.fn()}
            mode="edit"
            dataStore={{}}
            evaluationScope={{}}
          />
        ))}
      </div>
    </div>
  );
};

describe('TreeView Selection + Delete Button Functionality', () => {
  const mockOnDelete = jest.fn();

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
    components,
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
  });

  const testDeleteViaTreeView = (componentType: ComponentType, componentName: string, defaultProps: any = {}) => {
    describe(`${componentName} Component Delete via TreeView`, () => {
      it(`should delete ${componentName} when selected in TreeView and delete button clicked`, async () => {
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
        
        render(<TreeViewDeleteTestWrapper appDefinition={appDefinition} onDelete={mockOnDelete} />);

        // Select component in TreeView
        const componentNode = screen.getByText(componentName);
        await userEvent.click(componentNode);

        // Wait for component to be selected and delete button to appear
        await waitFor(() => {
          const deleteButton = screen.getByLabelText('Delete Component');
          expect(deleteButton).toBeInTheDocument();
        });

        // Click delete button
        const deleteButton = screen.getByLabelText('Delete Component');
        await userEvent.click(deleteButton);

        // Verify component was deleted
        await waitFor(() => {
          expect(mockOnDelete).toHaveBeenCalledWith('comp1');
          expect(screen.queryByLabelText(`${componentType} component`)).not.toBeInTheDocument();
        });
      });
    });
  };

  // Test delete via TreeView for all component types
  testDeleteViaTreeView(ComponentType.BUTTON, 'Button', { text: 'Click Me', actionType: 'none' });
  testDeleteViaTreeView(ComponentType.INPUT, 'Input', { placeholder: 'Enter text' });
  testDeleteViaTreeView(ComponentType.CHECKBOX, 'Checkbox', { label: 'Check me' });
  testDeleteViaTreeView(ComponentType.SELECT, 'Select', { placeholder: 'Select option', options: 'Option1,Option2' });
  testDeleteViaTreeView(ComponentType.TEXTAREA, 'Textarea', { placeholder: 'Enter text' });
  testDeleteViaTreeView(ComponentType.SWITCH, 'Switch', { label: 'Toggle me' });
  testDeleteViaTreeView(ComponentType.RADIO_GROUP, 'Radio Group', { options: 'Option1,Option2' });
  testDeleteViaTreeView(ComponentType.LABEL, 'Label', { text: 'Label Text', fontSize: 14, fontWeight: 'normal', color: '#000000' });
  testDeleteViaTreeView(ComponentType.TABLE, 'Table', { columns: 'Name:name,Age:age' });
  testDeleteViaTreeView(ComponentType.IMAGE, 'Image', { src: 'https://example.com/image.jpg', alt: 'Test image' });
  testDeleteViaTreeView(ComponentType.DIVIDER, 'Divider', { color: '#d1d5db' });
});

