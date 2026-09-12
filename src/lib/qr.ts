import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { QR_PREFIX } from '../types'

export function nodePayload(nodeId: string): string {
  return `${QR_PREFIX}${nodeId}`
}

export function parseNodePayload(payload: string): string | null {
  if (!payload.startsWith(QR_PREFIX)) return null
  return payload.slice(QR_PREFIX.length)
}

export async function nodeQrDataUrl(nodeId: string): Promise<string> {
  return QRCode.toDataURL(nodePayload(nodeId), {
    width: 320,
    margin: 2,
    color: { dark: '#0a0a0a', light: '#ffffff' },
  })
}

export interface QrScanHandle {
  stop: () => void
}

// Opens the rear camera into `video`, samples frames onto an offscreen
// canvas, and runs jsQR against each frame until a code is found.
export async function startQrScan(
  video: HTMLVideoElement,
  onDecode: (payload: string) => void,
  onError?: (err: unknown) => void,
): Promise<QrScanHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
    audio: false,
  })
  video.srcObject = stream
  await video.play()

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  let stopped = false

  const tick = () => {
    if (stopped) return
    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code?.data) {
          onDecode(code.data)
          return
        }
      } catch (err) {
        onError?.(err)
      }
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)

  return {
    stop: () => {
      stopped = true
      stream.getTracks().forEach((track) => track.stop())
    },
  }
}
