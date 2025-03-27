// components/ErrorBoundary.jsx
import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary caught:", error, errorInfo);
    // Log to error monitoring service (e.g., Sentry)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback bg-red-50 p-6 rounded-lg border border-red-200 max-w-2xl mx-auto my-8">
          <div className="text-center">
            <FiAlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Oops! Something went wrong.
            </h2>
            <p className="text-red-700 mb-4">
              {this.state.error?.toString()}
            </p>
            <button
              onClick={this.handleReset}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <p className="mt-4 text-sm text-red-600">
              Technical details have been logged. Contact support if the issue persists.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;