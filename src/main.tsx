import { StrictMode, Component } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AdminApp from './components/AdminApp'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#300', color: '#fdd', height: '100vh', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Crash di sistema!</h1>
          <p>L'app si è interrotta. Fai uno screenshot di questo errore e invialo (o copia il testo):</p>
          <pre style={{ background: '#000', padding: '15px', overflowX: 'auto', border: '1px solid #f55', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px', lineHeight: '1.5' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => { localStorage.removeItem('auth_intent'); window.location.reload(); }} style={{ padding: '10px 20px', background: '#f55', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' }}>
            Ricarica la pagina
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const path = window.location.pathname;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {path === '/admin' ? <AdminApp /> : <App />}
    </ErrorBoundary>
  </StrictMode>,
)
