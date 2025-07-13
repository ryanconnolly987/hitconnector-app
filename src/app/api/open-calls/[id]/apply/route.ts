import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findUserById } from '@/lib/user-store';

const OPEN_CALLS_FILE = path.join(process.cwd(), 'data', 'open-calls.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(OPEN_CALLS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
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
    return parsed.openCalls || [];
  } catch (error) {
    console.error('Error reading open calls file:', error);
    return [];
  }
}

// Write open calls to file
function saveOpenCalls(openCalls: any[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(OPEN_CALLS_FILE, JSON.stringify({ openCalls }, null, 2));
  } catch (error) {
    console.error('Error saving open calls file:', error);
    throw new Error('Failed to save open calls data');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, message } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get user data
    const user = findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get existing open calls
    const openCalls = getOpenCalls();
    
    // Find the specific open call
    const callIndex = openCalls.findIndex(call => call.id === id);
    if (callIndex === -1) {
      return NextResponse.json(
        { error: 'Open call not found' },
        { status: 404 }
      );
    }

    // Check if user already applied
    const existingApplication = openCalls[callIndex].applicants?.find(
      (applicant: any) => applicant.userId === userId
    );

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this open call' },
        { status: 409 }
      );
    }

    // Create new application with actual user data
    const newApplication = {
      userId,
      userName: user.name,
      userEmail: user.email,
      userImage: '', // Add profile image when available
      userRole: user.role,
      message: message || '',
      appliedAt: new Date().toISOString()
    };

    // Add application to the open call
    if (!openCalls[callIndex].applicants) {
      openCalls[callIndex].applicants = [];
    }
    openCalls[callIndex].applicants.push(newApplication);

    // Save updated open calls
    saveOpenCalls(openCalls);

    return NextResponse.json({
      message: 'Application submitted successfully',
      application: newApplication
    }, { status: 201 });

  } catch (error) {
    console.error('POST apply error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 