import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FOLLOWS_FILE = path.join(process.cwd(), 'data', 'follows.json');

interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

// Read follows from file
function getFollows(): Follow[] {
  try {
    if (!fs.existsSync(FOLLOWS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(FOLLOWS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading follows file:', error);
    return [];
  }
}

// GET /api/follow/status - Get follow status between two users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get('followerId');
    const targetId = searchParams.get('targetId');

    if (!followerId || !targetId) {
      return NextResponse.json(
        { error: 'followerId and targetId are required' },
        { status: 400 }
      );
    }

    const follows = getFollows();
    
    // Check if followerId is following targetId
    const isFollowing = follows.some(
      f => f.followerId === followerId && f.followingId === targetId
    );

    // Get follower and following counts for targetId
    const followersCount = follows.filter(f => f.followingId === targetId).length;
    const followingCount = follows.filter(f => f.followerId === targetId).length;

    return NextResponse.json({
      isFollowing,
      followersCount,
      followingCount
    }, { status: 200 });
  } catch (error) {
    console.error('GET follow status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 