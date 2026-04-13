import { vi } from 'vitest';

// --- Auth mocks ---

type AuthStateCallback = (user: any) => void;
let authStateCallback: AuthStateCallback | null = null;

export const mockOnAuthStateChanged = vi.fn((_auth: any, callback: AuthStateCallback) => {
  authStateCallback = callback;
  return vi.fn(); // unsubscribe
});

export function emitAuthState(user: any) {
  if (authStateCallback) {
    authStateCallback(user);
  }
}

export const mockSignInWithPopup = vi.fn();
export const mockSignOut = vi.fn().mockResolvedValue(undefined);

// --- Firestore mocks ---

export const mockSetDoc = vi.fn().mockResolvedValue(undefined);
export const mockGetDoc = vi.fn();
export const mockDoc = vi.fn((...args: any[]) => ({ _path: args.slice(1).join('/') }));
export const mockServerTimestamp = vi.fn(() => ({ _type: 'serverTimestamp' }));
export const mockGetDocFromServer = vi.fn().mockResolvedValue(undefined);
export const mockOnSnapshot = vi.fn();

export function mockDocSnapshot(exists: boolean, data?: Record<string, any>) {
  return {
    exists: () => exists,
    data: () => data ?? null,
  };
}

// --- Mock user factory ---

export function createMockUser(overrides?: Partial<{ uid: string; displayName: string; email: string; photoURL: string }>) {
  return {
    uid: 'test-uid-123',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
    ...overrides,
  };
}

// --- Reset helper ---

export function resetAllMocks() {
  authStateCallback = null;
  mockOnAuthStateChanged.mockClear();
  mockSignInWithPopup.mockClear();
  mockSignOut.mockClear().mockResolvedValue(undefined);
  mockSetDoc.mockClear().mockResolvedValue(undefined);
  mockGetDoc.mockClear();
  mockDoc.mockClear().mockImplementation((...args: any[]) => ({ _path: args.slice(1).join('/') }));
  mockServerTimestamp.mockClear().mockReturnValue({ _type: 'serverTimestamp' });
  mockGetDocFromServer.mockClear().mockResolvedValue(undefined);
  mockOnSnapshot.mockClear();
}
