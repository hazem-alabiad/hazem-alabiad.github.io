import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CMSButton } from './CMSButton'

describe('CMSButton', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders CMS button when not enabled', () => {
    render(<CMSButton onUnlock={vi.fn()} enabled={false} onDisable={vi.fn()} onOpenEditor={vi.fn()} />)
    expect(screen.getByText('CMS')).toBeInTheDocument()
  })

  it('renders EDIT CV and LOCK buttons when enabled', () => {
    render(<CMSButton onUnlock={vi.fn()} enabled={true} onDisable={vi.fn()} onOpenEditor={vi.fn()} />)
    expect(screen.getByText('EDIT CV')).toBeInTheDocument()
    expect(screen.getByText('LOCK')).toBeInTheDocument()
  })

  it('opens input form when CMS button is clicked', () => {
    render(<CMSButton onUnlock={vi.fn()} enabled={false} onDisable={vi.fn()} onOpenEditor={vi.fn()} />)
    fireEvent.click(screen.getByText('CMS'))
    expect(screen.getByPlaceholderText('GitHub PAT')).toBeInTheDocument()
    expect(screen.getByText('UNLOCK')).toBeInTheDocument()
  })

  it('calls onUnlock on successful verification', async () => {
    const onUnlock = vi.fn().mockResolvedValue(undefined)

    render(<CMSButton onUnlock={onUnlock} enabled={false} onDisable={vi.fn()} onOpenEditor={vi.fn()} />)

    // Open modal
    fireEvent.click(screen.getByText('CMS'))

    // Enter token
    const input = screen.getByPlaceholderText('GitHub PAT')
    fireEvent.change(input, { target: { value: 'valid-token' } })

    // Submit
    fireEvent.click(screen.getByText('UNLOCK'))

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledWith('valid-token')
    })
  })

  it('silently re-unlocks via onQuickUnlock without asking for the token', async () => {
    const onQuickUnlock = vi.fn().mockResolvedValue(true)

    render(<CMSButton onUnlock={vi.fn()} enabled={false} onDisable={vi.fn()} onOpenEditor={vi.fn()} onQuickUnlock={onQuickUnlock} />)

    fireEvent.click(screen.getByText('CMS'))

    await waitFor(() => {
      expect(onQuickUnlock).toHaveBeenCalledTimes(1)
    })
    // No token panel was opened
    expect(screen.queryByPlaceholderText('GitHub PAT')).not.toBeInTheDocument()
  })

  it('falls back to the token panel when onQuickUnlock finds no valid stored token', async () => {
    const onQuickUnlock = vi.fn().mockResolvedValue(false)

    render(<CMSButton onUnlock={vi.fn()} enabled={false} onDisable={vi.fn()} onOpenEditor={vi.fn()} onQuickUnlock={onQuickUnlock} />)

    fireEvent.click(screen.getByText('CMS'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('GitHub PAT')).toBeInTheDocument()
    })
  })

  it('shows error on failed verification', async () => {
    const onUnlock = vi.fn().mockRejectedValue(new Error('Token does not match owner.'))

    render(<CMSButton onUnlock={onUnlock} enabled={false} onDisable={vi.fn()} onOpenEditor={vi.fn()} />)
    fireEvent.click(screen.getByText('CMS'))

    fireEvent.change(screen.getByPlaceholderText('GitHub PAT'), { target: { value: 'wrong-token' } })
    fireEvent.click(screen.getByText('UNLOCK'))

    await waitFor(() => {
      expect(screen.getByText('Token does not match owner.')).toBeInTheDocument()
    })
  })
})
