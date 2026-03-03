import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageSettingsPanel } from '../PageSettingsPanel';
import { AppPage } from '../../types';

const mockOnUpdatePage = jest.fn();

const basePage: AppPage = {
  id: 'page_1',
  name: 'Home',
};

const pageWithMetadata: AppPage = {
  id: 'page_1',
  name: 'Home',
  metadata: {
    title: 'My App - Home',
    description: 'Welcome to my app',
    ogImage: 'https://example.com/og.png',
    favicon: 'https://example.com/favicon.ico',
  },
};

beforeEach(() => {
  mockOnUpdatePage.mockClear();
});

describe('PageSettingsPanel', () => {
  test('renders page name field with current value', () => {
    render(<PageSettingsPanel page={basePage} onUpdatePage={mockOnUpdatePage} isMainPage={true} />);
    const nameInput = screen.getByLabelText('Page Name');
    expect(nameInput).toHaveValue('Home');
  });

  test('renders SEO metadata section header', () => {
    render(<PageSettingsPanel page={basePage} onUpdatePage={mockOnUpdatePage} isMainPage={false} />);
    expect(screen.getByText('SEO & Metadata')).toBeInTheDocument();
  });

  test('renders all metadata fields', () => {
    render(<PageSettingsPanel page={basePage} onUpdatePage={mockOnUpdatePage} isMainPage={false} />);
    expect(screen.getByLabelText('Page Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Meta Description')).toBeInTheDocument();
    expect(screen.getByLabelText('OG Image URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Favicon URL')).toBeInTheDocument();
  });

  test('populates metadata fields when page has metadata', () => {
    render(<PageSettingsPanel page={pageWithMetadata} onUpdatePage={mockOnUpdatePage} isMainPage={false} />);
    expect(screen.getByLabelText('Page Title')).toHaveValue('My App - Home');
    expect(screen.getByLabelText('Meta Description')).toHaveValue('Welcome to my app');
    expect(screen.getByLabelText('OG Image URL')).toHaveValue('https://example.com/og.png');
    expect(screen.getByLabelText('Favicon URL')).toHaveValue('https://example.com/favicon.ico');
  });

  test('calls onUpdatePage when page name changes', async () => {
    const user = userEvent.setup();
    render(<PageSettingsPanel page={basePage} onUpdatePage={mockOnUpdatePage} isMainPage={false} />);
    const nameInput = screen.getByLabelText('Page Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Dashboard');
    fireEvent.blur(nameInput);
    expect(mockOnUpdatePage).toHaveBeenCalledWith('page_1', { name: 'Dashboard' });
  });

  test('calls onUpdatePage with metadata when title changes', async () => {
    const user = userEvent.setup();
    render(<PageSettingsPanel page={basePage} onUpdatePage={mockOnUpdatePage} isMainPage={false} />);
    const titleInput = screen.getByLabelText('Page Title');
    await user.type(titleInput, 'New Title');
    fireEvent.blur(titleInput);
    expect(mockOnUpdatePage).toHaveBeenCalledWith('page_1', {
      metadata: { title: 'New Title' },
    });
  });

  test('shows main page badge when isMainPage is true', () => {
    render(<PageSettingsPanel page={basePage} onUpdatePage={mockOnUpdatePage} isMainPage={true} />);
    expect(screen.getByText('Main Page')).toBeInTheDocument();
  });

  test('shows page ID', () => {
    render(<PageSettingsPanel page={basePage} onUpdatePage={mockOnUpdatePage} isMainPage={false} />);
    expect(screen.getByText('page_1')).toBeInTheDocument();
  });
});
