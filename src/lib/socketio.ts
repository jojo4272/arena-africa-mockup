import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Singleton Socket.IO instance
let socket: Socket | null = null;

// Event types
export const SOCKET_EVENTS = {
  MARKET_UPDATE: "market_update",
  MARKET_CREATE: "market_create",
  MARKET_RESOLVE: "market_resolve",
  PREDICTION_PLACED: "prediction_placed",
  TRANSACTION_UPDATE: "transaction_update",
  CHAMA_UPDATE: "chama_update",
  NOTIFICATION: "notification",
  USER_BALANCE_UPDATE: "user_balance_update",
  CONNECT: "connect",
  DISCONNECT: "disconnect",
} as const;

export type SocketEventType = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

// Hook for using Socket.IO in components
export function useSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.IO on mount
  useEffect(() => {
    if (!socket) {
      socket = io(url, {
        transports: ["websocket"],
      });

      socket.on(SOCKET_EVENTS.CONNECT, () => {
        setIsConnected(true);
      });

      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        setIsConnected(false);
      });
    }

    socketRef.current = socket;

    return () => {
      // We don't disconnect the socket here because it's a singleton
      // and might be used by other components.
      // In a real app, you might want to track usage count.
    };
  }, [url]);

  // Subscribe to events
  const subscribe = useCallback((eventType: SocketEventType, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(eventType, callback);
      return () => {
        if (socketRef.current) {
          socketRef.current.off(eventType, callback);
        }
      };
    }
    return () => {};
  }, []);

  // Unsubscribe from events
  const unsubscribe = useCallback((eventType: SocketEventType, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(eventType, callback);
    }
  }, []);

  // Send data through Socket.IO
  const send = useCallback((eventType: SocketEventType, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(eventType, data);
    }
  }, []);

  return { isConnected, subscribe, unsubscribe, send };
}