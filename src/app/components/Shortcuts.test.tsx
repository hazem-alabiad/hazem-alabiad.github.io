import { render, screen, fireEvent } from '@testing-library/react';
import Shortcuts from './Shortcuts';
import { test, expect, vi } from 'vitest';

// Test controlled open prop and close via dimmer click
test('renders shortcuts overlay and responds to close click', () => {
  const onClose = vi.fn();
  const onJump = vi.fn();
  render(
    <Shortcuts open={true} onClose={onClose} onJump={onJump} />
  );
  // Overlay should be present
  const panel = document.querySelector('.sc-panel');
  expect(panel).toBeInTheDocument();
  // Close by clicking the dimmer background
  const dimmer = document.querySelector('.sc-overlay-dimmer');
  if (dimmer) fireEvent.click(dimmer);
  expect(onClose).toHaveBeenCalled();
});

// Test default behavior: open via Cmd+K shortcut and close with Escape
test('renders shortcuts overlay and responds to key press', () => {
  render(<Shortcuts />);
  // Overlay hidden initially
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  // Open via Cmd+K (meta+K)
  fireEvent.keyDown(document, { key: 'k', metaKey: true });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  // Close with Escape
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
