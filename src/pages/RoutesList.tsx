import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { MapNode, SavedRoute } from '../types'
import { deleteRoute, listNodes, listRoutes } from '../lib/storage'

export function RoutesList() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [nodesById, setNodesById] = useState<Record<string, MapNode>>({})
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const [routesResult, allNodes] = await Promise.all([listRoutes(), listNodes()])
    setRoutes(routesResult)
    setNodesById(Object.fromEntries(allNodes.map((n) => [n.id, n])))
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function remove(id: string) {
    await deleteRoute(id)
    await refresh()
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          ‹
        </button>
        <h1>All routes</h1>
      </div>

      <div className="list">
        {loading && <div className="empty-state">Loading…</div>}
        {!loading && routes.length === 0 && (
          <div className="empty-state">
            No routes recorded yet. Scan a checkpoint to record your first one.
          </div>
        )}
        {routes.map((route) => (
          <div className="card" key={route.id}>
            <div className="card-title">{route.label}</div>
            <div className="card-meta">
              {nodesById[route.fromNodeId]?.label ?? 'Unknown'} →{' '}
              {nodesById[route.toNodeId]?.label ?? 'Unknown'} · {route.segments.length}{' '}
              segment{route.segments.length === 1 ? '' : 's'}
            </div>
            <div className="card-row">
              <Link to={`/navigate/${route.id}`} className="btn btn-primary btn-small">
                Navigate
              </Link>
              <button className="btn btn-danger btn-small" onClick={() => remove(route.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="spacer" />
      <Link to="/" className="btn btn-secondary">
        Done
      </Link>
    </div>
  )
}
