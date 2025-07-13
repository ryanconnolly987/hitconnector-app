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
    const parsed = JSON.parse(data);
    return parsed.users || [];
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const followsData = getFollows();
    const follows = followsData.follows || [];
    const users = getUsers();
    const studios = getStudios();

    // Get all users/studios following this user/studio
    const userFollowers = follows.filter((follow: any) => follow.followedId === id);

    const followers = userFollowers.map((follow: any) => {
      // First check if follower is a user
      const user = users.find((u: any) => u.id === follow.followerId);
      if (user) {
        return {
          id: user.id,
          name: user.name,
          type: 'user',
          profileImage: user.profileImage,
          location: user.location,
          slug: user.slug
        };
      }

      // Then check if follower is a studio
      const studio = studios.find((s: any) => s.id === follow.followerId);
      if (studio) {
        return {
          id: studio.id,
          name: studio.name,
          type: 'studio',
          profileImage: studio.profileImage,
          location: studio.location,
          rating: studio.rating,
          slug: studio.slug
        };
      }

      // Return unknown if not found
      return {
        id: follow.followerId,
        name: 'Unknown User',
        type: 'user',
        profileImage: '',
        location: '',
        slug: ''
      };
    });

    return NextResponse.json({ followers });
  } catch (error) {
    console.error('Failed to fetch followers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 