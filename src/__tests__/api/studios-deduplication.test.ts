/**
 * Test suite for studios API deduplication functionality
 * Verifies that duplicate studios with same slug are filtered out
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/studios/route'

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn(() => 'data'),
}))

const mockStudioData = {
  studios: [
    {
      id: 'studio_1',
      slug: 'the-dojo',
      name: 'The Dojo',
      location: 'Los Angeles',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'studio_2', 
      slug: 'the-dojo',
      name: 'The Dojo Updated',
      location: 'Los Angeles',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z' // More recent
    },
    {
      id: 'studio_3',
      slug: 'sound-lab',
      name: 'Sound Lab',
      location: 'New York',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ]
}

describe('Studios API Deduplication', () => {
  beforeEach(() => {
    const fs = require('fs')
    fs.existsSync.mockReturnValue(true)
    fs.readFileSync.mockReturnValue(JSON.stringify(mockStudioData))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should deduplicate studios with same slug keeping most recent', async () => {
    const request = new NextRequest('http://localhost:3000/api/studios')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.studios).toHaveLength(2) // Should have 2 unique studios (not 3)
    
    // Should keep the more recent studio_2, not studio_1
    const dojoStudio = data.studios.find((s: any) => s.slug === 'the-dojo')
    expect(dojoStudio).toBeDefined()
    expect(dojoStudio.id).toBe('studio_2')
    expect(dojoStudio.name).toBe('The Dojo Updated')
    
    // Should still have sound-lab
    const soundLab = data.studios.find((s: any) => s.slug === 'sound-lab')
    expect(soundLab).toBeDefined()
    expect(soundLab.id).toBe('studio_3')
  })

  test('should handle studios without updatedAt field using createdAt', async () => {
    const testData = {
      studios: [
        {
          id: 'studio_1',
          slug: 'test-studio',
          name: 'Test Studio Old',
          createdAt: '2024-01-01T00:00:00.000Z'
          // No updatedAt field
        },
        {
          id: 'studio_2',
          slug: 'test-studio', 
          name: 'Test Studio New',
          createdAt: '2024-01-02T00:00:00.000Z'
          // No updatedAt field
        }
      ]
    }

    const fs = require('fs')
    fs.readFileSync.mockReturnValue(JSON.stringify(testData))

    const request = new NextRequest('http://localhost:3000/api/studios')
    const response = await GET(request)
    
    const data = await response.json()
    expect(data.studios).toHaveLength(1)
    
    const studio = data.studios[0]
    expect(studio.id).toBe('studio_2') // More recent createdAt
    expect(studio.name).toBe('Test Studio New')
  })

  test('should return empty array when no studios exist', async () => {
    const fs = require('fs')
    fs.readFileSync.mockReturnValue(JSON.stringify({ studios: [] }))

    const request = new NextRequest('http://localhost:3000/api/studios')
    const response = await GET(request)
    
    const data = await response.json()
    expect(data.studios).toEqual([])
  })

  test('should handle studios without slugs gracefully', async () => {
    const testData = {
      studios: [
        {
          id: 'studio_1',
          name: 'Studio Without Slug',
          createdAt: '2024-01-01T00:00:00.000Z'
          // No slug field
        },
        {
          id: 'studio_2',
          slug: 'proper-studio',
          name: 'Proper Studio',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ]
    }

    const fs = require('fs')
    fs.readFileSync.mockReturnValue(JSON.stringify(testData))

    const request = new NextRequest('http://localhost:3000/api/studios')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    
    const data = await response.json()
    // Should not crash and should include the studio with proper slug
    const properStudio = data.studios.find((s: any) => s.slug === 'proper-studio')
    expect(properStudio).toBeDefined()
  })

  test('should handle file read errors gracefully', async () => {
    const fs = require('fs')
    fs.existsSync.mockReturnValue(false)

    const request = new NextRequest('http://localhost:3000/api/studios')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.studios).toEqual([])
  })
}) 