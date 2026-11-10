import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

type BoundaryState = { error: string | null }

class AppErrorBoundary extends React.Component<React.PropsWithChildren, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AL-MUKHTARI ERP render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', padding: '32px 20px', display: 'grid', placeItems: 'center', background: '#f5f7f5', color: '#17251f', fontFamily: 'system-ui, sans-serif' }}>
          <section style={{ width: 'min(100%, 560px)', background: '#fff', border: '1px solid #e5e9e5', borderRadius: 14, padding: 24, boxShadow: '0 12px 40px #10251f12' }}>
            <div style={{ fontWeight: 800, letterSpacing: 1, color: '#173c2b' }}>AL-MUKHTARI ERP</div>
            <h1 style={{ fontSize: 22, margin: '18px 0 8px' }}>Cilad ayaa dhacday</h1>
            <p style={{ color: '#65736a', lineHeight: 1.6 }}>Bogga nidaamka si sax ah uma soo bandhigi karo. Fariintan ciladda ah waxay naga caawinaysaa baaritaanka.</p>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', background: '#fff4f2', color: '#9b3028', borderRadius: 8, padding: 12, fontSize: 12 }}>{this.state.error}</pre>
            <button onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 8, padding: '11px 16px', background: '#173c2b', color: '#fff', fontWeight: 700 }}>Dib u fur</button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
)
