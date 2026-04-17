import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup, fireEvent, waitFor } from '@testing-library/react';
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
} from '../test/firebase-mocks';

// Mock firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: mockSignInWithPopup,
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
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  runTransaction: mockRunTransaction,
  writeBatch: mockWriteBatch,
  connectFirestoreEmulator: vi.fn(),
}));

// Mock motion/react to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
  },
}));

import { AuthProvider } from '../contexts/AuthContext';
import App from '../App';
import LoginScreen from './LoginScreen';

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

function renderLoginScreen() {
  return render(
    <AuthProvider>
      <LoginScreen />
    </AuthProvider>
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    resetAllMocks();
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    // Default: projectRefs collection empty (so ProjectProvider doesn't error on auth)
    mockGetDocs.mockResolvedValue({ docs: [], empty: true });
    // Skip auto-provisioning to keep the authenticated-user test focused on auth gate
    mockRunTransaction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  // Spec: Loading spinner during initial auth check
  it('shows a full-screen spinner while initial auth state is loading', () => {
    renderApp();
    // Auth state hasn't been emitted yet — should show spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    // Should not show login screen or editor
    expect(screen.queryByText('GameCraft Editor')).not.toBeInTheDocument();
  });

  // Spec: Auth gate blocks unauthenticated access — unauthenticated
  it('shows login screen when user is not authenticated', async () => {
    renderApp();

    await act(async () => {
      emitAuthState(null);
    });

    expect(screen.getByText('GameCraft Editor')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    // Editor screens should not be visible
    expect(screen.queryByText('Game Rules & Logic')).not.toBeInTheDocument();
  });

  // Spec: Auth gate blocks unauthenticated access — authenticated
  it('shows editor UI when user is authenticated', async () => {
    renderApp();

    await act(async () => {
      emitAuthState(createMockUser());
    });

    // Should not show login screen
    expect(screen.queryByText('Sign in with Google')).not.toBeInTheDocument();
    // Editor Layout should be visible (GameCraft Editor appears in the nav)
    expect(screen.getByText('GameCraft Editor')).toBeInTheDocument();
  });

  // Spec: Login screen displays application branding
  it('displays application branding', async () => {
    renderLoginScreen();

    await act(async () => {
      emitAuthState(null);
    });

    expect(screen.getByText('GameCraft Editor')).toBeInTheDocument();
    expect(screen.getByText(/Design, prototype, and playtest/)).toBeInTheDocument();
  });

  // Spec: Login screen provides Google Sign-In button
  it('displays Google Sign-In button that triggers sign-in', async () => {
    mockSignInWithPopup.mockResolvedValue({ user: createMockUser() });

    renderLoginScreen();
    await act(async () => {
      emitAuthState(null);
    });

    const button = screen.getByText('Sign in with Google').closest('button')!;
    expect(button).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockSignInWithPopup).toHaveBeenCalled();
  });

  // Spec: Login screen shows loading state during sign-in
  it('shows loading state and disables button during sign-in', async () => {
    let resolveSignIn: (value: any) => void;
    mockSignInWithPopup.mockImplementation(
      () => new Promise((resolve) => { resolveSignIn = resolve; })
    );

    renderLoginScreen();
    await act(async () => {
      emitAuthState(null);
    });

    const button = screen.getByText('Sign in with Google').closest('button')!;
    expect(button).not.toBeDisabled();

    // Click sign-in — it should enter loading state
    act(() => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(screen.getByText('Signing in...').closest('button')).toBeDisabled();
    });

    // Resolve sign-in
    await act(async () => {
      resolveSignIn!({ user: createMockUser() });
    });

    // Loading state should be removed
    await waitFor(() => {
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
    });
  });

  // Spec: Login screen shows error feedback — error
  it('shows error message when sign-in fails', async () => {
    mockSignInWithPopup.mockRejectedValue(new Error('Network error'));

    renderLoginScreen();
    await act(async () => {
      emitAuthState(null);
    });

    const button = screen.getByText('Sign in with Google').closest('button')!;

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  // Spec: Login screen shows error feedback — cancellation (no error shown)
  it('does not show error when user cancels sign-in popup', async () => {
    // signInWithGoogle catches popup-closed and returns null
    mockSignInWithPopup.mockRejectedValue({ code: 'auth/popup-closed-by-user' });

    renderLoginScreen();
    await act(async () => {
      emitAuthState(null);
    });

    const button = screen.getByText('Sign in with Google').closest('button')!;

    await act(async () => {
      fireEvent.click(button);
    });

    // Should not display any error
    await waitFor(() => {
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    });
  });
});
