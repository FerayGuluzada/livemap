import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseNodePayload, startQrScan, type QrScanHandle } from '../lib/qr'
import { getNode } from '../lib/storage'

export function Scan() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const handleRef = useRef<QrScanHandle | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!videoRef.current) return
      try {
        const handle = await startQrScan(
          videoRef.current,
          (payload) => {
            const nodeId = parseNodePayload(payload)
            if (!nodeId || !getNode(nodeId)) {
              setError('That QR code is not a livemap checkpoint.')
              return
            }
            handle.stop()
            navigate(`/node/${nodeId}`)
          },
        )
        if (cancelled) {
          handle.stop()
        } else {
          handleRef.current = handle
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? `Camera error: ${err.message}`
            : 'Could not access the camera.',
        )
      }
    }
    run()
    return () => {
      cancelled = true
      handleRef.current?.stop()
    }
  }, [navigate])

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-button" onClick={() => navigate(-1)}>
          ‹
        </button>
        <h1>Scan checkpoint</h1>
      </div>
      <div className="camera-frame">
        <video ref={videoRef} playsInline muted />
      </div>
      {error && <p className="subtitle" style={{ color: 'var(--danger)' }}>{error}</p>}
      <p className="subtitle">Point your camera at a checkpoint's QR code.</p>
    </div>
  )
}
