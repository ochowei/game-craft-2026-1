import React from 'react';

interface Props {
  children: React.ReactNode;
}

export default function ActiveProjectRoot({ children }: Props) {
  return <>{children}</>;
}
