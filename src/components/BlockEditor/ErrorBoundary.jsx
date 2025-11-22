/**
 * ErrorBoundary.jsx
 * 
 * Block Editor error boundary component
 * Catches and handles errors gracefully with fallback UI
 */

import React from 'react';

class BlockEditorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('BlockEditor Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
    
    // Optionally reload the page or reset state
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="block-editor-error p-8 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-700 mb-2">
              Block Editor Error
            </h2>
            <p className="text-gray-700 mb-4">
              Something went wrong while rendering the block editor.
            </p>
          </div>

          {/* Error details (development only) */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mb-4 p-4 bg-white rounded border border-red-200">
              <summary className="cursor-pointer font-semibold text-red-700 mb-2">
                Error Details (Development Mode)
              </summary>
              <div className="text-sm text-gray-700 font-mono whitespace-pre-wrap break-all">
                <div className="mb-2">
                  <strong>Message:</strong> {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => {
                if (this.props.onFallbackToTextarea) {
                  this.props.onFallbackToTextarea();
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Use Simple Text Editor
            </button>
          </div>

          {/* Help text */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>If this problem persists:</p>
            <ul className="mt-2 text-left inline-block">
              <li>• Try refreshing the page</li>
              <li>• Clear browser cache and storage</li>
              <li>• Check browser console for more details</li>
              <li>• Report this issue to the development team</li>
            </ul>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default BlockEditorErrorBoundary;
