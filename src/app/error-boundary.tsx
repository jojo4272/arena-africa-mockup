'use client';

import ErrorBoundary, { ErrorFallback } from "@/lib/error-boundary";

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}