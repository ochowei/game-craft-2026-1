import React from 'react';

interface Props {
  projectKey: string;
  children: React.ReactNode;
}

// Wraps design providers for the active project. Changing `projectKey` forces
// React to unmount and remount the entire subtree, fully resetting editor state
// across project switches (open-file UX).
export default function ActiveProjectRoot({ projectKey, children }: Props) {
  return <React.Fragment key={projectKey}>{children}</React.Fragment>;
}
