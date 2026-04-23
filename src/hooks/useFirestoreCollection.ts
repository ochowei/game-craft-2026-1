import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  doc as fsDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SyncStatus } from './useFirestoreDoc';

export interface UseFirestoreCollectionOptions<T> {
  idField: keyof T;
  debounceMs?: number;
  savedLingerMs?: number;
}

export interface UseFirestoreCollectionResult<T> {
  items: T[];
  addItem: (item: T) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, partial: Partial<T>) => Promise<void>;
  status: SyncStatus;
  hydrated: boolean;
  error?: Error;
}

interface PendingUpdate<T> {
  partial: Partial<T>;
  timer: ReturnType<typeof setTimeout>;
}

export function useFirestoreCollection<T>(
  path: string | null,
  opts: UseFirestoreCollectionOptions<T>,
): UseFirestoreCollectionResult<T> {
  const { idField, debounceMs = 500, savedLingerMs = 5000 } = opts;

  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<Error | undefined>();
  const [hydrated, setHydrated] = useState(false);

  const isMountedRef = useRef(true);
  const inFlightRef = useRef(0);
  const savedLingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate<T>>>(new Map());
  const pathRef = useRef<string | null>(path);

  useEffect(() => {
    pathRef.current = path;
    isMountedRef.current = true;
    setItems([]);
    setHydrated(false);

    if (!path) {
      return () => {
        isMountedRef.current = false;
      };
    }

    const colRef = collection(db, path);
    const unsubscribe = onSnapshot(
      colRef,
      (snap: any) => {
        if (!isMountedRef.current) return;
        const docs = (snap.docs ?? []).map((d: any) => {
          const data = d.data() ?? {};
          return { ...data, [idField]: d.id } as T;
        });
        setItems(docs);
        setHydrated(true);
      },
      (err: Error) => {
        if (!isMountedRef.current) return;
        setStatus('error');
        setError(err);
      },
    );

    return () => {
      isMountedRef.current = false;
      unsubscribe?.();

      // Flush pending debounced writes synchronously before teardown
      const currentPath = pathRef.current;
      for (const [id, entry] of pendingUpdatesRef.current) {
        clearTimeout(entry.timer);
        if (currentPath) {
          const docRef = fsDoc(db, currentPath, id);
          setDoc(docRef, entry.partial as any, { merge: true }).catch(() => {
            /* unmount: fire-and-forget */
          });
        }
      }
      pendingUpdatesRef.current.clear();

      if (savedLingerTimerRef.current) {
        clearTimeout(savedLingerTimerRef.current);
        savedLingerTimerRef.current = null;
      }
    };
  }, [path, idField]);

  const beginOp = useCallback(() => {
    inFlightRef.current += 1;
    if (!isMountedRef.current) return;
    setStatus('saving');
    setError(undefined);
    if (savedLingerTimerRef.current) {
      clearTimeout(savedLingerTimerRef.current);
      savedLingerTimerRef.current = null;
    }
  }, []);

  const endOp = useCallback(
    (err?: Error) => {
      inFlightRef.current = Math.max(0, inFlightRef.current - 1);
      if (!isMountedRef.current) return;
      if (err) {
        setStatus('error');
        setError(err);
        return;
      }
      if (inFlightRef.current === 0) {
        setStatus('saved');
        if (savedLingerTimerRef.current) clearTimeout(savedLingerTimerRef.current);
        savedLingerTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          setStatus('idle');
        }, savedLingerMs);
      }
    },
    [savedLingerMs],
  );

  const addItem = useCallback<(item: T) => Promise<void>>(
    async (item) => {
      const currentPath = pathRef.current;
      if (!currentPath) return;
      const id = String(item[idField]);
      beginOp();
      try {
        await setDoc(fsDoc(db, currentPath, id), item as any);
        endOp();
      } catch (e) {
        endOp(e as Error);
      }
    },
    [idField, beginOp, endOp],
  );

  const removeItem = useCallback<(id: string) => Promise<void>>(
    async (id) => {
      const currentPath = pathRef.current;
      if (!currentPath) return;
      beginOp();
      try {
        await deleteDoc(fsDoc(db, currentPath, id));
        endOp();
      } catch (e) {
        endOp(e as Error);
      }
    },
    [beginOp, endOp],
  );

  const updateItem = useCallback<(id: string, partial: Partial<T>) => Promise<void>>(
    async (id, partial) => {
      const currentPath = pathRef.current;
      if (!currentPath) return;
      const existing = pendingUpdatesRef.current.get(id);
      if (existing) clearTimeout(existing.timer);
      const mergedPartial: Partial<T> = { ...(existing?.partial ?? {}), ...partial };
      const timer = setTimeout(async () => {
        const entry = pendingUpdatesRef.current.get(id);
        if (!entry) return;
        pendingUpdatesRef.current.delete(id);
        const writePath = pathRef.current;
        if (!writePath) return;
        beginOp();
        try {
          await setDoc(fsDoc(db, writePath, id), entry.partial as any, { merge: true });
          endOp();
        } catch (e) {
          endOp(e as Error);
        }
      }, debounceMs);
      pendingUpdatesRef.current.set(id, { partial: mergedPartial, timer });
    },
    [debounceMs, beginOp, endOp],
  );

  return { items, addItem, removeItem, updateItem, status, hydrated, error };
}
