import fs from 'fs';
import path from 'path';
import { getTopFollowedStudios } from '@/lib/studios/getTopFollowedStudios';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('getTopFollowedStudios', () => {
  const mockStudiosData = {
    studios: [
      {
        id: 'studio-1',
        slug: 'studio-1',
        name: 'Studio One',
        location: 'New York',
        hourlyRate: 100,
        profileImage: '/studio1.jpg',
        rating: 4.5,
        reviewCount: 10,
        updatedAt: '2023-01-01T00:00:00Z'
      },
      {
        id: 'studio-2',
        slug: 'studio-2',
        name: 'Studio Two',
        location: 'Los Angeles',
        hourlyRate: 120,
        rating: 4.8,
        reviewCount: 20,
        updatedAt: '2023-01-02T00:00:00Z'
      },
      {
        id: 'studio-3',
        slug: 'studio-3',
        name: 'Studio Three',
        location: 'Chicago',
        hourlyRate: 80,
        rating: 4.2,
        reviewCount: 5,
        updatedAt: '2023-01-03T00:00:00Z'
      }
    ]
  };

  const mockFollowsData = [
    { followerId: 'user-1', followingId: 'studio-1', createdAt: '2023-01-01' },
    { followerId: 'user-2', followingId: 'studio-1', createdAt: '2023-01-01' },
    { followerId: 'user-3', followingId: 'studio-2', createdAt: '2023-01-01' },
    { followerId: 'user-4', followingId: 'studio-3', createdAt: '2023-01-01' },
    { followerId: 'user-5', followingId: 'studio-3', createdAt: '2023-01-01' },
    { followerId: 'user-6', followingId: 'studio-3', createdAt: '2023-01-01' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return top studios sorted by followers count', async () => {
    mockedFs.existsSync.mockImplementation((filePath) => {
      return typeof filePath === 'string' && 
        (filePath.includes('studios.json') || filePath.includes('follows.json'));
    });

    mockedFs.readFileSync.mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.includes('studios.json')) {
        return JSON.stringify(mockStudiosData);
      }
      if (typeof filePath === 'string' && filePath.includes('follows.json')) {
        return JSON.stringify(mockFollowsData);
      }
      return '{}';
    });

    const result = await getTopFollowedStudios(4);

    expect(result).toHaveLength(3);
    // Studio 3 has 3 followers, Studio 1 has 2, Studio 2 has 1
    expect(result[0].name).toBe('Studio Three');
    expect(result[0].followersCount).toBe(3);
    expect(result[1].name).toBe('Studio One');
    expect(result[1].followersCount).toBe(2);
    expect(result[2].name).toBe('Studio Two');
    expect(result[2].followersCount).toBe(1);
  });

  it('should limit results to specified count', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.includes('studios.json')) {
        return JSON.stringify(mockStudiosData);
      }
      return JSON.stringify(mockFollowsData);
    });

    const result = await getTopFollowedStudios(2);

    expect(result).toHaveLength(2);
  });

  it('should handle missing files gracefully', async () => {
    mockedFs.existsSync.mockReturnValue(false);

    const result = await getTopFollowedStudios(4);

    expect(result).toEqual([]);
  });

  it('should handle empty studios array', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.includes('studios.json')) {
        return JSON.stringify({ studios: [] });
      }
      return JSON.stringify([]);
    });

    const result = await getTopFollowedStudios(4);

    expect(result).toEqual([]);
  });

  it('should filter out studios without name or location', async () => {
    const invalidStudiosData = {
      studios: [
        {
          id: 'studio-1',
          name: 'Valid Studio',
          location: 'New York',
          hourlyRate: 100,
          rating: 4.5,
          reviewCount: 10
        },
        {
          id: 'studio-2',
          name: '',
          location: 'Los Angeles',
          hourlyRate: 120,
          rating: 4.8,
          reviewCount: 20
        },
        {
          id: 'studio-3',
          name: 'No Location Studio',
          location: '',
          hourlyRate: 80,
          rating: 4.2,
          reviewCount: 5
        }
      ]
    };

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.includes('studios.json')) {
        return JSON.stringify(invalidStudiosData);
      }
      return JSON.stringify([]);
    });

    const result = await getTopFollowedStudios(4);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Valid Studio');
  });

  it('should default hourlyRate to 0 if not provided', async () => {
    const studioWithoutRate = {
      studios: [
        {
          id: 'studio-1',
          name: 'Studio Without Rate',
          location: 'New York',
          rating: 4.5,
          reviewCount: 10
        }
      ]
    };

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.includes('studios.json')) {
        return JSON.stringify(studioWithoutRate);
      }
      return JSON.stringify([]);
    });

    const result = await getTopFollowedStudios(4);

    expect(result[0].hourlyRate).toBe(0);
  });
}); 