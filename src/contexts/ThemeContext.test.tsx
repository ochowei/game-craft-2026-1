import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { mockOnSnapshot, mockDoc, resetAllMocks, createMockUser, mockDocSnapshot } from '../test/firebase-mocks';

vi.mock('../lib/firebase', () => ({
  db: {},
  auth: {},
  onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
}));

function TestConsumer() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
    </div>
  );
}

describe('ThemeProvider', () => {
  let matchMediaListeners: Array<(e: { matches: boolean }) => void> = [];
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    resetAllMocks();
    matchMediaListeners = [];
    originalMatchMedia = window.matchMedia;
    document.documentElement.className = '';

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_event: string, listener: (e: { matches: boolean }) => void) => {
        matchMediaListeners.push(listener);
      },
      removeEventListener: (_event: string, listener: (e: { matches: boolean }) => void) => {
        matchMediaListeners = matchMediaListeners.filter(l => l !== listener);
      },
    })) as any;
  });

  afterEach(() => {
    cleanup();
    window.matchMedia = originalMatchMedia;
  });

  it('defaults to dark theme when no user is logged in', () => {
    render(
      <ThemeProvider user={null}>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.className).toBe('dark');
  });

  it('applies theme from Firestore when user is logged in', () => {
    mockOnSnapshot.mockImplementation((_ref: any, callback: any) => {
      callback(mockDocSnapshot(true, { theme: 'light' }));
      return vi.fn();
    });

    const user = createMockUser();
    render(
      <ThemeProvider user={user as any}>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('resolved').textContent).toBe('light');
    expect(document.documentElement.className).toBe('light');
  });

  it('resolves system theme to dark when OS prefers dark', () => {
    (window.matchMedia as any).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: (_event: string, listener: any) => { matchMediaListeners.push(listener); },
      removeEventListener: (_event: string, listener: any) => { matchMediaListeners = matchMediaListeners.filter(l => l !== listener); },
    }));

    mockOnSnapshot.mockImplementation((_ref: any, callback: any) => {
      callback(mockDocSnapshot(true, { theme: 'system' }));
      return vi.fn();
    });

    const user = createMockUser();
    render(
      <ThemeProvider user={user as any}>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.className).toBe('dark');
  });

  it('reacts to OS preference change when in system mode', () => {
    (window.matchMedia as any).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_event: string, listener: any) => { matchMediaListeners.push(listener); },
      removeEventListener: (_event: string, listener: any) => { matchMediaListeners = matchMediaListeners.filter(l => l !== listener); },
    }));

    mockOnSnapshot.mockImplementation((_ref: any, callback: any) => {
      callback(mockDocSnapshot(true, { theme: 'system' }));
      return vi.fn();
    });

    const user = createMockUser();
    render(
      <ThemeProvider user={user as any}>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('resolved').textContent).toBe('light');

    act(() => {
      matchMediaListeners.forEach(l => l({ matches: true }));
    });

    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.className).toBe('dark');
  });

  it('defaults to dark when Firestore doc does not exist', () => {
    mockOnSnapshot.mockImplementation((_ref: any, callback: any) => {
      callback(mockDocSnapshot(false));
      return vi.fn();
    });

    const user = createMockUser();
    render(
      <ThemeProvider user={user as any}>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.className).toBe('dark');
  });
});
