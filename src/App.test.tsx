import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { storageService } from '@/storageService';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

// Mock child components
jest.mock('Dashboard', () => ({
  Dashboard: ({ onEditApp, onCreateApp }: any) => (
    <div>
      <h1>Dashboard</h1>
      {/* FIX: Pass a full AppMetadata object to satisfy the prop type. */}
      <button onClick={() => onCreateApp({ id: 'app_new', name: 'New App', createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString() })}>Create App</button>
      <button onClick={() => onEditApp({ id: 'app_123', name: 'Existing App', createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString() })}>Edit App</button>
    </div>
  ),
}));

jest.mock('Editor', () => ({
  Editor: ({ appId, onBack }: { appId: string, onBack: () => void }) => (
    <div>
      <h1>Editor for {appId}</h1>
      <button onClick={onBack}>Back to Dashboard</button>
    </div>
  ),
}));

jest.mock('@/storageService');

describe('App', () => {
  beforeEach(() => {
    (storageService.getApp as jest.Mock).mockResolvedValue({ id: 'app_123', name: 'Test App' });
  });

  it('should render the Dashboard by default', () => {
    render(<App />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should switch to the Editor view when an app is created', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Create App'));
    expect(screen.getByText('Editor for app_new')).toBeInTheDocument();
  });

  it('should switch to the Editor view when an app is edited', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Edit App'));
    expect(screen.getByText('Editor for app_123')).toBeInTheDocument();
  });

  it('should switch back to the Dashboard from the Editor', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Edit App')); // Go to editor
    expect(screen.getByText('Editor for app_123')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back to Dashboard')); // Go back
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/Editor for/)).not.toBeInTheDocument();
  });
});