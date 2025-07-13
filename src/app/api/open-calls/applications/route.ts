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
    
    // Handle both old format (direct array) and new format (object with openCalls property)
    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      return parsed.openCalls || [];
    }
  } catch (error) {
    console.error('Error reading open calls file:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const openCalls = getOpenCalls();
    
    // Find open calls posted by this user that have applications
    const userOpenCallsWithApplications = openCalls
      .filter(call => call.createdBy === userId && call.applicants && call.applicants.length > 0)
      .map(call => {
        // Enhance applicants with actual user data
        const enhancedApplicants = (call.applicants || []).map((applicant: any) => {
          const user = findUserById(applicant.userId);
          return {
            ...applicant,
            userName: user?.name || applicant.userName || 'Unknown User',
            userEmail: user?.email || applicant.userEmail || '',
            userImage: applicant.userImage || '', // Keep existing userImage or empty
            userRole: user?.role || 'artist'
          };
        });

        return {
          id: call.id,
          role: call.role,
          genre: call.genre,
          description: call.description,
          userType: call.userType,
          posterName: call.posterName,
          timestamp: call.timestamp,
          applicants: enhancedApplicants,
          applicantCount: enhancedApplicants.length
        };
      });

    // Sort by timestamp (newest first)
    const sortedCallsWithApplications = userOpenCallsWithApplications.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      openCallsWithApplications: sortedCallsWithApplications,
      totalApplications: sortedCallsWithApplications.reduce((sum, call) => sum + call.applicantCount, 0)
    }, { status: 200 });

  } catch (error) {
    console.error('GET applications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 