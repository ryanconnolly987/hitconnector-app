import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

// Mock the Next.js environment
const DATA_DIR = path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROFILES_FILE = path.join(DATA_DIR, 'user-profiles.json');

describe('Conversation Pagination Test', () => {
  beforeAll(() => {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test data
    [MESSAGES_FILE, USERS_FILE, PROFILES_FILE].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  test('should paginate messages with cursor-based pagination', async () => {
    const testUserId1 = 'test-user-1';
    const testUserId2 = 'test-user-2';
    const testConversationId = 'test-conversation-123';

    // Create test users
    const userData = [
      {
        id: testUserId1,
        name: 'Test User 1',
        email: 'user1@test.com',
        role: 'rapper'
      },
      {
        id: testUserId2,
        name: 'Test User 2',
        email: 'user2@test.com',
        role: 'studio'
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(userData, null, 2));

    // Create test profiles
    const profileData = [
      {
        id: testUserId1,
        name: 'Test User 1',
        profileImage: '/test-avatar1.jpg'
      },
      {
        id: testUserId2,
        name: 'Test User 2',
        profileImage: '/test-avatar2.jpg'
      }
    ];
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profileData, null, 2));

    // Create test messages data with conversation and multiple messages
    const now = new Date();
    const messages = [];
    
    // Create 25 messages across different times
    for (let i = 1; i <= 25; i++) {
      const messageTime = new Date(now.getTime() - (25 - i) * 60000); // 1 minute apart
      messages.push({
        id: `message-${i}`,
        conversationId: testConversationId,
        senderId: i % 2 === 0 ? testUserId1 : testUserId2,
        receiverId: i % 2 === 0 ? testUserId2 : testUserId1,
        text: `Test message ${i}`,
        timestamp: messageTime.toISOString(),
        read: false
      });
    }

    const messagesData = {
      conversations: [
        {
          id: testConversationId,
          participants: [testUserId1, testUserId2],
          updatedAt: now.toISOString(),
          unreadCount: { [testUserId1]: 0, [testUserId2]: 0 }
        }
      ],
      messages
    };
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesData, null, 2));

    // Import and test the conversation messages API
    const { GET } = await import('../../src/app/api/conversations/[id]/messages/route');
    
    // Test 1: Get first page (latest 20 messages)
    const url1 = new URL(`http://localhost:3000/api/conversations/${testConversationId}/messages?userId=${testUserId1}&limit=20`);
    const request1 = new NextRequest(url1);
    const params1 = Promise.resolve({ id: testConversationId });

    const response1 = await GET(request1, { params: params1 });
    const data1 = await response1.json();

    // Verify first page response
    expect(response1.status).toBe(200);
    expect(data1).toHaveProperty('messages');
    expect(data1).toHaveProperty('pagination');
    expect(data1.messages).toHaveLength(20);
    expect(data1.pagination.hasMore).toBe(true);
    expect(data1.pagination.limit).toBe(20);
    expect(data1.pagination.nextCursor).toBeDefined();

    // Verify messages are in correct order (oldest first for UI)
    const firstPageMessages = data1.messages;
    expect(firstPageMessages[0].text).toBe('Test message 6'); // Should start from message 6 (latest 20 of 25)
    expect(firstPageMessages[19].text).toBe('Test message 25'); // Last message

    // Test 2: Get second page using cursor
    const beforeCursor = data1.pagination.nextCursor;
    const url2 = new URL(`http://localhost:3000/api/conversations/${testConversationId}/messages?userId=${testUserId1}&limit=20&before=${beforeCursor}`);
    const request2 = new NextRequest(url2);
    const params2 = Promise.resolve({ id: testConversationId });

    const response2 = await GET(request2, { params: params2 });
    const data2 = await response2.json();

    // Verify second page response
    expect(response2.status).toBe(200);
    expect(data2.messages).toHaveLength(5); // Remaining 5 messages
    expect(data2.pagination.hasMore).toBe(false);
    expect(data2.messages[0].text).toBe('Test message 1'); // Oldest message
    expect(data2.messages[4].text).toBe('Test message 5'); // Last of the older messages

    // Test 3: Verify conversation info is included
    expect(data1.conversation).toBeDefined();
    expect(data1.conversation.participantsInfo).toHaveLength(2);
    expect(data1.conversation.participantsInfo[0]).toHaveProperty('profileImage');
  });

  test('should handle invalid pagination parameters', async () => {
    const testUserId = 'test-user-1';
    const testConversationId = 'test-conversation-123';

    // Create minimal test data
    const userData = [{ id: testUserId, name: 'Test User', email: 'test@test.com', role: 'rapper' }];
    fs.writeFileSync(USERS_FILE, JSON.stringify(userData, null, 2));
    
    const messagesData = {
      conversations: [
        {
          id: testConversationId,
          participants: [testUserId],
          updatedAt: new Date().toISOString(),
          unreadCount: { [testUserId]: 0 }
        }
      ],
      messages: []
    };
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesData, null, 2));

    const { GET } = await import('../../src/app/api/conversations/[id]/messages/route');

    // Test invalid limit
    const url1 = new URL(`http://localhost:3000/api/conversations/${testConversationId}/messages?userId=${testUserId}&limit=101`);
    const request1 = new NextRequest(url1);
    const params1 = Promise.resolve({ id: testConversationId });

    const response1 = await GET(request1, { params: params1 });
    expect(response1.status).toBe(400);
    const data1 = await response1.json();
    expect(data1.error).toBe('Limit must be between 1 and 100');

    // Test invalid before timestamp
    const url2 = new URL(`http://localhost:3000/api/conversations/${testConversationId}/messages?userId=${testUserId}&before=invalid-date`);
    const request2 = new NextRequest(url2);
    const params2 = Promise.resolve({ id: testConversationId });

    const response2 = await GET(request2, { params: params2 });
    expect(response2.status).toBe(400);
    const data2 = await response2.json();
    expect(data2.error).toBe('Invalid before timestamp format');
  });

  test('should handle empty conversation', async () => {
    const testUserId = 'test-user-1';
    const testConversationId = 'test-conversation-empty';

    // Create test data with empty conversation
    const userData = [{ id: testUserId, name: 'Test User', email: 'test@test.com', role: 'rapper' }];
    fs.writeFileSync(USERS_FILE, JSON.stringify(userData, null, 2));
    
    const messagesData = {
      conversations: [
        {
          id: testConversationId,
          participants: [testUserId],
          updatedAt: new Date().toISOString(),
          unreadCount: { [testUserId]: 0 }
        }
      ],
      messages: []
    };
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesData, null, 2));

    const { GET } = await import('../../src/app/api/conversations/[id]/messages/route');

    const url = new URL(`http://localhost:3000/api/conversations/${testConversationId}/messages?userId=${testUserId}`);
    const request = new NextRequest(url);
    const params = Promise.resolve({ id: testConversationId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.messages).toHaveLength(0);
    expect(data.pagination.hasMore).toBe(false);
    expect(data.pagination.nextCursor).toBe(null);
  });
}); 