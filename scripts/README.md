# Migration Scripts

This directory contains migration scripts for data maintenance and upgrades.

## Slug Backfill Script

### Purpose
The `backfillSlugs.ts` script generates missing slugs for existing users in the system. This is useful for:
- Migrating legacy data that was created before slug support
- Ensuring all users have SEO-friendly profile URLs
- Maintaining data consistency

### Usage

#### Running the Script
```bash
# From the project root directory
npx ts-node scripts/backfillSlugs.ts
```

#### What It Does
1. **Scans all users** in `data/users.json`
2. **Identifies users** without slugs but with names
3. **Generates unique slugs** using the same logic as the main application
4. **Validates uniqueness** to prevent conflicts
5. **Saves the updated data** back to the JSON file
6. **Reports results** with detailed logging

#### Output Example
```
🔧 Starting slug backfill process...
📊 Found 5 users in total
🎯 2 users need slug generation
📝 Generated slug for user John Doe: "john-doe"
📝 Generated slug for user Jane Smith: "jane-smith"
💾 Saved updated users to file

📊 Backfill Summary:
✅ Slugs generated: 2
❌ Errors: 0
🎯 Users processed: 5

🔍 Validating slug uniqueness...
✅ All slugs are unique

🎉 Slug backfill completed successfully!
```

### Safety Features
- **Idempotent**: Can be run multiple times safely
- **Non-destructive**: Never removes or overwrites existing slugs
- **Validation**: Checks for duplicate slugs after generation
- **Error handling**: Reports issues without corrupting data
- **Backup recommended**: Always backup your data before running

### When to Use
- After importing legacy user data
- When upgrading from a version without slug support
- If you suspect data inconsistencies with user slugs
- Before deploying to production (to ensure all users have slugs)

### Prerequisites
- Node.js with TypeScript support
- `ts-node` installed (`npm install -g ts-node`)
- Read/write access to the `data/` directory

### Troubleshooting

#### "No users found"
- Check that `data/users.json` exists and contains valid JSON
- Ensure you're running from the correct directory

#### "Permission denied"
- Check file permissions on the `data/` directory
- Ensure the script has write access

#### "Duplicate slugs found"
- This indicates an existing data issue
- Review the duplicate slugs reported
- Manually resolve conflicts before re-running

### Related Files
- `src/lib/utils.ts` - Contains the `slugify` function
- `src/lib/user-store.ts` - User management utilities
- `src/app/api/users/route.ts` - Automatic slug generation for new users 