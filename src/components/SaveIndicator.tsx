import React from 'react';
import { useAggregateStatus } from '../contexts/SyncStatusContext';

export default function SaveIndicator() {
  const status = useAggregateStatus();
  if (status === 'idle') return null;
  const base = 'text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full';

  if (status === 'saving') {
    return <span className={`${base} bg-surface-container-high text-on-surface-variant`}>Saving…</span>;
  }
  if (status === 'saved') {
    return <span className={`${base} bg-primary/10 text-primary`}>Saved just now</span>;
  }
  return <span className={`${base} bg-error/20 text-error`}>Error — retry coming up</span>;
}
