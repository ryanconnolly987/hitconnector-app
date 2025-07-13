import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findUserById, getUsers } from '@/lib/user-store';

const OPEN_CALLS_FILE = path.join(process.cwd(), 'data', 'open-calls.json');
const STUDIOS_FILE = path.join(process.cwd(), 'data', 'studios.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(OPEN_CALLS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read studios from file
function getStudios(): any[] {
  try {
    if (!fs.existsSync(STUDIOS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(STUDIOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading studios file:', error);
    return [];
  }
}

// Find studio by ID
function findStudioById(studioId: string): any | null {
  const studios = getStudios();
  return studios.find(studio => studio.id === studioId) || null;
}

// Read open calls from file
function getOpenCalls(): any[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(OPEN_CALLS_FILE)) {
      fs.writeFileSync(OPEN_CALLS_FILE, JSON.stringify({ openCalls: [] }, null, 2));
      return [];
    }
    const data = fs.readFileSync(OPEN_CALLS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    
    // Handle both old format (direct array) and new format (object with openCalls property)
    if (Array.isArray(parsed)) {
      // Old format - direct array
      return parsed;
    } else {
      // New format - object with openCalls property
      return parsed.openCalls || [];
    }
  } catch (error) {
    console.error('Error reading open calls file:', error);
    return [];
  }
}

// Save open calls to file
function saveOpenCalls(openCalls: any[]): void {
  ensureDataDir();
  try {
    // Always save in the new format (object with openCalls property)
    fs.writeFileSync(OPEN_CALLS_FILE, JSON.stringify({ openCalls }, null, 2));
  } catch (error) {
    console.error('Error saving open calls file:', error);
    throw new Error('Failed to save open calls data');
  }
}

export async function GET() {
  try {
    const openCalls = getOpenCalls();
    
    // Enhance open calls with actual names if missing
    const enhancedCalls = openCalls.map(call => {
      // If posterName is missing or generic, try to get actual name
      if (!call.posterName || call.posterName === 'Studio User' || call.posterName === 'Artist User') {
        const user = findUserById(call.createdBy || call.postedById);
        if (user) {
          let posterName = user.name;
          let posterImage = '';
          let studioInfo = null;
          
          // If user is a studio user, try to get studio name and image
          if (user.role === 'studio' && user.studioId) {
            const studio = findStudioById(user.studioId);
            if (studio && studio.name) {
              posterName = studio.name;
              posterImage = studio.profileImage || '';
              studioInfo = {
                slug: user.slug || user.id, // Use user slug for studio profile
                profile: {
                  name: studio.name,
                  avatar: studio.profileImage || ''
                }
              };
            }
          }
          
          return {
            ...call,
            posterName,
            posterImage,
            studio: studioInfo
          };
        }
      }
      
      return call;
    });
    
    // Sort by timestamp/createdAt (newest first)
    const sortedCalls = enhancedCalls.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    
    return NextResponse.json(sortedCalls, { status: 200 });
  } catch (error) {
    console.error('GET open calls error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { createdBy, role, genre, description, userType } = body;
    
    if (!createdBy || !role || !genre || !description || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let posterName = 'Unknown User';
    let actualUserId = createdBy;

    if (userType === 'studio') {
      // For studios, createdBy might be studioId, we need to find the actual user
      const studio = findStudioById(createdBy);
      if (studio) {
        posterName = studio.name;
        // Try to find the user associated with this studio
        const users = getUsers();
        const studioUser = users.find(user => user.studioId === createdBy);
        if (studioUser) {
          actualUserId = studioUser.id;
        }
      } else {
        // If not found as studio, try as user ID
        const user = findUserById(createdBy);
        if (user && user.role === 'studio') {
          actualUserId = user.id;
          posterName = user.name;
          // Try to get studio name if available
          if (user.studioId) {
            const studioData = findStudioById(user.studioId);
            if (studioData && studioData.name) {
              posterName = studioData.name;
            }
          }
        } else {
          return NextResponse.json(
            { error: 'Studio not found' },
            { status: 404 }
          );
        }
      }
    } else {
      // For artists, createdBy should be user ID
      const user = findUserById(createdBy);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      posterName = user.name;
    }

    const openCalls = getOpenCalls();
    
    // Generate open call ID
    const openCallId = `open_call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create open call data with actual names
    const newOpenCall = {
      id: openCallId,
      createdBy: actualUserId, // Always store the actual user ID
      role,
      genre,
      description,
      userType,
      posterName, // Use actual name instead of generic placeholder
      timestamp: new Date().toISOString()
    };
    
    // Add to open calls list
    openCalls.push(newOpenCall);
    saveOpenCalls(openCalls);
    
    return NextResponse.json(newOpenCall, { status: 201 });
  } catch (error) {
    console.error('POST open calls error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 