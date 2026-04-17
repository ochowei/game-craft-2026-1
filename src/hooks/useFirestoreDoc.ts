import React, { useEffect, useReducer, useRef, useState } from 'react';
import { doc as fsDoc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export type RemoteSyncAction<T> = { type: '__REMOTE_SYNC__'; value: T };

export interface UseFirestoreDocOptions<T, A> {
  defaults: T;
  reducer: (state: T, action: A | RemoteSyncAction<T>) => T;
  debounceMs?: number;
  savedLingerMs?: number;
}

export interface UseFirestoreDocResult<T, A> {
  state: T;
  dispatch: React.Dispatch<A>;
  status: SyncStatus;
  error?: Error;
}

export function useFirestoreDoc<T, A>(
  path: string,
  opts: UseFirestoreDocOptions<T, A>,
): UseFirestoreDocResult<T, A> {
  const {
    defaults,
    reducer,
    debounceMs = 500,
    savedLingerMs = 5000,
  } = opts;

  const [state, dispatch] = useReducer(reducer, defaults);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<Error | undefined>();

  const hydratedRef = useRef(false);
  const skipNextWriteRef = useRef(false);
  const pendingValueRef = useRef<T | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedLingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Initial load + onSnapshot subscription. Keyed by `path`.
  useEffect(() => {
    isMountedRef.current = true;
    hydratedRef.current = false;
    const ref = fsDoc(db, path);

    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        const snap = await getDoc(ref);
        if (!isMountedRef.current) return;
        if (snap.exists()) {
          skipNextWriteRef.current = true;
          dispatch({ type: '__REMOTE_SYNC__', value: snap.data() as T } as A | RemoteSyncAction<T>);
        }
        hydratedRef.current = true;
      } catch (e) {
        if (!isMountedRef.current) return;
        setStatus('error');
        setError(e as Error);
      }

      unsubscribe = onSnapshot(
        ref,
        (snap: any) => {
          if (!isMountedRef.current) return;
          if (snap.exists()) {
            skipNextWriteRef.current = true;
            dispatch({ type: '__REMOTE_SYNC__', value: snap.data() as T } as A | RemoteSyncAction<T>);
          }
        },
        (err: Error) => {
          if (!isMountedRef.current) return;
          setStatus('error');
          setError(err);
        },
      );
    })();

    return () => {
      isMountedRef.current = false;
      if (unsubscribe) unsubscribe();
      // Flush pending write synchronously before teardown
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        if (pendingValueRef.current !== null) {
          const payload = pendingValueRef.current;
          pendingValueRef.current = null;
          // Fire-and-forget; unmount won't await
          setDoc(ref, payload as any, { merge: true }).catch(() => { /* noop on unmount */ });
        }
      }
      if (savedLingerTimerRef.current) {
        clearTimeout(savedLingerTimerRef.current);
        savedLingerTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  // Debounced write on state changes
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false;
      return;
    }

    pendingValueRef.current = state;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      debounceTimerRef.current = null;
      const payload = pendingValueRef.current;
      pendingValueRef.current = null;
      if (payload === null) return;

      setStatus('saving');
      setError(undefined);
      try {
        const ref = fsDoc(db, path);
        await setDoc(ref, payload as any, { merge: true });
        if (!isMountedRef.current) return;
        setStatus('saved');
        if (savedLingerTimerRef.current) clearTimeout(savedLingerTimerRef.current);
        savedLingerTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          setStatus('idle');
        }, savedLingerMs);
      } catch (e) {
        if (!isMountedRef.current) return;
        setStatus('error');
        setError(e as Error);
      }
    }, debounceMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return { state, dispatch: dispatch as React.Dispatch<A>, status, error };
}
