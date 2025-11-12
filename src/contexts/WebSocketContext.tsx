import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

// Use current subdomain for WebSocket connection
const WS_URL = `wss://${window.location.host}/api/ws`;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;

interface WebSocketMessage {
  type: string;
  ticketId?: string;
  data?: any;
  timestamp: string;
}

type MessageHandler = (data: any) => void;
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

interface WebSocketContextValue {
  state: ConnectionState;
  connected: boolean; // Backward compatibility
  connecting: boolean; // Backward compatibility
  subscribeToTicket: (ticketId: string) => void;
  unsubscribeFromTicket: (ticketId: string) => void;
  subscribeToGlobal: () => void;
  unsubscribeFromGlobal: () => void;
  subscribeToUser: (userId: string) => void;
  unsubscribeFromUser: (userId: string) => void;
  on: (eventType: string, handler: MessageHandler) => () => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<ConnectionState>('disconnected');

  // Refs to maintain stable references across renders
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const subscribedChannelsRef = useRef<Set<string>>(new Set());
  const isConnectingRef = useRef(false);

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
      MAX_RECONNECT_DELAY
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }, []);

  /**
   * Send subscription messages for all tracked channels
   */
  const resubscribeAll = useCallback((ws: WebSocket) => {
    if (ws.readyState !== WebSocket.OPEN) return;

    subscribedChannelsRef.current.forEach(channel => {
      ws.send(JSON.stringify({ type: 'subscribe', ticketId: channel }));
    });
  }, []);

  /**
   * Connect to WebSocket server
   * This function has NO dependencies and creates a stable connection
   */
  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Check if we've exceeded max reconnect attempts
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnect attempts reached. Giving up.');
      setState('failed');
      return;
    }

    isConnectingRef.current = true;
    setState(reconnectAttemptsRef.current === 0 ? 'connecting' : 'reconnecting');

    try {
      const url = user ? `${WS_URL}?userId=${user.id}` : WS_URL;
      console.log(`🔌 WebSocket connection attempt #${reconnectAttemptsRef.current + 1} to:`, url);

      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setState('connected');
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0; // Reset on successful connection
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

        // Resubscribe to all previously subscribed channels
        resubscribeAll(ws);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Handle system messages silently
          if (message.type === 'connected' || message.type === 'subscribed' || message.type === 'pong') {
            return;
          }

          // Dispatch to registered handlers
          const handlers = handlersRef.current.get(message.type);
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(message);
              } catch (err) {
                console.error('Error in message handler:', err);
              }
            });
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean
        });

        setState('disconnected');
        isConnectingRef.current = false;
        wsRef.current = null;

        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Attempt reconnection with exponential backoff
        reconnectAttemptsRef.current++;
        reconnectDelayRef.current = getReconnectDelay();

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          console.log(`⏳ Reconnecting in ${Math.round(reconnectDelayRef.current / 1000)}s (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelayRef.current);
        } else {
          console.error('❌ Max reconnection attempts reached');
          setState('failed');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('❌ Failed to create WebSocket:', err);
      isConnectingRef.current = false;
      setState('disconnected');
    }
  }, [user, getReconnectDelay, resubscribeAll]);

  /**
   * Disconnect WebSocket cleanly
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect'); // Normal closure
      wsRef.current = null;
    }
    subscribedChannelsRef.current.clear();
    setState('disconnected');
    isConnectingRef.current = false;
  }, []);

  /**
   * Subscribe to a channel (ticket or user)
   */
  const subscribe = useCallback((channel: string) => {
    subscribedChannelsRef.current.add(channel);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', ticketId: channel }));
    }
  }, []);

  /**
   * Unsubscribe from a channel
   */
  const unsubscribe = useCallback((channel: string) => {
    subscribedChannelsRef.current.delete(channel);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', ticketId: channel }));
    }
  }, []);

  /**
   * Public API functions
   */
  const subscribeToTicket = useCallback((ticketId: string) => {
    subscribe(ticketId);
  }, [subscribe]);

  const unsubscribeFromTicket = useCallback((ticketId: string) => {
    unsubscribe(ticketId);
  }, [unsubscribe]);

  const subscribeToGlobal = useCallback(() => {
    subscribe('*');
  }, [subscribe]);

  const unsubscribeFromGlobal = useCallback(() => {
    unsubscribe('*');
  }, [unsubscribe]);

  const subscribeToUser = useCallback((userId: string) => {
    subscribe(`user:${userId}`);
  }, [subscribe]);

  const unsubscribeFromUser = useCallback((userId: string) => {
    unsubscribe(`user:${userId}`);
  }, [unsubscribe]);

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
        // Clean up empty sets
        if (handlers.size === 0) {
          handlersRef.current.delete(eventType);
        }
      }
    };
  }, []);

  /**
   * Manual reconnect (resets attempt counter)
   */
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    disconnect();
    setTimeout(() => connect(), 100);
  }, [connect, disconnect]);

  // CRITICAL: Empty dependency array - runs ONCE on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []); // DO NOT add dependencies here

  const value: WebSocketContextValue = {
    state,
    connected: state === 'connected',
    connecting: state === 'connecting' || state === 'reconnecting',
    subscribeToTicket,
    unsubscribeFromTicket,
    subscribeToGlobal,
    unsubscribeFromGlobal,
    subscribeToUser,
    unsubscribeFromUser,
    on,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
