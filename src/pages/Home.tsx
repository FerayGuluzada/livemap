import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function Home() {
  const { user, signOut } = useAuth()

  return (
    <div className="screen">
      <div className="topbar">
        <h1>livemap</h1>
      </div>
      <p className="subtitle">
        Scan a checkpoint QR when you arrive somewhere (an elevator, a stairwell, your
        front door). Record a route once, then let the app guide you next time.
      </p>

      <div className="list" style={{ marginTop: 8 }}>
        <Link to="/scan" className="btn btn-primary">
          Scan checkpoint
        </Link>
        <Link to="/nodes" className="btn btn-secondary">
          Manage checkpoints
        </Link>
        <Link to="/routes" className="btn btn-secondary">
          My routes
        </Link>
      </div>

      <div className="spacer" />
      <p className="card-meta" style={{ textAlign: 'center' }}>
        Tip: hold your phone flat, screen up, while walking — that's what lets the app
        tell left turns from right turns.
      </p>
      {user && (
        <p className="card-meta" style={{ textAlign: 'center' }}>
          Signed in as {user.displayName ?? user.email} ·{' '}
          <button
            className="btn-small"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
            onClick={signOut}
          >
            Sign out
          </button>
        </p>
      )}
    </div>
  )
}
