import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the skip link for accessibility', () => {
    render(<App />);
    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toBeInTheDocument();
  });

  it('renders the navigation elements', () => {
    render(<App />);
    const navMarks = screen.getAllByText(/H.*ALABIAD/i);
    expect(navMarks.length).toBeGreaterThan(0);
  });
});
