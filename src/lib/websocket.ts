/**
 * WebSocket client for real-time messaging
 * This is a foundation that can be extended for full real-time support
 */

interface MessageEvent {
  type: 'message_created' | 'message_read' | 'user_typing' | 'conversation_updated';
  conversationId: string;
  data: any;
}

interface WebSocketEventHandler {
  (event: MessageEvent): void;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Map<string, WebSocketEventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private userId: string | null = null;

  constructor() {
    // In development, we would connect to a WebSocket server
    // For now, this is a foundation for future implementation
  }

  connect(userId: string): void {
    this.userId = userId;
    
    // TODO: In production, implement actual WebSocket connection
    // Example: this.ws = new WebSocket(`${WS_URL}/chat/${userId}`);
    
    console.log('WebSocket foundation initialized for user:', userId);
    console.log('Note: Full WebSocket implementation pending');
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
    this.userId = null;
  }

  // Subscribe to specific events
  on(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  // Unsubscribe from events
  off(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Send message event (for future WebSocket implementation)
  sendEvent(event: MessageEvent): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket not connected, event not sent:', event);
    }
  }

  // Simulate real-time event for testing (can be removed in production)
  simulateEvent(event: MessageEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  private handleMessage(event: MessageEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      console.log(`WebSocket reconnection attempt ${this.reconnectAttempts + 1}`);
      this.reconnectAttempts++;
      if (this.userId) {
        this.connect(this.userId);
      }
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();

// Hook for React components
export function useWebSocket(userId: string | null) {
  const connect = () => {
    if (userId && userId !== wsClient['userId']) {
      wsClient.connect(userId);
    }
  };

  const disconnect = () => {
    wsClient.disconnect();
  };

  const subscribe = (eventType: string, handler: WebSocketEventHandler) => {
    wsClient.on(eventType, handler);
    
    // Return cleanup function
    return () => {
      wsClient.off(eventType, handler);
    };
  };

  return {
    connect,
    disconnect,
    subscribe,
    sendEvent: wsClient.sendEvent.bind(wsClient),
    simulateEvent: wsClient.simulateEvent.bind(wsClient)
  };
}

export type { MessageEvent, WebSocketEventHandler }; 