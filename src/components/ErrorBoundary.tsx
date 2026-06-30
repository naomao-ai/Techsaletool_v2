import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-surface/80 backdrop-blur-sm p-4">
          <div className="bg-brand-surface shadow-lg border border-brand-outline-variant rounded-xl max-w-md w-full p-6 animate-fade-scale flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-brand-error-container flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-brand-error" />
            </div>
            <h2 className="text-lg font-bold text-brand-on-surface mb-2">예상치 못한 오류가 발생했습니다</h2>
            <p className="text-sm text-brand-on-surface-variant mb-6 text-left w-full bg-brand-surface-lowest p-3 rounded overflow-auto max-h-32 font-mono break-all">
              {this.state.error?.message || '알 수 없는 오류'}
            </p>
            <div className="flex justify-center w-full">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary text-brand-on-primary font-medium rounded-lg hover:bg-brand-primary/90 flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>앱 다시 시작</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
