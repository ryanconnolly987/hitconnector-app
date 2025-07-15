import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MESSAGES_FILE = path.join(process.cwd(), 'data', 'messages.json');

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
  type?: 'text' | 'attachment';
  attachmentUrl?: string;
  attachmentFilename?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
  unreadCount: { [userId: string]: number };
  lastReadAt?: { [userId: string]: string };
  deletedAt?: string;
}

interface MessagesData {
  messages: Message[];
  conversations: Conversation[];
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
    console.error('Error saving messages data:', error);
  }
}

// PUT /api/conversations/[id]/read - Mark conversation as read
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
    
    // Find the conversation
    const conversation = data.conversations.find(conv => 
      conv.id === conversationId && conv.participants.includes(userId) && !conv.deletedAt
    );
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Update lastReadAt and reset unread count for this user
    if (!conversation.lastReadAt) {
      conversation.lastReadAt = {};
    }
    
    conversation.lastReadAt[userId] = new Date().toISOString();
    conversation.unreadCount[userId] = 0;
    
    // Mark messages as read for this user
    data.messages
      .filter(msg => msg.conversationId === conversationId && msg.receiverId === userId)
      .forEach(msg => {
        msg.read = true;
      });
    
    saveMessagesData(data);

    return NextResponse.json({ 
      success: true,
      lastReadAt: conversation.lastReadAt[userId],
      unreadCount: 0
    }, { status: 200 });

  } catch (error) {
    console.error('PUT conversation read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 