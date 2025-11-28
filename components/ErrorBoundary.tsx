import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra lỗi (Application Error)</h1>
            <p className="text-gray-700 mb-4">
              Ứng dụng gặp sự cố không mong muốn. Vui lòng thử tải lại trang.
            </p>
            
            <div className="bg-gray-100 p-4 rounded overflow-auto mb-4 border border-gray-300 max-h-60">
              <p className="font-mono text-sm text-red-800 font-bold mb-2">
                {this.state.error && this.state.error.toString()}
              </p>
              <details className="whitespace-pre-wrap text-xs text-gray-500 font-mono">
                <summary className="cursor-pointer mb-1 hover:text-gray-700">Chi tiết Stack Trace</summary>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </details>
            </div>

            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}