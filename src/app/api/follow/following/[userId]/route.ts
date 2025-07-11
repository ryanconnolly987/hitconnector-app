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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const followsData = getFollows();
    const follows = followsData.follows || [];
    const users = getUsers();
    const studios = getStudios();

    // Get all users/studios this user is following
    const userFollows = follows.filter((follow: any) => follow.followerId === userId);

    const following = userFollows.map((follow: any) => {
      // First check if it's a user
      const user = users.find((u: any) => u.id === follow.followedId);
      if (user) {
        return {
          id: user.id,
          name: user.name,
          type: 'user',
          profileImage: user.profileImage,
          location: user.location
        };
      }

      // Then check if it's a studio
      const studio = studios.find((s: any) => s.id === follow.followedId);
      if (studio) {
        return {
          id: studio.id,
          name: studio.name,
          type: 'studio',
          profileImage: studio.profileImage,
          location: studio.location,
          rating: studio.rating
        };
      }

      // Return unknown if not found
      return {
        id: follow.followedId,
        name: 'Unknown User',
        type: 'user',
        profileImage: '',
        location: ''
      };
    });

    return NextResponse.json({ following });
  } catch (error) {
    console.error('Error fetching following list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 