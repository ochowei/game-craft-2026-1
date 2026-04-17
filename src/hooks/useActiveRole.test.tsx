import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../contexts/ProjectContext', () => ({
  useProjects: () => ({
    activeProjectId: 'p_1',
    projects: [
      { id: 'p_1', name: 'X', ownerId: 'uid_A', updatedAt: null, role: 'editor' },
      { id: 'p_2', name: 'Y', ownerId: 'uid_A', updatedAt: null, role: 'owner' },
    ],
  }),
}));

import { useActiveRole } from './useActiveRole';

describe('useActiveRole', () => {
  it('returns the role for the active project', () => {
    const { result } = renderHook(() => useActiveRole());
    expect(result.current).toBe('editor');
  });
});
