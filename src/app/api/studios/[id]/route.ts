import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STUDIOS_FILE = path.join(process.cwd(), 'data', 'studios.json');

function getStudios(): any[] {
  try {
    if (fs.existsSync(STUDIOS_FILE)) {
      const data = fs.readFileSync(STUDIOS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.studios || [];
    }
    return [];
  } catch (error) {
    console.error('Error reading studios file:', error);
    return [];
  }
}

function findStudioById(id: string): any | null {
  const studios = getStudios();
  return studios.find(studio => studio.id === id) || null;
}

function findStudioBySlug(slug: string): any | null {
  const studios = getStudios();
  return studios.find(studio => studio.slug === slug) || null;
}

function saveStudios(studios: any[]): void {
  try {
    const dataDir = path.dirname(STUDIOS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const data = { studios };
    fs.writeFileSync(STUDIOS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving studios file:', error);
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: identifier } = await params;
    
    // Try to find studio by slug first, then by ID
    let studio = findStudioBySlug(identifier);
    if (!studio) {
      studio = findStudioById(identifier);
    }
    
    if (!studio) {
      return NextResponse.json(
        { error: 'Studio not found' },
        { status: 404 }
      );
    }

    // Compute minRoomRate and maxRoomRate from rooms
    const rooms = studio.rooms || [];
    const roomRates = rooms
      .filter((room: any) => room && typeof room.hourlyRate === 'number' && room.hourlyRate > 0)
      .map((room: any) => room.hourlyRate);
    
    const minRoomRate = roomRates.length > 0 ? Math.min(...roomRates) : null;
    const maxRoomRate = roomRates.length > 0 ? Math.max(...roomRates) : null;

    // Add computed rates to studio object
    const enhancedStudio = {
      ...studio,
      minRoomRate,
      maxRoomRate
    };
    
    return NextResponse.json(enhancedStudio);
  } catch (error) {
    console.error('Error fetching studio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: identifier } = await params;
    const body = await request.json();
    const studios = getStudios();
    
    // Find studio by slug first, then by ID
    let studioIndex = studios.findIndex(s => s.slug === identifier);
    if (studioIndex === -1) {
      studioIndex = studios.findIndex(s => s.id === identifier);
    }
    
    if (studioIndex === -1) {
      return NextResponse.json(
        { error: 'Studio not found' },
        { status: 404 }
      );
    }
    
    // Update studio data
    studios[studioIndex] = {
      ...studios[studioIndex],
      ...body,
      id: studios[studioIndex].id, // Preserve the original ID
      slug: studios[studioIndex].slug, // Preserve the original slug
      updatedAt: new Date().toISOString()
    };
    
    saveStudios(studios);
    
    return NextResponse.json(studios[studioIndex]);
  } catch (error) {
    console.error('Error updating studio:', error);
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