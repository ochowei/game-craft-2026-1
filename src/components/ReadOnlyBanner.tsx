import React from 'react';

export default function ReadOnlyBanner() {
  return (
    <div className="bg-surface-container-high border-b border-outline-variant/50 px-6 py-2 text-sm text-on-surface-variant">
      <span className="material-symbols-outlined align-middle mr-2 text-[18px]">visibility</span>
      You're viewing this project as a Viewer. You can't make changes.
    </div>
  );
}
