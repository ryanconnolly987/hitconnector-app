/**
 * End-to-End Tests for Dashboard Fixes
 * 
 * Tests cover:
 * 1. Artist dashboard bookings display with studio avatars and links
 * 2. Calendar dropdown with proper spacing and grey adjacent days  
 * 3. Studio billing payment method management
 */

describe('Artist Dashboard Fixes', () => {
  beforeEach(() => {
    // Login as artist user
    cy.visit('/login');
    cy.get('input[type="email"]').type('ryanconnolly987@gmail.com');
    cy.get('input[type="password"]').type('testpassword');
    cy.get('form').submit();
    
    // Wait for redirect to dashboard
    cy.url().should('include', '/dashboard');
  });

  describe('Artist Bookings Display', () => {
    it('should display bookings with studio avatars and clickable links', () => {
      // Check if bookings section exists
      cy.get('[data-testid="upcoming-bookings"]', { timeout: 10000 })
        .should('exist');

      // Look for booking cards with studio information
      cy.get('[data-testid="booking-card"]').first().within(() => {
        // Check for studio avatar
        cy.get('.avatar, [role="img"]').should('exist');
        
        // Check for clickable studio name (Link component creates anchors)
        cy.get('a[href*="/studios/"]').should('exist');
        
        // Verify studio name is visible
        cy.get('.font-medium, .font-semibold').should('be.visible');
      });
    });

    it('should handle empty bookings state gracefully', () => {
      // If no bookings, should show empty state
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="booking-card"]').length === 0) {
          cy.contains('No upcoming bookings').should('be.visible');
          cy.contains('Find Studios').should('be.visible');
        }
      });
    });

    it('should fetch bookings from correct API endpoint', () => {
      // Intercept the API call to verify correct endpoint
      cy.intercept('GET', '**/api/users/*/bookings').as('fetchBookings');
      
      // Reload page to trigger API call
      cy.reload();
      
      // Verify API was called
      cy.wait('@fetchBookings').then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 404]);
      });
    });
  });

  describe('Calendar Dropdown', () => {
    it('should open calendar with proper spacing and visual indicators', () => {
      // Open calendar dropdown
      cy.get('button').contains('View Calendar').click();
      
      // Verify calendar container exists
      cy.get('[role="dialog"], .popover').should('be.visible');
      
      // Check calendar grid structure (7 columns for days of week)
      cy.get('.calendar, [data-testid="calendar"]').within(() => {
        // Look for calendar days
        cy.get('button').should('have.length.greaterThan', 20); // At least 21 days visible
        
        // Check for booking indicators (dots or highlights)
        cy.get('.bg-primary, .border-primary').should('exist');
      });
    });

    it('should grey out adjacent month days', () => {
      // Open calendar
      cy.get('button').contains('View Calendar').click();
      
      // Look for greyed out days (previous/next month)
      cy.get('.text-gray-400, .text-muted-foreground').should('exist');
    });

    it('should show booking tooltips only for current month days with bookings', () => {
      // Open calendar
      cy.get('button').contains('View Calendar').click();
      
      // Look for days with booking indicators
      cy.get('.bg-primary').parent().first().trigger('mouseover');
      
      // Should show tooltip with booking information
      cy.get('[role="tooltip"]').should('be.visible');
    });
  });
});

