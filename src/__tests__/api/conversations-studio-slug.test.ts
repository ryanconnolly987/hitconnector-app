/**
 * Unit tests for conversations API studio slug functionality
 * Verifies that studio conversations include slug data for proper navigation
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/conversations/route'

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
  messages: [],
  conversations: [
    {
      id: 'conv_123',
      participants: ['user_artist', 'user_studio'],
      lastMessage: {
        id: 'msg_1',
        text: 'Test message',
        senderId: 'user_studio',
        timestamp: '2024-01-01T12:00:00.000Z'
      },
      updatedAt: '2024-01-01T12:00:00.000Z',
      unreadCount: { user_artist: 1, user_studio: 0 }
    }
  ]
}

const mockUsersData = [
  {
    id: 'user_artist',
    email: 'artist@test.com',
    name: 'Test Artist',
    role: 'rapper'
  },
  {
    id: 'user_studio',
    email: 'studio@test.com',
    name: 'Studio User',
    role: 'studio',
    studioId: 'studio_123'
  }
]

const mockStudiosData = {
  studios: [
    {
      id: 'studio_123',
      name: 'Test Studio',
      slug: 'test-studio',
      profileImage: 'https://example.com/studio-avatar.jpg'
    }
  ]
}

const mockProfilesData = [
  {
    id: 'user_artist',
    profileImage: 'https://example.com/artist-avatar.jpg'
  }
]

describe('Conversations API Studio Slug Tests', () => {
  beforeEach(() => {
    const fs = require('fs')
    fs.existsSync.mockImplementation((filePath: string) => {
      return filePath.includes('messages.json') || 
             filePath.includes('users.json') || 
             filePath.includes('studios.json') ||
             filePath.includes('user-profiles.json')
    })
    
    fs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('messages.json')) {
        return JSON.stringify(mockMessagesData)
      }
      if (filePath.includes('users.json')) {
        return JSON.stringify(mockUsersData)
      }
      if (filePath.includes('studios.json')) {
        return JSON.stringify(mockStudiosData)
      }
      if (filePath.includes('user-profiles.json')) {
        return JSON.stringify(mockProfilesData)
      }
      return '{}'
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should return studio conversations with slug for navigation', async () => {
    const url = new URL('http://localhost:3000/api/conversations?userId=user_artist')
    const request = new NextRequest(url)
    
    const response = await GET(request)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.conversations).toHaveLength(1)
    
    const conversation = data.conversations[0]
    expect(conversation.other).toBeDefined()
    expect(conversation.other.type).toBe('studio')
    expect(conversation.other.slug).toBe('test-studio')
    expect(conversation.other.name).toBe('Test Studio')
    expect(conversation.other.profileImage).toBe('https://example.com/studio-avatar.jpg')
  })

  test('should return artist conversations without studio-specific fields', async () => {
    const url = new URL('http://localhost:3000/api/conversations?userId=user_studio')
    const request = new NextRequest(url)
    
    const response = await GET(request)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.conversations).toHaveLength(1)
    
    const conversation = data.conversations[0]
    expect(conversation.other).toBeDefined()
    expect(conversation.other.type).toBe('artist')
    expect(conversation.other.slug).toBeUndefined()
    expect(conversation.other.name).toBe('Test Artist')
  })

  test('should handle missing studio data gracefully', async () => {
    // Mock studio user with missing studio data
    const fs = require('fs')
    fs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('messages.json')) {
        return JSON.stringify(mockMessagesData)
      }
      if (filePath.includes('users.json')) {
        return JSON.stringify([
          ...mockUsersData,
          {
            id: 'user_studio_no_data',
            email: 'nostudio@test.com',
            name: 'Studio User No Data',
            role: 'studio',
            studioId: 'nonexistent_studio'
          }
        ])
      }
      if (filePath.includes('studios.json')) {
        return JSON.stringify({ studios: [] }) // No studios
      }
      return JSON.stringify([])
    })

    const conversationWithMissingStudio = {
      ...mockMessagesData,
      conversations: [{
        id: 'conv_456',
        participants: ['user_artist', 'user_studio_no_data'],
        updatedAt: '2024-01-01T12:00:00.000Z',
        unreadCount: { user_artist: 0, user_studio_no_data: 0 }
      }]
    }

    fs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('messages.json')) {
        return JSON.stringify(conversationWithMissingStudio)
      }
      if (filePath.includes('users.json')) {
        return JSON.stringify([
          mockUsersData[0], // artist
          {
            id: 'user_studio_no_data',
            email: 'nostudio@test.com',
            name: 'Studio User No Data',
            role: 'studio',
            studioId: 'nonexistent_studio'
          }
        ])
      }
      if (filePath.includes('studios.json')) {
        return JSON.stringify({ studios: [] })
      }
      return JSON.stringify([])
    })

    const url = new URL('http://localhost:3000/api/conversations?userId=user_artist')
    const request = new NextRequest(url)
    
    const response = await GET(request)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.conversations).toHaveLength(1)
    
    const conversation = data.conversations[0]
    expect(conversation.other).toBeDefined()
    expect(conversation.other.name).toBe('Studio User No Data') // Falls back to user name
    expect(conversation.other.type).toBe('studio')
    expect(conversation.other.slug).toBeUndefined() // No slug since studio data missing
  })

  test('should include participantsInfo with correct studio data', async () => {
    const url = new URL('http://localhost:3000/api/conversations?userId=user_artist')
    const request = new NextRequest(url)
    
    const response = await GET(request)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    const conversation = data.conversations[0]
    
    expect(conversation.participantsInfo).toHaveLength(2)
    
    const studioParticipant = conversation.participantsInfo.find(
      (p: any) => p.role === 'studio'
    )
    expect(studioParticipant).toBeDefined()
    expect(studioParticipant.slug).toBe('test-studio')
    expect(studioParticipant.type).toBe('studio')
    expect(studioParticipant.name).toBe('Test Studio')

    const artistParticipant = conversation.participantsInfo.find(
      (p: any) => p.role === 'rapper'
    )
    expect(artistParticipant).toBeDefined()
    expect(artistParticipant.name).toBe('Test Artist')
    expect(artistParticipant.type).toBe('artist')
  })

  test('should handle studio without slug field', async () => {
    // Mock studio data without slug
    const fs = require('fs')
    const studioWithoutSlug = {
      studios: [{
        id: 'studio_123',
        name: 'Test Studio No Slug',
        profileImage: 'https://example.com/studio-avatar.jpg'
        // No slug field
      }]
    }

    fs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('studios.json')) {
        return JSON.stringify(studioWithoutSlug)
      }
      if (filePath.includes('messages.json')) {
        return JSON.stringify(mockMessagesData)
      }
      if (filePath.includes('users.json')) {
        return JSON.stringify(mockUsersData)
      }
      return JSON.stringify([])
    })

    const url = new URL('http://localhost:3000/api/conversations?userId=user_artist')
    const request = new NextRequest(url)
    
    const response = await GET(request)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    const conversation = data.conversations[0]
    
    expect(conversation.other.name).toBe('Test Studio No Slug')
    expect(conversation.other.slug).toBeUndefined()
    expect(conversation.other.type).toBe('studio')
  })

  test('should return empty conversations array when user has no conversations', async () => {
    const fs = require('fs')
    fs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('messages.json')) {
        return JSON.stringify({ messages: [], conversations: [] })
      }
      if (filePath.includes('users.json')) {
        return JSON.stringify(mockUsersData)
      }
      return JSON.stringify([])
    })

    const url = new URL('http://localhost:3000/api/conversations?userId=user_artist')
    const request = new NextRequest(url)
    
    const response = await GET(request)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.conversations).toEqual([])
  })

  test('should require userId parameter', async () => {
    const url = new URL('http://localhost:3000/api/conversations')
    const request = new NextRequest(url)
    
    const response = await GET(request)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('User ID is required')
  })
}) 