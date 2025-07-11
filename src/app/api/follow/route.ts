import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FOLLOWS_FILE = path.join(process.cwd(), 'data', 'follows.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(FOLLOWS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read follows from file
function getFollows(): any {
  ensureDataDir();
  try {
    if (!fs.existsSync(FOLLOWS_FILE)) {
      const initialData = { follows: [] };
      fs.writeFileSync(FOLLOWS_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(FOLLOWS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading follows file:', error);
    return { follows: [] };
  }
}

// Write follows to file
function saveFollows(followsData: any): void {
  ensureDataDir();
  try {
    fs.writeFileSync(FOLLOWS_FILE, JSON.stringify(followsData, null, 2));
  } catch (error) {
    console.error('Error saving follows file:', error);
    throw new Error('Failed to save follows data');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerId, followedId } = body;

    if (!followerId || !followedId) {
      return NextResponse.json(
        { error: 'followerId and followedId are required' },
        { status: 400 }
      );
    }

    if (followerId === followedId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    const followsData = getFollows();
    const follows = followsData.follows || [];

    // Check if already following
    const existingFollowIndex = follows.findIndex(
      (follow: any) => follow.followerId === followerId && follow.followedId === followedId
    );

    let action: string;
    let isFollowing: boolean;

    if (existingFollowIndex >= 0) {
      // Unfollow
      follows.splice(existingFollowIndex, 1);
      action = 'unfollowed';
      isFollowing = false;
    } else {
      // Follow
      follows.push({
        id: `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        followerId,
        followedId,
        createdAt: new Date().toISOString()
      });
      action = 'followed';
      isFollowing = true;
    }

    // Save updated follows
    followsData.follows = follows;
    saveFollows(followsData);

    // Calculate counts
    const followersCount = follows.filter((f: any) => f.followedId === followedId).length;
    const followingCount = follows.filter((f: any) => f.followerId === followerId).length;

    return NextResponse.json({
      action,
      isFollowing,
      followersCount,
      followingCount
    });
  } catch (error) {
    console.error('Error toggling follow status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 