import fs from 'fs';
import path from 'path';

const STUDIOS_FILE = path.join(process.cwd(), 'data', 'studios.json');
const FOLLOWS_FILE = path.join(process.cwd(), 'data', 'follows.json');

interface Studio {
  id: string;
  slug: string;
  name: string;
  location: string;
  hourlyRate: number;
  profileImage?: string;
  rating: number;
  reviewCount: number;
}

interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export async function getTopFollowedStudios(limit = 4): Promise<Studio[]> {
  try {
    // Read studios
    let studios: any[] = [];
    if (fs.existsSync(STUDIOS_FILE)) {
      const studiosData = fs.readFileSync(STUDIOS_FILE, 'utf-8');
      const parsed = JSON.parse(studiosData);
      studios = parsed.studios || [];
    }

    // Read follows to count followers for each studio
    let follows: Follow[] = [];
    if (fs.existsSync(FOLLOWS_FILE)) {
      const followsData = fs.readFileSync(FOLLOWS_FILE, 'utf-8');
      follows = JSON.parse(followsData);
    }

    // Count followers for each studio
    const followerCounts = follows.reduce((acc, follow) => {
      acc[follow.followingId] = (acc[follow.followingId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Add follower counts to studios and sort by followers, then by rating
    const studiosWithFollowers = studios
      .filter(studio => studio.name && studio.location) // Only include valid studios
      .map(studio => ({
        id: studio.id,
        slug: studio.slug,
        name: studio.name,
        location: studio.location || studio.address || studio.city || 'Unknown Location',
        hourlyRate: studio.hourlyRate || 0,
        profileImage: studio.profileImage || studio.coverImage,
        rating: studio.rating || 0,
        reviewCount: studio.reviewCount || 0,
        followersCount: followerCounts[studio.id] || 0,
        updatedAt: studio.updatedAt || studio.createdAt || new Date().toISOString()
      }))
      .sort((a, b) => {
        // Sort by followers count (descending), then by rating (descending), then by updated date (descending)
        if (b.followersCount !== a.followersCount) {
          return b.followersCount - a.followersCount;
        }
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .slice(0, limit);

    return studiosWithFollowers;
  } catch (error) {
    console.error('Error fetching top followed studios:', error);
    return [];
  }
} 