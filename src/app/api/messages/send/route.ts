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
function getUserInfo(userId: string): { id: string; name: string; email: string; role: string; profileImage?: string; type?: string } | null {
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

// POST /api/messages/send - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, senderId, receiverId, text } = body;

    if (!conversationId || !senderId || !receiverId || !text?.trim()) {
      return NextResponse.json(
        { error: 'conversationId, senderId, receiverId, and text are required' },
        { status: 400 }
      );
    }

    if (senderId === receiverId) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      );
    }

    // Validate that sender exists
    const senderInfo = getUserInfo(senderId);
    if (!senderInfo) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }

    // Validate that receiver exists
    const receiverInfo = getUserInfo(receiverId);
    if (!receiverInfo) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    const data = getMessagesData();
    
    // Verify conversation exists and user is a participant
    const conversation = data.conversations.find(conv => 
      conv.id === conversationId && conv.participants.includes(senderId)
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Create new message
    const newMessage: Message = {
      id: generateId(),
      conversationId,
      senderId,
      receiverId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    data.messages.push(newMessage);

    // Update conversation
    conversation.lastMessage = newMessage;
    conversation.updatedAt = newMessage.timestamp;
    conversation.unreadCount[receiverId] = (conversation.unreadCount[receiverId] || 0) + 1;

    saveMessagesData(data);

    // Return message with sender info for immediate UI update
    const messageWithSenderInfo = {
      ...newMessage,
      senderInfo: senderInfo
    };

    return NextResponse.json({
      message: 'Message sent successfully',
      data: messageWithSenderInfo
    }, { status: 201 });

  } catch (error) {
    console.error('POST send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 