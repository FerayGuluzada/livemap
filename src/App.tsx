import { HashRouter, Route, Routes } from 'react-router-dom'
import { firebaseConfigured } from './lib/firebase'
import { Home } from './pages/Home'
import { NodeManager } from './pages/NodeManager'
import { NodeDetail } from './pages/NodeDetail'
import { Scan } from './pages/Scan'
import { Record } from './pages/Record'
import { Navigate } from './pages/Navigate'
import { RoutesList } from './pages/RoutesList'

function App() {
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

  return (
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
  )
}

export default App
