import { describe, it, expect } from 'vitest';
import {
  PROJECT_SCHEMA_VERSION,
  DEFAULT_PROJECT_NAME,
  PUBLIC_PROFILE_PATH,
  ROLES_THAT_CAN_WRITE_DESIGN,
  makeNewProject,
  type Project,
  type ProjectRef,
  type Role,
} from './project';

describe('domain/project', () => {
  it('exposes the schema version constant', () => {
    expect(PROJECT_SCHEMA_VERSION).toBe(1);
  });

  it('exposes the default project name', () => {
    expect(DEFAULT_PROJECT_NAME).toBe('My First Project');
  });

  it('makeNewProject returns a project with owner-only membership', () => {
    const now = new Date();
    const p: Project = makeNewProject({
      id: 'p_1',
      ownerId: 'uid_A',
      name: 'My Project',
      now,
    });
    expect(p.id).toBe('p_1');
    expect(p.ownerId).toBe('uid_A');
    expect(p.members).toEqual({ uid_A: 'owner' });
    expect(p.name).toBe('My Project');
    expect(p.schemaVersion).toBe(1);
    expect(p.createdAt).toBe(now);
    expect(p.updatedAt).toBe(now);
    expect(p.description).toBeUndefined();
    expect(p.thumbnail).toBeUndefined();
  });

  it('Role is a string union for future extension', () => {
    const r: Role = 'owner';
    expect(r).toBe('owner');
  });

  it('ProjectRef fields are assignable', () => {
    const ref: ProjectRef = {
      role: 'owner',
      addedAt: new Date(),
      lastOpenedAt: new Date(),
    };
    expect(ref.role).toBe('owner');
  });
});

describe('Role extensions', () => {
  it('Role union accepts owner, editor, viewer', () => {
    const roles: Role[] = ['owner', 'editor', 'viewer'];
    expect(roles).toHaveLength(3);
  });

  it('PUBLIC_PROFILE_PATH formats the Firestore path', () => {
    expect(PUBLIC_PROFILE_PATH('uid_A')).toBe('users/uid_A/publicProfile/main');
  });

  it('ROLES_THAT_CAN_WRITE_DESIGN excludes viewer', () => {
    expect(ROLES_THAT_CAN_WRITE_DESIGN).toEqual(['owner', 'editor']);
    expect(ROLES_THAT_CAN_WRITE_DESIGN.includes('viewer' as any)).toBe(false);
  });
});
