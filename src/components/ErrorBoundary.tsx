import React, { type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F6F2" }}>
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              Something went wrong
            </h1>
            <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
