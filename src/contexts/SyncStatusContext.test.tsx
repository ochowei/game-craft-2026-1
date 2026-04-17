import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { SyncStatusProvider, useSyncStatus, useAggregateStatus } from './SyncStatusContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <SyncStatusProvider>{children}</SyncStatusProvider>;
}

describe('SyncStatusContext', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useAggregateStatus(), { wrapper });
    expect(result.current).toBe('idle');
  });

  it('reports saving when any domain is saving', () => {
    const { result } = renderHook(
      () => ({
        reporter: useSyncStatus(),
        agg: useAggregateStatus(),
      }),
      { wrapper },
    );
    act(() => { result.current.reporter.report('rules', 'saving'); });
    expect(result.current.agg).toBe('saving');
  });

  it('reports error taking precedence over saving', () => {
    const { result } = renderHook(
      () => ({
        reporter: useSyncStatus(),
        agg: useAggregateStatus(),
      }),
      { wrapper },
    );
    act(() => {
      result.current.reporter.report('rules', 'saving');
      result.current.reporter.report('cards', 'error');
    });
    expect(result.current.agg).toBe('error');
  });

  it('reports saved when all settled with at least one saved', () => {
    const { result } = renderHook(
      () => ({
        reporter: useSyncStatus(),
        agg: useAggregateStatus(),
      }),
      { wrapper },
    );
    act(() => {
      result.current.reporter.report('rules', 'saved');
      result.current.reporter.report('cards', 'idle');
    });
    expect(result.current.agg).toBe('saved');
  });
});
