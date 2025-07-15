import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FOLLOWS_FILE = path.join(process.cwd(), 'data', 'follows.json');

interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read follows from file
function getFollows(): Follow[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(FOLLOWS_FILE)) {
      fs.writeFileSync(FOLLOWS_FILE, '[]');
      return [];
    }
    const data = fs.readFileSync(FOLLOWS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading follows file:', error);
    return [];
  }
}

// Save follows to file
function saveFollows(follows: Follow[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(FOLLOWS_FILE, JSON.stringify(follows, null, 2));
  } catch (error) {
    console.error('Error saving follows file:', error);
    throw new Error('Failed to save follows');
  }
}

// POST /api/follow - Toggle follow/unfollow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support both followedId and followingId for backward compatibility
    const followerId = body.followerId;
    const followingId = body.followedId || body.followingId;

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'followerId and followingId (or followedId) are required' },
        { status: 400 }
      );
    }

    if (followerId === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    const follows = getFollows();
    
    // Check if already following
    const existingFollowIndex = follows.findIndex(
      f => f.followerId === followerId && f.followingId === followingId
    );

    let action: string;
    let isFollowing: boolean;

    if (existingFollowIndex !== -1) {
      // Already following, so unfollow
      follows.splice(existingFollowIndex, 1);
      action = 'unfollowed';
      isFollowing = false;
    } else {
      // Not following, so follow
      const newFollow: Follow = {
        followerId,
        followingId,
        createdAt: new Date().toISOString()
      };
      follows.push(newFollow);
      action = 'followed';
      isFollowing = true;
    }

    saveFollows(follows);

    // Calculate updated follower counts
    // followersCount: how many people follow the target (followingId)
    // followingCount: how many people the target (followingId) follows
    const followersCount = follows.filter(f => f.followingId === followingId).length;
    const followingCount = follows.filter(f => f.followerId === followingId).length;

    return NextResponse.json({ 
      success: true,
      action,
      isFollowing,
      followersCount,
      followingCount
    }, { status: 200 });
  } catch (error) {
    console.error('POST follow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/follow - Unfollow a user (kept for backward compatibility)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get('followerId');
    const followingId = searchParams.get('followingId') || searchParams.get('followedId');

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'followerId and followingId are required' },
        { status: 400 }
      );
    }

    const follows = getFollows();
    
    // Find and remove the follow
    const followIndex = follows.findIndex(
      f => f.followerId === followerId && f.followingId === followingId
    );

    if (followIndex === -1) {
      return NextResponse.json(
        { error: 'Follow relationship not found' },
        { status: 404 }
      );
    }

    follows.splice(followIndex, 1);
    saveFollows(follows);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE follow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 