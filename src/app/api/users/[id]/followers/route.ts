import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FOLLOWS_FILE = path.join(process.cwd(), 'data', 'follows.json');
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const STUDIOS_FILE = path.join(process.cwd(), 'data', 'studios.json');

// Read follows from file
function getFollows(): any {
  try {
    if (!fs.existsSync(FOLLOWS_FILE)) {
      return { follows: [] };
    }
    const data = fs.readFileSync(FOLLOWS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading follows file:', error);
    return { follows: [] };
  }
}

// Read users from file
function getUsers(): any[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return Array.isArray(data) ? data : JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Read studios from file
function getStudios(): any[] {
  try {
    if (!fs.existsSync(STUDIOS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(STUDIOS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.studios || [];
  } catch (error) {
    console.error('Error reading studios file:', error);
    return [];
  }
}

// Enhanced function to get user info with studio data
function getUserInfoWithStudio(userId: string, users: any[], studios: any[]): any {
  const user = users.find((u: any) => u.id === userId);
  if (!user) {
    return {
      id: userId,
      name: 'Unknown User',
      type: 'user',
      profileImage: '',
      location: '',
      slug: ''
    };
  }

  // If user is a studio, get studio information
  if (user.role === 'studio' && user.studioId) {
    const studio = studios.find((s: any) => s.id === user.studioId);
    if (studio) {
      return {
        id: user.id,
        name: studio.name || user.name,
        type: 'studio',
        profileImage: studio.profileImage || user.profileImage,
        location: studio.location || user.location,
        rating: studio.rating,
        slug: studio.slug || user.slug
      };
    }
  }

  // Return regular user info
  return {
    id: user.id,
    name: user.name,
    type: user.role === 'studio' ? 'studio' : 'user',
    profileImage: user.profileImage,
    location: user.location,
    slug: user.slug
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const followsData = getFollows();
    
    // Handle both old and new data formats
    let follows = followsData.follows || followsData || [];
    
    // If it's an array directly (new format), use it as is
    if (Array.isArray(followsData)) {
      follows = followsData;
    }
    
    const users = getUsers();
    const studios = getStudios();

    // Get all users who are following this user
    const userFollowers = follows.filter((follow: any) => {
      // Support both followedId and followingId property names
      const targetId = follow.followingId || follow.followedId;
      return targetId === userId;
    });

    const followers = userFollowers.map((follow: any) => {
      const followerId = follow.followerId;
      return getUserInfoWithStudio(followerId, users, studios);
    });

    return NextResponse.json({ followers });
  } catch (error) {
    console.error('Error fetching followers list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 