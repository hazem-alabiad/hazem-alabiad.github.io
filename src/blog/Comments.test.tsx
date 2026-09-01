import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Comments } from './Comments'

// ── Mock @giscus/react ────────────────────────────────────────────────────────
// Giscus renders an iframe via a web component — untestable in jsdom.
// We replace it with a transparent spy that exposes its props as data-attributes
// so we can assert the correct config is passed.
vi.mock('@giscus/react', () => ({
  default: vi.fn((props: Record<string, unknown>) => (
    <div
      data-testid="giscus"
      data-repo={props.repo}
      data-repo-id={props.repoId}
      data-mapping={props.mapping}
      data-term={props.term}
      data-theme={props.theme}
      data-strict={props.strict}
      data-reactions-enabled={props.reactionsEnabled}
      data-input-position={props.inputPosition}
      data-loading={props.loading}
    />
  )),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
function setHtmlTheme(value: string | null) {
  if (value === null) {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', value)
  }
}

describe('Comments', () => {
  beforeEach(() => {
    // Start in dark mode (default)
    setHtmlTheme(null)
  })

  afterEach(() => {
    setHtmlTheme(null)
    vi.restoreAllMocks()
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders the giscus wrapper div', () => {
    render(<Comments slug="test-post" />)
    expect(document.querySelector('.blog-comments-giscus')).toBeInTheDocument()
  })

  it('mounts the Giscus component', () => {
    render(<Comments slug="test-post" />)
    expect(screen.getByTestId('giscus')).toBeInTheDocument()
  })

  // ── Giscus config ──────────────────────────────────────────────────────────

  it('passes the correct repo to Giscus', () => {
    render(<Comments slug="test-post" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute(
      'data-repo',
      'hazem-alabiad/hazem-alabiad.github.io'
    )
  })

  it('passes mapping="specific" to Giscus', () => {
    render(<Comments slug="test-post" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-mapping', 'specific')
  })

  it('passes the slug as the discussion term', () => {
    render(<Comments slug="arabic-vmwe-llms" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-term', 'arabic-vmwe-llms')
  })

  it('enables reactions', () => {
    render(<Comments slug="test-post" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-reactions-enabled', '1')
  })

  it('uses strict title matching', () => {
    render(<Comments slug="test-post" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-strict', '1')
  })

  it('positions the input box at the top', () => {
    render(<Comments slug="test-post" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-input-position', 'top')
  })

  it('loads lazily', () => {
    render(<Comments slug="test-post" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-loading', 'lazy')
  })

  // ── Theme sync ─────────────────────────────────────────────────────────────

  it('uses dark_dimmed theme by default (no data-theme on html)', () => {
    render(<Comments slug="test-post" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-theme', 'dark_dimmed')
  })

  it('uses light theme when html has data-theme="light"', () => {
    setHtmlTheme('light')
    render(<Comments slug="test-post" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-theme', 'light')
  })

  it('switches to light theme when data-theme changes to "light"', async () => {
    render(<Comments slug="test-post" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-theme', 'dark_dimmed')

    await act(async () => { setHtmlTheme('light') })

    expect(screen.getByTestId('giscus')).toHaveAttribute('data-theme', 'light')
  })

  it('switches back to dark_dimmed when data-theme is removed', async () => {
    setHtmlTheme('light')
    render(<Comments slug="test-post" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-theme', 'light')

    await act(async () => { setHtmlTheme(null) })

    expect(screen.getByTestId('giscus')).toHaveAttribute('data-theme', 'dark_dimmed')
  })

  it('switches back to dark_dimmed when data-theme is set to "dark"', async () => {
    setHtmlTheme('light')
    render(<Comments slug="test-post" />)

    await act(async () => { setHtmlTheme('dark') })

    expect(screen.getByTestId('giscus')).toHaveAttribute('data-theme', 'dark_dimmed')
  })

  // ── Slug isolation ─────────────────────────────────────────────────────────

  it('passes different term for each unique slug', () => {
    const { rerender } = render(<Comments slug="post-one" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-term', 'post-one')

    rerender(<Comments slug="post-two" />)
    expect(screen.getByTestId('giscus')).toHaveAttribute('data-term', 'post-two')
  })

  // ── Observer cleanup ───────────────────────────────────────────────────────

  it('disconnects the MutationObserver on unmount (no leak)', async () => {
    const disconnectSpy = vi.fn()
    const observeSpy = vi.fn()

    // MutationObserver must be patched as a real class (not an arrow fn)
    const OriginalMO = globalThis.MutationObserver
    class MockMO {
      observe = observeSpy
      disconnect = disconnectSpy
      takeRecords = vi.fn()
      constructor(_cb: MutationCallback) {}
    }
    globalThis.MutationObserver = MockMO as unknown as typeof MutationObserver

    const { unmount } = render(<Comments slug="test-post" />)

    expect(observeSpy).toHaveBeenCalledWith(
      document.documentElement,
      expect.objectContaining({ attributes: true, attributeFilter: ['data-theme'] })
    )

    unmount()
    expect(disconnectSpy).toHaveBeenCalledTimes(1)

    globalThis.MutationObserver = OriginalMO
  })
})
