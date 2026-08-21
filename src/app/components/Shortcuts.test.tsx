import { render, fireEvent } from '@testing-library/react';
import { Shortcuts } from './Shortcuts';
import { test, expect, vi } from 'vitest';

test('renders shortcuts overlay and responds to close click', () => {
  const onClose = vi.fn();
  const onJump = vi.fn();
  render(<Shortcuts open={true} onClose={onClose} onJump={onJump} />);
  // Overlay should be present
  const panel = document.querySelector('.sc-panel');
  expect(panel).toBeInTheDocument();
  // Close by clicking the dimmer background
  const dimmer = document.querySelector('.sc-overlay-dimmer');
  if (dimmer) fireEvent.click(dimmer);
  expect(onClose).toHaveBeenCalled();
});
