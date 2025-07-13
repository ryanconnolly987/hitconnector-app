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
  const dataDir = path.dirname(FOLLOWS_FILE);
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

// POST /api/follow - Follow a user
export async function POST(request: NextRequest) {
  try {
    const { followerId, followingId } = await request.json();

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'followerId and followingId are required' },
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
    const existingFollow = follows.find(
      f => f.followerId === followerId && f.followingId === followingId
    );

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      );
    }

    // Add new follow
    const newFollow: Follow = {
      followerId,
      followingId,
      createdAt: new Date().toISOString()
    };

    follows.push(newFollow);
    saveFollows(follows);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('POST follow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/follow - Unfollow a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get('followerId');
    const followingId = searchParams.get('followingId');

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