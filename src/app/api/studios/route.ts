import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { slugify } from '@/lib/utils';

const STUDIOS_FILE = path.join(process.cwd(), 'data', 'studios.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(STUDIOS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getStudios(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(STUDIOS_FILE)) {
      const data = fs.readFileSync(STUDIOS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      let studios = parsed.studios || [];
      
      // Add slugs to studios that don't have them
      let needsSave = false;
      studios = studios.map((studio: any) => {
        if (!studio.slug && studio.name) {
          const baseSlug = slugify(studio.name);
          let finalSlug = baseSlug;
          let counter = 1;
          
          // Ensure slug is unique
          while (studios.some((s: any) => s.slug === finalSlug && s.id !== studio.id)) {
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          
          studio.slug = finalSlug;
          needsSave = true;
        }
        return studio;
      });
      
      // Save back if we added slugs
      if (needsSave) {
        saveStudios(studios);
      }
      
      return studios;
    }
    return [];
  } catch (error) {
    console.error('Error reading studios file:', error);
    return [];
  }
}

function saveStudios(studios: any[]): void {
  try {
    ensureDataDir();
    const data = { studios };
    fs.writeFileSync(STUDIOS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving studios file:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const allStudios = getStudios();
    
    // Deduplicate studios by slug, keeping the most recently updated version
    const studioMap = new Map();
    for (const studio of allStudios) {
      const existingStudio = studioMap.get(studio.slug);
      if (!existingStudio || new Date(studio.updatedAt || studio.createdAt) > new Date(existingStudio.updatedAt || existingStudio.createdAt)) {
        studioMap.set(studio.slug, studio);
      }
    }
    
    const studios = Array.from(studioMap.values());
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
    
    // Generate studio ID and slug
    const studioId = `studio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const slug = body.name ? slugify(body.name) : slugify(`Studio ${Date.now()}`);
    
    // Ensure slug is unique
    let finalSlug = slug;
    let counter = 1;
    while (studios.some(studio => studio.slug === finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    
    // Create studio data
    const newStudio = {
      id: studioId,
      slug: finalSlug,
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