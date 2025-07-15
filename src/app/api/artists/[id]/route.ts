import { NextRequest, NextResponse } from 'next/server';
import { getCompleteArtistProfileBySlugOrId } from '@/lib/profile-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: identifier } = await params;
    
    // Validate identifier
    if (!identifier || identifier === 'undefined' || identifier === 'null') {
      return NextResponse.json({ error: 'Invalid artist identifier provided' }, { status: 400 });
    }
    
    const artist = getCompleteArtistProfileBySlugOrId(identifier);
    
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    return NextResponse.json(artist);

  } catch (error) {
    console.error('Error fetching artist profile:', error);
    return NextResponse.json({ error: 'Failed to fetch artist profile' }, { status: 500 });
  }
} 