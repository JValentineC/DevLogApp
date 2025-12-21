import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
          <div className="card bg-base-100 shadow-xl max-w-2xl w-full">
            <div className="card-body">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-error text-5xl">⚠️</div>
                <div>
                  <h2 className="card-title text-2xl text-error">
                    Oops! Something went wrong
                  </h2>
                  <p className="text-base-content/70">
                    The application encountered an unexpected error
                  </p>
                </div>
              </div>

              {this.state.error && (
                <div className="bg-base-200 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold mb-2 text-error">
                    Error Details:
                  </h3>
                  <p className="font-mono text-sm text-base-content/80 break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              {this.state.errorInfo && (
                <details className="collapse collapse-arrow bg-base-200 mb-4">
                  <summary className="collapse-title font-medium">
                    Component Stack Trace
                  </summary>
                  <div className="collapse-content">
                    <pre className="text-xs overflow-auto max-h-60 text-base-content/70">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="card-actions justify-end gap-2">
                <button onClick={this.handleReload} className="btn btn-primary">
                  Reload Page
                </button>
                <button onClick={this.handleReset} className="btn btn-ghost">
                  Go to Home
                </button>
              </div>

              <div className="alert alert-info mt-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span className="text-sm">
                  If this problem persists, please contact support or try
                  clearing your browser cache.
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
