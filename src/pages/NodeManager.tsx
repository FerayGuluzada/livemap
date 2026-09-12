import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { MapNode, NodeType } from '../types'
import { deleteNode, listNodes, newId, saveNode } from '../lib/storage'
import { nodeQrDataUrl } from '../lib/qr'

export function NodeManager() {
  const navigate = useNavigate()
  const [nodes, setNodes] = useState<MapNode[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [floor, setFloor] = useState('')
  const [type, setType] = useState<NodeType>('elevator')
  const [qrOpenFor, setQrOpenFor] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  async function refresh() {
    setNodes(await listNodes())
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!qrOpenFor) {
      setQrDataUrl(null)
      return
    }
    nodeQrDataUrl(qrOpenFor).then(setQrDataUrl)
  }, [qrOpenFor])

  async function addNode() {
    if (!label.trim()) return
    const node: MapNode = {
      id: newId(),
      label: label.trim(),
      floor: floor.trim() || '—',
      type,
      createdAt: Date.now(),
    }
    await saveNode(node)
    await refresh()
    setLabel('')
    setFloor('')
    setQrOpenFor(node.id)
  }

  async function removeNode(id: string) {
    await deleteNode(id)
    await refresh()
    if (qrOpenFor === id) setQrOpenFor(null)
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          ‹
        </button>
        <h1>Checkpoints</h1>
      </div>
      <p className="subtitle">
        A checkpoint is any spot you scan on arrival — an elevator, a stairwell door,
        your front door at home. Each gets its own QR code to print or screenshot.
      </p>

      <div className="card">
        <div className="field">
          <label>Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Elevator A, Floor 3"
          />
        </div>
        <div className="field">
          <label>Floor / area</label>
          <input
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder="e.g. Floor 3, or Home"
          />
        </div>
        <div className="field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as NodeType)}>
            <option value="elevator">Elevator</option>
            <option value="stairs">Stairs</option>
            <option value="custom">Other</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={addNode} disabled={!label.trim()}>
          Add checkpoint
        </button>
      </div>

      <div className="list">
        {loading && <div className="empty-state">Loading…</div>}
        {!loading && nodes.length === 0 && (
          <div className="empty-state">No checkpoints yet — add your first one above.</div>
        )}
        {nodes.map((node) => (
          <div className="card" key={node.id}>
            <div className="card-row">
              <div>
                <div className="card-title">{node.label}</div>
                <div className="card-meta">
                  {node.floor} · {node.type}
                </div>
              </div>
              <span className="chip">{node.type}</span>
            </div>
            {qrOpenFor === node.id && qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={`QR code for ${node.label}`}
                style={{ width: '100%', borderRadius: 12, background: '#fff' }}
              />
            )}
            <div className="card-row">
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setQrOpenFor(qrOpenFor === node.id ? null : node.id)}
              >
                {qrOpenFor === node.id ? 'Hide QR' : 'Show QR'}
              </button>
              <button className="btn btn-danger btn-small" onClick={() => removeNode(node.id)}>
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
