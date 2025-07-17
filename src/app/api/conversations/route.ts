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
  studioId?: string; // Added for studio users
}

interface UserProfile {
  id: string;
  name: string;
  profileImage?: string;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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

// GET /api/conversations?userId=xxx - Get all conversations for a user with participant info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const data = getMessagesData();
    
    // Get conversations where user is a participant and not deleted
    const userConversations = data.conversations
      .filter(conv => conv.participants.includes(userId) && !conv.deletedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map(conv => {
        // Get participant info for each conversation
        const participantsInfo = conv.participants.map(participantId => {
          const userInfo = getUserInfo(participantId);
          return userInfo || {
            id: participantId,
            name: 'Unknown User',
            email: '',
            role: 'artist',
            profileImage: undefined
          };
        });

        // Find the other participant (not the current user)
        const other = participantsInfo.find(p => p.id !== userId) || null;

        return {
          ...conv,
          unreadCount: conv.unreadCount[userId] || 0,
          participantsInfo,
          other
        };
      });

    return NextResponse.json({ 
      conversations: userConversations 
    }, { status: 200 });

  } catch (error) {
    console.error('GET conversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create or fetch existing conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId } = body;

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: 'senderId and receiverId are required' },
        { status: 400 }
      );
    }

    if (senderId === receiverId) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    // Validate that both users exist
    const senderInfo = getUserInfo(senderId);
    const receiverInfo = getUserInfo(receiverId);
    
    if (!senderInfo || !receiverInfo) {
      return NextResponse.json(
        { error: 'One or both users not found' },
        { status: 404 }
      );
    }

    const data = getMessagesData();
    
    // Check if conversation already exists
    let conversation = data.conversations.find(conv => 
      conv.participants.includes(senderId) && conv.participants.includes(receiverId)
    );

    if (!conversation) {
      // Create new conversation
      conversation = {
        id: generateId(),
        participants: [senderId, receiverId],
        updatedAt: new Date().toISOString(),
        unreadCount: { [senderId]: 0, [receiverId]: 0 }
      };
      data.conversations.push(conversation);
      saveMessagesData(data);
    }

    // Add participant info to response
    const conversationWithInfo = {
      ...conversation,
      participantsInfo: [senderInfo, receiverInfo]
    };

    return NextResponse.json({ 
      conversation: conversationWithInfo 
    }, { status: 200 });

  } catch (error) {
    console.error('POST conversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 