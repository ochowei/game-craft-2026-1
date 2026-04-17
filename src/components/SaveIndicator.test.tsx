import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { SyncStatusProvider, useSyncStatus } from '../contexts/SyncStatusContext';
import SaveIndicator from './SaveIndicator';

type Reporter = ReturnType<typeof useSyncStatus>;

function Trigger({ onReport }: { onReport: (r: Reporter) => void }) {
  const reporter = useSyncStatus();
  React.useEffect(() => { onReport(reporter); }, [reporter, onReport]);
  return null;
}

function setup() {
  let reporter!: Reporter;
  render(
    <SyncStatusProvider>
      <Trigger onReport={(r) => (reporter = r)} />
      <SaveIndicator />
    </SyncStatusProvider>,
  );
  return () => reporter;
}

describe('SaveIndicator', () => {
  afterEach(() => cleanup());

  it('renders nothing when all idle', () => {
    setup();
    expect(screen.queryByText(/Saving/)).toBeNull();
    expect(screen.queryByText(/Saved just now/)).toBeNull();
  });

  it('renders "Saving…" when any domain saving', () => {
    const get = setup();
    act(() => { get().report('rules', 'saving'); });
    expect(screen.getByText(/Saving/)).toBeInTheDocument();
  });

  it('renders "Saved just now" when a recent save landed', () => {
    const get = setup();
    act(() => { get().report('cards', 'saved'); });
    expect(screen.getByText(/Saved just now/)).toBeInTheDocument();
  });

  it('renders an error state when any domain errored', () => {
    const get = setup();
    act(() => { get().report('board', 'error'); });
    expect(screen.getByText(/Error/i)).toBeInTheDocument();
  });
});
