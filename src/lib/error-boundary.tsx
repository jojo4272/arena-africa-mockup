import React, { Component, ErrorInfo, ReactNode } from "react";
import Sentry from "@/lib/sentry";

interface ErrorBoundaryProps {
  fallback: React.ComponentType<{ error: Error; resetError: () => void }>;
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Send error to Sentry
    if (Sentry) {
      Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
        // Optionally add more context
        contexts: {
          react: {
            name: "React",
            version: "19",
          },
        },
      });
    }
  }

  public resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children || (<></>);
  }
}

export default ErrorBoundary;

// Simple fallback component for demonstration
export function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-3xl w-full max-w-md p-6 text-center">
        <div className="flex items-center justify-start mb-4">
          <button onClick={resetError} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="ml-3 text-xl font-bold text-slate-900 dark:text-white">Something went wrong!</h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          We're sorry, but it looks like something broke. Our team has been notified and is working on a fix.
        </p>
        <p className="text-slate-400 dark:text-slate-300 text-xs mb-6">
          Error: {error.message}
        </p>
        <button onClick={resetError} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 px-4 rounded-xl text-xs transition-all">
          Try Again
        </button>
      </div>
    </div>
  );
}