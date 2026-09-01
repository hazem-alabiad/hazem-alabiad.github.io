import { render, screen, fireEvent } from '@testing-library/react';
import Shortcuts from './Shortcuts';
import { test, expect, vi } from 'vitest';

// Mock posts data
vi.mock('../../blog/posts', () => ({
  posts: [
    {
      slug: 'test-post',
      title: 'Test Post Title',
      tags: ['foo', 'bar'],
      description: 'A description containing query',
    },
    {
      slug: 'other-post',
      title: 'Another Title',
      tags: ['baz'],
      description: 'Something else',
    },
  ],
}));

test('search filters sections and selects with keyboard', async () => {
  const onClose = vi.fn();
  const onJump = vi.fn();
  const onOpenPost = vi.fn();

  render(
    <Shortcuts open={true} onClose={onClose} onJump={onJump} onOpenPost={onOpenPost} />
  );

  const input = screen.getByPlaceholderText('Search commands, sections, or posts…');
  expect(input).toBeInTheDocument();

  fireEvent.change(input, { target: { value: 'exp' } });
  expect(screen.getByText('Experience')).toBeInTheDocument();
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onJump).toHaveBeenCalledWith('experience');
  expect(onClose).toHaveBeenCalled();
});

test('search matches post and triggers onOpenPost', async () => {
  const onClose = vi.fn();
  const onJump = vi.fn();
  const onOpenPost = vi.fn();

  render(
    <Shortcuts open={true} onClose={onClose} onJump={onJump} onOpenPost={onOpenPost} />
  );

  const input = screen.getByPlaceholderText('Search commands, sections, or posts…');
  fireEvent.change(input, { target: { value: 'test post' } });
  expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  fireEvent.keyDown(input, { key: 'ArrowDown' }); // first match (section or post)
  fireEvent.keyDown(input, { key: 'ArrowDown' }); // second match (post)
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onOpenPost).toHaveBeenCalledWith('test-post');
  expect(onClose).toHaveBeenCalled();
});
