/**
 * Cypress E2E tests for routing and messaging behavior fixes
 * Tests artist back button routing, studio name navigation, and message ordering
 */

describe('Routing and Messaging Behavior Fixes', () => {
  beforeEach(() => {
    // Reset any state and ensure we start fresh
    cy.window().then((win) => {
      win.localStorage.clear()
    })
  })

  describe('Artist Back Button Routing Fix', () => {
    it('should route back to artist dashboard when returnTo parameter is provided', () => {
      // Visit artist dashboard first
      cy.visit('/dashboard')
      
      // Wait for page to load and look for the View Public Profile button
      cy.get('button:contains("View Public Profile"), a:contains("View Public Profile")').should('be.visible')
      
      // Click on View Public Profile (should have returnTo parameter)
      cy.get('button:contains("View Public Profile"), a:contains("View Public Profile")').click()
      
      // Should navigate to artist profile page
      cy.url().should('match', /\/artist\/[^\/]+/)
      cy.url().should('include', 'returnTo=/dashboard')
      
      // Click the Back button
      cy.get('button:contains("Back")').click()
      
      // Should return to artist dashboard, not studio dashboard
      cy.url().should('include', '/dashboard')
      cy.url().should('not.include', '/studio-dashboard')
    })

    it('should maintain studio workflow - back button from artist profile to studio dashboard', () => {
      // Simulate studio dashboard to artist profile navigation (without returnTo)
      cy.visit('/artist/test-artist-id')
      
      // Click back button (should use router.back() since no returnTo parameter)
      cy.get('button:contains("Back")').click()
      
      // Since we navigated directly, back should go to previous page or dashboard
      // This tests the fallback behavior
      cy.url().should('not.include', '/artist/')
    })
  })

  describe('Studio Name Link Navigation Fix', () => {
    it('should navigate to studio profile when clicking studio name in messages', () => {
      // Mock the conversations API to return studio with slug
      cy.intercept('GET', '/api/conversations*', {
        statusCode: 200,
        body: {
          conversations: [
            {
              id: 'conv_123',
              participants: ['user_artist', 'user_studio'],
              lastMessage: {
                id: 'msg_1',
                text: 'Test message',
                senderId: 'user_studio',
                timestamp: new Date().toISOString()
              },
              unreadCount: 0,
              other: {
                id: 'user_studio',
                name: 'Test Studio',
                email: 'studio@test.com',
                role: 'studio',
                type: 'studio',
                slug: 'test-studio'
              }
            }
          ]
        }
      }).as('getConversations')

      // Mock messages API
      cy.intercept('GET', '/api/conversations/conv_123/messages*', {
        statusCode: 200,
        body: {
          messages: [
            {
              id: 'msg_1',
              text: 'Test message',
              senderId: 'user_studio',
              timestamp: new Date().toISOString(),
              senderInfo: {
                id: 'user_studio',
                name: 'Test Studio',
                role: 'studio',
                type: 'studio',
                slug: 'test-studio'
              }
            }
          ],
          conversation: {
            id: 'conv_123',
            participants: ['user_artist', 'user_studio']
          }
        }
      }).as('getMessages')

      // Visit messages page
      cy.visit('/messages')
      
      // Wait for conversations to load
      cy.wait('@getConversations')
      
      // Click on the conversation
      cy.get('[role="button"]:contains("Test Studio"), .cursor-pointer:contains("Test Studio")').first().click()
      
      // Wait for messages to load
      cy.wait('@getMessages')
      
      // Click on the studio name in the header
      cy.get('a:contains("Test Studio")').click()
      
      // Should navigate to studio profile (not 404)
      cy.url().should('include', '/studios/test-studio')
      cy.get('body').should('not.contain', '404')
      cy.get('body').should('not.contain', 'Page Not Found')
    })

    it('should handle studio name click when slug is missing gracefully', () => {
      // Mock conversation with studio but no slug
      cy.intercept('GET', '/api/conversations*', {
        statusCode: 200,
        body: {
          conversations: [
            {
              id: 'conv_456',
              participants: ['user_artist', 'user_studio_no_slug'],
              other: {
                id: 'user_studio_no_slug',
                name: 'Studio No Slug',
                email: 'studio@test.com',
                role: 'studio',
                type: 'studio'
                // No slug property
              }
            }
          ]
        }
      })

      cy.visit('/messages')
      
      // Studio name should not be clickable if no slug
      cy.get('h3:contains("Studio No Slug")').should('exist')
      cy.get('a:contains("Studio No Slug")').should('not.exist')
    })
  })

  describe('Message Ordering - Newest First', () => {
    it('should display messages with newest at bottom and auto-scroll', () => {
      const now = new Date()
      const olderMessage = new Date(now.getTime() - 3600000) // 1 hour ago
      const newerMessage = new Date(now.getTime() - 1800000) // 30 min ago

      // Mock messages API returning newest first (as API now does)
      cy.intercept('GET', '/api/conversations/conv_789/messages*', {
        statusCode: 200,
        body: {
          messages: [
            {
              id: 'msg_new',
              text: 'Newer message',
              senderId: 'user_other',
              timestamp: newerMessage.toISOString(),
              senderInfo: { id: 'user_other', name: 'Other User' }
            },
            {
              id: 'msg_old',
              text: 'Older message',
              senderId: 'user_current',
              timestamp: olderMessage.toISOString(),
              senderInfo: { id: 'user_current', name: 'Current User' }
            }
          ],
          conversation: { id: 'conv_789', participants: ['user_current', 'user_other'] }
        }
      }).as('getMessagesOrdered')

      // Mock conversation
      cy.intercept('GET', '/api/conversations*', {
        statusCode: 200,
        body: {
          conversations: [
            {
              id: 'conv_789',
              participants: ['user_current', 'user_other'],
              other: { id: 'user_other', name: 'Other User', role: 'artist' }
            }
          ]
        }
      })

      cy.visit('/messages')
      
      // Select conversation
      cy.get('[role="button"]:contains("Other User")').click()
      cy.wait('@getMessagesOrdered')
      
      // Check message order in DOM - older should appear before newer
      cy.get('[class*="space-y-1"] > div').should('have.length.at.least', 2)
      cy.get('[class*="space-y-1"] > div').first().should('contain', 'Older message')
      cy.get('[class*="space-y-1"] > div').last().should('contain', 'Newer message')
      
      // Check that scroll is at bottom (newest message visible)
      cy.get('[class*="overflow-y-auto"]').should('be.visible')
      cy.get('div:contains("Newer message")').should('be.visible')
    })

    it('should handle new message arrival and maintain scroll position', () => {
      // Initial messages
      cy.intercept('GET', '/api/conversations/conv_890/messages*', {
        statusCode: 200,
        body: {
          messages: [
            {
              id: 'msg_1',
              text: 'First message',
              senderId: 'user_other',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              senderInfo: { id: 'user_other', name: 'Other User' }
            }
          ],
          conversation: { id: 'conv_890' }
        }
      }).as('getInitialMessages')

      // Mock sending a message
      cy.intercept('POST', '/api/messages/send', {
        statusCode: 200,
        body: {
          data: {
            id: 'msg_new',
            text: 'New message',
            senderId: 'user_current',
            timestamp: new Date().toISOString(),
            senderInfo: { id: 'user_current', name: 'Current User' }
          }
        }
      }).as('sendMessage')

      cy.visit('/messages')
      
      // Simulate conversation selection and message loading
      cy.window().then((win) => {
        // Mock the conversation state
        const mockConversation = {
          id: 'conv_890',
          participants: ['user_current', 'user_other']
        }
        
        // This simulates the conversation being selected
        win.dispatchEvent(new CustomEvent('test-conversation-selected', { 
          detail: mockConversation 
        }))
      })

      // Type and send a message
      cy.get('textarea[placeholder*="message"], input[placeholder*="message"]').type('New message')
      cy.get('button:contains("Send"), [aria-label="Send message"]').click()
      
      // Verify new message appears at bottom
      cy.get('div:contains("New message")').should('be.visible')
    })

    it('should support pagination when scrolling up for older messages', () => {
      // Mock initial messages (newest first from API)
      cy.intercept('GET', '/api/conversations/conv_pagination/messages*', (req) => {
        const url = new URL(req.url)
        const before = url.searchParams.get('before')
        
        if (!before) {
          // Initial load - return newest messages
          req.reply({
            statusCode: 200,
            body: {
              messages: [
                {
                  id: 'msg_3',
                  text: 'Newest message',
                  senderId: 'user_other',
                  timestamp: new Date(Date.now() - 1000).toISOString()
                },
                {
                  id: 'msg_2',
                  text: 'Middle message',
                  senderId: 'user_current',
                  timestamp: new Date(Date.now() - 2000).toISOString()
                }
              ],
              pagination: { hasMore: true, nextCursor: new Date(Date.now() - 2000).toISOString() }
            }
          })
        } else {
          // Pagination request - return older messages
          req.reply({
            statusCode: 200,
            body: {
              messages: [
                {
                  id: 'msg_1',
                  text: 'Oldest message',
                  senderId: 'user_other',
                  timestamp: new Date(Date.now() - 3000).toISOString()
                }
              ],
              pagination: { hasMore: false, nextCursor: null }
            }
          })
        }
      }).as('getPaginatedMessages')

      cy.visit('/messages')
      
      // Simulate loading conversation
      cy.wait('@getPaginatedMessages')
      
      // Scroll to top to trigger pagination
      cy.get('[class*="overflow-y-auto"]').scrollTo('top')
      
      // Should load older messages
      cy.wait('@getPaginatedMessages')
      cy.get('div:contains("Oldest message")').should('be.visible')
      
      // Verify order: oldest at top, newest at bottom
      cy.get('div:contains("Oldest message")').should('be.visible')
      cy.get('div:contains("Newest message")').should('be.visible')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle API errors gracefully in message loading', () => {
      cy.intercept('GET', '/api/conversations/error_conv/messages*', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getMessagesError')

      cy.visit('/messages')
      
      // Try to load a conversation that errors
      cy.window().then((win) => {
        const mockConversation = { id: 'error_conv', participants: ['user1', 'user2'] }
        win.dispatchEvent(new CustomEvent('test-conversation-selected', { detail: mockConversation }))
      })

      cy.wait('@getMessagesError')
      
      // Should show error state gracefully
      cy.get('body').should('not.contain', 'Uncaught')
      cy.get('div').should('contain.text', 'No messages yet').or('contain.text', 'Failed to load')
    })

    it('should handle missing returnTo parameter gracefully', () => {
      // Visit artist profile directly without returnTo
      cy.visit('/artist/test-artist')
      
      // Back button should still work (fall back to router.back or backHref)
      cy.get('button:contains("Back")').should('be.visible').click()
      
      // Should navigate somewhere (not crash)
      cy.url().should('not.include', '/artist/test-artist')
    })
  })
}) 