import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="shell">
          <section className="hero">
            <h1>Something went wrong</h1>
            <p className="sub">An unexpected error occurred. Please refresh or try again.</p>
          </section>
          <div className="panel" style={{ padding: 16, marginTop: 16 }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              If the issue persists, capture your steps and share with the team.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
