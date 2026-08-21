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
    const onUnlock = vi.fn()
    // Mock successful fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ login: 'hazem-alabiad' })
    } as Response)

    render(<CMSButton onUnlock={onUnlock} enabled={false} onDisable={vi.fn()} onOpenEditor={vi.fn()} />)
    
    // Open modal
    fireEvent.click(screen.getByText('CMS'))
    
    // Enter token
    const input = screen.getByPlaceholderText('GitHub PAT')
    fireEvent.change(input, { target: { value: 'valid-token' } })
    
    // Submit
    fireEvent.click(screen.getByText('UNLOCK'))
    
    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalled()
      expect(localStorage.setItem).toHaveBeenCalledWith('hazem-cms-token', 'valid-token')
    })
  })

  it('shows error on failed verification', async () => {
    // Mock failed fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ login: 'wrong-user' })
    } as Response)

    render(<CMSButton onUnlock={vi.fn()} enabled={false} onDisable={vi.fn()} onOpenEditor={vi.fn()} />)
    fireEvent.click(screen.getByText('CMS'))
    
    fireEvent.change(screen.getByPlaceholderText('GitHub PAT'), { target: { value: 'wrong-token' } })
    fireEvent.click(screen.getByText('UNLOCK'))
    
    await waitFor(() => {
      expect(screen.getByText('Token does not match owner.')).toBeInTheDocument()
    })
  })
})
