"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Notification {
  id: string;
  type: "toast" | "persistent";
  message: string;
  timestamp: Date;
  read?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addToast: (notification: Omit<Notification, "id" | "timestamp" | "type"> & { type?: "toast" }) => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp"> & { type?: "persistent" }) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate a unique ID
  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  // Remove a notification by ID
  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    []
  );

  // Add a toast notification (ephemeral)
  const addToast = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "type"> & { type?: "toast" }) => {
      const id = generateId();
      const newNotification: Notification = {
        id,
        type: "toast",
        timestamp: new Date(),
        ...notification,
      };
      setNotifications((prev) => [...prev, newNotification]);

      // Auto-remove toast after 5 seconds if not dismissed
      const timer = setTimeout(() => {
        removeNotification(id);
      }, 5000);

      // Return a function to manually dismiss the toast
      return () => {
        clearTimeout(timer);
        removeNotification(id);
      };
    },
    [generateId, removeNotification]
  );

  // Add a persistent notification (stored in the notification center)
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp"> & { type?: "persistent" }) => {
      const id = generateId();
      const newNotification: Notification = {
        id,
        type: "persistent",
        timestamp: new Date(),
        read: false,
        ...notification,
      };
      setNotifications((prev) => [...prev, newNotification]);
    },
    [generateId]
  );

  // Mark a notification as read
  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    []
  );

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addToast,
        addNotification,
        markAsRead,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}