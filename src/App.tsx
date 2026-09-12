import { HashRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { firebaseConfigured } from './lib/firebase'
import { Home } from './pages/Home'
import { NodeManager } from './pages/NodeManager'
import { NodeDetail } from './pages/NodeDetail'
import { Scan } from './pages/Scan'
import { Record } from './pages/Record'
import { Navigate } from './pages/Navigate'
import { RoutesList } from './pages/RoutesList'

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading, error, signIn } = useAuth()

  if (!firebaseConfigured) {
    return (
      <div className="screen">
        <div className="empty-state">
          Firebase isn't configured yet. Set the VITE_FIREBASE_* environment variables
          and reload.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="screen">
        <div className="empty-state">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="screen">
        <div className="topbar">
          <h1>livemap</h1>
        </div>
        <p className="subtitle">
          Sign in so your checkpoints and routes are saved to your account and available
          on any device.
        </p>
        {error && <p className="subtitle" style={{ color: 'var(--danger)' }}>{error}</p>}
        <button className="btn btn-primary" onClick={signIn}>
          Sign in with Google
        </button>
      </div>
    )
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Gate>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/nodes" element={<NodeManager />} />
            <Route path="/node/:id" element={<NodeDetail />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/record/:fromId" element={<Record />} />
            <Route path="/navigate/:routeId" element={<Navigate />} />
            <Route path="/routes" element={<RoutesList />} />
          </Routes>
        </HashRouter>
      </Gate>
    </AuthProvider>
  )
}

export default App
