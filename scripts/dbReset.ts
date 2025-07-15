import fs from 'fs';
import path from 'path';

// Path to data directory
const DATA_DIR = path.join(process.cwd(), 'data');

// Define initial state for each data file
const INITIAL_DATA = {
  'bookings.json': { bookings: [] },
  'booking-requests.json': { bookingRequests: [] },
  'messages.json': { messages: [], conversations: [] },
  'users.json': [],
  'user-profiles.json': { profiles: [] },
  'studios.json': { studios: [] },
  'rappers.json': { rappers: [] },
  'follows.json': { follows: [] },
  'open-calls.json': { openCalls: [] }
};

async function main() {
  console.log('🔥 Starting database reset...');
  
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data directory');
  }

  let filesProcessed = 0;
  
  // Reset each JSON file to its initial state
  for (const [filename, initialContent] of Object.entries(INITIAL_DATA)) {
    const filePath = path.join(DATA_DIR, filename);
    
    try {
      // Write the initial content to the file
      fs.writeFileSync(filePath, JSON.stringify(initialContent, null, 2));
      console.log(`✅ Reset ${filename}`);
      filesProcessed++;
    } catch (error) {
      console.error(`❌ Failed to reset ${filename}:`, error);
      throw error;
    }
  }
  
  console.log(`🎉 Database reset complete! Processed ${filesProcessed} files.`);
  console.log('🔥 All user-generated data wiped.');
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Database reset failed:', error);
    process.exit(1);
  }); 