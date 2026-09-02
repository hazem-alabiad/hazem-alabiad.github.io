import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('App routes', () => {
  function renderAt(hash: string) {
    window.location.hash = hash;
    return render(<App />);
  }

  it('renders the blog index with the search input at #/blog', async () => {
    renderAt('#/blog');
    expect(await screen.findByRole('textbox', { name: /search the blog/i })).toBeInTheDocument();
    expect(await screen.findByText(/Writing on NLP research/i)).toBeInTheDocument();
  });

  it('renders a blog post at #/blog/:slug', async () => {
    renderAt('#/blog/arabic-vmwe-llms');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Why LLMs Fumble/i);
    expect((await screen.findAllByText(/IN THIS NOTE/i)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('toolbar', { name: /reading tools/i })).toBeInTheDocument();
  });

  it('shows the unlock panel on the new-post route without credentials', async () => {
    renderAt('#/blog/admin/new');
    // the lazy editor chunk is large; give it time to transform under parallel load
    expect(await screen.findByText(/NEW POST · WRITE A NOTE/i, {}, { timeout: 8000 })).toBeInTheDocument();
    expect(await screen.findByPlaceholderText('GitHub PAT', {}, { timeout: 8000 })).toBeInTheDocument();
  });

  it('renders the admin dashboard at #/blog/admin', async () => {
    renderAt('#/blog/admin');
    expect(await screen.findByPlaceholderText('GitHub PAT')).toBeInTheDocument();
  });
});

describe('App keyboard shortcuts', () => {
  it('opens the shortcuts dialog with ? and closes it with Escape', async () => {
    window.location.hash = '#/';
    render(<App />);
    await screen.findByRole('button', { name: /hire me/i }).catch(async () => {
      await screen.findAllByRole('button', { name: /hire me/i });
    });
    fireEvent.keyDown(window, { key: '?' });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('scrolls to sections via the keyboard shortcuts', async () => {
    window.location.hash = '#/';
    const spy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    render(<App />);
    await screen.findByRole('button', { name: /hire me/i }).catch(async () => {
      await screen.findAllByRole('button', { name: /hire me/i });
    });
    for (const key of ['g', 'G', 't', '1', '2', '3', '4', '5', '6', 'j', 'k', 'ArrowDown', 'ArrowUp']) {
      fireEvent.keyDown(window, { key });
    }
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('App CMS flow', () => {
  it('unlocks the CMS and opens the portfolio editor', async () => {
    window.location.hash = '#/';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ login: 'hazem-alabiad', email: null }) })));
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /cms/i }));
    fireEvent.change(await screen.findByPlaceholderText('GitHub PAT'), { target: { value: 'ghp_cms' } });
    fireEvent.click(screen.getByRole('button', { name: /^unlock$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /edit cv/i }));
    expect(await screen.findByRole('heading', { name: /edit portfolio/i })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('inline-edits the footer line after unlocking the CMS', async () => {
    window.location.hash = '#/';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ login: 'hazem-alabiad', email: null }) })));
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /^cms$/i }));
    fireEvent.change(await screen.findByPlaceholderText('GitHub PAT'), { target: { value: 'ghp_cms' } });
    fireEvent.click(screen.getByRole('button', { name: /^unlock$/i }));
    await screen.findByRole('button', { name: /edit cv/i });
    const copyright = document.querySelector('span.copyright') as HTMLElement;
    expect(copyright.getAttribute('contenteditable')).toBe('true');
    fireEvent.blur(copyright, { target: { textContent: 'custom © 2026' } });
    const stored = JSON.parse(localStorage.getItem('hazem-portfolio-cms-settings-v4')!);
    expect(stored.footerLine).toBe('custom © 2026');
    vi.unstubAllGlobals();
  });

  it('locks the CMS back down after unlocking', async () => {
    window.location.hash = '#/';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ login: 'hazem-alabiad', email: null }) })));
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /cms/i }));
    fireEvent.change(await screen.findByPlaceholderText('GitHub PAT'), { target: { value: 'ghp_cms' } });
    fireEvent.click(screen.getByRole('button', { name: /^unlock$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /lock/i }));
    expect(await screen.findByRole('button', { name: /cms/i })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});