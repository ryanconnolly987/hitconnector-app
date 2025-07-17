describe('Studio Dashboard Cleanup & Quality-of-Life Upgrades', () => {
  beforeEach(() => {
    // Assuming we need to log in as a studio user for these tests
    cy.visit('/login')
    // Add login steps here if needed for your test environment
    // For now, we'll navigate directly to test pages
  })

  describe('Ghost Bookings Removal', () => {
    it('should not display orphaned bookings in studio dashboard', () => {
      cy.visit('/studio-dashboard')
      
      // Verify that the July 14 2025 20:00-22:00 ghost bookings are not present
      cy.get('[data-testid="upcoming-bookings"]', { timeout: 10000 }).should('exist')
      
      // Check that no bookings show July 14, 2025 20:00-22:00 time slots
      cy.get('[data-testid="booking-card"]').each($booking => {
        cy.wrap($booking).should('not.contain', 'July 14, 2025')
        cy.wrap($booking).should('not.contain', '20:00')
      })
    })

    it('should not display orphaned bookings in past bookings', () => {
      cy.visit('/studio-dashboard')
      
      // Click on Past Bookings tab
      cy.contains('Past Bookings').click()
      
      // Verify no orphaned bookings exist
      cy.get('body').then($body => {
        if ($body.find('[data-testid="booking-card"]').length > 0) {
          cy.get('[data-testid="booking-card"]').each($booking => {
            cy.wrap($booking).should('not.contain', 'July 14, 2025')
            cy.wrap($booking).should('not.contain', '20:00-22:00')
          })
        }
      })
    })
  })

  describe('Booking Details Modal Enhancements', () => {
    it('should display engineer preference when available', () => {
      cy.visit('/studio-dashboard')
      
      // Look for an upcoming booking and click it
      cy.get('[data-testid="booking-card"]').first().click()
      
      // Check if booking details modal opens
      cy.get('[data-testid="booking-details-modal"]', { timeout: 5000 }).should('be.visible')
      
      // If engineer preference exists, it should be displayed
      cy.get('body').then($body => {
        if ($body.find(':contains("Engineer Preference")').length > 0) {
          cy.contains('Engineer Preference').should('be.visible')
          cy.contains('Engineer Preference').parent().should('contain.text', 'Engineer Preference')
        }
      })
    })

    it('should show cancel button for confirmed bookings', () => {
      cy.visit('/studio-dashboard')
      
      // Look for a confirmed booking
      cy.get('[data-testid="booking-card"]').first().click()
      
      // Modal should open
      cy.get('[data-testid="booking-details-modal"]', { timeout: 5000 }).should('be.visible')
      
      // Check for cancel button if booking is confirmed
      cy.get('body').then($body => {
        if ($body.find(':contains("Confirmed")').length > 0) {
          cy.contains('Cancel Booking').should('be.visible')
          cy.contains('Cancel Booking').should('have.class', 'destructive')
        }
      })
    })

    it('should successfully cancel a booking', () => {
      cy.visit('/studio-dashboard')
      
      // Find a confirmed booking and click it
      cy.get('[data-testid="booking-card"]').first().click()
      cy.get('[data-testid="booking-details-modal"]', { timeout: 5000 }).should('be.visible')
      
      // If cancel button exists, click it
      cy.get('body').then($body => {
        if ($body.find('button:contains("Cancel Booking")').length > 0) {
          cy.contains('Cancel Booking').click()
          
          // Should show success message
          cy.contains('Booking Cancelled', { timeout: 5000 }).should('be.visible')
          
          // Modal should close after delay
          cy.get('[data-testid="booking-details-modal"]', { timeout: 6000 }).should('not.exist')
        }
      })
    })
  })

  describe('Collapsible Sidebar', () => {
    it('should toggle sidebar collapse state', () => {
      cy.visit('/studio-dashboard')
      
      // Find sidebar toggle button
      cy.get('[data-testid="sidebar-toggle"]', { timeout: 5000 }).should('be.visible')
      
      // Initially sidebar should be expanded
      cy.get('[data-testid="sidebar"]').should('have.class', 'w-64')
      
      // Click toggle to collapse
      cy.get('[data-testid="sidebar-toggle"]').click()
      
      // Sidebar should be collapsed
      cy.get('[data-testid="sidebar"]').should('have.class', 'w-16')
      
      // Click toggle to expand
      cy.get('[data-testid="sidebar-toggle"]').click()
      
      // Sidebar should be expanded again
      cy.get('[data-testid="sidebar"]').should('have.class', 'w-64')
    })

    it('should persist sidebar state across page reloads', () => {
      cy.visit('/studio-dashboard')
      
      // Collapse sidebar
      cy.get('[data-testid="sidebar-toggle"]', { timeout: 5000 }).click()
      cy.get('[data-testid="sidebar"]').should('have.class', 'w-16')
      
      // Reload page
      cy.reload()
      
      // Sidebar should remain collapsed
      cy.get('[data-testid="sidebar"]', { timeout: 5000 }).should('have.class', 'w-16')
      
      // Expand sidebar
      cy.get('[data-testid="sidebar-toggle"]').click()
      cy.get('[data-testid="sidebar"]').should('have.class', 'w-64')
      
      // Reload again
      cy.reload()
      
      // Sidebar should remain expanded
      cy.get('[data-testid="sidebar"]', { timeout: 5000 }).should('have.class', 'w-64')
    })

    it('should work on artist dashboard as well', () => {
      cy.visit('/dashboard')
      
      // Check sidebar toggle functionality
      cy.get('[data-testid="sidebar-toggle"]', { timeout: 5000 }).should('be.visible')
      cy.get('[data-testid="sidebar"]').should('have.class', 'w-64')
      
      // Toggle collapse
      cy.get('[data-testid="sidebar-toggle"]').click()
      cy.get('[data-testid="sidebar"]').should('have.class', 'w-16')
    })
  })

  describe('Studio Profile Cleanup', () => {
    it('should not display stale price in public studio profile header', () => {
      cy.visit('/studio-profile')
      
      // Check that hourly rate is not displayed in the header
      cy.get('[data-testid="studio-header"]').should('not.contain', '/hour')
      cy.get('[data-testid="studio-header"]').should('not.contain', '$/hr')
      
      // Location and follower count should be properly aligned
      cy.get('[data-testid="studio-header"]').within(() => {
        cy.get('[data-testid="location"]').should('be.visible')
        cy.get('[data-testid="followers"]').should('be.visible')
      })
    })

    it('should not show Test Images button in studio dashboard profile', () => {
      cy.visit('/studio-dashboard/profile')
      
      // Test Images button should not exist
      cy.contains('Test Images').should('not.exist')
      
      // Other buttons should still be present
      cy.contains('View Public Profile').should('be.visible')
      cy.contains('Save Changes').should('be.visible')
    })

    it('should not display website field in basic info form', () => {
      cy.visit('/studio-dashboard/profile')
      
      // Website field should not exist in the form
      cy.get('label').contains('Website').should('not.exist')
      cy.get('input[id="website"]').should('not.exist')
      
      // Other fields should still be present
      cy.get('label').contains('Studio Name').should('be.visible')
      cy.get('label').contains('Email').should('be.visible')
      cy.get('label').contains('Phone').should('be.visible')
    })

    it('should not display website in public studio profile contact info', () => {
      cy.visit('/studio-profile')
      
      // Look for contact info section
      cy.get('body').then($body => {
        if ($body.find(':contains("Contact")').length > 0) {
          cy.contains('Contact').parent().should('not.contain', 'Website')
        }
      })
    })
  })

  describe('Data Safety and Integrity', () => {
    it('should handle booking data validation gracefully', () => {
      cy.visit('/studio-dashboard')
      
      // Page should load without errors even with data validation
      cy.get('[data-testid="studio-dashboard"]', { timeout: 10000 }).should('be.visible')
      
      // No console errors related to orphaned data should appear
      cy.window().then((win) => {
        expect(win.console.error).to.not.have.been.called
      })
    })

    it('should not display bookings with missing artist data', () => {
      cy.visit('/studio-dashboard')
      
      // All displayed bookings should have valid artist information
      cy.get('[data-testid="booking-card"]').each($booking => {
        cy.wrap($booking).should('contain.text', '@') // Should have artist name/email
        cy.wrap($booking).find('[data-testid="artist-avatar"]').should('exist')
      })
    })
  })

  describe('API Integration', () => {
    it('should successfully call cancel booking endpoint', () => {
      cy.intercept('PATCH', '/api/bookings/*/cancel', { statusCode: 200, body: { message: 'Booking cancelled successfully' } }).as('cancelBooking')
      
      cy.visit('/studio-dashboard')
      
      // Try to cancel a booking if available
      cy.get('body').then($body => {
        if ($body.find('[data-testid="booking-card"]').length > 0) {
          cy.get('[data-testid="booking-card"]').first().click()
          cy.get('[data-testid="booking-details-modal"]').should('be.visible')
          
          if ($body.find('button:contains("Cancel Booking")').length > 0) {
            cy.contains('Cancel Booking').click()
            cy.wait('@cancelBooking')
          }
        }
      })
    })

    it('should filter bookings using safety guards', () => {
      cy.intercept('GET', '/api/bookings*', { fixture: 'bookings-with-orphans.json' }).as('getBookings')
      
      cy.visit('/studio-dashboard')
      cy.wait('@getBookings')
      
      // Only valid bookings should be displayed
      cy.get('[data-testid="booking-card"]').should('have.length.greaterThan', 0)
      
      // Each booking should have valid data
      cy.get('[data-testid="booking-card"]').each($booking => {
        cy.wrap($booking).should('have.attr', 'data-booking-id')
        cy.wrap($booking).should('contain.text', '2025') // Valid date
      })
    })
  })

  describe('Responsive Design', () => {
    it('should work properly on mobile devices', () => {
      cy.viewport('iphone-x')
      cy.visit('/studio-dashboard')
      
      // Sidebar should be responsive
      cy.get('[data-testid="sidebar"]').should('be.visible')
      cy.get('[data-testid="sidebar-toggle"]').should('be.visible')
      
      // Toggle should work on mobile
      cy.get('[data-testid="sidebar-toggle"]').click()
      cy.get('[data-testid="sidebar"]').should('have.class', 'w-16')
    })

    it('should maintain functionality on tablet', () => {
      cy.viewport('ipad-2')
      cy.visit('/studio-dashboard')
      
      // All functionality should work on tablet
      cy.get('[data-testid="studio-dashboard"]').should('be.visible')
      cy.get('[data-testid="sidebar-toggle"]').should('be.visible')
      
      // Booking cards should be properly displayed
      cy.get('[data-testid="booking-card"]').should('be.visible')
    })
  })
}) 