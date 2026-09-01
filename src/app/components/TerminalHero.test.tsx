import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TerminalHero } from './TerminalHero'
import { type CmsContent, DEFAULT_CONTENT } from '../../cms'

const mockContent: CmsContent = {
  ...DEFAULT_CONTENT,
  heroTagline: "Test Tagline",
  education: [
    {
      id: "edu1",
      degree: "M.Sc.",
      school: "Test Uni",
      location: "Test City",
      period: "2020 - Present",
      detail: "",
      focus: [],
      badges: [],
      current: true
    }
  ],
}

describe('TerminalHero', () => {
  beforeEach(() => {
    // Mock matchMedia to enable reduce-motion so animations are skipped
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('renders without crashing and displays core identity', () => {
    render(<TerminalHero content={mockContent} factLocation="Test Location" scrollTo={vi.fn()} />)
    
    // Check main elements
    expect(screen.getByAltText('Hazem Alabiad')).toBeInTheDocument()
    expect(screen.getByText(/Test Tagline/i)).toBeInTheDocument()
    expect(screen.getByText(/Get in touch/i)).toBeInTheDocument()
  })

  it('displays the terminal output instantly due to reduced motion', () => {
    render(<TerminalHero content={mockContent} factLocation="Test Location" scrollTo={vi.fn()} />)
    
    // Terminal output should be visible
    expect(screen.getByText('hazem-alabiad.ini loaded — 4 roles · Test Location')).toBeInTheDocument()
    expect(screen.getByText('./job --status')).toBeInTheDocument()
    expect(screen.getByText('cat roles.toml')).toBeInTheDocument()
    expect(screen.getByText(/Test Uni/i)).toBeInTheDocument()
  })

  it('calls scrollTo when scroll link is clicked', () => {
    const scrollToMock = vi.fn()
    render(<TerminalHero content={mockContent} factLocation="Test Location" scrollTo={scrollToMock} />)
    
    const scrollLink = screen.getByText(/scroll for the transcript/i)
    fireEvent.click(scrollLink)
    
    expect(scrollToMock).toHaveBeenCalledWith('experience')
  })

  it('replays the animation via the refresh button', () => {
    render(<TerminalHero content={mockContent} factLocation="Test Location" scrollTo={vi.fn()} />)
    const replayBtn = screen.getByRole('button', { name: /replay animation/i })
    fireEvent.click(replayBtn)
    fireEvent.click(replayBtn)
    // output stays present under reduced motion after replay
    expect(screen.getByText('cat roles.toml')).toBeInTheDocument()
  })

  it('renders the role list tags and priority markers', () => {
    render(<TerminalHero content={mockContent} factLocation="Test Location" scrollTo={vi.fn()} />)
    expect(screen.getAllByText('focus').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('current').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('◀ priority').length).toBeGreaterThanOrEqual(1)
  })
})
