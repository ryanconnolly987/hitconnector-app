import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FOLLOWS_FILE = path.join(process.cwd(), 'data', 'follows.json');

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

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; targetId: string }> }
) {
  try {
    const { id, targetId } = await params;

    const followsData = getFollows();
    const follows = followsData.follows || [];

    // Check if user (id) is following target (targetId)
    const isFollowing = follows.some(
      (follow: any) => follow.followerId === id && follow.followedId === targetId
    );

    // Calculate counts
    const followersCount = follows.filter((f: any) => f.followedId === targetId).length;
    const followingCount = follows.filter((f: any) => f.followerId === id).length;

    return NextResponse.json({ 
      isFollowing,
      followersCount,
      followingCount
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { isFollowing: false, followersCount: 0, followingCount: 0 },
      { status: 200 } // Return 200 with defaults to prevent errors
    );
  }
} 