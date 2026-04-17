export const PROJECT_SCHEMA_VERSION = 1 as const;
export const DEFAULT_PROJECT_NAME = 'My First Project' as const;

export type Role = 'owner' | 'editor' | 'viewer';

export const ROLES_THAT_CAN_WRITE_DESIGN: Role[] = ['owner', 'editor'];

export function PUBLIC_PROFILE_PATH(uid: string): string {
  return `users/${uid}/publicProfile/main`;
}

export interface PublicProfile {
  displayName: string;
  email: string;
  photoURL: string;
  updatedAt: Date | unknown;
}

export interface Project {
  id: string;
  ownerId: string;
  members: Record<string, Role>;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
  schemaVersion: number;
}

export interface ProjectRef {
  role: Role;
  addedAt: Date | unknown;
  lastOpenedAt?: Date | unknown;
}

interface MakeNewProjectArgs {
  id: string;
  ownerId: string;
  name: string;
  now: Date | unknown;
}

export function makeNewProject({ id, ownerId, name, now }: MakeNewProjectArgs): Project {
  return {
    id,
    ownerId,
    members: { [ownerId]: 'owner' },
    name,
    createdAt: now,
    updatedAt: now,
    schemaVersion: PROJECT_SCHEMA_VERSION,
  };
}
