import React from 'react';
import type { Role } from '../domain/project';

interface Props {
  role: Role;
}

export default function RoleBadge({ role }: Props) {
  if (role === 'owner') return null;
  const base = 'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full';
  if (role === 'editor') {
    return <span className={`${base} bg-secondary/20 text-secondary`}>Editor</span>;
  }
  return <span className={`${base} bg-surface-container-high text-on-surface-variant`}>Viewer</span>;
}
