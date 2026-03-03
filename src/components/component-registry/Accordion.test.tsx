import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccordionPlugin } from '@/components/component-registry/Accordion';
import { ComponentType, AccordionProps } from '@/types';
import '@testing-library/jest-dom';

const AccordionRenderer = AccordionPlugin.renderer;

describe('AccordionPlugin', () => {
  describe('Plugin metadata', () => {
    it('should have ACCORDION type', () => {
      expect(AccordionPlugin.type).toBe(ComponentType.ACCORDION);
    });

    it('should be a container', () => {
      expect(AccordionPlugin.isContainer).toBe(true);
    });

    it('should return null for properties', () => {
      expect(AccordionPlugin.properties()).toBeNull();
    });

    it('should have correct palette label', () => {
      expect(AccordionPlugin.paletteConfig.label).toBe('Accordion');
    });
  });

  describe('Renderer', () => {
    const mockOnUpdateDataStore = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    const baseComponent = {
      id: 'acc1',
      type: ComponentType.ACCORDION,
      props: {
        x: 0, y: 0, width: '100%', height: 'auto',
        sections: 'Section A,Section B,Section C',
        allowMultiple: false,
        defaultExpanded: '0',
        variant: 'default',
        iconPosition: 'right',
        backgroundColor: 'transparent',
        borderRadius: '0',
      } as AccordionProps,
    };

    it('should render section headers from comma-separated string', () => {
      render(
        <AccordionRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByText('Section A')).toBeInTheDocument();
      expect(screen.getByText('Section B')).toBeInTheDocument();
      expect(screen.getByText('Section C')).toBeInTheDocument();
    });

    it('should expand first section by default', () => {
      render(
        <AccordionRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      const firstButton = screen.getByText('Section A').closest('button')!;
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');

      const secondButton = screen.getByText('Section B').closest('button')!;
      expect(secondButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should toggle section on click', () => {
      render(
        <AccordionRenderer
          component={baseComponent}
          mode="preview"
          evaluationScope={{}}
          onUpdateDataStore={mockOnUpdateDataStore}
        />
      );
      // Click section B to expand it (single mode: section A should collapse)
      const sectionBButton = screen.getByText('Section B').closest('button')!;
      fireEvent.click(sectionBButton);

      expect(mockOnUpdateDataStore).toHaveBeenCalledWith('acc1_expanded', [1]);
    });

    it('should collapse an expanded section on click', () => {
      render(
        <AccordionRenderer
          component={baseComponent}
          mode="preview"
          evaluationScope={{}}
          dataStore={{ acc1_expanded: [1] }}
          onUpdateDataStore={mockOnUpdateDataStore}
        />
      );
      // Click section B again to collapse
      const sectionBButton = screen.getByText('Section B').closest('button')!;
      fireEvent.click(sectionBButton);

      expect(mockOnUpdateDataStore).toHaveBeenCalledWith('acc1_expanded', []);
    });

    it('should allow multiple sections open when allowMultiple is true', () => {
      const multiComponent = {
        ...baseComponent,
        props: { ...baseComponent.props, allowMultiple: true },
      };
      render(
        <AccordionRenderer
          component={multiComponent}
          mode="preview"
          evaluationScope={{}}
          dataStore={{ acc1_expanded: [0] }}
          onUpdateDataStore={mockOnUpdateDataStore}
        />
      );
      // Click section B — should add to set, not clear existing
      const sectionBButton = screen.getByText('Section B').closest('button')!;
      fireEvent.click(sectionBButton);

      expect(mockOnUpdateDataStore).toHaveBeenCalledWith('acc1_expanded', expect.arrayContaining([0, 1]));
    });

    it('should show all sections expanded in edit mode', () => {
      render(
        <AccordionRenderer component={baseComponent} mode="edit" evaluationScope={{}} />
      );
      // All buttons should have aria-expanded=true in edit mode
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should show placeholder text for empty sections in edit mode', () => {
      render(
        <AccordionRenderer component={baseComponent} mode="edit" evaluationScope={{}} />
      );
      expect(screen.getByText(/Drop components here for.*Section A/)).toBeInTheDocument();
    });

    it('should render region panels with correct ARIA attributes', () => {
      render(
        <AccordionRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      const panel = screen.getByRole('region');
      expect(panel).toHaveAttribute('aria-labelledby', 'header-acc1-0');
      expect(panel).toHaveAttribute('id', 'panel-acc1-0');
    });

    it('should navigate with ArrowDown key', () => {
      render(
        <AccordionRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      const firstButton = screen.getByText('Section A').closest('button')!;
      firstButton.focus();
      fireEvent.keyDown(firstButton, { key: 'ArrowDown' });

      const secondButton = screen.getByText('Section B').closest('button')!;
      expect(document.activeElement).toBe(secondButton);
    });

    it('should navigate with ArrowUp key', () => {
      render(
        <AccordionRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      const secondButton = screen.getByText('Section B').closest('button')!;
      secondButton.focus();
      fireEvent.keyDown(secondButton, { key: 'ArrowUp' });

      const firstButton = screen.getByText('Section A').closest('button')!;
      expect(document.activeElement).toBe(firstButton);
    });

    it('should navigate to first with Home key', () => {
      render(
        <AccordionRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      const thirdButton = screen.getByText('Section C').closest('button')!;
      thirdButton.focus();
      fireEvent.keyDown(thirdButton, { key: 'Home' });

      const firstButton = screen.getByText('Section A').closest('button')!;
      expect(document.activeElement).toBe(firstButton);
    });

    it('should navigate to last with End key', () => {
      render(
        <AccordionRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      const firstButton = screen.getByText('Section A').closest('button')!;
      firstButton.focus();
      fireEvent.keyDown(firstButton, { key: 'End' });

      const thirdButton = screen.getByText('Section C').closest('button')!;
      expect(document.activeElement).toBe(thirdButton);
    });

    it('should wrap around with ArrowDown from last section', () => {
      render(
        <AccordionRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      const thirdButton = screen.getByText('Section C').closest('button')!;
      thirdButton.focus();
      fireEvent.keyDown(thirdButton, { key: 'ArrowDown' });

      const firstButton = screen.getByText('Section A').closest('button')!;
      expect(document.activeElement).toBe(firstButton);
    });

    it('should render children in matching slot sections', () => {
      const childComp = { id: 'child1', slot: 1 };
      const childElement = <div key="c1" component={childComp as any}>Child in Section B</div>;

      render(
        <AccordionRenderer
          component={baseComponent}
          mode="edit"
          evaluationScope={{}}
        >
          {childElement}
        </AccordionRenderer>
      );
      expect(screen.getByText('Child in Section B')).toBeInTheDocument();
    });

    it('should use defaultExpanded prop to determine initially expanded sections', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, defaultExpanded: '1,2' },
      };
      render(
        <AccordionRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      const secondButton = screen.getByText('Section B').closest('button')!;
      expect(secondButton).toHaveAttribute('aria-expanded', 'true');

      const thirdButton = screen.getByText('Section C').closest('button')!;
      expect(thirdButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should apply bordered variant styles', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, variant: 'bordered' },
      };
      const { container } = render(
        <AccordionRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply separated variant with gap', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, variant: 'separated' },
      };
      const { container } = render(
        <AccordionRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.gap).toBe('8px');
    });

    it('should render chevron on left when iconPosition is left', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, iconPosition: 'left' },
      };
      render(
        <AccordionRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      // Chevron SVGs should exist
      const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should execute onChange handler in preview mode', () => {
      const mockOnUpdateDS = jest.fn();
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
        props: { ...baseComponent.props, onChange: '{{actions.updateVariable("expanded", expandedSections)}}' },
      };
      render(
        <AccordionRenderer
          component={comp}
          mode="preview"
          evaluationScope={{}}
          actions={mockActions}
          onUpdateDataStore={mockOnUpdateDS}
        />
      );
      const sectionBButton = screen.getByText('Section B').closest('button')!;
      fireEvent.click(sectionBButton);

      expect(mockActions.updateVariable).toHaveBeenCalled();
    });

    it('should use fallback sections when sections prop is empty', () => {
      const comp = {
        ...baseComponent,
        props: { ...baseComponent.props, sections: undefined },
      };
      render(
        <AccordionRenderer component={comp} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
    });

    it('should render data-testid on wrapper', () => {
      render(
        <AccordionRenderer component={baseComponent} mode="preview" evaluationScope={{}} />
      );
      expect(screen.getByTestId('accordion-acc1')).toBeInTheDocument();
    });
  });
});
