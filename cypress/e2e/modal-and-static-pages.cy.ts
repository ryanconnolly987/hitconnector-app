/**
 * Cypress E2E tests for Modal and Static Info Pages
 * Tests HowItWorksModal functionality and static page navigation
 */

describe('Modal and Static Info Pages', () => {
  beforeEach(() => {
    // Reset any state and ensure we start fresh
    cy.window().then((win) => {
      win.localStorage.clear()
    })
  })

  describe('How It Works Modal', () => {
    it('should open modal when "How It Works" is clicked in navigation', () => {
      cy.visit('/')
      
      // Click the "How It Works" button in navigation
      cy.get('button:contains("How It Works")').click()
      
      // Modal should appear
      cy.get('[role="dialog"]').should('be.visible')
      cy.contains('How It Works').should('be.visible')
      
      // Should show tabs
      cy.get('[role="tab"]:contains("For Artists")').should('be.visible')
      cy.get('[role="tab"]:contains("For Studios")').should('be.visible')
    })

    it('should display artist content by default', () => {
      cy.visit('/')
      cy.get('button:contains("How It Works")').click()
      
      // Should show artist content by default
      cy.contains('For Artists & Rappers').should('be.visible')
      cy.contains('Discover Studios:').should('be.visible')
      cy.contains('View Detailed Profiles:').should('be.visible')
    })

    it('should switch to studio content when studio tab is clicked', () => {
      cy.visit('/')
      cy.get('button:contains("How It Works")').click()
      
      // Click studio tab
      cy.get('[role="tab"]:contains("For Studios")').click()
      
      // Should show studio content
      cy.contains('For Recording Studios').should('be.visible')
      cy.contains('Create Your Profile:').should('be.visible')
      cy.contains('Manage Bookings:').should('be.visible')
    })

    it('should close modal when clicking outside or pressing escape', () => {
      cy.visit('/')
      cy.get('button:contains("How It Works")').click()
      
      // Modal should be visible
      cy.get('[role="dialog"]').should('be.visible')
      
      // Click outside the modal (on backdrop)
      cy.get('[role="dialog"]').parent().click({ force: true })
      
      // Modal should be closed
      cy.get('[role="dialog"]').should('not.exist')
    })

    it('should close modal when close button is clicked', () => {
      cy.visit('/')
      cy.get('button:contains("How It Works")').click()
      
      // Modal should be visible
      cy.get('[role="dialog"]').should('be.visible')
      
      // Click close button (X)
      cy.get('[role="dialog"] button[aria-label="Close"]').click({ force: true })
      
      // Modal should be closed
      cy.get('[role="dialog"]').should('not.exist')
    })
  })

  describe('Learn More Landing Page', () => {
    it('should navigate to /learn-more when Learn More button is clicked', () => {
      cy.visit('/')
      
      // Click Learn More button in CTA section
      cy.get('a:contains("Learn More")').click()
      
      // Should navigate to learn-more page
      cy.url().should('include', '/learn-more')
      cy.contains('Learn More About HitConnector').should('be.visible')
    })

    it('should contain all required content on learn-more page', () => {
      cy.visit('/learn-more')
      
      // Check page title and subtitle
      cy.contains('Learn More About HitConnector').should('be.visible')
      cy.contains('Your One‑Stop Platform for Booking & Managing Recording Sessions').should('be.visible')
      
      // Check content paragraphs
      cy.contains('HitConnector is revolutionizing how artists and recording studios connect').should('be.visible')
      cy.contains('For artists, discovering and booking studio time').should('be.visible')
      cy.contains('For recording studios, HitConnector provides').should('be.visible')
    })

    it('should have working Sign Up and Back to Home buttons', () => {
      cy.visit('/learn-more')
      
      // Check Sign Up button
      cy.get('a:contains("Sign Up")').should('have.attr', 'href', '/signup')
      
      // Check Back to Home button
      cy.get('a:contains("Back to Home")').should('have.attr', 'href', '/')
      
      // Test Back to Home functionality
      cy.get('a:contains("Back to Home")').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })

  describe('Static Pages Navigation', () => {
    it('should navigate to Terms page from footer', () => {
      cy.visit('/')
      
      // Click Terms link in footer
      cy.get('footer a:contains("Terms")').click()
      
      // Should navigate to terms page
      cy.url().should('include', '/terms')
      cy.contains('HitConnector Terms of Service').should('be.visible')
    })

    it('should navigate to Privacy page from footer', () => {
      cy.visit('/')
      
      // Click Privacy link in footer
      cy.get('footer a:contains("Privacy")').click()
      
      // Should navigate to privacy page
      cy.url().should('include', '/privacy')
      cy.contains('Privacy Policy').should('be.visible')
    })

    it('should navigate to Contact page from footer', () => {
      cy.visit('/')
      
      // Click Contact link in footer
      cy.get('footer a:contains("Contact")').click()
      
      // Should navigate to contact page
      cy.url().should('include', '/contact')
      cy.contains('Contact Us').should('be.visible')
    })
  })

  describe('Terms of Service Page', () => {
    it('should contain all required sections', () => {
      cy.visit('/terms')
      
      // Check main heading
      cy.contains('HitConnector Terms of Service').should('be.visible')
      
      // Check key sections
      cy.contains('1. Acceptance of Terms').should('be.visible')
      cy.contains('2. Use License').should('be.visible')
      cy.contains('6. Payment Terms').should('be.visible')
      cy.contains('10. Contact Information').should('be.visible')
    })

    it('should have working legal email link', () => {
      cy.visit('/terms')
      
      // Check legal email link
      cy.get('a[href="mailto:legal@hitconnector.com"]').should('be.visible')
      cy.get('a[href="mailto:legal@hitconnector.com"]').should('contain', 'legal@hitconnector.com')
    })
  })

  describe('Privacy Policy Page', () => {
    it('should contain all required sections', () => {
      cy.visit('/privacy')
      
      // Check main heading
      cy.contains('Privacy Policy').should('be.visible')
      
      // Check key sections
      cy.contains('1. Information We Collect').should('be.visible')
      cy.contains('2. How We Use Your Information').should('be.visible')
      cy.contains('6. Your Rights').should('be.visible')
      cy.contains('9. Contact Us').should('be.visible')
    })

    it('should have working privacy email link', () => {
      cy.visit('/privacy')
      
      // Check privacy email link
      cy.get('a[href="mailto:privacy@hitconnector.com"]').should('be.visible')
      cy.get('a[href="mailto:privacy@hitconnector.com"]').should('contain', 'privacy@hitconnector.com')
    })
  })

  describe('Contact Page', () => {
    it('should contain all contact sections', () => {
      cy.visit('/contact')
      
      // Check main heading
      cy.contains('Contact Us').should('be.visible')
      
      // Check contact sections
      cy.contains('General Support').should('be.visible')
      cy.contains('Business Inquiries').should('be.visible')
      cy.contains('Technical Issues').should('be.visible')
      cy.contains('Legal & Privacy').should('be.visible')
      cy.contains('Studio Onboarding').should('be.visible')
    })

    it('should have all email contact links working', () => {
      cy.visit('/contact')
      
      // Check all email links
      cy.get('a[href="mailto:support@hitconnector.com"]').should('be.visible')
      cy.get('a[href="mailto:business@hitconnector.com"]').should('be.visible')
      cy.get('a[href="mailto:tech@hitconnector.com"]').should('be.visible')
      cy.get('a[href="mailto:legal@hitconnector.com"]').should('be.visible')
      cy.get('a[href="mailto:studios@hitconnector.com"]').should('be.visible')
      cy.get('a[href="mailto:feedback@hitconnector.com"]').should('be.visible')
    })

    it('should display office hours and mailing address', () => {
      cy.visit('/contact')
      
      // Check office hours section
      cy.contains('Office Hours').should('be.visible')
      cy.contains('Monday - Friday: 9:00 AM - 6:00 PM (PST)').should('be.visible')
      
      // Check mailing address
      cy.contains('Mailing Address').should('be.visible')
      cy.contains('HitConnector Inc.').should('be.visible')
      cy.contains('Los Angeles, CA 90028').should('be.visible')
    })
  })

  describe('Cross-Page Navigation', () => {
    it('should maintain proper navigation flow between all new pages', () => {
      // Start from homepage
      cy.visit('/')
      
      // Navigate to Learn More
      cy.get('a:contains("Learn More")').click()
      cy.url().should('include', '/learn-more')
      
      // Go back to home
      cy.get('a:contains("Back to Home")').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      
      // Navigate to Terms from footer
      cy.get('footer a:contains("Terms")').click()
      cy.url().should('include', '/terms')
      
      // Navigate to Privacy from footer (while on Terms page)
      cy.get('footer a:contains("Privacy")').click()
      cy.url().should('include', '/privacy')
      
      // Navigate to Contact from footer (while on Privacy page)
      cy.get('footer a:contains("Contact")').click()
      cy.url().should('include', '/contact')
    })
  })

  describe('Responsive Design', () => {
    it('should work properly on mobile devices', () => {
      cy.viewport('iphone-6')
      cy.visit('/')
      
      // Test modal on mobile
      cy.get('button:contains("How It Works")').should('not.be.visible') // Hidden on mobile
      
      // Test static pages on mobile
      cy.visit('/learn-more')
      cy.contains('Learn More About HitConnector').should('be.visible')
      
      cy.visit('/terms')
      cy.contains('HitConnector Terms of Service').should('be.visible')
      
      cy.visit('/privacy')
      cy.contains('Privacy Policy').should('be.visible')
      
      cy.visit('/contact')
      cy.contains('Contact Us').should('be.visible')
    })

    it('should work properly on tablet devices', () => {
      cy.viewport('ipad-2')
      cy.visit('/')
      
      // Test modal on tablet
      cy.get('button:contains("How It Works")').click()
      cy.get('[role="dialog"]').should('be.visible')
      
      // Test static pages on tablet
      cy.visit('/learn-more')
      cy.contains('Learn More About HitConnector').should('be.visible')
      
      // Check button layout on tablet
      cy.get('a:contains("Sign Up")').should('be.visible')
      cy.get('a:contains("Back to Home")').should('be.visible')
    })
  })
}) 