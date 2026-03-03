import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalPlugin } from '@/components/component-registry/Modal';
import { ComponentType, ModalProps } from '@/types';
import '@testing-library/jest-dom';

const ModalRenderer = ModalPlugin.renderer;

describe('ModalPlugin', () => {
  describe('Plugin metadata', () => {
    it('should have MODAL type', () => {
      expect(ModalPlugin.type).toBe(ComponentType.MODAL);
    });

    it('should be a container', () => {
      expect(ModalPlugin.isContainer).toBe(true);
    });

    it('should return null for properties', () => {
      expect(ModalPlugin.properties()).toBeNull();
    });

    it('should have correct palette label', () => {
      expect(ModalPlugin.paletteConfig.label).toBe('Modal');
    });
  });

  describe('Renderer — edit mode', () => {
    const baseComponent = {
      id: 'modal1',
      type: ComponentType.MODAL,
      props: {
        x: 0, y: 0, width: '100%', height: 'auto',
        isOpen: '{{false}}',
        title: 'Test Modal',
        size: 'md',
        showCloseButton: true,
        closeOnBackdrop: true,
        closeOnEsc: true,
        onClose: '',
        backdrop: 'dark',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '24px',
      } as ModalProps,
    };

    it('should render inline frame in edit mode', () => {
      render(
        <ModalRenderer component={baseComponent} mode="edit" evaluationScope={{}} />
      );
      expect(screen.getByTestId('modal-edit-modal1')).toBeInTheDocument();
    });

    it('should display title in edit mode', () => {
      render(
        <ModalRenderer component={baseComponent} mode="edit" evaluationScope={{}} />
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should show close icon in edit mode when showCloseButton is true', () => {
      render(
        <ModalRenderer component={baseComponent} mode="edit" evaluationScope={{}} />
      );
      // The close icon renders as the multiplication sign entity
      expect(screen.getByText('\u00D7')).toBeInTheDocument();
    });

    it('should not show close icon when showCloseButton is false', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, showCloseButton: false },
      };
      const { container } = render(
        <ModalRenderer component={comp} mode="edit" evaluationScope={{}} />
      );
      // Header still shows but no close icon
      const closeIcons = container.querySelectorAll('[aria-hidden="true"]');
      // Close icon uses aria-hidden
      expect(screen.queryByText('\u00D7')).not.toBeInTheDocument();
    });

    it('should render children in edit mode', () => {
      render(
        <ModalRenderer component={baseComponent} mode="edit" evaluationScope={{}}>
          <div>Modal Body Content</div>
        </ModalRenderer>
      );
      expect(screen.getByText('Modal Body Content')).toBeInTheDocument();
    });

    it('should display fallback title when title prop is empty', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, title: '' },
      };
      render(
        <ModalRenderer component={comp} mode="edit" evaluationScope={{}} />
      );
      expect(screen.getByText('Modal')).toBeInTheDocument();
    });
  });

  describe('Renderer — preview mode', () => {
    const baseComponent = {
      id: 'modal2',
      type: ComponentType.MODAL,
      props: {
        x: 0, y: 0, width: '100%', height: 'auto',
        isOpen: '{{true}}',
        title: 'Preview Modal',
        size: 'md',
        showCloseButton: true,
        closeOnBackdrop: true,
        closeOnEsc: true,
        onClose: '',
        backdrop: 'dark',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '24px',
      } as ModalProps,
    };

    afterEach(() => {
      document.body.style.overflow = '';
    });

    it('should render nothing when isOpen is false', () => {
      const closedComp = {
        ...baseComponent,
        props: { ...baseComponent.props, isOpen: '{{false}}' },
      };
      const { container } = render(
        <ModalRenderer component={closedComp} mode="preview" evaluationScope={{}} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render portal dialog when isOpen is true', () => {
      render(
        <ModalRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display title in preview dialog', () => {
      render(
        <ModalRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByText('Preview Modal')).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      render(
        <ModalRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should show close button in preview mode', () => {
      render(
        <ModalRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const mockActions = {
        createRecord: jest.fn(),
        updateRecord: jest.fn(),
        deleteRecord: jest.fn(),
        selectRecord: jest.fn(),
        updateVariable: jest.fn(),
        submitForm: jest.fn(),
        navigateTo: jest.fn(),
      };
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, onClose: '{{actions.updateVariable("modalOpen", false)}}' },
      };
      render(
        <ModalRenderer component={comp} mode="preview" evaluationScope={{}} actions={mockActions} />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(mockActions.updateVariable).toHaveBeenCalledWith('modalOpen', false);
    });

    it('should close on backdrop click when closeOnBackdrop is true', () => {
      const mockActions = {
        createRecord: jest.fn(),
        updateRecord: jest.fn(),
        deleteRecord: jest.fn(),
        selectRecord: jest.fn(),
        updateVariable: jest.fn(),
        submitForm: jest.fn(),
        navigateTo: jest.fn(),
      };
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, onClose: '{{actions.updateVariable("closed", true)}}' },
      };
      render(
        <ModalRenderer component={comp} mode="preview" evaluationScope={{}} actions={mockActions} />
      );
      fireEvent.click(screen.getByTestId('modal-backdrop-modal2'));
      expect(mockActions.updateVariable).toHaveBeenCalledWith('closed', true);
    });

    it('should not close on backdrop click when closeOnBackdrop is false', () => {
      const mockActions = {
        createRecord: jest.fn(),
        updateRecord: jest.fn(),
        deleteRecord: jest.fn(),
        selectRecord: jest.fn(),
        updateVariable: jest.fn(),
        submitForm: jest.fn(),
        navigateTo: jest.fn(),
      };
      const comp = {
        ...baseComponent,
        props: {
          ...baseComponent.props,
          closeOnBackdrop: false,
          onClose: '{{actions.updateVariable("closed", true)}}',
        },
      };
      render(
        <ModalRenderer component={comp} mode="preview" evaluationScope={{}} actions={mockActions} />
      );
      fireEvent.click(screen.getByTestId('modal-backdrop-modal2'));
      expect(mockActions.updateVariable).not.toHaveBeenCalled();
    });

    it('should close on Escape key when closeOnEsc is true', () => {
      const mockActions = {
        createRecord: jest.fn(),
        updateRecord: jest.fn(),
        deleteRecord: jest.fn(),
        selectRecord: jest.fn(),
        updateVariable: jest.fn(),
        submitForm: jest.fn(),
        navigateTo: jest.fn(),
      };
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, onClose: '{{actions.updateVariable("escaped", true)}}' },
      };
      render(
        <ModalRenderer component={comp} mode="preview" evaluationScope={{}} actions={mockActions} />
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockActions.updateVariable).toHaveBeenCalledWith('escaped', true);
    });

    it('should not close on Escape when closeOnEsc is false', () => {
      const mockActions = {
        createRecord: jest.fn(),
        updateRecord: jest.fn(),
        deleteRecord: jest.fn(),
        selectRecord: jest.fn(),
        updateVariable: jest.fn(),
        submitForm: jest.fn(),
        navigateTo: jest.fn(),
      };
      const comp = {
        ...baseComponent,
        props: {
          ...baseComponent.props,
          closeOnEsc: false,
          onClose: '{{actions.updateVariable("escaped", true)}}',
        },
      };
      render(
        <ModalRenderer component={comp} mode="preview" evaluationScope={{}} actions={mockActions} />
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockActions.updateVariable).not.toHaveBeenCalled();
    });

    it('should render children in preview dialog', () => {
      render(
        <ModalRenderer component={baseComponent} mode="preview" evaluationScope={{}}>
          <div>Dialog Content</div>
        </ModalRenderer>
      );
      expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    });

    it('should apply light backdrop style', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, backdrop: 'light' },
      };
      render(
        <ModalRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      const backdrop = screen.getByTestId('modal-backdrop-modal2');
      expect(backdrop.style.backgroundColor).toContain('rgba');
      expect(backdrop.style.backgroundColor).toContain('0.15');
    });

    it('should apply transparent backdrop style', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, backdrop: 'transparent' },
      };
      render(
        <ModalRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      const backdrop = screen.getByTestId('modal-backdrop-modal2');
      expect(backdrop.style.backgroundColor).toBe('transparent');
    });

    it('should not call onClose in edit mode even if handler is set', () => {
      const mockActions = {
        createRecord: jest.fn(),
        updateRecord: jest.fn(),
        deleteRecord: jest.fn(),
        selectRecord: jest.fn(),
        updateVariable: jest.fn(),
        submitForm: jest.fn(),
        navigateTo: jest.fn(),
      };
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, onClose: '{{actions.updateVariable("x", true)}}' },
      };
      render(
        <ModalRenderer component={comp} mode="edit" evaluationScope={{}} actions={mockActions} />
      );
      // Edit mode renders inline frame, no close button with aria-label
      // The close icon is just decorative in edit mode
      expect(mockActions.updateVariable).not.toHaveBeenCalled();
    });

    it('should lock body scroll when open in preview mode', () => {
      render(
        <ModalRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      expect(document.body.style.overflow).toBe('hidden');
    });
  });
});
