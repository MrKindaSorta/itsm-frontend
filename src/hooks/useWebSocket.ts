import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Use current subdomain for WebSocket connection
const WS_URL = `wss://${window.location.host}/api/ws`;
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 30000;

interface WebSocketMessage {
  type: string;
  ticketId?: string;
  data?: any;
  timestamp: string;
}

type MessageHandler = (data: any) => void;

export function useWebSocket() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const subscribedTicketsRef = useRef<Set<string>>(new Set());

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (connecting) {
      return; // Connection in progress
    }

    setConnecting(true);

    try {
      const url = user ? `${WS_URL}?userId=${user.id}` : WS_URL;
      console.log('🔌 Attempting WebSocket connection to:', url);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setConnecting(false);

        // Resubscribe to tickets after reconnection
        subscribedTicketsRef.current.forEach(ticketId => {
          ws.send(JSON.stringify({ type: 'subscribe', ticketId }));
        });

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Handle system messages
          if (message.type === 'connected' || message.type === 'subscribed' || message.type === 'pong') {
            return;
          }

          // Dispatch to registered handlers
          const handlers = handlersRef.current.get(message.type);
          if (handlers) {
            handlers.forEach(handler => handler(message));
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket URL:', url);
        console.error('WebSocket readyState:', ws.readyState);
        setConnecting(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected');
        console.log('Close code:', event.code);
        console.log('Close reason:', event.reason);
        console.log('Was clean:', event.wasClean);
        setConnected(false);
        setConnecting(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, RECONNECT_DELAY);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setConnecting(false);
    }
  }, [user]); // Don't include 'connecting' to avoid re-initialization loop

  /**
   * Subscribe to a specific ticket's updates
   */
  const subscribeToTicket = useCallback((ticketId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, queuing subscription');
      subscribedTicketsRef.current.add(ticketId);
      return;
    }

    subscribedTicketsRef.current.add(ticketId);
    wsRef.current.send(JSON.stringify({ type: 'subscribe', ticketId }));
  }, []);

  /**
   * Unsubscribe from a ticket
   */
  const unsubscribeFromTicket = useCallback((ticketId: string) => {
    subscribedTicketsRef.current.delete(ticketId);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', ticketId }));
    }
  }, []);

  /**
   * Subscribe to global events (e.g., ticket creation)
   */
  const subscribeToGlobal = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, queuing global subscription');
      subscribedTicketsRef.current.add('*');
      return;
    }

    subscribedTicketsRef.current.add('*');
    wsRef.current.send(JSON.stringify({ type: 'subscribe', ticketId: '*' }));
  }, []);

  /**
   * Unsubscribe from global events
   */
  const unsubscribeFromGlobal = useCallback(() => {
    subscribedTicketsRef.current.delete('*');

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', ticketId: '*' }));
    }
  }, []);

  /**
   * Subscribe to user-specific notifications
   */
  const subscribeToUser = useCallback((userId: string) => {
    const channel = `user:${userId}`;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, queuing user subscription');
      subscribedTicketsRef.current.add(channel);
      return;
    }

    subscribedTicketsRef.current.add(channel);
    wsRef.current.send(JSON.stringify({ type: 'subscribe', ticketId: channel }));
  }, []);

  /**
   * Unsubscribe from user notifications
   */
  const unsubscribeFromUser = useCallback((userId: string) => {
    const channel = `user:${userId}`;
    subscribedTicketsRef.current.delete(channel);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', ticketId: channel }));
    }
  }, []);

  /**
   * Register an event handler
   */
  const on = useCallback((eventType: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    handlersRef.current.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = handlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }, []);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    subscribedTicketsRef.current.clear();
    setConnected(false);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    connected,
    connecting,
    subscribeToTicket,
    unsubscribeFromTicket,
    subscribeToGlobal,
    unsubscribeFromGlobal,
    subscribeToUser,
    unsubscribeFromUser,
    on,
    reconnect: connect,
  };
}
