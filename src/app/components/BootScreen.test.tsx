import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BootScreen } from './BootScreen'

describe('BootScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('renders initial boot text', () => {
    render(<BootScreen onDone={vi.fn()} />)
    expect(screen.getByText('HAZEM_ALABIAD // BOOT')).toBeInTheDocument()
    expect(screen.getByText('ENTER ↵ / SPACE / CLICK TO LAUNCH')).toBeInTheDocument()
  })

  it('progressively shows boot lines', () => {
    render(<BootScreen onDone={vi.fn()} />)
    
    // Initially no lines
    expect(screen.queryByText(/Initializing neural interface/i)).not.toBeInTheDocument()
    
    // Advance timer to show first line
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.getByText(/Initializing neural interface/i)).toBeInTheDocument()
    
    act(() => { vi.advanceTimersByTime(1000) })
    
    // We expect some boot lines to have been rendered by now
    expect(screen.getByText(/Initializing/i)).toBeInTheDocument()
    expect(screen.getAllByText(/\[ OK \]/i).length).toBeGreaterThan(1)
  })

  it('calls onDone after wipe animation when clicked', async () => {
    const onDone = vi.fn()
    render(<BootScreen onDone={onDone} />)
    
    const container = screen.getByText('HAZEM_ALABIAD // BOOT').parentElement?.parentElement
    expect(container).toBeInTheDocument()
    
    if (container) {
      fireEvent.click(container)
      
      // Fast forward past the 600ms wipe timeout
      act(() => {
        vi.advanceTimersByTime(600)
      })
      
      expect(onDone).toHaveBeenCalled()
    }
  })

  it('calls onDone when Enter is pressed', () => {
    const onDone = vi.fn()
    render(<BootScreen onDone={onDone} />)
    
    fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' })
    
    act(() => {
      vi.advanceTimersByTime(600)
    })
    
    expect(onDone).toHaveBeenCalled()
  })
})
