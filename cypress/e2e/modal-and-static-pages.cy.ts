/// <reference types="cypress" />

describe('Modal + Static Info Pages - Complete E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('How It Works Modal Functionality', () => {
    it('should open modal when "How It Works" is clicked in header', () => {
      cy.get('button').contains('How It Works').click()
      cy.get('[role="dialog"]').should('be.visible')
      cy.get('[role="dialog"]').should('contain', 'How It Works')
    })

    it('should display both tab triggers', () => {
      cy.get('button').contains('How It Works').click()
      cy.get('[role="dialog"]').within(() => {
        cy.get('[role="tab"]').contains('For Artists').should('be.visible')
        cy.get('[role="tab"]').contains('For Studios').should('be.visible')
      })
    })

    it('should show artist content by default', () => {
      cy.get('button').contains('How It Works').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Getting Started as an Artist').should('be.visible')
        cy.contains('Create Your Profile').should('be.visible')
      })
    })

    it('should switch to studio content when studio tab is clicked', () => {
      cy.get('button').contains('How It Works').click()
      cy.get('[role="dialog"]').within(() => {
        cy.get('[role="tab"]').contains('For Studios').click()
        cy.contains('Getting Started as a Studio').should('be.visible')
        cy.contains('Register Your Studio').should('be.visible')
      })
    })

    it('should contain all 7 numbered steps for artists', () => {
      cy.get('button').contains('How It Works').click()
      cy.get('[role="dialog"]').within(() => {
        for (let i = 1; i <= 7; i++) {
          cy.contains(i.toString()).should('be.visible')
        }
      })
    })

    it('should contain all 7 numbered steps for studios', () => {
      cy.get('button').contains('How It Works').click()
      cy.get('[role="dialog"]').within(() => {
        cy.get('[role="tab"]').contains('For Studios').click()
        for (let i = 1; i <= 7; i++) {
          cy.contains(i.toString()).should('be.visible')
        }
      })
    })

    it('should have scrollable content area', () => {
      cy.get('button').contains('How It Works').click()
      cy.get('[role="dialog"]').within(() => {
        cy.get('[data-radix-scroll-area-viewport]').should('exist')
      })
    })

    it('should close modal when ESC key is pressed', () => {
      cy.get('button').contains('How It Works').click()
      cy.get('[role="dialog"]').should('be.visible')
      cy.get('body').type('{esc}')
      cy.get('[role="dialog"]').should('not.exist')
    })

    it('should close modal when clicking outside', () => {
      cy.get('button').contains('How It Works').click()
      cy.get('[role="dialog"]').should('be.visible')
      cy.get('[data-radix-dialog-overlay]').click({ force: true })
      cy.get('[role="dialog"]').should('not.exist')
    })
  })

  describe('Learn More Page Navigation', () => {
    it('should navigate to learn-more page when "Learn More" button is clicked', () => {
      cy.contains('Learn More').click()
      cy.url().should('include', '/learn-more')
    })

    it('should display correct page content', () => {
      cy.visit('/learn-more')
      cy.get('h1').should('contain', 'Learn More About HitConnector')
      cy.get('h2').should('contain', 'Your One‑Stop Platform for Booking')
    })

    it('should have Sign Up button that links to signup page', () => {
      cy.visit('/learn-more')
      cy.get('a').contains('Sign Up').should('have.attr', 'href', '/signup')
    })

    it('should have Back to Home button that links to home page', () => {
      cy.visit('/learn-more')
      cy.get('a').contains('Back to Home').should('have.attr', 'href', '/')
      cy.get('a').contains('Back to Home').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })

    it('should contain comprehensive content about the platform', () => {
      cy.visit('/learn-more')
      cy.contains('For Artists:').should('be.visible')
      cy.contains('For Studios:').should('be.visible')
      cy.contains('Why Choose HitConnector?').should('be.visible')
    })
  })

  describe('Static Pages - Terms, Privacy, Contact', () => {
    describe('Terms Page', () => {
      it('should navigate to terms page from footer', () => {
        cy.get('footer a').contains('Terms').click()
        cy.url().should('include', '/terms')
      })

      it('should display correct page title and content', () => {
        cy.visit('/terms')
        cy.get('h1').should('contain', 'HitConnector Terms of Service')
        cy.contains('Effective Date:').should('be.visible')
        cy.contains('Last Updated:').should('be.visible')
      })

      it('should contain all required sections', () => {
        cy.visit('/terms')
        const expectedSections = [
          'Acceptance of Terms',
          'Use License',
          'User Accounts',
          'Booking and Payment Terms',
          'Contact Information'
        ]
        
        expectedSections.forEach(section => {
          cy.contains(section).should('be.visible')
        })
      })

      it('should have contact email link', () => {
        cy.visit('/terms')
        cy.get('a[href="mailto:legal@hitconnector.com"]').should('be.visible')
      })

      it('should contain numbered sections 1-13', () => {
        cy.visit('/terms')
        for (let i = 1; i <= 13; i++) {
          cy.contains(`${i}.`).should('be.visible')
        }
      })
    })

    describe('Privacy Page', () => {
      it('should navigate to privacy page from footer', () => {
        cy.get('footer a').contains('Privacy').click()
        cy.url().should('include', '/privacy')
      })

      it('should display correct page title and content', () => {
        cy.visit('/privacy')
        cy.get('h1').should('contain', 'HitConnector Privacy Policy')
        cy.contains('Effective Date:').should('be.visible')
      })

      it('should contain all required sections', () => {
        cy.visit('/privacy')
        const expectedSections = [
          'Information We Collect',
          'How We Use Your Information',
          'Data Security',
          'Your Rights',
          'Contact Us'
        ]
        
        expectedSections.forEach(section => {
          cy.contains(section).should('be.visible')
        })
      })

      it('should have contact email link', () => {
        cy.visit('/privacy')
        cy.get('a[href="mailto:privacy@hitconnector.com"]').should('be.visible')
      })

      it('should contain numbered sections 1-12', () => {
        cy.visit('/privacy')
        for (let i = 1; i <= 12; i++) {
          cy.contains(`${i}.`).should('be.visible')
        }
      })
    })

    describe('Contact Page', () => {
      it('should navigate to contact page from footer', () => {
        cy.get('footer a').contains('Contact').click()
        cy.url().should('include', '/contact')
      })

      it('should display correct page title and content', () => {
        cy.visit('/contact')
        cy.get('h1').should('contain', 'Contact HitConnector')
      })

      it('should contain all contact email links', () => {
        cy.visit('/contact')
        const emailAddresses = [
          'support@hitconnector.com',
          'partnerships@hitconnector.com',
          'tech@hitconnector.com',
          'studios@hitconnector.com',
          'legal@hitconnector.com',
          'privacy@hitconnector.com',
          'hello@hitconnector.com'
        ]

        emailAddresses.forEach(email => {
          cy.get(`a[href="mailto:${email}"]`).should('be.visible')
        })
      })

      it('should contain all major sections', () => {
        cy.visit('/contact')
        const expectedSections = [
          'Get in Touch',
          'Specialized Support',
          'Legal & Privacy',
          'Frequently Asked Questions',
          'Company Information'
        ]
        
        expectedSections.forEach(section => {
          cy.contains(section).should('be.visible')
        })
      })

      it('should contain FAQ section with questions', () => {
        cy.visit('/contact')
        cy.contains('How do I create an account?').should('be.visible')
        cy.contains('How does booking work?').should('be.visible')
        cy.contains('What payment methods do you accept?').should('be.visible')
        cy.contains('How do I list my studio?').should('be.visible')
      })

      it('should display company information', () => {
        cy.visit('/contact')
        cy.contains('HitConnector Inc.').should('be.visible')
        cy.contains('123 Music Row, Los Angeles').should('be.visible')
      })
    })
  })

  describe('Footer Links Integration', () => {
    it('should have all footer links working correctly', () => {
      // Terms link
      cy.get('footer a').contains('Terms').should('have.attr', 'href', '/terms')
      
      // Privacy link  
      cy.get('footer a').contains('Privacy').should('have.attr', 'href', '/privacy')
      
      // Contact link
      cy.get('footer a').contains('Contact').should('have.attr', 'href', '/contact')
    })

    it('should navigate between static pages correctly', () => {
      // Go to Terms
      cy.get('footer a').contains('Terms').click()
      cy.url().should('include', '/terms')
      
      // Go to Privacy
      cy.get('footer a').contains('Privacy').click()
      cy.url().should('include', '/privacy')
      
      // Go to Contact
      cy.get('footer a').contains('Contact').click()
      cy.url().should('include', '/contact')
    })
  })

  describe('Page Metadata and SEO', () => {
    it('should have correct page titles', () => {
      cy.visit('/learn-more')
      cy.title().should('eq', 'Learn More | HitConnector')
      
      cy.visit('/terms')
      cy.title().should('eq', 'Terms of Service | HitConnector')
      
      cy.visit('/privacy')
      cy.title().should('eq', 'Privacy Policy | HitConnector')
      
      cy.visit('/contact')
      cy.title().should('eq', 'Contact Us | HitConnector')
    })
  })

  describe('Responsive Design Tests', () => {
    const viewports = [
      [1920, 1080],
      [1440, 900],
      [1024, 768],
      [768, 1024],
      [375, 667]
    ]

    viewports.forEach(([width, height]) => {
      it(`should work correctly on ${width}x${height} viewport`, () => {
        cy.viewport(width, height)
        
        // Test modal
        cy.get('button').contains('How It Works').click()
        cy.get('[role="dialog"]').should('be.visible')
        cy.get('body').type('{esc}')
        
        // Test Learn More
        cy.contains('Learn More').click()
        cy.url().should('include', '/learn-more')
        
        // Test footer links
        cy.visit('/')
        cy.get('footer a').contains('Terms').should('be.visible')
        cy.get('footer a').contains('Privacy').should('be.visible')
        cy.get('footer a').contains('Contact').should('be.visible')
      })
    })
  })

  describe('Accessibility Tests', () => {
    it('should have proper ARIA attributes on modal', () => {
      cy.get('button').contains('How It Works').click()
      cy.get('[role="dialog"]').should('have.attr', 'aria-labelledby')
      cy.get('[role="tablist"]').should('exist')
      cy.get('[role="tab"]').should('have.length', 2)
    })

    it('should have proper heading hierarchy on static pages', () => {
      cy.visit('/learn-more')
      cy.get('h1').should('have.length', 1)
      cy.get('h2').should('exist')
      
      cy.visit('/terms')
      cy.get('h1').should('have.length', 1)
      cy.get('h2').should('exist')
    })

    it('should have proper semantic structure', () => {
      cy.visit('/learn-more')
      cy.get('main').should('exist')
      
      cy.visit('/terms')
      cy.get('main').should('exist')
      
      cy.visit('/contact')
      cy.get('main').should('exist')
    })
  })
}) 