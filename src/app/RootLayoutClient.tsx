'use client';

import type { ReactNode } from "react";
import QueryProvider from "./query-provider";
import SocketIOProvider from "./socketio-provider";
import AppErrorBoundary from "./error-boundary";
import { LocaleProvider } from "@/lib/locale-context";

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <SocketIOProvider socketUrl={process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"}>
          <LocaleProvider>
            {children}
          </LocaleProvider>
        </SocketIOProvider>
      </QueryProvider>
    </AppErrorBoundary>
  );
}