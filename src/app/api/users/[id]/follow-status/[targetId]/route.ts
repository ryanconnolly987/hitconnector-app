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
    
    // Handle both old and new data formats
    let follows = followsData.follows || followsData || [];
    
    // If it's an array directly (new format), use it as is
    if (Array.isArray(followsData)) {
      follows = followsData;
    }

    // Check if user (id) is following target (targetId)
    // Support both followedId (old) and followingId (new) property names
    const isFollowing = follows.some(
      (follow: any) => follow.followerId === id && (follow.followingId === targetId || follow.followedId === targetId)
    );

    // Calculate counts - support both property names for backward compatibility
    // followersCount: how many people follow the target (targetId)
    // followingCount: how many people the target (targetId) follows
    const followersCount = follows.filter((f: any) => f.followingId === targetId || f.followedId === targetId).length;
    const followingCount = follows.filter((f: any) => f.followerId === targetId).length;

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