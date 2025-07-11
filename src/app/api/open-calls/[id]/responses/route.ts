import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get existing open calls
    const openCalls = getOpenCalls();
    
    // Find the specific open call
    const openCall = openCalls.find(call => call.id === id);
    if (!openCall) {
      return NextResponse.json(
        { error: 'Open call not found' },
        { status: 404 }
      );
    }

    // Return the applicants/responses for this open call
    return NextResponse.json(openCall.applicants || [], { status: 200 });

  } catch (error) {
    console.error('GET responses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { responderId, message } = body;

    // Validate required fields
    if (!responderId) {
      return NextResponse.json(
        { error: 'responderId is required' },
        { status: 400 }
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

    // Check if user already responded
    const existingResponse = openCalls[callIndex].applicants?.find(
      (applicant: any) => applicant.userId === responderId
    );

    if (existingResponse) {
      return NextResponse.json(
        { error: 'You have already responded to this open call' },
        { status: 409 }
      );
    }

    // Create new response
    const newResponse = {
      userId: responderId,
      userName: 'Artist User', // This could be enhanced to get actual user name
      userEmail: '',
      userImage: '',
      message: message || '',
      appliedAt: new Date().toISOString()
    };

    // Add response to the open call
    if (!openCalls[callIndex].applicants) {
      openCalls[callIndex].applicants = [];
    }
    openCalls[callIndex].applicants.push(newResponse);

    // Save updated open calls
    saveOpenCalls(openCalls);

    return NextResponse.json({
      message: 'Response submitted successfully',
      response: newResponse
    }, { status: 201 });

  } catch (error) {
    console.error('POST responses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 