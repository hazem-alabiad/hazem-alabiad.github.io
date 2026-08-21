import { render, screen, fireEvent } from '@testing-library/react';
import Shortcuts from './Shortcuts';

test('renders shortcuts overlay and responds to close click', () => {
  const onClose = jest.fn();
  const onJump = jest.fn();
  render(<Shortcuts open={true} onClose={onClose} onJump={onJump} />);
  // Overlay should be present
  const panel = document.querySelector('.sc-panel');
  expect(panel).toBeInTheDocument();
  // Close by clicking the dimmer background
  const dimmer = document.querySelector('.sc-overlay-dimmer');
  if (dimmer) fireEvent.click(dimmer);
  expect(onClose).toHaveBeenCalled();
});
