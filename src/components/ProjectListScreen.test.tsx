import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import ProjectListScreen from './ProjectListScreen';

function setup(override?: { projects?: any[] }) {
  const createProject = vi.fn().mockResolvedValue('p_new');
  const renameProject = vi.fn().mockResolvedValue(undefined);
  const deleteProject = vi.fn().mockResolvedValue(undefined);
  const openProject = vi.fn().mockResolvedValue(undefined);
  const projects = override?.projects ?? [
    { id: 'p_1', name: 'First', ownerId: 'uid_A', updatedAt: null },
    { id: 'p_2', name: 'Second', ownerId: 'uid_A', updatedAt: null },
  ];
  render(<ProjectListScreen
    projects={projects}
    createProject={createProject}
    renameProject={renameProject}
    deleteProject={deleteProject}
    openProject={openProject}
  />);
  return { createProject, renameProject, deleteProject, openProject };
}

describe('ProjectListScreen', () => {
  afterEach(() => cleanup());

  it('renders one card per project', () => {
    setup();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('calls openProject when a card is clicked', () => {
    const { openProject } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Open First/i }));
    expect(openProject).toHaveBeenCalledWith('p_1');
  });

  it('prompts for a name and calls createProject', () => {
    const { createProject } = setup();
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Fresh Project');
    fireEvent.click(screen.getByRole('button', { name: /New project/i }));
    expect(createProject).toHaveBeenCalledWith('Fresh Project');
    promptSpy.mockRestore();
  });

  it('confirms before deleting', () => {
    const { deleteProject } = setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]);
    expect(deleteProject).toHaveBeenCalledWith('p_1');
    confirmSpy.mockRestore();
  });

  it('does not delete when confirmation is declined', () => {
    const { deleteProject } = setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]);
    expect(deleteProject).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('shows empty state when no projects', () => {
    setup({ projects: [] });
    expect(screen.getByText(/No projects yet/i)).toBeInTheDocument();
  });
});
