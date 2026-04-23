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

// --- Firestore mocks (original) ---

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

// --- Additional Firestore API mocks for project work ---

export const mockCollection = vi.fn((...args: any[]) => ({
  _path: args.slice(1).join('/'),
  _collection: true,
}));
export const mockQuery = vi.fn((ref: any) => ref);
export const mockWhere = vi.fn((field: string, op: string, value: any) => ({ _where: { field, op, value } }));
export const mockGetDocs = vi.fn();
export const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
export const mockDeleteDoc = vi.fn().mockResolvedValue(undefined);
export const mockRunTransaction = vi.fn();
export const mockWriteBatch = vi.fn();
export const mockInitializeFirestore = vi.fn(() => ({}));
export const mockPersistentLocalCache = vi.fn(() => ({ _cache: 'persistent' }));
export const mockCollectionGroup = vi.fn((_db: any, path: string) => ({ _collectionGroup: path }));

// onSnapshot impl: register callback by path, return an unsubscribe spy
type SnapshotCb = (snap: any) => void;
const snapshotRegistry = new Map<string, SnapshotCb>();
export const mockOnSnapshotImpl = vi.fn((ref: any, cb: SnapshotCb) => {
  const key = ref._path ?? Math.random().toString();
  snapshotRegistry.set(key, cb);
  return vi.fn(() => snapshotRegistry.delete(key));
});
export function emitSnapshot(path: string, data: Record<string, any> | null) {
  const cb = snapshotRegistry.get(path);
  if (!cb) throw new Error(`No snapshot listener registered for ${path}`);
  cb(mockDocSnapshot(data !== null, data ?? undefined));
}

export function emitCollectionSnapshot(
  path: string,
  docs: Array<{ id: string; data: Record<string, any> }>,
) {
  const cb = snapshotRegistry.get(path);
  if (!cb) throw new Error(`No snapshot listener registered for ${path}`);
  cb({
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
  });
}

export function emitSnapshotError(path: string, err: Error) {
  // onSnapshot is called with (ref, onNext, onError). Our mockOnSnapshotImpl only
  // stored the onNext callback; for error-path tests, override mockOnSnapshotImpl
  // directly in the test, or register both. Kept as a no-op helper for clarity.
  void path;
  void err;
  throw new Error('emitSnapshotError: override mockOnSnapshotImpl directly for error cases');
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

// --- Reset helpers ---

export function resetFirestoreProjectMocks() {
  mockCollection.mockClear();
  mockQuery.mockClear();
  mockWhere.mockClear();
  mockGetDocs.mockClear();
  mockUpdateDoc.mockClear().mockResolvedValue(undefined);
  mockDeleteDoc.mockClear().mockResolvedValue(undefined);
  mockRunTransaction.mockClear();
  mockWriteBatch.mockClear();
  mockInitializeFirestore.mockClear().mockReturnValue({});
  mockPersistentLocalCache.mockClear().mockReturnValue({ _cache: 'persistent' });
  mockCollectionGroup.mockClear();
  mockOnSnapshotImpl.mockClear();
  snapshotRegistry.clear();
}

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
  resetFirestoreProjectMocks();
}
