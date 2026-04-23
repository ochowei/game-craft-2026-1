import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { SyncStatus } from '../hooks/useFirestoreDoc';

type DomainKey = 'rules' | 'cards' | 'board' | 'tokens' | 'library';
type StatusMap = Record<DomainKey, SyncStatus>;

const INITIAL: StatusMap = { rules: 'idle', cards: 'idle', board: 'idle', tokens: 'idle', library: 'idle' };

interface ReporterValue {
  report: (key: DomainKey, status: SyncStatus) => void;
}

const ReporterContext = createContext<ReporterValue | null>(null);
const StatusContext = createContext<StatusMap>(INITIAL);

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<StatusMap>(INITIAL);
  const report = useCallback((key: DomainKey, status: SyncStatus) => {
    setStatuses((prev) => (prev[key] === status ? prev : { ...prev, [key]: status }));
  }, []);
  const reporter = useMemo(() => ({ report }), [report]);

  return (
    <ReporterContext.Provider value={reporter}>
      <StatusContext.Provider value={statuses}>
        {children}
      </StatusContext.Provider>
    </ReporterContext.Provider>
  );
}

export function useSyncStatus(): ReporterValue {
  const ctx = useContext(ReporterContext);
  if (!ctx) throw new Error('useSyncStatus must be used within a SyncStatusProvider');
  return ctx;
}

export function useAggregateStatus(): SyncStatus {
  const map = useContext(StatusContext);
  const values = Object.values(map);
  if (values.includes('error')) return 'error';
  if (values.includes('saving')) return 'saving';
  if (values.includes('saved')) return 'saved';
  return 'idle';
}
