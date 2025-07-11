import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OPEN_CALLS_FILE = path.join(process.cwd(), 'data', 'open-calls.json');

// Type definitions
interface OpenCallResponse {
  id: string;
  openCallId: string;
  openCallTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string;
  message: string;
  appliedAt: string;
  status: string;
}

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');
    
    if (!studioId) {
      return NextResponse.json(
        { error: 'studioId is required' },
        { status: 400 }
      );
    }

    // Get all open calls
    const openCalls = getOpenCalls();
    
    // Filter open calls posted by this studio and collect all responses
    const studioOpenCalls = openCalls.filter(call => 
      call.postedById === studioId || call.studioId === studioId
    );

    // Collect all responses with open call info
    const responses: OpenCallResponse[] = [];
    studioOpenCalls.forEach(call => {
      if (call.applicants && call.applicants.length > 0) {
        call.applicants.forEach((applicant: any) => {
          responses.push({
            id: `${call.id}_${applicant.userId}`,
            openCallId: call.id,
            openCallTitle: call.role,
            userId: applicant.userId,
            userName: applicant.userName,
            userEmail: applicant.userEmail,
            userImage: applicant.userImage,
            message: applicant.message,
            appliedAt: applicant.appliedAt,
            status: 'pending' // Default status
          });
        });
      }
    });

    // Sort by application date (newest first)
    responses.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

    return NextResponse.json(responses, { status: 200 });

  } catch (error) {
    console.error('GET open-call-responses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 