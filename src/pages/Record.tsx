import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { MapNode, RouteSegment, TurnDirection } from '../types'
import { getNode, listNodes, newId, saveRoute } from '../lib/storage'
import { MotionTracker, requestMotionPermission } from '../lib/motion'

type Phase = 'setup' | 'permission' | 'recording' | 'done'

export function Record() {
  const { fromId } = useParams<{ fromId: string }>()
  const navigate = useNavigate()
  const [fromNode, setFromNode] = useState<MapNode | null>(null)
  const [candidates, setCandidates] = useState<MapNode[]>([])
  const [toNodeId, setToNodeId] = useState('')
  const [phase, setPhase] = useState<Phase>('setup')
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const [segments, setSegments] = useState<RouteSegment[]>([])
  const [currentSegmentSteps, setCurrentSegmentSteps] = useState(0)
  const trackerRef = useRef<MotionTracker | null>(null)
  const currentStepsRef = useRef(0)

  useEffect(() => {
    if (!fromId) return
    setFromNode(getNode(fromId) ?? null)
    setCandidates(listNodes().filter((n) => n.id !== fromId))
  }, [fromId])

  function closeSegment(turn: TurnDirection | null, turnDegrees: number) {
    setSegments((prev) => [
      ...prev,
      { steps: currentStepsRef.current, turn, turnDegrees },
    ])
    currentStepsRef.current = 0
    setCurrentSegmentSteps(0)
  }

  async function startRecording() {
    setPhase('permission')
    const granted = await requestMotionPermission()
    if (!granted) {
      setPermissionError(
        'Motion access was denied. Enable it in Settings > Safari > Motion & Orientation Access, then try again.',
      )
      setPhase('setup')
      return
    }
    setSegments([])
    currentStepsRef.current = 0
    setCurrentSegmentSteps(0)
    const tracker = new MotionTracker({
      onStep: (total) => {
        currentStepsRef.current += 1
        setCurrentSegmentSteps(currentStepsRef.current)
        void total
      },
      onTurn: (direction, degrees) => closeSegment(direction, degrees),
    })
    tracker.start()
    trackerRef.current = tracker
    setPhase('recording')
  }

  function manualTurn(direction: TurnDirection) {
    closeSegment(direction, 90)
  }

  function finishRecording() {
    trackerRef.current?.stop()
    trackerRef.current = null
    // Close out the final straight segment (no turn at the destination).
    if (currentStepsRef.current > 0) {
      setSegments((prev) => [
        ...prev,
        { steps: currentStepsRef.current, turn: null, turnDegrees: 0 },
      ])
      currentStepsRef.current = 0
      setCurrentSegmentSteps(0)
    }
    setPhase('done')
  }

  useEffect(() => {
    return () => {
      trackerRef.current?.stop()
    }
  }, [])

  function save() {
    if (!fromNode || !toNodeId) return
    const toNode = getNode(toNodeId)
    saveRoute({
      id: newId(),
      label: `${fromNode.label} → ${toNode?.label ?? 'destination'}`,
      fromNodeId: fromNode.id,
      toNodeId,
      segments,
      createdAt: Date.now(),
    })
    navigate(`/node/${fromNode.id}`)
  }

  if (!fromNode) {
    return (
      <div className="screen">
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
        <h1>Record route</h1>
      </div>
      <p className="subtitle">From {fromNode.label}</p>

      {phase === 'setup' && (
        <div className="card">
          <div className="field">
            <label>Destination checkpoint</label>
            <select value={toNodeId} onChange={(e) => setToNodeId(e.target.value)}>
              <option value="">Select where you're walking to…</option>
              {candidates.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label} ({n.floor})
                </option>
              ))}
            </select>
          </div>
          {candidates.length === 0 && (
            <p className="card-meta">
              No other checkpoints yet — add your destination (e.g. "My desk") under
              Manage checkpoints first.
            </p>
          )}
          {permissionError && (
            <p className="card-meta" style={{ color: 'var(--danger)' }}>
              {permissionError}
            </p>
          )}
          <button className="btn btn-primary" onClick={startRecording} disabled={!toNodeId}>
            Start walking & recording
          </button>
        </div>
      )}

      {phase === 'permission' && (
        <div className="empty-state">Requesting motion sensor access…</div>
      )}

      {phase === 'recording' && (
        <>
          <div className="card" style={{ alignItems: 'center' }}>
            <div className="instruction-text">{currentSegmentSteps} steps</div>
            <div className="instruction-sub">walking this stretch</div>
          </div>
          <div className="list">
            {segments.map((seg, i) => (
              <div className="card" key={i}>
                <div className="card-row">
                  <span className="card-meta">Segment {i + 1}</span>
                  <span className="card-meta">{seg.steps} steps</span>
                </div>
                {seg.turn && (
                  <div className="card-meta">
                    then turn {seg.turn} (~{seg.turnDegrees}°)
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="subtitle">
            Turns are detected automatically. If one's missed, tap the matching button
            the moment you turn.
          </p>
          <div className="card-row">
            <button className="btn btn-secondary" onClick={() => manualTurn('left')}>
              ↰ I turned left
            </button>
            <button className="btn btn-secondary" onClick={() => manualTurn('right')}>
              ↱ I turned right
            </button>
          </div>
          <div className="spacer" />
          <button className="btn btn-primary" onClick={finishRecording}>
            I've arrived
          </button>
        </>
      )}

      {phase === 'done' && (
        <div className="card">
          <div className="card-title">Route recorded</div>
          <p className="card-meta">
            {segments.length} segment{segments.length === 1 ? '' : 's'} saved from{' '}
            {fromNode.label} to {getNode(toNodeId)?.label}.
          </p>
          <button className="btn btn-primary" onClick={save}>
            Save route
          </button>
        </div>
      )}
    </div>
  )
}
