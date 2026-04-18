import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../contexts/ProjectContext', () => ({
  useProjects: () => ({
    activeProjectId: null,
    projects: [],
  }),
}));

import { useActiveRole } from './useActiveRole';

describe('useActiveRole (no active project)', () => {
  it('returns null when no project is active', () => {
    const { result } = renderHook(() => useActiveRole());
    expect(result.current).toBeNull();
  });
});
