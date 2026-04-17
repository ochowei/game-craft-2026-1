import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockCollectionGroup,
  mockGetDocs,
  mockQuery,
  mockWhere,
  mockCollection,
  mockDoc,
  mockGetDoc,
  mockSetDoc,
  mockOnSnapshotImpl,
  mockUpdateDoc,
  mockDeleteDoc,
  mockRunTransaction,
  mockWriteBatch,
  mockInitializeFirestore,
  mockPersistentLocalCache,
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
  initializeFirestore: mockInitializeFirestore,
  persistentLocalCache: mockPersistentLocalCache,
  getFirestore: vi.fn(() => ({})),
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  onSnapshot: mockOnSnapshotImpl,
  serverTimestamp: vi.fn(),
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
  getDocFromServer: vi.fn(),
}));

import { lookupUserByEmail } from './useUserLookup';

describe('lookupUserByEmail', () => {
  beforeEach(() => { resetAllMocks(); });

  it('returns the matching user when email is found', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{
        ref: { parent: { parent: { id: 'uid_A' } } },
        data: () => ({ displayName: 'Alice', email: 'alice@example.com', photoURL: 'p.jpg' }),
      }],
    });
    const result = await lookupUserByEmail('alice@example.com');
    expect(result).toEqual({ uid: 'uid_A', displayName: 'Alice', photoURL: 'p.jpg' });
    expect(mockWhere).toHaveBeenCalledWith('email', '==', 'alice@example.com');
    expect(mockCollectionGroup).toHaveBeenCalledWith(expect.anything(), 'publicProfile');
  });

  it('normalizes input (trim + lowercase)', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    await lookupUserByEmail('  Alice@Example.com  ');
    expect(mockWhere).toHaveBeenCalledWith('email', '==', 'alice@example.com');
  });

  it('returns null when no user matches', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    const result = await lookupUserByEmail('nobody@example.com');
    expect(result).toBeNull();
  });

  it('returns null for empty or whitespace-only input without querying', async () => {
    const result = await lookupUserByEmail('   ');
    expect(result).toBeNull();
    expect(mockCollectionGroup).not.toHaveBeenCalled();
  });
});
