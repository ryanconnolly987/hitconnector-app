/**
 * Cypress E2E tests for find-studios page fixes
 * Tests debug element removal, deduplication, and studio navigation
 */

describe('Find Studios Page Fixes', () => {
  beforeEach(() => {
    // Visit the find-studios page before each test
    cy.visit('/find-studios')
  })

  describe('Debug Elements Removal', () => {
    it('should not show Test API Call debug button', () => {
      cy.get('body').should('not.contain', 'Test API Call (Debug)')
      cy.get('body').should('not.contain', '🔄 Test API Call')
    })

    it('should not show studios loaded status line', () => {
      cy.get('body').should('not.contain', 'Studios loaded:')
      cy.get('body').should('not.contain', 'Loading:')
      cy.get('body').should('not.contain', 'Error: none')
    })

    it('should not have filter icon button in search bar', () => {
      // Check that there's no button with filter icon near the search input
      cy.get('input[placeholder*="Search studios"]').should('exist')
      cy.get('input[placeholder*="Search studios"]').parent().parent()
        .find('button[aria-label="filter"]').should('not.exist')
    })
  })

  describe('Page Functionality', () => {
    it('should display the main heading and description', () => {
      cy.contains('Find Recording Studios').should('be.visible')
      cy.contains('Discover professional recording studios in your area').should('be.visible')
    })

    it('should have working search input', () => {
      cy.get('input[placeholder*="Search studios"]').should('be.visible').and('be.enabled')
      cy.get('input[placeholder*="Search studios"]').type('test search')
      cy.get('input[placeholder*="Search studios"]').should('have.value', 'test search')
    })

    it('should have all filter dropdowns working', () => {
      // Location filter
      cy.contains('All Locations').should('be.visible')
      
      // Price filter  
      cy.contains('All Prices').should('be.visible')
      
      // Sort filter
      cy.contains('Highest Rated').should('be.visible')
    })
  })

  describe('Studios Display and Deduplication', () => {
    it('should load and display studios without duplicates', () => {
      // Wait for studios to load
      cy.get('[data-cy="studio-card"], .cursor-pointer').should('exist')
      
      // Check that each studio name appears only once
      cy.get('[data-cy="studio-card"], .cursor-pointer').then($cards => {
        const studioNames: string[] = []
        $cards.each((index, card) => {
          const studioName = Cypress.$(card).find('h3, .font-semibold').first().text().trim()
          if (studioName) {
            expect(studioNames).to.not.include(studioName, `Duplicate studio found: ${studioName}`)
            studioNames.push(studioName)
          }
        })
      })
    })

    it('should show studio count information', () => {
      cy.contains(/\d+ studios? found/).should('be.visible')
    })
  })

  describe('Studio Navigation', () => {
    it('should navigate to studio profile when clicking studio name', () => {
      // Wait for studios to load
      cy.get('.cursor-pointer h3, .font-semibold').first().should('be.visible')
      
      // Click on the first studio name
      cy.get('.cursor-pointer h3, .font-semibold').first().click()
      
      // Should navigate to studio profile (either /studio/[id] or /studios/[slug])
      cy.url().should('match', /\/(studio|studios)\/[^\/]+$/)
      
      // Should not be on a 404 page
      cy.get('body').should('not.contain', '404')
      cy.get('body').should('not.contain', 'Page Not Found')
      cy.get('body').should('not.contain', 'This page could not be found')
    })

    it('should navigate to studio profile when clicking studio card', () => {
      // Click on the first studio card
      cy.get('.cursor-pointer').first().click()
      
      // Should navigate to studio profile
      cy.url().should('match', /\/(studio|studios)\/[^\/]+$/)
      
      // Should show studio profile content
      cy.get('body').should('not.contain', '404')
    })

    it('should handle studio slug navigation correctly', () => {
      // Test specific case that was causing 404s
      cy.window().then((win) => {
        // Programmatically navigate to a studio by slug
        win.location.href = '/studios/the-dojo'
      })
      
      // Should either redirect to /studio/[id] or show the profile
      cy.url().should('satisfy', (url: string) => {
        return url.includes('/studio/') || url.includes('/studios/')
      })
      
      // Should not show 404
      cy.get('body').should('not.contain', '404')
      cy.get('body').should('not.contain', 'Page Not Found')
    })
  })

  describe('Studio Profile Content', () => {
    it('should show studio profile when navigating from find-studios', () => {
      // Navigate to a studio
      cy.get('.cursor-pointer').first().click()
      
      // Should show studio profile elements
      cy.get('h1, h2, h3').should('contain.text', /Studio|Recording|Music/)
      
      // Should have back navigation
      cy.contains('Back').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid studio navigation gracefully', () => {
      // Try to navigate to a non-existent studio
      cy.visit('/studios/non-existent-studio', { failOnStatusCode: false })
      
      // Should show appropriate error or 404 page
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text()
        return text.includes('404') || 
               text.includes('Not Found') || 
               text.includes('Studio not found') ||
               text.includes('Page not found')
      })
    })

    it('should show appropriate message when no studios found', () => {
      // Search for something that won't match
      cy.get('input[placeholder*="Search studios"]').type('zzznomatchzzz')
      
      // Should show no results message
      cy.contains('No studios found').should('be.visible')
      cy.contains('Try adjusting your search criteria').should('be.visible')
    })
  })
}) 