"use client";

import { useNotification } from "@/components/NotificationProvider";
import {
  Bell,
  X,
  CheckCircle2,
  TrendingUp,
  Mail,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/i18n-format";
import { getTranslations, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

export function NotificationCenter() {
  const { notifications, markAsRead, removeNotification, clearNotifications } =
    useNotification();
  const { locale } = useLocale();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const persistentNotifications = notifications.filter(
    (n) => n.type === "persistent"
  );

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-emerald-500 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Dropdown */}
      <div className="absolute right-0 mt-4 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl dark:bg-slate-900 dark:border-slate-800 z-50 hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Notifications
            </h3>
            <button
              onClick={() => clearNotifications()}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
            >
              Clear All
            </button>
          </div>

          {persistentNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {persistentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg ${
                    notification.read
                      ? "bg-slate-50 dark:bg-slate-950"
                      : "bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-400 dark:border-emerald-300"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {notification.type === "toast" ? (
                      <Bell className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {notification.message}
                    </p>
                    {notification.action && (
                      <button
                        onClick={notification.action.onClick}
                        className="mt-1 text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 underline"
                      >
                        {notification.action.label}
                      </button>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-slate-400">
                        {formatDate(notification.timestamp, { hour: '2-digit', minute: '2-digit' }, locale)}
                      </span>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => clearNotifications()}
            className="w-full text-sm text-slate-600 hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
          >
            Mark All as Read
          </button>
        </div>
      </div>
    </div>
  );
}