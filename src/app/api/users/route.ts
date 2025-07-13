import { NextRequest, NextResponse } from 'next/server';
import { getUsers, saveUsers } from '@/lib/user-store';
import { slugify } from '@/lib/utils';

// GET /api/users - Get all users (with slug generation)
export async function GET(request: NextRequest) {
  try {
    const users = getUsers();
    
    // Add slugs to users that don't have them
    let needsSave = false;
    const usersWithSlugs = users.map(user => {
      if (!user.slug && user.name) {
        const baseSlug = slugify(user.name);
        let finalSlug = baseSlug;
        let counter = 1;
        
        // Ensure slug is unique
        while (users.some(u => u.slug === finalSlug && u.id !== user.id)) {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        needsSave = true;
        return { ...user, slug: finalSlug };
      }
      return user;
    });
    
    // Save back if we added slugs
    if (needsSave) {
      saveUsers(usersWithSlugs);
    }
    
    return NextResponse.json(usersWithSlugs);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
} 