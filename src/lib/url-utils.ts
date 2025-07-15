/**
 * Build artist profile href with slug preference and fallback logic
 * @param artist - Artist object with slug and/or id
 * @returns Artist profile URL path
 */
export function buildArtistProfileHref(artist: { slug?: string; id?: string }): string | null {
  // Validate inputs
  if (!artist || (!artist.slug && !artist.id)) {
    console.warn('Cannot create artist profile link: both slug and id are missing', artist);
    return null;
  }
  
  // Prefer slug over ID for SEO-friendly URLs
  const identifier = artist.slug || artist.id;
  
  // Validate the identifier is not empty or invalid
  if (!identifier || identifier === 'undefined' || identifier === 'null' || identifier.trim() === '') {
    console.warn('Cannot create artist profile link: invalid identifier', artist);
    return null;
  }
  
  return `/artist/${identifier}`;
}

/**
 * Build artist profile href from separate slug and id parameters
 * @param slug - Artist slug (preferred)
 * @param id - Artist ID (fallback)
 * @returns Artist profile URL path
 */
export function buildArtistProfileHrefFromParams(slug?: string, id?: string): string | null {
  return buildArtistProfileHref({ slug, id });
}

/**
 * Check if we can create a valid artist profile link
 * @param artist - Artist object with slug and/or id
 * @returns true if a valid link can be created
 */
export function canCreateArtistLink(artist: { slug?: string; id?: string }): boolean {
  return buildArtistProfileHref(artist) !== null;
} 