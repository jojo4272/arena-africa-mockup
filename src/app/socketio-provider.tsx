'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket, SOCKET_EVENTS } from '@/lib/socketio';
import { useNotification } from '@/components/NotificationProvider';

interface SocketIOProviderProps {
  children: React.ReactNode;
  socketUrl: string;
}

export default function SocketIOProvider({ children, socketUrl }: SocketIOProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const { subscribe, unsubscribe, send } = useSocket(socketUrl);
  const { addToast } = useNotification();

  // Connection status effect
  useEffect(() => {
    // Subscribe to connection status
    const connectedUnsubscribe = subscribe(SOCKET_EVENTS.CONNECT, () => {
      setIsConnected(true);
    });

    const disconnectedUnsubscribe = subscribe(SOCKET_EVENTS.DISCONNECT, () => {
      setIsConnected(false);
    });

    // Subscribe to notification events
    const notificationUnsubscribe = subscribe(SOCKET_EVENTS.NOTIFICATION, (data) => {
      addToast({
        message: data.message || 'New notification',
        type: data.type as 'toast' | undefined
      });
    });

    // Subscribe to market updates
    const marketUpdateUnsubscribe = subscribe(SOCKET_EVENTS.MARKET_UPDATE, (data) => {
      // In a real app, we'd update React Query cache or state
      console.log('Market update received:', data);
    });

    // Subscribe to balance updates
    const balanceUpdateUnsubscribe = subscribe(SOCKET_EVENTS.USER_BALANCE_UPDATE, (data) => {
      // Update user balance in context or state
      console.log('Balance update received:', data);
    });

    return () => {
      connectedUnsubscribe();
      disconnectedUnsubscribe();
      notificationUnsubscribe();
      marketUpdateUnsubscribe();
      balanceUpdateUnsubscribe();
    };
  }, [subscribe, addToast]);

  // Enhanced send function with error handling
  const safeSend = useCallback((eventType: string, data: any) => {
    try {
      send(eventType, data);
    } catch (error) {
      console.error('Failed to send Socket.IO message:', error);
      addToast({
        message: 'Connection lost. Reconnecting...',
        type: 'toast'
      });
    }
  }, [send, addToast]);

  return (
    <div data-socket-connected={isConnected.toString()}>
      {children}
    </div>
  );
}