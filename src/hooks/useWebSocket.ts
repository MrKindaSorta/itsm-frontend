/**
 * Legacy useWebSocket hook - now just re-exports the context
 * This maintains backward compatibility with existing code
 *
 * MIGRATION: All components now use a shared WebSocket connection via Context
 * instead of creating individual connections per component
 */
export { useWebSocketContext as useWebSocket } from '@/contexts/WebSocketContext';