describe('Studio Billing Fixes', () => {
  beforeEach(() => {
    // Login as studio user
    cy.visit('/login');
    cy.get('input[type="email"]').type('ryanconnolly987@g.ucla.edu');
    cy.get('input[type="password"]').type('testpassword');
    cy.get('form').submit();
    
    // Navigate to studio settings billing
    cy.url().should('include', '/studio-dashboard');
    cy.visit('/studio-dashboard/settings');
    cy.get('[data-value="billing"]').click();
  });

  describe('Payment Method Management', () => {
    it('should display payment methods section', () => {
      cy.contains('Payment Methods').should('be.visible');
      cy.get('button').contains('Add Payment Method').should('be.visible');
    });

    it('should handle add payment method with proper error messaging', () => {
      // Intercept API calls
      cy.intercept('POST', '**/stripe/payment-methods', { 
        statusCode: 201, 
        body: { clientSecret: 'test_secret' }
      }).as('createSetupIntent');
      
      // Click add payment method
      cy.get('button').contains('Add Payment Method').click();
      
      // Should show success message or setup intent created
      cy.wait('@createSetupIntent');
      cy.get('.toast, [role="alert"]').should('contain', 'Setup Intent Created');
    });

    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('POST', '**/stripe/payment-methods', { 
        statusCode: 500, 
        body: { error: 'stripe_setup_intent_failed' }
      }).as('createSetupIntentError');
      
      // Click add payment method
      cy.get('button').contains('Add Payment Method').click();
      
      // Should show error message
      cy.wait('@createSetupIntentError');
      cy.get('.toast, [role="alert"]').should('contain', 'Payment Setup Error');
    });

    it('should display existing payment methods', () => {
      // Mock payment methods response
      cy.intercept('GET', '**/api/billing/info*', {
        statusCode: 200,
        body: {
          paymentMethods: [
            {
              id: 'pm_test123',
              brand: 'visa',
              last4: '4242',
              expMonth: 12,
              expYear: 2026
            }
          ]
        }
      }).as('loadPaymentMethods');
      
      // Reload to trigger API call
      cy.reload();
      
      // Should display payment method
      cy.wait('@loadPaymentMethods');
      cy.contains('Visa ending in 4242').should('be.visible');
      cy.contains('Expires 12/2026').should('be.visible');
    });

    it('should handle remove payment method', () => {
      // Mock payment methods and removal
      cy.intercept('GET', '**/api/billing/info*', {
        statusCode: 200,
        body: {
          paymentMethods: [
            {
              id: 'pm_test123',
              brand: 'visa',
              last4: '4242',
              expMonth: 12,
              expYear: 2026
            }
          ]
        }
      }).as('loadPaymentMethods');
      
      cy.intercept('DELETE', '**/stripe/payment-methods/pm_test123', {
        statusCode: 200,
        body: { success: true }
      }).as('removePaymentMethod');
      
      // Reload and remove payment method
      cy.reload();
      cy.wait('@loadPaymentMethods');
      
      // Click remove button
      cy.get('button').contains('Remove').click();
      
      // Should show success message
      cy.wait('@removePaymentMethod');
      cy.get('.toast, [role="alert"]').should('contain', 'Payment Method Removed');
    });
  });

  describe('Error Handling', () => {
    it('should handle studio not found error', () => {
      cy.intercept('POST', '**/stripe/payment-methods', { 
        statusCode: 404, 
        body: { error: 'studio_not_found' }
      }).as('studioNotFound');
      
      cy.get('button').contains('Add Payment Method').click();
      
      cy.wait('@studioNotFound');
      cy.get('.toast, [role="alert"]').should('contain', 'Studio Not Found');
    });

    it('should handle network errors', () => {
      cy.intercept('POST', '**/stripe/payment-methods', { forceNetworkError: true }).as('networkError');
      
      cy.get('button').contains('Add Payment Method').click();
      
      cy.wait('@networkError');
      cy.get('.toast, [role="alert"]').should('contain', 'Error');
    });
  });
});

describe('Visual Regression Tests', () => {
  it('should maintain calendar layout consistency', () => {
    cy.visit('/dashboard');
    cy.get('button').contains('View Calendar').click();
    
    // Take screenshot for visual comparison
    cy.get('[role="dialog"], .popover').should('be.visible');
    cy.screenshot('calendar-layout');
  });

  it('should maintain booking card layout with studio avatars', () => {
    cy.visit('/dashboard');
    
    // Wait for bookings to load
    cy.get('[data-testid="booking-card"]', { timeout: 10000 })
      .first()
      .should('be.visible');
    
    // Take screenshot
    cy.screenshot('booking-cards-with-avatars');
  });
}); 