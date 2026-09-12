import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { MapNode, SavedRoute } from '../types'
import { getNode, listNodes, routesFromNode } from '../lib/storage'

export function NodeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [node, setNode] = useState<MapNode | null>(null)
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [nodesById, setNodesById] = useState<Record<string, MapNode>>({})

  useEffect(() => {
    if (!id) return
    setNode(getNode(id) ?? null)
    setRoutes(routesFromNode(id))
    setNodesById(Object.fromEntries(listNodes().map((n) => [n.id, n])))
  }, [id])

  if (!id || !node) {
    return (
      <div className="screen">
        <div className="topbar">
          <button className="back-button" onClick={() => navigate(-1)}>
            ‹
          </button>
          <h1>Checkpoint</h1>
        </div>
        <div className="empty-state">Checkpoint not found.</div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          ‹
        </button>
        <h1>{node.label}</h1>
      </div>
      <p className="subtitle">
        {node.floor} · {node.type}
      </p>

      <div className="list">
        <div className="card-title">Routes from here</div>
        {routes.length === 0 && (
          <div className="empty-state">No routes recorded from this checkpoint yet.</div>
        )}
        {routes.map((route) => (
          <div className="card" key={route.id}>
            <div className="card-row">
              <div>
                <div className="card-title">{route.label}</div>
                <div className="card-meta">
                  → {nodesById[route.toNodeId]?.label ?? 'Unknown'} ·{' '}
                  {route.segments.length} segment{route.segments.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>
            <Link to={`/navigate/${route.id}`} className="btn btn-primary btn-small">
              Navigate
            </Link>
          </div>
        ))}
      </div>

      <div className="spacer" />
      <Link to={`/record/${node.id}`} className="btn btn-secondary">
        Record new route from here
      </Link>
    </div>
  )
}
