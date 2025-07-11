import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STUDIOS_FILE = path.join(process.cwd(), 'data', 'studios.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(STUDIOS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read studios from file
function getStudios(): any[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(STUDIOS_FILE)) {
      fs.writeFileSync(STUDIOS_FILE, '[]');
      return [];
    }
    const data = fs.readFileSync(STUDIOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading studios file:', error);
    return [];
  }
}

// Write studios to file
function saveStudios(studios: any[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(STUDIOS_FILE, JSON.stringify(studios, null, 2));
  } catch (error) {
    console.error('Error saving studios file:', error);
    throw new Error('Failed to save studio data');
  }
}

export async function GET(request: NextRequest) {
  try {
    const studios = getStudios();
    return NextResponse.json({ studios }, { status: 200 });
  } catch (error) {
    console.error('GET studios error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const studios = getStudios();
    
    // Generate studio ID
    const studioId = `studio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create studio data
    const newStudio = {
      id: studioId,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to studios list
    studios.push(newStudio);
    saveStudios(studios);
    
    return NextResponse.json(newStudio, { status: 201 });
  } catch (error) {
    console.error('POST studios error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 