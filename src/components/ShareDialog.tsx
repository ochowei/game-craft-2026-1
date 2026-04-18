import React, { useState } from 'react';
import type { Role } from '../domain/project';

export interface ShareDialogMember {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  photoURL: string;
}

interface Props {
  projectId: string;
  projectName: string;
  members: ShareDialogMember[];
  addMember: (projectId: string, email: string, role: Role) => Promise<void>;
  removeMember: (projectId: string, uid: string) => Promise<void>;
  changeRole: (projectId: string, uid: string, role: Role) => Promise<void>;
  onClose: () => void;
}

export default function ShareDialog({
  projectId, projectName, members,
  addMember, removeMember, changeRole, onClose,
}: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    setBusy(true);
    setError(null);
    try {
      await addMember(projectId, email.trim(), role);
      setEmail('');
    } catch (e: any) {
      if (e?.code === 'user-not-found') {
        setError("This user hasn't signed in to GameCraft yet — ask them to sign in first.");
      } else {
        setError(e?.message ?? 'Failed to add member');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (uid: string, name: string) => {
    if (!window.confirm(`Remove ${name} from "${projectName}"?`)) return;
    await removeMember(projectId, uid);
  };

  const handleChangeRole = async (uid: string, newRole: Role) => {
    await changeRole(projectId, uid, newRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-surface-container rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-outline-variant/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-on-surface font-headline mb-4">Share "{projectName}"</h2>

        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {members.map((m) => (
            <div key={m.uid} className="flex items-center gap-3 py-2 border-b border-outline-variant/40">
              {m.photoURL
                ? <img src={m.photoURL} alt="" className="w-8 h-8 rounded-full shrink-0" referrerPolicy="no-referrer" />
                : <div className="w-8 h-8 rounded-full bg-surface-container-high shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-on-surface truncate">{m.displayName}</div>
                <div className="text-xs text-on-surface-variant truncate">{m.email}</div>
              </div>
              {m.role === 'owner' ? (
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Owner</span>
              ) : (
                <>
                  <select
                    aria-label={`Role for ${m.displayName}`}
                    value={m.role}
                    onChange={(e) => handleChangeRole(m.uid, e.target.value as Role)}
                    className="bg-surface-container-high text-on-surface text-xs rounded-lg px-2 py-1"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    aria-label={`Remove ${m.displayName}`}
                    onClick={() => handleRemove(m.uid, m.displayName)}
                    className="text-xs font-semibold uppercase tracking-widest text-error hover:brightness-110"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-surface-container-high text-on-surface text-sm rounded-lg px-3 py-2"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="bg-surface-container-high text-on-surface text-sm rounded-lg px-2 py-2"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={busy || !email.trim()}
            className="bg-primary text-on-primary-container rounded-lg px-4 py-2 font-bold text-sm uppercase tracking-widest disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {error && <p className="text-xs text-error mb-2">{error}</p>}
        <p className="text-xs text-on-surface-variant italic mt-4">
          When two people edit at the same time, the most recent save wins. Coordinate over chat for heavy editing.
        </p>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
