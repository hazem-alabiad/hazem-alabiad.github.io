import { render, screen, fireEvent } from '@testing-library/react';
import Shortcuts from './Shortcuts';

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
