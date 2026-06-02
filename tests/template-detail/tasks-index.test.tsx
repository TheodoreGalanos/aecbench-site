// ABOUTME: Tests the public /tasks library index surface.
// ABOUTME: Verifies sitemap framing, counts, and canonical detail links.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TasksPage, { metadata } from '@/app/(home)/tasks/page';

describe('TasksPage', () => {
  it('sets task-library metadata', () => {
    expect(metadata.title).toMatch(/Task Library/);
  });

  it('renders the task library sitemap and canonical task links', () => {
    render(<TasksPage />);
    expect(screen.getByRole('heading', { level: 1, name: /Task Library/i })).toBeInTheDocument();
    expect(screen.getByText('/tasks/[discipline]/[taskId]')).toBeInTheDocument();
    const navigation = screen.getByRole('navigation', { name: /task library disciplines/i });
    expect(within(navigation).getByRole('link', { name: /Civil/i })).toHaveAttribute(
      'href',
      '#civil-tasks-heading',
    );
    expect(within(navigation).getAllByRole('link')).toHaveLength(5);
    expect(screen.getByRole('link', { name: /^Voltage Drop$/i })).toHaveAttribute(
      'href',
      '/tasks/electrical/voltage-drop',
    );
    expect(screen.getByText('built templates')).toBeInTheDocument();
    expect(screen.getByText('184')).toBeInTheDocument();
    expect(screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('/tasks/'))).toHaveLength(184);
  });
});
