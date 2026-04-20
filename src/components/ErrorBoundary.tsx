
import React from 'react';

interface Props { children?: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

/**
 * ErrorBoundary — wraps the entire app.
 * Catches render/API failures so a single crash never takes down the whole UI.
 * Matches the existing app design: white bento-card style, emerald accents.
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Nutri-Guardian] Unhandled error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          padding: '2rem',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '2rem',
            padding: '3rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)',
            border: '1px solid rgba(226,232,240,0.6)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              background: '#FFF1F2',
              borderRadius: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: 36,
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#0F172A',
              marginBottom: '0.75rem',
              letterSpacing: '-0.025em',
            }}
          >
            Clinical System Error
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '2rem', lineHeight: 1.7 }}>
            {this.state.error?.message || 'An unexpected error occurred. Please refresh to reconnect.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#10B981',
              color: '#fff',
              border: 'none',
              borderRadius: '1rem',
              padding: '0.875rem 2rem',
              fontWeight: 900,
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Reinitialize System
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
