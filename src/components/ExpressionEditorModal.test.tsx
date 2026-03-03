import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpressionEditorModal } from './ExpressionEditorModal';

// Mock the expression-editor helpers
jest.mock('./expression-editor/generateTypeDefs', () => ({
  generateTypeDefs: jest.fn(() => ''),
}));
jest.mock('./expression-editor/snippetSuggestions', () => ({
  getSnippetSuggestions: jest.fn(() => []),
}));

describe('ExpressionEditorModal', () => {
  const defaultProps = {
    isOpen: true,
    initialValue: '{{counter + 1}}',
    onClose: jest.fn(),
    onSave: jest.fn(),
    variables: [],
    components: [],
    pages: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the editor with the expression value instead of staying on Loading', () => {
    render(<ExpressionEditorModal {...defaultProps} />);

    // The editor mock renders a textarea with the value
    const editor = screen.getByTestId('monaco-editor-mock');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveValue('{{counter + 1}}');

    // "Loading..." should NOT be visible
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders the dialog title', () => {
    render(<ExpressionEditorModal {...defaultProps} />);
    expect(screen.getByText('Edit Expression')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ExpressionEditorModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('monaco-editor-mock')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit Expression')).not.toBeInTheDocument();
  });

  it('wraps a plain value in expression brackets', () => {
    render(<ExpressionEditorModal {...defaultProps} initialValue="hello" />);
    const editor = screen.getByTestId('monaco-editor-mock');
    expect(editor).toHaveValue('{{hello}}');
  });

  it('keeps already-wrapped expressions as-is', () => {
    render(<ExpressionEditorModal {...defaultProps} initialValue="{{myVar}}" />);
    const editor = screen.getByTestId('monaco-editor-mock');
    expect(editor).toHaveValue('{{myVar}}');
  });

  it('defaults to empty expression when initialValue is empty', () => {
    render(<ExpressionEditorModal {...defaultProps} initialValue="" />);
    const editor = screen.getByTestId('monaco-editor-mock');
    expect(editor).toHaveValue('{{}}');
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = jest.fn();
    render(<ExpressionEditorModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with the expression value when Save is clicked', () => {
    const onSave = jest.fn();
    render(<ExpressionEditorModal {...defaultProps} onSave={onSave} />);
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('{{counter + 1}}');
  });

  it('calls onClose when the X button is clicked', () => {
    const onClose = jest.fn();
    render(<ExpressionEditorModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows Quick Start Examples link', () => {
    render(<ExpressionEditorModal {...defaultProps} />);
    expect(screen.getByText('Show Quick Start Examples')).toBeInTheDocument();
  });
});
