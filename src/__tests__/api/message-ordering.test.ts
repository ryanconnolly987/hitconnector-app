/**
 * Unit tests for message ordering API changes
 * Verifies that messages are returned in newest-first order with proper pagination
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/conversations/[id]/messages/route'

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}))

const mockMessagesData = {
  messages: [
    {
      id: 'msg_1',
      conversationId: 'conv_123',
      senderId: 'user_1',
      receiverId: 'user_2',
      text: 'First message (oldest)',
      timestamp: '2024-01-01T10:00:00.000Z',
      read: true
    },
    {
      id: 'msg_2',
      conversationId: 'conv_123',
      senderId: 'user_2',
      receiverId: 'user_1',
      text: 'Second message',
      timestamp: '2024-01-01T11:00:00.000Z',
      read: true
    },
    {
      id: 'msg_3',
      conversationId: 'conv_123',
      senderId: 'user_1',
      receiverId: 'user_2',
      text: 'Third message (newest)',
      timestamp: '2024-01-01T12:00:00.000Z',
      read: false
    }
  ],
  conversations: [
    {
      id: 'conv_123',
      participants: ['user_1', 'user_2'],
      updatedAt: '2024-01-01T12:00:00.000Z',
      unreadCount: { user_1: 0, user_2: 1 }
    }
  ]
}

const mockUsersData = [
  {
    id: 'user_1',
    email: 'user1@test.com',
    name: 'User One',
    role: 'rapper'
  },
  {
    id: 'user_2',
    email: 'user2@test.com',
    name: 'User Two',
    role: 'studio'
  }
]

describe('Message Ordering API Tests', () => {
  beforeEach(() => {
    const fs = require('fs')
    fs.existsSync.mockReturnValue(true)
    fs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('messages.json')) {
        return JSON.stringify(mockMessagesData)
      }
      if (filePath.includes('users.json')) {
        return JSON.stringify(mockUsersData)
      }
      if (filePath.includes('user-profiles.json')) {
        return JSON.stringify([])
      }
      return '{}'
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should return messages in newest-first order by default', async () => {
    const url = new URL('http://localhost:3000/api/conversations/conv_123/messages?userId=user_1')
    const request = new NextRequest(url)
    
    const response = await GET(request, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.messages).toHaveLength(3)
    
    // Messages should be in newest-first order (API changed behavior)
    expect(data.messages[0].id).toBe('msg_3') // Newest
    expect(data.messages[1].id).toBe('msg_2') // Middle
    expect(data.messages[2].id).toBe('msg_1') // Oldest
    
    // Verify timestamps are in descending order
    const timestamps = data.messages.map((msg: any) => new Date(msg.timestamp).getTime())
    expect(timestamps[0]).toBeGreaterThan(timestamps[1])
    expect(timestamps[1]).toBeGreaterThan(timestamps[2])
  })

  test('should include senderInfo for each message', async () => {
    const url = new URL('http://localhost:3000/api/conversations/conv_123/messages?userId=user_1')
    const request = new NextRequest(url)
    
    const response = await GET(request, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.messages).toHaveLength(3)
    
    // Each message should have senderInfo
    data.messages.forEach((message: any) => {
      expect(message.senderInfo).toBeDefined()
      expect(message.senderInfo.id).toBeDefined()
      expect(message.senderInfo.name).toBeDefined()
      expect(message.senderInfo.role).toBeDefined()
    })
    
    // Check specific sender info
    const newestMessage = data.messages[0] // msg_3
    expect(newestMessage.senderInfo.name).toBe('User One')
    expect(newestMessage.senderInfo.role).toBe('rapper')
  })

  test('should support pagination with before cursor', async () => {
    // First request - get initial messages
    const url1 = new URL('http://localhost:3000/api/conversations/conv_123/messages?userId=user_1&limit=2')
    const request1 = new NextRequest(url1)
    
    const response1 = await GET(request1, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response1.status).toBe(200)
    
    const data1 = await response1.json()
    expect(data1.messages).toHaveLength(2)
    expect(data1.pagination.hasMore).toBe(true)
    
    // Should get newest 2 messages
    expect(data1.messages[0].id).toBe('msg_3')
    expect(data1.messages[1].id).toBe('msg_2')
    
    // NextCursor should be timestamp of oldest message in this batch (msg_2)
    expect(data1.pagination.nextCursor).toBe('2024-01-01T11:00:00.000Z')
    
    // Second request - use cursor to get older messages
    const url2 = new URL(`http://localhost:3000/api/conversations/conv_123/messages?userId=user_1&before=${data1.pagination.nextCursor}`)
    const request2 = new NextRequest(url2)
    
    const response2 = await GET(request2, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response2.status).toBe(200)
    
    const data2 = await response2.json()
    expect(data2.messages).toHaveLength(1)
    expect(data2.pagination.hasMore).toBe(false)
    
    // Should get the oldest message
    expect(data2.messages[0].id).toBe('msg_1')
  })

  test('should respect limit parameter', async () => {
    const url = new URL('http://localhost:3000/api/conversations/conv_123/messages?userId=user_1&limit=1')
    const request = new NextRequest(url)
    
    const response = await GET(request, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.messages).toHaveLength(1)
    expect(data.messages[0].id).toBe('msg_3') // Should get newest message
    expect(data.pagination.hasMore).toBe(true)
  })

  test('should handle invalid before timestamp', async () => {
    const url = new URL('http://localhost:3000/api/conversations/conv_123/messages?userId=user_1&before=invalid-date')
    const request = new NextRequest(url)
    
    const response = await GET(request, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Invalid before timestamp format')
  })

  test('should validate limit parameter bounds', async () => {
    // Test limit too small
    const url1 = new URL('http://localhost:3000/api/conversations/conv_123/messages?userId=user_1&limit=0')
    const request1 = new NextRequest(url1)
    
    const response1 = await GET(request1, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response1.status).toBe(400)
    
    // Test limit too large
    const url2 = new URL('http://localhost:3000/api/conversations/conv_123/messages?userId=user_1&limit=101')
    const request2 = new NextRequest(url2)
    
    const response2 = await GET(request2, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response2.status).toBe(400)
    
    const data = await response2.json()
    expect(data.error).toBe('Limit must be between 1 and 100')
  })

  test('should return empty messages array for empty conversation', async () => {
    const fs = require('fs')
    fs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('messages.json')) {
        return JSON.stringify({
          messages: [],
          conversations: [{
            id: 'conv_123',
            participants: ['user_1', 'user_2'],
            updatedAt: '2024-01-01T12:00:00.000Z',
            unreadCount: { user_1: 0, user_2: 0 }
          }]
        })
      }
      if (filePath.includes('users.json')) {
        return JSON.stringify(mockUsersData)
      }
      return JSON.stringify([])
    })

    const url = new URL('http://localhost:3000/api/conversations/conv_123/messages?userId=user_1')
    const request = new NextRequest(url)
    
    const response = await GET(request, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.messages).toEqual([])
    expect(data.pagination.hasMore).toBe(false)
    expect(data.pagination.nextCursor).toBeNull()
  })

  test('should require userId parameter', async () => {
    const url = new URL('http://localhost:3000/api/conversations/conv_123/messages')
    const request = new NextRequest(url)
    
    const response = await GET(request, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('User ID is required')
  })

  test('should deny access to unauthorized users', async () => {
    const url = new URL('http://localhost:3000/api/conversations/conv_123/messages?userId=unauthorized_user')
    const request = new NextRequest(url)
    
    const response = await GET(request, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response.status).toBe(404)
    
    const data = await response.json()
    expect(data.error).toBe('Conversation not found or access denied')
  })

  test('should handle deleted conversations', async () => {
    const fs = require('fs')
    fs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('messages.json')) {
        return JSON.stringify({
          messages: mockMessagesData.messages,
          conversations: [{
            id: 'conv_123',
            participants: ['user_1', 'user_2'],
            updatedAt: '2024-01-01T12:00:00.000Z',
            unreadCount: { user_1: 0, user_2: 0 },
            deletedAt: '2024-01-01T13:00:00.000Z' // Marked as deleted
          }]
        })
      }
      return JSON.stringify(mockUsersData)
    })

    const url = new URL('http://localhost:3000/api/conversations/conv_123/messages?userId=user_1')
    const request = new NextRequest(url)
    
    const response = await GET(request, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response.status).toBe(404)
    
    const data = await response.json()
    expect(data.error).toBe('Conversation not found or access denied')
  })

  test('should provide correct pagination metadata', async () => {
    const url = new URL('http://localhost:3000/api/conversations/conv_123/messages?userId=user_1&limit=2')
    const request = new NextRequest(url)
    
    const response = await GET(request, { params: Promise.resolve({ id: 'conv_123' }) })
    expect(response.status).toBe(200)
    
    const data = await response.json()
    
    expect(data.pagination).toBeDefined()
    expect(data.pagination.hasMore).toBe(true)
    expect(data.pagination.limit).toBe(2)
    expect(data.pagination.nextCursor).toBe('2024-01-01T11:00:00.000Z') // Timestamp of oldest message in page
  })
}) 