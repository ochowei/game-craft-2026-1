import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  db,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  writeBatch,
  serverTimestamp,
} from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  DEFAULT_PROJECT_NAME,
  PROJECT_SCHEMA_VERSION,
  type Project,
  type Role,
} from '../domain/project';
import { lookupUserByEmail } from '../hooks/useUserLookup';

export interface ProjectMeta {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  ownerId: string;
  updatedAt: unknown;
  role: Role;
}

interface ProjectContextValue {
  projects: ProjectMeta[];
  activeProjectId: string | null;
  loading: boolean;
  createProject: (name: string) => Promise<string>;
  renameProject: (projectId: string, newName: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  openProject: (projectId: string) => Promise<void>;
  closeActive: () => void;
  addMember: (projectId: string, email: string, role: Role) => Promise<void>;
  removeMember: (projectId: string, targetUid: string) => Promise<void>;
  changeRole: (projectId: string, targetUid: string, newRole: Role) => Promise<void>;
  leaveProject: (projectId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

function generateProjectId(): string {
  return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

async function loadProjectsForUser(uid: string): Promise<ProjectMeta[]> {
  const refsSnap = await getDocs(collection(db, 'users', uid, 'projectRefs'));
  const ids = refsSnap.docs.map((d: any) => d.id);
  const metas: ProjectMeta[] = [];
  for (const id of ids) {
    const pSnap = await getDoc(doc(db, 'projects', id));
    if (!pSnap.exists()) continue;
    const data = pSnap.data() as Project;
    const role = (data.members?.[uid] ?? 'viewer') as Role;
    metas.push({
      id,
      name: data.name,
      description: data.description,
      thumbnail: data.thumbnail,
      ownerId: data.ownerId,
      updatedAt: data.updatedAt,
      role,
    });
  }
  metas.sort((a, b) => {
    const av = (a.updatedAt as any)?.toMillis?.() ?? 0;
    const bv = (b.updatedAt as any)?.toMillis?.() ?? 0;
    return bv - av;
  });
  return metas;
}

async function createProjectTransaction(uid: string, name: string): Promise<string> {
  const projectId = generateProjectId();
  const projectRef = doc(db, 'projects', projectId);
  const refDocRef = doc(db, 'users', uid, 'projectRefs', projectId);

  await runTransaction(db, async (tx: any) => {
    tx.set(projectRef, {
      id: projectId,
      ownerId: uid,
      members: { [uid]: 'owner' },
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      schemaVersion: PROJECT_SCHEMA_VERSION,
    });
    tx.set(refDocRef, {
      role: 'owner',
      addedAt: serverTimestamp(),
    });
  });

  return projectId;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedForUserRef = useRef<string | null>(null);

  const createProject = useCallback(async (name: string): Promise<string> => {
    if (!user) throw new Error('Not signed in');
    const uid = user.uid;
    const projectId = await createProjectTransaction(uid, name);
    setProjects(await loadProjectsForUser(uid));
    return projectId;
  }, [user]);

  const renameProject = useCallback(async (projectId: string, newName: string) => {
    await updateDoc(doc(db, 'projects', projectId), {
      name: newName,
      updatedAt: serverTimestamp(),
    });
    if (user) setProjects(await loadProjectsForUser(user.uid));
  }, [user]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) throw new Error('Not signed in');
    const uid = user.uid;

    await runTransaction(db, async (tx: any) => {
      tx.delete(doc(db, 'projects', projectId));
      tx.delete(doc(db, 'users', uid, 'projectRefs', projectId));
    });

    // Best-effort cleanup of design subdocuments
    try {
      const designSnap = await getDocs(collection(db, 'projects', projectId, 'design'));
      if (!designSnap.empty) {
        const batch = writeBatch(db);
        designSnap.docs.forEach((d: any) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch {
      // Ignore cleanup failures
    }

    if (activeProjectId === projectId) setActiveProjectId(null);
    setProjects(await loadProjectsForUser(uid));
  }, [user, activeProjectId]);

  const openProject = useCallback(async (projectId: string) => {
    if (!user) throw new Error('Not signed in');
    setActiveProjectId(projectId);
    await setDoc(
      doc(db, 'users', user.uid, 'profile', 'main'),
      { lastOpenedProjectId: projectId, lastLoginAt: serverTimestamp() },
      { merge: true },
    );
    try {
      await updateDoc(
        doc(db, 'users', user.uid, 'projectRefs', projectId),
        { lastOpenedAt: serverTimestamp() },
      );
    } catch {
      // best-effort; projectRef may not exist yet for unusual flows
    }
  }, [user]);

  const closeActive = useCallback(() => {
    setActiveProjectId(null);
  }, []);

  const addMember = useCallback(async (projectId: string, email: string, role: Role) => {
    if (!user) throw new Error('Not signed in');
    const uid = user.uid;
    const target = await lookupUserByEmail(email);
    if (!target) {
      const err = new Error('User not found') as Error & { code?: string };
      err.code = 'user-not-found';
      throw err;
    }

    const projectRef = doc(db, 'projects', projectId);
    const refDocRef = doc(db, 'users', target.uid, 'projectRefs', projectId);

    await runTransaction(db, async (tx: any) => {
      const pSnap = await tx.get(projectRef);
      if (!pSnap.exists()) throw new Error('Project not found');
      const current = pSnap.data() as Project;
      tx.update(projectRef, {
        members: { ...current.members, [target.uid]: role },
        updatedAt: serverTimestamp(),
      });
      tx.set(refDocRef, {
        role,
        addedAt: serverTimestamp(),
      });
    });

    setProjects(await loadProjectsForUser(uid));
  }, [user]);

  const removeMember = useCallback(async (projectId: string, targetUid: string) => {
    if (!user) throw new Error('Not signed in');
    const uid = user.uid;
    const projectRef = doc(db, 'projects', projectId);
    const refDocRef = doc(db, 'users', targetUid, 'projectRefs', projectId);

    await runTransaction(db, async (tx: any) => {
      const pSnap = await tx.get(projectRef);
      if (!pSnap.exists()) throw new Error('Project not found');
      const current = pSnap.data() as Project;
      if (targetUid === current.ownerId) {
        throw new Error('Cannot remove the owner; delete the project instead');
      }
      const nextMembers = { ...current.members };
      delete nextMembers[targetUid];
      tx.update(projectRef, { members: nextMembers, updatedAt: serverTimestamp() });
      tx.delete(refDocRef);
    });

    setProjects(await loadProjectsForUser(uid));
    if (targetUid === uid && activeProjectId === projectId) setActiveProjectId(null);
  }, [user, activeProjectId]);

  const changeRole = useCallback(async (projectId: string, targetUid: string, newRole: Role) => {
    if (!user) throw new Error('Not signed in');
    const uid = user.uid;
    const projectRef = doc(db, 'projects', projectId);
    const refDocRef = doc(db, 'users', targetUid, 'projectRefs', projectId);

    await runTransaction(db, async (tx: any) => {
      const pSnap = await tx.get(projectRef);
      if (!pSnap.exists()) throw new Error('Project not found');
      const current = pSnap.data() as Project;
      if (targetUid === current.ownerId) {
        throw new Error('Cannot change the owner role');
      }
      tx.update(projectRef, {
        members: { ...current.members, [targetUid]: newRole },
        updatedAt: serverTimestamp(),
      });
      tx.update(refDocRef, { role: newRole });
    });

    setProjects(await loadProjectsForUser(uid));
  }, [user]);

  const leaveProject = useCallback(async (projectId: string) => {
    if (!user) throw new Error('Not signed in');
    await removeMember(projectId, user.uid);
  }, [user, removeMember]);

  // Hydrate on auth state change
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setActiveProjectId(null);
      setLoading(true);
      initializedForUserRef.current = null;
      return;
    }
    if (initializedForUserRef.current === user.uid) return;
    initializedForUserRef.current = user.uid;

    (async () => {
      setLoading(true);
      try {
        let metas = await loadProjectsForUser(user.uid);

        if (metas.length === 0) {
          // First-login auto-provisioning
          const newId = await createProjectTransaction(user.uid, DEFAULT_PROJECT_NAME);
          metas = await loadProjectsForUser(user.uid);
          setProjects(metas);
          setActiveProjectId(newId);
          return;
        }

        setProjects(metas);

        // Last-opened hydration
        const profileSnap = await getDoc(doc(db, 'users', user.uid, 'profile', 'main'));
        const lastOpenedId = profileSnap.exists()
          ? (profileSnap.data() as any).lastOpenedProjectId
          : undefined;
        if (lastOpenedId && metas.some((m) => m.id === lastOpenedId)) {
          setActiveProjectId(lastOpenedId);
        } else if (lastOpenedId) {
          await setDoc(
            doc(db, 'users', user.uid, 'profile', 'main'),
            { lastOpenedProjectId: null },
            { merge: true },
          );
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProjectId,
        loading,
        createProject,
        renameProject,
        deleteProject,
        openProject,
        closeActive,
        addMember,
        removeMember,
        changeRole,
        leaveProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used within a ProjectProvider');
  return ctx;
}
