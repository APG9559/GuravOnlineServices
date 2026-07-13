import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Route error caught:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="card"
          style={{ margin: '2rem auto', maxWidth: '600px', border: '3px solid var(--border)' }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '32px' }}>⚠️</span>
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '8px', textTransform: 'uppercase' }}>
                Section failed to load
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                An unexpected error occurred while loading this page. You can try refreshing the
                section or reloading the browser.
              </p>
              {this.state.error && (
                <pre
                  style={{
                    background: 'var(--bg)',
                    padding: '12px',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    border: '1.5px solid var(--border)',
                    marginBottom: '16px',
                    color: 'var(--text-hint)',
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={this.handleReset}>
                  🔄 Retry
                </button>
                <button className="btn btn-sm" onClick={() => window.location.reload()}>
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
