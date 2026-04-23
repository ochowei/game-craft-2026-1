import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LibraryItem, LibraryItemType, DEFAULT_LIBRARY } from '../domain/library';
import { useAuth } from './AuthContext';
import { useSyncStatus } from './SyncStatusContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { db, doc, writeBatch } from '../lib/firebase';

type LibraryFilter = LibraryItemType | 'all';

type LibraryAction =
  | { type: 'ADD_ITEM'; item: LibraryItem }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'SET_FILTER'; filter: LibraryFilter };

interface LibraryContextValue {
  items: LibraryItem[];
  activeFilter: LibraryFilter;
  dispatch: React.Dispatch<LibraryAction>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { report } = useSyncStatus();
  const path = user ? `users/${user.uid}/library` : null;

  const { items, addItem, removeItem, status, hydrated } = useFirestoreCollection<LibraryItem>(
    path,
    { idField: 'id' },
  );

  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all');
  const seedAttemptedRef = useRef(false);

  useEffect(() => {
    report('library', status);
  }, [status, report]);

  // Reset seed gate when provider's effective user changes (sign in/out).
  useEffect(() => {
    seedAttemptedRef.current = false;
  }, [path]);

  // One-time seed on first empty snapshot for a signed-in user.
  useEffect(() => {
    if (!path || !hydrated || seedAttemptedRef.current) return;
    seedAttemptedRef.current = true;
    if (items.length > 0) return;

    const batch = writeBatch(db);
    for (const item of DEFAULT_LIBRARY) {
      batch.set(doc(db, path, item.id), item);
    }
    batch.commit().catch((err) => {
      console.error('Library seed failed:', err);
    });
  }, [hydrated, path, items.length]);

  const dispatch = useCallback<React.Dispatch<LibraryAction>>(
    (action) => {
      switch (action.type) {
        case 'ADD_ITEM':
          void addItem(action.item);
          return;
        case 'REMOVE_ITEM':
          void removeItem(action.itemId);
          return;
        case 'SET_FILTER':
          setActiveFilter(action.filter);
          return;
      }
    },
    [addItem, removeItem],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({ items, activeFilter, dispatch }),
    [items, activeFilter, dispatch],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
