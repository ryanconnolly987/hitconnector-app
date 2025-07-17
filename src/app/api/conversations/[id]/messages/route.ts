import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MESSAGES_FILE = path.join(process.cwd(), 'data', 'messages.json');
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const PROFILES_FILE = path.join(process.cwd(), 'data', 'user-profiles.json');

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
  unreadCount: { [userId: string]: number };
  deletedAt?: string;
}

interface MessagesData {
  messages: Message[];
  conversations: Conversation[];
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  studioId?: string; // Added studioId for studio users
}

interface UserProfile {
  id: string;
  name: string;
  profileImage?: string;
}

// Helper function to get user info with profile data
function getUserInfo(userId: string): { id: string; name: string; email: string; role: string; profileImage?: string; slug?: string; type?: string } | null {
  try {
    // Get basic user info
    let users: User[] = [];
    if (fs.existsSync(USERS_FILE)) {
      const usersData = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(usersData);
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    // Get profile info for avatar
    let profiles: UserProfile[] = [];
    if (fs.existsSync(PROFILES_FILE)) {
      const profilesData = fs.readFileSync(PROFILES_FILE, 'utf8');
      profiles = JSON.parse(profilesData);
    }
    
    const profile = profiles.find(p => p.id === userId);
    
    // If user is a studio, get studio information
    if (user.role === 'studio' && user.studioId) {
      try {
        const STUDIOS_FILE = path.join(process.cwd(), 'data', 'studios.json');
        if (fs.existsSync(STUDIOS_FILE)) {
          const studiosData = fs.readFileSync(STUDIOS_FILE, 'utf8');
          const studioDataObj = JSON.parse(studiosData);
          const studios = studioDataObj.studios || [];
          
          const studio = studios.find((s: any) => s.id === user.studioId);
          if (studio) {
            return {
              id: user.id,
              name: studio.name || user.name,
              email: user.email,
              role: user.role,
              profileImage: studio.profileImage || profile?.profileImage,
              slug: studio.slug,
              type: 'studio'
            };
          }
        }
      } catch (error) {
        console.error('Error fetching studio info for user:', userId, error);
      }
    }
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: profile?.profileImage,
      type: user.role === 'studio' ? 'studio' : 'artist'
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

function getMessagesData(): MessagesData {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
      const initialData: MessagesData = { messages: [], conversations: [] };
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading messages:', error);
    return { messages: [], conversations: [] };
  }
}

function saveMessagesData(data: MessagesData): void {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving messages:', error);
  }
}

// GET /api/conversations/[id]/messages - Get messages for a conversation with sender info and pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const before = searchParams.get('before'); // ISO timestamp for cursor-based pagination
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20; // Default 20 messages

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate limit parameter
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    const data = getMessagesData();
    
    // Verify user is part of this conversation and it's not deleted
    const conversation = data.conversations.find(conv => 
      conv.id === conversationId && conv.participants.includes(userId) && !conv.deletedAt
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get all messages for this conversation
    let filteredMessages = data.messages
      .filter(msg => msg.conversationId === conversationId);

    // Apply cursor-based pagination (before timestamp)
    if (before) {
      const beforeDate = new Date(before);
      if (isNaN(beforeDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid before timestamp format' },
          { status: 400 }
        );
      }
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.timestamp).getTime() < beforeDate.getTime()
      );
    }

    // Sort by timestamp descending (newest first for pagination), then take limit + 1 to check if there are more
    const sortedMessages = filteredMessages
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit + 1);

    // Check if there are more messages (hasMore)
    const hasMore = sortedMessages.length > limit;
    const messages = hasMore ? sortedMessages.slice(0, limit) : sortedMessages;

    // Keep newest first order for UI
    const finalMessages = messages
      .map(message => {
        const senderInfo = getUserInfo(message.senderId);
        return {
          ...message,
          senderInfo: senderInfo || {
            id: message.senderId,
            name: 'Unknown User',
            email: '',
            role: 'artist',
            profileImage: undefined
          }
        };
      });

    // Get participant info for the conversation
    const participantsInfo = conversation.participants.map(participantId => {
      const userInfo = getUserInfo(participantId);
      return userInfo || {
        id: participantId,
        name: 'Unknown User',
        email: '',
        role: 'artist',
        profileImage: undefined
      };
    });

    const conversationWithInfo = {
      ...conversation,
      participantsInfo
    };

    // Cursor for next page (timestamp of oldest message in current page - last in array since newest first)
    const nextCursor = finalMessages.length > 0 ? finalMessages[finalMessages.length - 1].timestamp : null;

    return NextResponse.json({ 
      conversation: conversationWithInfo,
      messages: finalMessages,
      pagination: {
        hasMore,
        nextCursor,
        limit
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET conversation messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/conversations/[id]/messages - Mark messages as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const data = getMessagesData();
    
    // Verify user is part of this conversation
    const conversation = data.conversations.find(conv => 
      conv.id === conversationId && conv.participants.includes(userId)
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Mark messages as read
    data.messages
      .filter(msg => msg.conversationId === conversationId && msg.receiverId === userId)
      .forEach(msg => msg.read = true);

    // Update conversation unread count
    conversation.unreadCount[userId] = 0;

    saveMessagesData(data);

    return NextResponse.json({ 
      message: 'Messages marked as read' 
    }, { status: 200 });

  } catch (error) {
    console.error('PUT conversation messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 