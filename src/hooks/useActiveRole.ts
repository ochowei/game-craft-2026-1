import { useProjects } from '../contexts/ProjectContext';
import type { Role } from '../domain/project';

export function useActiveRole(): Role | null {
  const { activeProjectId, projects } = useProjects();
  if (!activeProjectId) return null;
  const match = projects.find((p) => p.id === activeProjectId);
  return match?.role ?? null;
}
