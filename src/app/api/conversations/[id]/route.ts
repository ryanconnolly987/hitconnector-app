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
  studioId?: string;
}

interface UserProfile {
  id: string;
  name: string;
  profileImage?: string;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Helper function to get messages data
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

// Helper function to save messages data
function saveMessagesData(data: MessagesData): void {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving messages data:', error);
  }
}



// GET /api/conversations/[id] - Get a specific conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const data = getMessagesData();
    
    // Find the conversation
    const conversation = data.conversations.find(conv => conv.id === conversationId);
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant
    if (!conversation.participants.includes(userId)) {
      return NextResponse.json(
        { error: 'Access denied. You are not a participant in this conversation.' },
        { status: 403 }
      );
    }

    // Return conversation details
    return NextResponse.json(conversation, { status: 200 });

  } catch (error) {
    console.error('GET conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete (soft delete) a conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const data = getMessagesData();
    
    // Find the conversation
    const conversation = data.conversations.find(conv => conv.id === conversationId);
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant (authorization)
    if (!conversation.participants.includes(userId)) {
      return NextResponse.json(
        { error: 'Access denied. You are not a participant in this conversation.' },
        { status: 403 }
      );
    }

    // Check if already deleted
    if (conversation.deletedAt) {
      return NextResponse.json(
        { error: 'Conversation is already deleted' },
        { status: 409 }
      );
    }

    // Soft delete by adding deletedAt timestamp
    conversation.deletedAt = new Date().toISOString();
    
    saveMessagesData(data);

    return NextResponse.json({ 
      success: true,
      message: 'Conversation deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 