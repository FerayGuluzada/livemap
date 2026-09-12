import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { MapNode, SavedRoute, TurnDirection } from '../types'
import { getNode, getRoute } from '../lib/storage'
import { MotionTracker, requestMotionPermission } from '../lib/motion'
import { TurnArrow } from '../components/TurnArrow'
import { ProgressBar } from '../components/ProgressBar'

type Phase = 'loading' | 'intro' | 'permission' | 'walking' | 'turning' | 'arrived'

export function Navigate() {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()
  const [route, setRoute] = useState<SavedRoute | null>(null)
  const [fromNode, setFromNode] = useState<MapNode | null>(null)
  const [toNode, setToNode] = useState<MapNode | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [stepsInSegment, setStepsInSegment] = useState(0)

  const trackerRef = useRef<MotionTracker | null>(null)
  const segmentIndexRef = useRef(0)
  const phaseRef = useRef<Phase>('loading')
  const routeRef = useRef<SavedRoute | null>(null)

  useEffect(() => {
    if (!routeId) return
    let cancelled = false
    async function run() {
      const r = (await getRoute(routeId!)) ?? null
      if (cancelled) return
      setRoute(r)
      routeRef.current = r
      if (r) {
        const [from, to] = await Promise.all([getNode(r.fromNodeId), getNode(r.toNodeId)])
        if (cancelled) return
        setFromNode(from ?? null)
        setToNode(to ?? null)
      }
      setPhaseBoth('intro')
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId])

  useEffect(() => {
    return () => trackerRef.current?.stop()
  }, [])

  function setPhaseBoth(p: Phase) {
    phaseRef.current = p
    setPhase(p)
  }

  function advanceSegment() {
    const next = segmentIndexRef.current + 1
    segmentIndexRef.current = next
    setSegmentIndex(next)
    setStepsInSegment(0)
    if (!routeRef.current || next >= routeRef.current.segments.length) {
      setPhaseBoth('arrived')
    } else {
      setPhaseBoth('walking')
    }
  }

  function handleTurn(_direction: TurnDirection) {
    if (phaseRef.current === 'turning') {
      advanceSegment()
    }
  }

  function handleStep() {
    if (phaseRef.current !== 'walking' || !routeRef.current) return
    setStepsInSegment((prev) => {
      const next = prev + 1
      const target = routeRef.current!.segments[segmentIndexRef.current]?.steps ?? 0
      if (next >= target) {
        const seg = routeRef.current!.segments[segmentIndexRef.current]
        if (seg?.turn) {
          setPhaseBoth('turning')
        } else {
          advanceSegment()
        }
      }
      return next
    })
  }

  async function start() {
    setPhase('permission')
    const granted = await requestMotionPermission()
    if (!granted) {
      setPermissionError(
        'Motion access was denied. Enable it in Settings > Safari > Motion & Orientation Access, then try again.',
      )
      setPhase('intro')
      return
    }
    segmentIndexRef.current = 0
    setSegmentIndex(0)
    setStepsInSegment(0)
    const tracker = new MotionTracker({
      onStep: handleStep,
      onTurn: handleTurn,
    })
    tracker.start()
    trackerRef.current = tracker
    setPhaseBoth('walking')
  }

  function manualConfirmTurn() {
    if (phaseRef.current === 'turning') advanceSegment()
  }

  if (phase === 'loading') {
    return (
      <div className="screen">
        <div className="empty-state">Loading…</div>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="screen">
        <div className="empty-state">Route not found.</div>
      </div>
    )
  }

  const currentSegment = route.segments[segmentIndex]

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          ‹
        </button>
        <h1>{toNode?.label ?? 'Navigate'}</h1>
      </div>
      <p className="subtitle">From {fromNode?.label}</p>

      {phase === 'intro' && (
        <div className="card">
          <div className="card-title">Ready to walk?</div>
          <p className="card-meta">
            Hold your phone flat, screen up, and follow the instructions as you walk.
          </p>
          {permissionError && (
            <p className="card-meta" style={{ color: 'var(--danger)' }}>
              {permissionError}
            </p>
          )}
          <button className="btn btn-primary" onClick={start}>
            Start
          </button>
        </div>
      )}

      {phase === 'permission' && (
        <div className="empty-state">Requesting motion sensor access…</div>
      )}

      {(phase === 'walking' || phase === 'turning') && currentSegment && (
        <div className="spacer" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="sheet" style={{ position: 'static', width: '100%' }}>
            {phase === 'walking' ? (
              <>
                <TurnArrow direction="straight" />
                <div className="instruction-text">
                  {Math.max(currentSegment.steps - stepsInSegment, 0)} steps to go
                </div>
                <ProgressBar value={stepsInSegment} max={currentSegment.steps} />
              </>
            ) : (
              <>
                <TurnArrow direction={currentSegment.turn ?? 'straight'} />
                <div className="instruction-text">Turn {currentSegment.turn}</div>
                <div className="instruction-sub">Tap once you've turned, if it's not detected</div>
                <button className="btn btn-secondary" onClick={manualConfirmTurn}>
                  I turned {currentSegment.turn}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {phase === 'arrived' && (
        <div className="spacer" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="sheet" style={{ position: 'static', width: '100%' }}>
            <TurnArrow direction="arrived" />
            <div className="instruction-text">You've arrived</div>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
