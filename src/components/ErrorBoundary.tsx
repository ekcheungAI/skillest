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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F6F2" }}>
          <div className="text-center max-w-2xl mx-auto px-6">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Fraunces, Georgia, serif" }}>
              Something went wrong
            </h1>
            <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
              We encountered an unexpected error. Please check the browser console (F12) for details.
            </p>

            {error && (
              <div className="text-left bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-left">
                <p className="text-xs font-semibold text-red-700 mb-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {error.name}: {error.message}
                </p>
                {error.stack && (
                  <pre
                    className="text-[10px] text-red-600 mt-2 overflow-x-auto whitespace-pre-wrap"
                    style={{ fontFamily: "JetBrains Mono, monospace", maxHeight: "300px" }}
                  >
                    {error.stack}
                  </pre>
                )}
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 mr-2"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Reload Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
