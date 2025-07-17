/**
 * Cypress E2E tests for Home Page Layout Improvements
 * Tests header layout, real studio feed, and removed recording studio label
 */

describe('Home Page Layout Improvements', () => {
  beforeEach(() => {
    // Reset any state and ensure we start fresh
    cy.window().then((win) => {
      win.localStorage.clear()
    })
  })

  describe('Header Navbar Layout Fix', () => {
    it('should have properly centered header with correct max-width container', () => {
      cy.visit('/')
      
      // Check header structure
      cy.get('header').should('exist')
      cy.get('header > div').should('have.class', 'max-w-7xl')
      cy.get('header > div').should('have.class', 'justify-between')
      
      // Check brand positioning
      cy.get('header a').contains('HitConnector').should('be.visible')
      
      // Check navigation links
      cy.get('header nav').should('be.visible')
      cy.get('header nav button').contains('How It Works').should('be.visible')
      cy.get('header nav a').contains('Log In').should('be.visible')
      cy.get('header nav a').contains('Sign Up').should('be.visible')
    })

    it('should have visually balanced spacing between brand and nav', () => {
      cy.visit('/')
      
      // On desktop viewport, check spacing
      cy.viewport(1366, 768)
      
      cy.get('header').within(() => {
        // Brand should be on the left
        cy.get('a').contains('HitConnector').should('be.visible')
        
        // Nav should be on the right with proper gap
        cy.get('nav').should('have.class', 'gap-8')
        cy.get('nav').should('have.class', 'items-center')
      })
    })

    it('should work on mobile with responsive design', () => {
      cy.viewport('iphone-6')
      cy.visit('/')
      
      // Header should still be present and functional on mobile
      cy.get('header').should('be.visible')
      cy.get('header a').contains('HitConnector').should('be.visible')
    })
  })

  describe('Some of Our Studios Section with Real Data', () => {
    it('should display "Some of Our Studios" section with correct title', () => {
      cy.visit('/')
      
      // Check section title is updated
      cy.contains('h2', 'Some of Our Studios').should('be.visible')
      cy.contains('Followed by artists across HitConnector').should('be.visible')
      
      // Should NOT contain old title
      cy.contains('Top-Rated Studios').should('not.exist')
      cy.contains('Discover the highest-rated recording studios').should('not.exist')
    })

    it('should show loading skeletons initially', () => {
      cy.visit('/')
      
      // Should show loading state initially
      cy.get('[data-testid="studio-skeleton"]', { timeout: 1000 }).should('exist')
        .or(cy.get('.animate-pulse').should('exist'))
    })

    it('should load real studio data from API', () => {
      // Stub the API call to return test data
      cy.intercept('GET', '/api/studios/top', {
        statusCode: 200,
        body: [
          {
            id: 'test-studio-1',
            name: 'Test Studio One',
            location: 'New York',
            hourlyRate: 100,
            rating: 4.5,
            profileImage: '/test-studio-1.jpg'
          }
        ]
      }).as('getTopStudios')

      cy.visit('/')
      
      // Wait for API call
      cy.wait('@getTopStudios')
      
      // Should display studio data
      cy.contains('Test Studio One').should('be.visible')
      cy.contains('New York').should('be.visible')
      cy.contains('$100').should('be.visible')
    })

    it('should handle empty studio data gracefully', () => {
      // Stub the API call to return empty array
      cy.intercept('GET', '/api/studios/top', {
        statusCode: 200,
        body: []
      }).as('getEmptyStudios')

      cy.visit('/')
      
      // Wait for API call
      cy.wait('@getEmptyStudios')
      
      // Should show fallback message
      cy.contains('Studios will appear here soon!').should('be.visible')
    })

    it('should handle API errors gracefully', () => {
      // Stub the API call to return error
      cy.intercept('GET', '/api/studios/top', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('getStudiosError')

      cy.visit('/')
      
      // Wait for API call
      cy.wait('@getStudiosError')
      
      // Should show fallback message when API fails
      cy.contains('Studios will appear here soon!').should('be.visible')
    })

    it('should display up to 4 studios in grid layout', () => {
      // Stub the API call to return multiple studios
      cy.intercept('GET', '/api/studios/top', {
        statusCode: 200,
        body: [
          { id: '1', name: 'Studio 1', location: 'NY', hourlyRate: 100, rating: 4.5 },
          { id: '2', name: 'Studio 2', location: 'LA', hourlyRate: 120, rating: 4.8 },
          { id: '3', name: 'Studio 3', location: 'Chicago', hourlyRate: 80, rating: 4.2 },
          { id: '4', name: 'Studio 4', location: 'Miami', hourlyRate: 90, rating: 4.6 }
        ]
      }).as('getMultipleStudios')

      cy.visit('/')
      
      // Wait for API call
      cy.wait('@getMultipleStudios')
      
      // Should display exactly 4 studios
      cy.get('[data-cy="studio-card"]').should('have.length', 4)
        .or(cy.get('.grid').find('.overflow-hidden').should('have.length', 4))
      
      // Check grid layout classes
      cy.get('.grid-cols-1').should('exist')
      cy.get('.sm\\:grid-cols-2').should('exist')
      cy.get('.lg\\:grid-cols-4').should('exist')
    })
  })

  describe('Recording Studio Label Removal', () => {
    it('should not contain "recording studio" text anywhere on the page', () => {
      cy.visit('/')
      
      // Check that the old "Recording studio" alt text is gone
      cy.get('img[alt*="Recording studio"]').should('not.exist')
      cy.get('img[alt*="recording studio"]').should('not.exist')
      
      // Verify the new alt text is present
      cy.get('img[alt="Music production setup"]').should('exist')
    })

    it('should not have any stray recording studio labels in CTA section', () => {
      cy.visit('/')
      
      // Check CTA section specifically
      cy.get('section').contains('Ready to create your next hit?').parent().within(() => {
        cy.contains('recording studio').should('not.exist')
        cy.contains('Recording studio').should('not.exist')
        cy.contains('🎙').should('not.exist')
      })
    })
  })

  describe('Overall Layout Integration', () => {
    it('should maintain proper page structure and styling', () => {
      cy.visit('/')
      
      // Check main sections exist in correct order
      cy.get('header').should('exist')
      cy.get('main').should('exist')
      cy.get('footer').should('exist')
      
      // Check hero section
      cy.contains('Find Your Perfect Studio Today').should('be.visible')
      
      // Check studios section
      cy.contains('Some of Our Studios').should('be.visible')
      
      // Check CTA section
      cy.contains('Ready to create your next hit?').should('be.visible')
    })

    it('should have working navigation links', () => {
      cy.visit('/')
      
      // Check How It Works button opens modal
      cy.get('button').contains('How It Works').click()
      cy.get('[role="dialog"]').should('be.visible')
      
      // Close modal
      cy.get('body').click(0, 0)
      
      // Check other navigation links
      cy.get('a').contains('Log In').should('have.attr', 'href', '/login')
      cy.get('a').contains('Sign Up').should('have.attr', 'href', '/signup')
    })

    it('should be responsive on different screen sizes', () => {
      // Test desktop
      cy.viewport(1366, 768)
      cy.visit('/')
      cy.get('header').should('be.visible')
      cy.contains('Some of Our Studios').should('be.visible')
      
      // Test tablet
      cy.viewport('ipad-2')
      cy.visit('/')
      cy.get('header').should('be.visible')
      cy.contains('Some of Our Studios').should('be.visible')
      
      // Test mobile
      cy.viewport('iphone-6')
      cy.visit('/')
      cy.get('header').should('be.visible')
      cy.contains('Some of Our Studios').should('be.visible')
    })
  })

  describe('Performance and Loading', () => {
    it('should load the page within reasonable time', () => {
      cy.visit('/', { timeout: 10000 })
      
      // Page should load key elements quickly
      cy.get('header').should('be.visible')
      cy.contains('Find Your Perfect Studio Today').should('be.visible')
      cy.contains('Some of Our Studios').should('be.visible')
    })

    it('should handle multiple API calls efficiently', () => {
      cy.intercept('GET', '/api/studios/top').as('getStudios')
      
      cy.visit('/')
      
      // Should only make one API call for studios
      cy.wait('@getStudios')
      cy.get('@getStudios.all').should('have.length', 1)
    })
  })
}) 