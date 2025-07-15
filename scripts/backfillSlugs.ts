import fs from 'fs';
import path from 'path';

// Define the slugify function (same as in utils.ts)
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

interface User {
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

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

function getUsers(): User[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function saveUsers(users: User[]): void {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users file:', error);
    throw error;
  }
}

/**
 * Backfill missing slugs for all users
 * This script is idempotent - it can be run multiple times safely
 */
function backfillSlugs(): void {
  console.log('🔧 Starting slug backfill process...');
  
  const users = getUsers();
  console.log(`📊 Found ${users.length} users in total`);
  
  let usersNeedingSlug = 0;
  let slugsGenerated = 0;
  let errors = 0;
  
  // First pass: count users needing slugs
  users.forEach(user => {
    if (!user.slug && user.name) {
      usersNeedingSlug++;
    } else if (!user.slug && !user.name) {
      console.warn(`⚠️  User ${user.id} has no name and no slug - cannot generate slug`);
    }
  });
  
  console.log(`🎯 ${usersNeedingSlug} users need slug generation`);
  
  if (usersNeedingSlug === 0) {
    console.log('✅ All users already have slugs - nothing to do');
    return;
  }
  
  // Second pass: generate slugs
  const usersWithSlugs = users.map(user => {
    if (!user.slug && user.name) {
      try {
        const baseSlug = slugify(user.name);
        let finalSlug = baseSlug;
        let counter = 1;
        
        // Ensure slug is unique across all users
        while (users.some(u => u.slug === finalSlug && u.id !== user.id)) {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        console.log(`📝 Generated slug for user ${user.name}: "${finalSlug}"`);
        slugsGenerated++;
        
        return { ...user, slug: finalSlug };
      } catch (error) {
        console.error(`❌ Error generating slug for user ${user.id}:`, error);
        errors++;
        return user;
      }
    }
    return user;
  });
  
  // Save the updated users
  try {
    saveUsers(usersWithSlugs);
    console.log('💾 Saved updated users to file');
  } catch (error) {
    console.error('❌ Failed to save users file:', error);
    process.exit(1);
  }
  
  // Summary
  console.log('\n📊 Backfill Summary:');
  console.log(`✅ Slugs generated: ${slugsGenerated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`🎯 Users processed: ${users.length}`);
  
  if (errors > 0) {
    console.log('\n⚠️  Some errors occurred. Please check the log above.');
    process.exit(1);
  } else {
    console.log('\n🎉 Slug backfill completed successfully!');
  }
}

/**
 * Validate that all slugs are unique
 */
function validateSlugs(): void {
  console.log('\n🔍 Validating slug uniqueness...');
  
  const users = getUsers();
  const slugCounts: { [slug: string]: number } = {};
  const duplicateUsers: User[] = [];
  
  users.forEach(user => {
    if (user.slug) {
      slugCounts[user.slug] = (slugCounts[user.slug] || 0) + 1;
      if (slugCounts[user.slug] > 1) {
        duplicateUsers.push(user);
      }
    }
  });
  
  const duplicateSlugs = Object.keys(slugCounts).filter(slug => slugCounts[slug] > 1);
  
  if (duplicateSlugs.length > 0) {
    console.error('❌ Found duplicate slugs:');
    duplicateSlugs.forEach(slug => {
      console.error(`  - "${slug}" used by ${slugCounts[slug]} users`);
    });
    process.exit(1);
  } else {
    console.log('✅ All slugs are unique');
  }
}

// Main execution
try {
  backfillSlugs();
  validateSlugs();
} catch (error) {
  console.error('❌ Backfill process failed:', error);
  process.exit(1);
} 