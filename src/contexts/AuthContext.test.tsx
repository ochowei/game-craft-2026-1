import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook, cleanup } from '@testing-library/react';
import React from 'react';
import {
  mockOnAuthStateChanged,
  mockSignInWithPopup,
  mockSignOut,
  mockSetDoc,
  mockGetDoc,
  mockDoc,
  mockServerTimestamp,
  mockGetDocFromServer,
  mockDocSnapshot,
  emitAuthState,
  createMockUser,
  resetAllMocks,
  mockCollection,
  mockQuery,
  mockWhere,
  mockGetDocs,
  mockUpdateDoc,
  mockDeleteDoc,
  mockRunTransaction,
  mockWriteBatch,
  mockInitializeFirestore,
  mockPersistentLocalCache,
  mockOnSnapshotImpl,
  mockCollectionGroup,
} from '../test/firebase-mocks';

// Mock firebase modules before importing AuthContext
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: mockSignInWithPopup,
  signInWithRedirect: mockSignInWithPopup,
  getRedirectResult: vi.fn().mockResolvedValue(null),
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: mockInitializeFirestore,
  persistentLocalCache: mockPersistentLocalCache,
  getFirestore: vi.fn(() => ({})),
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  onSnapshot: mockOnSnapshotImpl,
  getDocFromServer: mockGetDocFromServer,
  serverTimestamp: mockServerTimestamp,
  collection: mockCollection,
  collectionGroup: mockCollectionGroup,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  runTransaction: mockRunTransaction,
  writeBatch: mockWriteBatch,
  connectFirestoreEmulator: vi.fn(),
}));

import { AuthProvider, useAuth } from './AuthContext';

function TestConsumer() {
  const { user, loading, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.displayName : 'null'}</span>
      <button data-testid="sign-in" onClick={() => signIn()}>Sign In</button>
      <button data-testid="sign-out" onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    resetAllMocks();
    // Default: getDoc returns non-existent doc for provisioning
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
  });

  afterEach(() => {
    cleanup();
  });

  // Spec: AuthProvider wraps the application
  it('provides auth context to child components', () => {
    renderWithAuth();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByTestId('user')).toBeInTheDocument();
  });

  // Spec: Auth context exposes current user — authenticated
  it('exposes authenticated user after auth state emits a user', async () => {
    renderWithAuth();
    const mockUser = createMockUser();

    await act(async () => {
      emitAuthState(mockUser);
    });

    expect(screen.getByTestId('user').textContent).toBe('Test User');
  });

  // Spec: Auth context exposes current user — not authenticated
  it('exposes null user when not authenticated', async () => {
    renderWithAuth();

    await act(async () => {
      emitAuthState(null);
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  // Spec: Auth context exposes loading state — initial
  it('starts with loading true before auth state is resolved', () => {
    renderWithAuth();
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  // Spec: Auth context exposes loading state — resolved
  it('sets loading to false after auth state is resolved', async () => {
    renderWithAuth();

    await act(async () => {
      emitAuthState(null);
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  // Spec: Auth context exposes sign-in action — redirect starts successfully
  // With signInWithRedirect, signIn() resolves with null; the user object arrives
  // on the next page load via onAuthStateChanged (simulated here by emitAuthState).
  it('updates user after successful sign-in', async () => {
    const mockUser = createMockUser();
    mockSignInWithPopup.mockResolvedValue(undefined);

    renderWithAuth();
    await act(async () => {
      emitAuthState(null);
    });

    await act(async () => {
      screen.getByTestId('sign-in').click();
    });

    // Simulate the post-redirect auth state broadcast.
    await act(async () => {
      emitAuthState(mockUser);
    });

    expect(screen.getByTestId('user').textContent).toBe('Test User');
  });

  // Spec: Auth context exposes sign-in action — error
  it('throws error when sign-in fails', async () => {
    const networkError = new Error('Network error');
    mockSignInWithPopup.mockRejectedValue(networkError);

    renderWithAuth();
    await act(async () => {
      emitAuthState(null);
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      ),
    });

    await act(async () => {
      emitAuthState(null);
    });

    await expect(result.current.signIn()).rejects.toThrow('Network error');
  });

  // Spec: Auth context exposes sign-out action
  it('clears user after sign-out', async () => {
    const mockUser = createMockUser();
    renderWithAuth();

    await act(async () => {
      emitAuthState(mockUser);
    });
    expect(screen.getByTestId('user').textContent).toBe('Test User');

    await act(async () => {
      screen.getByTestId('sign-out').click();
    });

    // After signOut, onAuthStateChanged fires with null
    await act(async () => {
      emitAuthState(null);
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  // Spec: Auth context subscribes to auth state changes
  it('reactively updates when auth state changes externally', async () => {
    renderWithAuth();

    const user1 = createMockUser({ displayName: 'User One' });
    await act(async () => {
      emitAuthState(user1);
    });
    expect(screen.getByTestId('user').textContent).toBe('User One');

    // Simulate external state change (e.g., session expiry)
    await act(async () => {
      emitAuthState(null);
    });
    expect(screen.getByTestId('user').textContent).toBe('null');

    // And back again
    const user2 = createMockUser({ displayName: 'User Two' });
    await act(async () => {
      emitAuthState(user2);
    });
    expect(screen.getByTestId('user').textContent).toBe('User Two');
  });
});
