import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoleBadge from './RoleBadge';

describe('RoleBadge', () => {
  it('renders Editor label for editor role', () => {
    render(<RoleBadge role="editor" />);
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });
  it('renders Viewer label for viewer role', () => {
    render(<RoleBadge role="viewer" />);
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });
  it('renders nothing for owner role', () => {
    const { container } = render(<RoleBadge role="owner" />);
    expect(container.firstChild).toBeNull();
  });
});
