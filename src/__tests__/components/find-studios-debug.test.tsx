/**
 * Test suite for find-studios page debug elements removal
 * Ensures the "Test API Call (Debug)" button and status line are not rendered
 */

import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import FindStudiosPage from '@/app/find-studios/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
}

describe('FindStudios Debug Elements Removal', () => {
  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(fetch as jest.Mock).mockClear()
    
    // Mock successful API response
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ studios: [] }),
      text: async () => 'OK',
      status: 200,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should not render Test API Call (Debug) button', async () => {
    render(<FindStudiosPage />)
    
    // Wait for component to render
    await screen.findByText('Find Recording Studios')
    
    // Verify debug button is not present
    expect(screen.queryByText(/Test API Call \(Debug\)/)).not.toBeInTheDocument()
    expect(screen.queryByText(/🔄 Test API Call/)).not.toBeInTheDocument()
  })

  test('should not render studios loaded status line', async () => {
    render(<FindStudiosPage />)
    
    // Wait for component to render
    await screen.findByText('Find Recording Studios')
    
    // Verify status line is not present
    expect(screen.queryByText(/Studios loaded:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Loading:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument()
  })

  test('should not render filter icon button in search bar', async () => {
    render(<FindStudiosPage />)
    
    // Wait for component to render
    await screen.findByText('Find Recording Studios')
    
    // Verify filter icon button is not present
    const filterButtons = screen.queryAllByRole('button')
    const filterIconButton = filterButtons.find(button => 
      button.getAttribute('aria-label') === 'filter' ||
      button.querySelector('[data-testid="filter-icon"]')
    )
    
    expect(filterIconButton).toBeUndefined()
  })

  test('should maintain functional search bar without filter button', async () => {
    render(<FindStudiosPage />)
    
    // Wait for component to render
    await screen.findByText('Find Recording Studios')
    
    // Verify search input is still present and functional
    const searchInput = screen.getByPlaceholderText('Search studios, locations, or genres...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toBeEnabled()
  })

  test('should maintain all other filter dropdowns', async () => {
    render(<FindStudiosPage />)
    
    // Wait for component to render
    await screen.findByText('Find Recording Studios')
    
    // Verify location, price, and sort filters are still present
    expect(screen.getByDisplayValue('All Locations')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All Prices')).toBeInTheDocument()  
    expect(screen.getByDisplayValue('Highest Rated')).toBeInTheDocument()
  })

  test('should still have working refresh functionality through natural data fetching', async () => {
    render(<FindStudiosPage />)
    
    // Wait for component to render and API call to complete
    await screen.findByText('Find Recording Studios')
    
    // Verify fetch was called for studios (not through debug button)
    expect(fetch).toHaveBeenCalledWith('/api/studios')
    expect(fetch).toHaveBeenCalledWith('/api/health')
  })
}) 