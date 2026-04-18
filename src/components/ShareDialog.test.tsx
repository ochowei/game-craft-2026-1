import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareDialog from './ShareDialog';

function setup(override?: {
  addMember?: any;
  removeMember?: any;
  changeRole?: any;
  members?: Array<{ uid: string; displayName: string; email: string; role: 'owner' | 'editor' | 'viewer'; photoURL: string }>;
}) {
  const addMember = override?.addMember ?? vi.fn().mockResolvedValue(undefined);
  const removeMember = override?.removeMember ?? vi.fn().mockResolvedValue(undefined);
  const changeRole = override?.changeRole ?? vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  const members = override?.members ?? [
    { uid: 'uid_A', displayName: 'Alice', email: 'alice@example.com', role: 'owner' as const, photoURL: '' },
    { uid: 'uid_B', displayName: 'Bob', email: 'bob@example.com', role: 'editor' as const, photoURL: '' },
  ];
  render(
    <ShareDialog
      projectId="p_1"
      projectName="Demo"
      members={members}
      addMember={addMember}
      removeMember={removeMember}
      changeRole={changeRole}
      onClose={onClose}
    />,
  );
  return { addMember, removeMember, changeRole, onClose };
}

describe('ShareDialog', () => {
  afterEach(() => cleanup());

  it('renders current members', () => {
    setup();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('adds a member by email on happy path', async () => {
    const { addMember } = setup();
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => expect(addMember).toHaveBeenCalledWith('p_1', 'new@example.com', 'editor'));
  });

  it('shows error when email is not found', async () => {
    const addMember = vi.fn().mockRejectedValue(Object.assign(new Error('not found'), { code: 'user-not-found' }));
    setup({ addMember });
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'nobody@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));
    await waitFor(() => expect(screen.getByText(/hasn't signed in to GameCraft/i)).toBeInTheDocument());
  });

  it('removes a member after confirmation', async () => {
    const { removeMember } = setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: /Remove Bob/i }));
    await waitFor(() => expect(removeMember).toHaveBeenCalledWith('p_1', 'uid_B'));
    confirmSpy.mockRestore();
  });

  it('changes a role via role picker', async () => {
    const { changeRole } = setup();
    const picker = screen.getByRole('combobox', { name: /role for Bob/i });
    fireEvent.change(picker, { target: { value: 'viewer' } });
    await waitFor(() => expect(changeRole).toHaveBeenCalledWith('p_1', 'uid_B', 'viewer'));
  });

  it('does not show Remove button for the owner row', () => {
    setup();
    expect(screen.queryByRole('button', { name: /Remove Alice/i })).toBeNull();
  });

  it('renders the last-write-wins disclaimer', () => {
    setup();
    expect(screen.getByText(/most recent save wins/i)).toBeInTheDocument();
  });
});
