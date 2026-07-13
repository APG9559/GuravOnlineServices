import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top left, #1e1e2e, #11111b)',
            color: '#cdd6f4',
            padding: '2rem',
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '650px',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '2.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              animation: 'fadeIn 0.6s ease-out',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #f38ba8, #e78284)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 24px rgba(243, 139, 168, 0.3)',
              }}
            >
              ⚠️
            </div>

            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#f38ba8',
                margin: '0 0 0.75rem 0',
                letterSpacing: '-0.02em',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: '#a6adc8',
                margin: '0 0 1.5rem 0',
              }}
            >
              An unexpected error occurred in the application. We've logged the error, and you can
              try resetting or reloading the page.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#f38ba8',
                    marginBottom: '0.5rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <pre
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      lineHeight: 1.5,
                      color: '#bac2de',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: 'linear-gradient(135deg, #cba6f7, #89b4fa)',
                  border: 'none',
                  color: '#11111b',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(203, 166, 247, 0.2)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(203, 166, 247, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(203, 166, 247, 0.2)';
                }}
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cdd6f4',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
