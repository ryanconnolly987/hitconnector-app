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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studios = getStudios();
    const studio = studios.find(s => s.id === id);
    
    if (!studio) {
      return NextResponse.json(
        { error: 'Studio not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(studio, { status: 200 });
  } catch (error) {
    console.error('GET studio error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const studios = getStudios();
    const studioIndex = studios.findIndex(s => s.id === id);
    
    if (studioIndex === -1) {
      return NextResponse.json(
        { error: 'Studio not found' },
        { status: 404 }
      );
    }
    
    // Update studio
    const updatedStudio = {
      ...studios[studioIndex],
      ...body,
      id: id, // Preserve the original ID
      updatedAt: new Date().toISOString()
    };
    
    studios[studioIndex] = updatedStudio;
    saveStudios(studios);
    
    return NextResponse.json(updatedStudio, { status: 200 });
  } catch (error) {
    console.error('PUT studio error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studios = getStudios();
    const studioIndex = studios.findIndex(s => s.id === id);
    
    if (studioIndex === -1) {
      return NextResponse.json(
        { error: 'Studio not found' },
        { status: 404 }
      );
    }
    
    studios.splice(studioIndex, 1);
    saveStudios(studios);
    
    return NextResponse.json({ message: 'Studio deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE studio error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 