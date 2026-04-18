import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import {
  mockDoc,
  mockGetDoc,
  mockSetDoc,
  mockOnSnapshotImpl,
  mockDocSnapshot,
  resetAllMocks,
} from '../test/firebase-mocks';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn().mockResolvedValue(undefined),
  getRedirectResult: vi.fn().mockResolvedValue(null),
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
  collectionGroup: vi.fn(),
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

import { CardsProvider, useCards } from './CardsContext';
import { SyncStatusProvider } from './SyncStatusContext';
import { DEFAULT_CARDS } from '../domain/cards';

function Probe() {
  const { cards, selectedCardId, dispatch } = useCards();
  return (
    <div>
      <span data-testid="count">{cards.length}</span>
      <span data-testid="selected">{selectedCardId ?? 'none'}</span>
      <button data-testid="add" onClick={() => dispatch({ type: 'ADD_CARD' })}>add</button>
      <button data-testid="select" onClick={() => cards[0] && dispatch({ type: 'SELECT_CARD', cardId: cards[0].id })}>sel</button>
    </div>
  );
}

describe('CardsContext (Firestore)', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('persists only the cards array (not UI fields)', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    render(
      <SyncStatusProvider>
        <CardsProvider activeProjectId="p_1"><Probe /></CardsProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    mockSetDoc.mockClear();

    await act(async () => { screen.getByTestId('add').click(); });
    await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });

    expect(mockSetDoc).toHaveBeenCalled();
    const [ref, payload] = mockSetDoc.mock.calls.at(-1)!;
    expect(ref._path).toBe('projects/p_1/design/cards');
    expect(Array.isArray(payload.cards)).toBe(true);
    expect(payload.selectedCardId).toBeUndefined();
    expect(payload.activeDeckType).toBeUndefined();
  });

  it('SELECT_CARD does not trigger a Firestore write', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(true, { cards: DEFAULT_CARDS }));
    render(
      <SyncStatusProvider>
        <CardsProvider activeProjectId="p_1"><Probe /></CardsProvider>
      </SyncStatusProvider>,
    );
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    mockSetDoc.mockClear();

    await act(async () => { screen.getByTestId('select').click(); });
    await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
