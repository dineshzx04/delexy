import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Result } from 'antd';
import * as Lucide from 'lucide-react';
import { Outlet } from 'react-router-dom';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service here
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
          <Result
            status="500"
            title={<span className="text-gray-900 font-bold tracking-tight">Something went wrong</span>}
            subTitle={
              <div className="text-gray-500 max-w-md mx-auto">
                <p className="mb-2">An unexpected error occurred in the application.</p>
                <div className="bg-gray-100 p-3 rounded-md text-sm font-mono text-red-600 text-left overflow-auto max-h-32 shadow-inner">
                  {this.state.error?.message || "Unknown Error"}
                </div>
              </div>
            }
            extra={
              <Button
                type="primary"
                size="large"
                className="bg-sky-600 hover:bg-sky-500 flex items-center gap-2 mx-auto"
                onClick={() => window.location.href = '/'}
              >
                <Lucide.RotateCcw size={16} />
                Reload Application
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children || <Outlet />;
  }
}

export default ErrorBoundary;
