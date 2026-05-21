import React from "react";

/**
 * React error boundary for app-wide error capture.
 */
export class ErrorBoundary extends React.Component {
  /**
   * @param {any} props
   */
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * @returns {{ hasError: boolean }}
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * @param {Error} error
   * @returns {void}
   */
  componentDidCatch(error) {
    console.error("[PivotIQ] ErrorBoundary caught error", error);
    this.setState({ error });
  }

  /**
   * @returns {React.ReactNode}
   */
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg text-textPrimary flex items-center justify-center p-6">
          <div className="bg-card border border-danger/40 rounded-xl p-6 max-w-xl w-full">
            <h1 className="text-xl font-semibold mb-3">Something went wrong</h1>
            <p className="text-textSecondary">Please refresh and try again.</p>
            {this.state.error ? <pre className="mt-4 text-xs text-danger whitespace-pre-wrap">{this.state.error.message}</pre> : null}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
