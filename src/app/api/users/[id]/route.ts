import { NextRequest, NextResponse } from 'next/server';
import { getUsers, findUserByEmail, saveUsers } from '@/lib/user-store';
import fs from 'fs';
import path from 'path';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  location?: string;
  website?: string;
  trackUrl?: string;
  profileImage?: string;
  bannerImage?: string;
  projectHighlights?: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    trackUrl?: string;
  }>;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
  };
  genres?: string[];
  experience?: string;
  createdAt?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'user-profiles.json');

// Ensure data directory exists
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Read profiles from file
function getProfiles(): UserProfile[] {
  ensureDataDir();
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const data = fs.readFileSync(PROFILES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading profiles file:', error);
  }
  return [];
}

// Write profiles to file
function saveProfiles(profiles: UserProfile[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
  } catch (error) {
    console.error('Error saving profiles file:', error);
    throw new Error('Failed to save profile data');
  }
}

// GET /api/users/[id] - Get user profile
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    
    // Get basic user info
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get extended profile info
    const profiles = getProfiles();
    const profile = profiles.find(p => p.id === userId);

    // Return combined data
    const userData: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      ...profile // Spread profile data if it exists
    };

    return NextResponse.json(userData);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user profile
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const body = await request.json();

    // Validate user exists
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[userIndex];

    // Update base user data if name or email changed
    let baseUserUpdated = false;
    if (body.name && body.name !== user.name) {
      users[userIndex].name = body.name;
      baseUserUpdated = true;
    }
    if (body.email && body.email !== user.email) {
      // Check if email is already taken by another user
      const emailExists = users.some(u => u.id !== userId && u.email === body.email);
      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
      users[userIndex].email = body.email;
      baseUserUpdated = true;
    }

    // Save updated users if base data changed
    if (baseUserUpdated) {
      saveUsers(users);
    }

    // Get current profiles
    const profiles = getProfiles();
    const existingProfileIndex = profiles.findIndex(p => p.id === userId);

    // Create updated profile with latest user data
    const updatedUser = users[userIndex];
    const updatedProfile: UserProfile = {
      id: userId,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      bio: body.bio,
      location: body.location,
      website: body.website,
      trackUrl: body.trackUrl,
      profileImage: body.profileImage,
      bannerImage: body.bannerImage,
      projectHighlights: body.projectHighlights || [],
      socialMedia: body.socialMedia || {},
      genres: body.genres || [],
      experience: body.experience,
      createdAt: updatedUser.createdAt
    };

    // Update or add profile
    if (existingProfileIndex >= 0) {
      profiles[existingProfileIndex] = updatedProfile;
    } else {
      profiles.push(updatedProfile);
    }

    // Save profiles
    saveProfiles(profiles);

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      },
      message: 'Profile updated successfully' 
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
} 