import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockSignInWithPopup,
  mockSignOut,
  mockOnAuthStateChanged,
  mockSetDoc,
  mockGetDoc,
  mockDoc,
  mockServerTimestamp,
  mockGetDocFromServer,
  mockDocSnapshot,
  createMockUser,
  resetAllMocks,
} from '../test/firebase-mocks';

// Mock firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  onSnapshot: vi.fn(),
  getDocFromServer: (...args: any[]) => mockGetDocFromServer(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

import { provisionUserProfile } from './firebase';

describe('provisionUserProfile', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // Spec: User profile created on first sign-in
  it('creates a new profile document on first sign-in', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    const user = createMockUser() as any;

    await provisionUserProfile(user);

    expect(mockSetDoc).toHaveBeenCalledOnce();
    const [_ref, data] = mockSetDoc.mock.calls[0];
    expect(data).toEqual({
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
      createdAt: { _type: 'serverTimestamp' },
      lastLoginAt: { _type: 'serverTimestamp' },
    });
    // First-time creation should NOT use merge
    expect(mockSetDoc.mock.calls[0][2]).toBeUndefined();
  });

  // Spec: User profile updated on subsequent sign-ins
  it('updates lastLoginAt without overwriting createdAt on returning user', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(true, {
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: '2026-01-01T00:00:00Z',
    }));
    const user = createMockUser() as any;

    await provisionUserProfile(user);

    expect(mockSetDoc).toHaveBeenCalledOnce();
    const [_ref, data, options] = mockSetDoc.mock.calls[0];
    // Should use merge to avoid overwriting createdAt
    expect(options).toEqual({ merge: true });
    // Data should NOT include createdAt
    expect(data.createdAt).toBeUndefined();
    expect(data.lastLoginAt).toEqual({ _type: 'serverTimestamp' });
    expect(data.displayName).toBe('Test User');
  });

  // Spec: Provisioning is idempotent (merge strategy)
  it('uses merge strategy for existing profiles ensuring idempotent writes', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(true, { displayName: 'Existing' }));
    const user = createMockUser() as any;

    await provisionUserProfile(user);

    const [, , options] = mockSetDoc.mock.calls[0];
    expect(options).toEqual({ merge: true });
  });

  // Spec: Profile data sourced from Firebase Auth
  it('populates profile fields from Firebase Auth user object', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    const user = createMockUser({
      displayName: 'Jane Doe',
      email: 'jane@example.com',
      photoURL: 'https://example.com/jane.jpg',
    }) as any;

    await provisionUserProfile(user);

    const [, data] = mockSetDoc.mock.calls[0];
    expect(data.displayName).toBe('Jane Doe');
    expect(data.email).toBe('jane@example.com');
    expect(data.photoURL).toBe('https://example.com/jane.jpg');
  });

  // Spec: Correct Firestore document path
  it('writes to the correct Firestore path /users/{userId}/profile/main', async () => {
    mockGetDoc.mockResolvedValue(mockDocSnapshot(false));
    const user = createMockUser({ uid: 'user-abc' }) as any;

    await provisionUserProfile(user);

    // mockDoc is called to create the reference
    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(), // db
      'users', 'user-abc', 'profile', 'main'
    );
  });
});

// Spec: Firestore rules protect user profile
// These scenarios require the Firebase emulator to test security rules.
// They are documented as stubs to be implemented when emulator testing is set up.
describe('Firestore security rules for user profile (requires Firebase emulator)', () => {
  it.todo('allows owner to read their own profile — /users/{userId}/profile where userId matches auth UID');

  it.todo('allows owner to write their own profile — /users/{userId}/profile where userId matches auth UID');

  it.todo('denies non-owner from reading another user profile — /users/{otherUserId}/profile where otherUserId does not match auth UID');

  it.todo('denies unauthenticated access to any user profile — /users/{userId}/profile');
});
