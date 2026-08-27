import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-left bg-white border border-red-200 rounded-lg shadow-md m-4">
          <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong.</h2>
          <p className="text-gray-700 mb-4">{this.state.error && this.state.error.toString()}</p>
          <pre className="text-xs font-mono text-gray-500 bg-gray-50 p-4 rounded overflow-auto whitespace-pre-wrap">
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
