import fs from 'fs';
import path from 'path';
import { Artist } from './types';
import { slugify } from './utils';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const PROFILES_FILE = path.join(process.cwd(), 'data', 'user-profiles.json');

interface BasicUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  createdAt: string;
  slug?: string;
  studioId?: string;
  stripeCustomerId?: string;
}

interface ExtendedProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  location?: string;
  website?: string;
  trackUrl?: string;
  profileImage?: string;
  bannerImage?: string;
  projectHighlights?: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    trackUrl?: string;
  }>;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
  };
  genres?: string[];
  experience?: string;
  createdAt?: string;
}

function getUsers(): BasicUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      
      // Validate that users is an array
      if (!Array.isArray(users)) {
        console.error('Users data is not an array, returning empty array');
        return [];
      }
      
      return users;
    }
    return [];
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function getProfiles(): ExtendedProfile[] {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const data = fs.readFileSync(PROFILES_FILE, 'utf8');
      const profiles = JSON.parse(data);
      
      // Validate that profiles is an array
      if (!Array.isArray(profiles)) {
        console.error('Profiles data is not an array, returning empty array');
        return [];
      }
      
      return profiles;
    }
    return [];
  } catch (error) {
    console.error('Error reading profiles file:', error);
    return [];
  }
}

/**
 * Validate identifier for safety
 */
function isValidIdentifier(identifier: string): boolean {
  return !!(identifier && 
           identifier.trim() !== '' && 
           identifier !== 'undefined' && 
           identifier !== 'null' &&
           identifier.length > 0 &&
           identifier.length < 100); // Reasonable length limit
}

/**
 * Generate a fallback slug if user doesn't have one
 */
function generateFallbackSlug(user: BasicUser, existingUsers: BasicUser[]): string {
  if (user.slug && isValidIdentifier(user.slug)) {
    return user.slug;
  }
  
  // Generate slug from name if available
  if (user.name) {
    const baseSlug = slugify(user.name);
    let finalSlug = baseSlug;
    let counter = 1;
    
    // Ensure uniqueness
    while (existingUsers.some(u => u.slug === finalSlug && u.id !== user.id)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return finalSlug;
  }
  
  // Last resort: use a portion of the user ID
  return `user-${user.id.split('_').pop() || user.id.slice(-8)}`;
}

/**
 * Get complete artist profile data by combining user and profile data
 */
export function getCompleteArtistProfile(userId: string): Artist | null {
  try {
    // Validate input
    if (!isValidIdentifier(userId)) {
      console.warn('Invalid userId provided to getCompleteArtistProfile:', userId);
      return null;
    }

    const users = getUsers();
    const profiles = getProfiles();
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      console.warn('User not found:', userId);
      return null;
    }
    
    if (user.role !== 'rapper') {
      console.warn('User is not an artist (rapper):', userId, 'role:', user.role);
      return null;
    }
    
    const profile = profiles.find(p => p.id === userId);
    
    // Generate fallback slug if needed
    const slug = generateFallbackSlug(user, users);
    
    // Combine user and profile data with safeguards
    const completeProfile: Artist = {
      id: user.id,
      name: user.name || 'Unknown Artist',
      email: user.email,
      role: user.role,
      slug: slug,
      created_at: user.createdAt,
      // Extended profile data with fallbacks
      bio: profile?.bio || undefined,
      location: profile?.location || undefined,
      experience: profile?.experience || undefined,
      genres: Array.isArray(profile?.genres) ? profile.genres : undefined,
      socialMedia: profile?.socialMedia || undefined,
      trackUrl: profile?.trackUrl || undefined,
      profileImage: profile?.profileImage || undefined,
      avatarUrl: profile?.profileImage || undefined, // Use profileImage as avatarUrl for consistency
      bannerImage: profile?.bannerImage || undefined,
      projectHighlights: Array.isArray(profile?.projectHighlights) ? profile.projectHighlights : undefined
    };
    
    return completeProfile;
  } catch (error) {
    console.error('Error getting complete artist profile:', error);
    return null;
  }
}

/**
 * Get complete artist profile data by slug
 */
export function getCompleteArtistProfileBySlug(slug: string): Artist | null {
  try {
    // Validate input
    if (!isValidIdentifier(slug)) {
      console.warn('Invalid slug provided to getCompleteArtistProfileBySlug:', slug);
      return null;
    }

    const users = getUsers();
    const user = users.find(u => u.slug === slug && u.role === 'rapper');
    
    if (!user) {
      console.warn('Artist not found by slug:', slug);
      return null;
    }
    
    return getCompleteArtistProfile(user.id);
  } catch (error) {
    console.error('Error getting complete artist profile by slug:', error);
    return null;
  }
}

/**
 * Get complete artist profile by slug or ID (unified function)
 */
export function getCompleteArtistProfileBySlugOrId(identifier: string): Artist | null {
  try {
    // Validate input
    if (!isValidIdentifier(identifier)) {
      console.warn('Invalid identifier provided to getCompleteArtistProfileBySlugOrId:', identifier);
      return null;
    }

    // First try by slug
    const profileBySlug = getCompleteArtistProfileBySlug(identifier);
    if (profileBySlug) {
      return profileBySlug;
    }
    
    // Fallback to ID
    return getCompleteArtistProfile(identifier);
  } catch (error) {
    console.error('Error getting complete artist profile by slug or ID:', error);
    return null;
  }
} 