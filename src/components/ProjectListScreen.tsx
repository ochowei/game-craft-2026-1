import React from 'react';
import type { ProjectMeta } from '../contexts/ProjectContext';
import RoleBadge from './RoleBadge';

interface Props {
  projects: ProjectMeta[];
  createProject: (name: string) => Promise<string>;
  renameProject: (id: string, newName: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  leaveProject: (id: string) => Promise<void>;
  onOpenShare: (id: string) => void;
}

export default function ProjectListScreen({
  projects, createProject, renameProject, deleteProject, openProject, leaveProject, onOpenShare,
}: Props) {
  const handleCreate = async () => {
    const name = window.prompt('New project name');
    if (!name) return;
    await createProject(name);
  };

  const handleRename = async (id: string, current: string) => {
    const name = window.prompt('New name', current);
    if (!name || name === current) return;
    await renameProject(id, name);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteProject(id);
  };

  const handleLeave = async (id: string, name: string) => {
    if (!window.confirm(`Leave "${name}"? You won't be able to rejoin unless re-invited.`)) return;
    await leaveProject(id);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-on-surface font-headline">Projects</h2>
        <button
          onClick={handleCreate}
          className="bg-primary text-on-primary-container rounded-xl px-4 py-2 font-bold text-sm uppercase tracking-widest hover:brightness-110"
        >
          <span className="material-symbols-outlined align-middle mr-1">add</span>
          New project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <p className="font-medium">No projects yet — hit "New project" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const isOwner = p.role === 'owner';
            return (
              <div
                key={p.id}
                className="bg-surface-container rounded-xl border border-outline-variant/50 p-4 flex flex-col gap-3"
              >
                <button
                  aria-label={`Open ${p.name}`}
                  onClick={() => openProject(p.id)}
                  className="text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-on-surface">{p.name}</h3>
                    <RoleBadge role={p.role} />
                  </div>
                  {p.description && (
                    <p className="text-sm text-on-surface-variant mt-1">{p.description}</p>
                  )}
                </button>
                <div className="flex gap-2 mt-auto pt-3 border-t border-outline-variant/40">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => handleRename(p.id, p.name)}
                        className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
                      >
                        Rename
                      </button>
                      <button
                        aria-label={`Share ${p.name}`}
                        onClick={() => onOpenShare(p.id)}
                        className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="text-xs font-semibold uppercase tracking-widest text-error hover:brightness-110 ml-auto"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      aria-label={`Leave ${p.name}`}
                      onClick={() => handleLeave(p.id, p.name)}
                      className="text-xs font-semibold uppercase tracking-widest text-error hover:brightness-110 ml-auto"
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
