describe('Final Home Page Polish - Alignment & Visual Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Hero Section Perfect Centering', () => {
    it('should center hero content perfectly on desktop', () => {
      cy.viewport(1440, 900)
      
      // Check hero section has proper flex centering
      cy.get('section').first().should('have.class', 'flex')
        .and('have.class', 'flex-col')
        .and('have.class', 'items-center')
        .and('have.class', 'justify-center')
        .and('have.class', 'text-center')
      
      // Check heading is centered with CSS
      cy.get('h1').should('have.css', 'text-align', 'center')
      
      // Verify heading positioning
      cy.get('h1').should('be.visible').then($heading => {
        const rect = $heading[0].getBoundingClientRect()
        const windowWidth = Cypress.config('viewportWidth')
        const center = windowWidth / 2
        const headingCenter = rect.left + rect.width / 2
        
        // Allow 10px tolerance for perfect centering
        expect(Math.abs(headingCenter - center)).to.be.lessThan(10)
      })
    })

    it('should maintain centering on ultrawide displays', () => {
      cy.viewport(1920, 1080)
      
      cy.get('h1').should('be.visible').then($heading => {
        const rect = $heading[0].getBoundingClientRect()
        const windowWidth = 1920
        const center = windowWidth / 2
        const headingCenter = rect.left + rect.width / 2
        
        expect(Math.abs(headingCenter - center)).to.be.lessThan(15)
      })
    })

    it('should have proper search bar centering', () => {
      cy.viewport(1440, 900)
      
      cy.get('input[placeholder*="Enter your city"]').should('be.visible').then($input => {
        const rect = $input[0].getBoundingClientRect()
        const windowWidth = Cypress.config('viewportWidth')
        const center = windowWidth / 2
        const inputCenter = rect.left + rect.width / 2
        
        expect(Math.abs(inputCenter - center)).to.be.lessThan(20)
      })
    })
  })

  describe('Header Perfect Symmetry', () => {
    it('should have equidistant brand and nav from viewport edges', () => {
      cy.viewport(1440, 900)
      
      cy.get('header').within(() => {
        cy.get('a[href="/"]').should('be.visible').then($brand => {
          const brandRect = $brand[0].getBoundingClientRect()
          const brandLeft = brandRect.left
          
          cy.get('nav').should('be.visible').then($nav => {
            const navRect = $nav[0].getBoundingClientRect()
            const navRight = navRect.right
            const windowWidth = Cypress.config('viewportWidth')
            const navRightDistance = windowWidth - navRight
            
            // Check symmetry: left distance ≈ right distance
            expect(Math.abs(brandLeft - navRightDistance)).to.be.lessThan(5)
          })
        })
      })
    })

    it('should maintain responsive padding', () => {
      // Test large screens
      cy.viewport(1440, 900)
      cy.get('header div').first().should('have.class', 'lg:px-8')
      
      // Test smaller screens
      cy.viewport(768, 1024)
      cy.get('header div').first().should('have.class', 'px-6')
    })

    it('should have proper brand negative margin adjustment', () => {
      cy.get('header a[href="/"]').should('have.class', '-ml-px')
    })
  })

  describe('Studios Section Background & Centering', () => {
    it('should have uniform white background throughout page', () => {
      // Hero section should not have different background
      cy.get('section').first().should('not.have.class', 'bg-gray-50')
        .and('not.have.class', 'bg-muted')
      
      // Studios section should not have different background
      cy.contains('Some of Our Studios').closest('section')
        .should('not.have.class', 'bg-gray-50')
        .and('not.have.class', 'bg-muted')
    })

    it('should center heading and content properly', () => {
      cy.contains('Some of Our Studios').should('have.css', 'text-align', 'center')
      
      cy.contains('Some of Our Studios').closest('section')
        .should('have.class', 'text-center')
    })

    it('should center empty state message', () => {
      // Check if empty state is properly centered
      cy.get('body').then($body => {
        if ($body.text().includes('Studios will appear here soon!')) {
          cy.contains('Studios will appear here soon!')
            .should('have.css', 'text-align', 'center')
        }
      })
    })
  })

  describe('CTA Section - No Stray Images', () => {
    it('should not contain music production setup image or caption', () => {
      cy.contains('music production setup').should('not.exist')
      cy.get('img[alt*="music production setup"]').should('not.exist')
      cy.get('img[alt*="Music production setup"]').should('not.exist')
    })

    it('should have centered CTA content', () => {
      cy.contains('Ready to create your next hit?').should('be.visible')
        .and('have.css', 'text-align', 'center')
      
      cy.contains('Ready to create your next hit?').closest('section')
        .should('have.class', 'text-center')
    })

    it('should have proper button layout', () => {
      cy.contains('Get Started').should('be.visible')
      cy.contains('Learn More').should('be.visible')
      
      // Check buttons are in proper flex container
      cy.contains('Get Started').parent().should('have.class', 'flex')
    })
  })

  describe('Footer Alignment with Header', () => {
    it('should match header container styling', () => {
      cy.get('footer div').first()
        .should('have.class', 'mx-auto')
        .and('have.class', 'max-w-7xl')
        .and('have.class', 'justify-between')
        .and('have.class', 'px-6')
        .and('have.class', 'lg:px-8')
    })

    it('should have proper text leading for alignment', () => {
      cy.get('footer p').should('have.class', 'leading-none')
      cy.get('footer nav').should('have.class', 'leading-none')
    })

    it('should align footer edges with header edges', () => {
      cy.viewport(1440, 900)
      
      // Get header container left edge
      cy.get('header div').first().then($headerContainer => {
        const headerRect = $headerContainer[0].getBoundingClientRect()
        const headerLeft = headerRect.left
        
        // Get footer container left edge
        cy.get('footer div').first().then($footerContainer => {
          const footerRect = $footerContainer[0].getBoundingClientRect()
          const footerLeft = footerRect.left
          
          // They should align within 1px
          expect(Math.abs(headerLeft - footerLeft)).to.be.lessThan(2)
        })
      })
    })
  })

  describe('Overall Visual Consistency', () => {
    it('should have consistent max-width containers', () => {
      // Header
      cy.get('header div').first().should('have.class', 'max-w-7xl')
      
      // Footer  
      cy.get('footer div').first().should('have.class', 'max-w-7xl')
      
      // Hero content containers should be properly sized
      cy.get('h1').should('have.class', 'max-w-4xl')
    })

    it('should maintain visual balance across sections', () => {
      cy.viewport(1440, 900)
      
      // Check that all main sections are visible
      cy.get('h1').contains('Find Your Perfect Studio Today').should('be.visible')
      cy.get('h2').contains('Some of Our Studios').should('be.visible')
      cy.get('h2').contains('Ready to create your next hit?').should('be.visible')
      
      // Check footer is present
      cy.get('footer').should('be.visible')
    })

    it('should handle responsive breakpoints smoothly', () => {
      const viewports = [
        [1920, 1080],
        [1440, 900],
        [1024, 768],
        [768, 1024]
      ]

      viewports.forEach(([width, height]) => {
        cy.viewport(width, height)
        
        // All main sections should remain visible and centered
        cy.get('h1').should('be.visible')
        cy.get('h2').contains('Some of Our Studios').should('be.visible')
        cy.get('footer').should('be.visible')
        
        // Header should maintain structure
        cy.get('header').should('be.visible')
        cy.get('header a[href="/"]').should('be.visible')
        cy.get('header nav').should('be.visible')
      })
    })
  })

  describe('Screenshot Comparison Test', () => {
    it('should capture layout for visual regression testing', () => {
      cy.viewport(1440, 900)
      
      // Wait for any loading to complete
      cy.wait(1000)
      
      // Take screenshot of full page
      cy.screenshot('final-home-page-layout', {
        capture: 'fullPage',
        overwrite: true
      })
      
      // Take specific section screenshots
      cy.get('header').screenshot('header-alignment')
      cy.get('section').first().screenshot('hero-centering')
      cy.get('footer').screenshot('footer-alignment')
    })
  })
}) 