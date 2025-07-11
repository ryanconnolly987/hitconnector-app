import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MESSAGES_FILE = path.join(process.cwd(), 'data', 'messages.json');

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  messages: Message[];
}

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(MESSAGES_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read messages from file
function getMessages(): { conversations: Conversation[] } {
  ensureDataDir();
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
      const initialData = { conversations: [] };
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading messages file:', error);
    return { conversations: [] };
  }
}

// Write messages to file
function saveMessages(data: { conversations: Conversation[] }): void {
  ensureDataDir();
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving messages file:', error);
    throw new Error('Failed to save messages data');
  }
}

// Generate UUID-like ID
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const data = getMessages();

    if (conversationId) {
      // Get specific conversation
      const conversation = data.conversations.find(c => 
        c.id === conversationId && c.participants.includes(userId)
      );

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ conversation }, { status: 200 });
    } else {
      // Get all conversations for user
      const userConversations = data.conversations
        .filter(c => c.participants.includes(userId))
        .map(c => ({
          id: c.id,
          participants: c.participants,
          lastMessage: c.messages[c.messages.length - 1] || null,
          messageCount: c.messages.length
        }));

      return NextResponse.json({ conversations: userConversations }, { status: 200 });
    }
  } catch (error) {
    console.error('GET messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, recipientId, content } = body;

    if (!senderId || !recipientId || !content) {
      return NextResponse.json(
        { error: 'senderId, recipientId, and content are required' },
        { status: 400 }
      );
    }

    const data = getMessages();
    
    // Find existing conversation between these users
    let conversation = data.conversations.find(c => 
      c.participants.includes(senderId) && c.participants.includes(recipientId)
    );

    // Create new message
    const newMessage: Message = {
      id: generateId(),
      senderId,
      recipientId,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };

    if (!conversation) {
      // Create new conversation
      conversation = {
        id: generateId(),
        participants: [senderId, recipientId],
        messages: [newMessage]
      };
      data.conversations.push(conversation);
    } else {
      // Add message to existing conversation
      conversation.messages.push(newMessage);
    }

    saveMessages(data);

    return NextResponse.json({
      message: 'Message sent successfully',
      messageData: newMessage,
      conversationId: conversation.id
    }, { status: 201 });

  } catch (error) {
    console.error('POST messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 