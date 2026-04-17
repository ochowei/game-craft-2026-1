import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import {
  mockDoc,
  mockGetDoc,
  mockSetDoc,
  mockOnSnapshotImpl,
  mockDocSnapshot,
  emitSnapshot,
  resetAllMocks,
} from '../test/firebase-mocks';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  connectAuthEmulator: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(),
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  onSnapshot: mockOnSnapshotImpl,
  serverTimestamp: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  runTransaction: vi.fn(),
  writeBatch: vi.fn(),
  getDocFromServer: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
}));

import { RulesProvider, useRules } from './RulesContext';
import { SyncStatusProvider } from './SyncStatusContext';
import { DEFAULT_RULES } from '../domain/rules';

function Probe() {
  const { rules, dispatch } = useRules();
  return (
    <div>
      <span data-testid="salary">{rules.economy.salary}</span>
      <button
        data-testid="edit"
        onClick={() => dispatch({ type: 'UPDATE_FIELD', section: 'economy', field: 'salary', value: 999 })}
      >edit</button>
    </div>
  );
}

describe('RulesContext (Firestore)', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('seeds from DEFAULT_RULES when the doc is missing', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    render(
      <SyncStatusProvider>
        <RulesProvider activeProjectId="p_1"><Probe /></RulesProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByTestId('salary').textContent).toBe(String(DEFAULT_RULES.economy.salary));
  });

  it('writes to projects/{pid}/design/rules after debounce', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    render(
      <SyncStatusProvider>
        <RulesProvider activeProjectId="p_1"><Probe /></RulesProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    mockSetDoc.mockClear();

    await act(async () => { screen.getByTestId('edit').click(); });
    await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });

    expect(mockSetDoc).toHaveBeenCalled();
    const [ref] = mockSetDoc.mock.calls.at(-1)!;
    expect(ref._path).toBe('projects/p_1/design/rules');
  });

  it('applies remote snapshots to local state', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(true, DEFAULT_RULES));
    render(
      <SyncStatusProvider>
        <RulesProvider activeProjectId="p_1"><Probe /></RulesProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    act(() => {
      emitSnapshot('projects/p_1/design/rules', {
        ...DEFAULT_RULES,
        economy: { ...DEFAULT_RULES.economy, salary: 12345 },
      });
    });
    expect(screen.getByTestId('salary').textContent).toBe('12345');
  });
});
