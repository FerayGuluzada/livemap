import type { TurnDirection } from '../types'

export interface MotionHandlers {
  onStep?: (totalSteps: number) => void
  onTurn?: (direction: TurnDirection, degrees: number) => void
}

// iOS requires an explicit user-gesture-triggered permission prompt for
// both motion and orientation events. Other browsers just work.
export async function requestMotionPermission(): Promise<boolean> {
  const DeviceMotionEventIOS = DeviceMotionEvent as unknown as {
    requestPermission?: () => Promise<'granted' | 'denied'>
  }
  if (typeof DeviceMotionEventIOS?.requestPermission === 'function') {
    try {
      const result = await DeviceMotionEventIOS.requestPermission()
      return result === 'granted'
    } catch {
      return false
    }
  }
  return true
}

const GRAVITY_SMOOTHING = 0.9 // higher = slower-adapting gravity estimate
const STEP_THRESHOLD = 1.1 // m/s^2 of linear acceleration to count as a step peak
const STEP_MIN_INTERVAL_MS = 250 // debounce: fastest plausible step cadence

const TURN_RATE_THRESHOLD = 25 // deg/s to start considering it a turn
const TURN_MIN_DEGREES = 35 // total rotation required to count as a real turn (vs. wobble)
const TURN_END_DEBOUNCE_MS = 150 // how long rate must stay low before closing a turn

// Detects walking steps and turns from raw devicemotion events.
// Assumes the phone is held flat, screen up, like reading a compass —
// that's what makes rotationRate.alpha correspond to yaw (left/right turns).
export class MotionTracker {
  private handlers: MotionHandlers
  private gravity = { x: 0, y: 0, z: 0 }
  private gravityInitialized = false
  private lastMagnitude = 0
  private rising = false
  private lastStepAt = 0
  private stepCount = 0

  private turning = false
  private turnAccumDegrees = 0
  private turnBelowThresholdSince: number | null = null
  private lastSampleAt = 0

  private boundHandler = this.handleMotion.bind(this)

  constructor(handlers: MotionHandlers) {
    this.handlers = handlers
  }

  start() {
    this.stepCount = 0
    this.gravityInitialized = false
    this.lastSampleAt = performance.now()
    window.addEventListener('devicemotion', this.boundHandler)
  }

  stop() {
    window.removeEventListener('devicemotion', this.boundHandler)
  }

  get steps() {
    return this.stepCount
  }

  private handleMotion(event: DeviceMotionEvent) {
    const now = performance.now()
    const dt = Math.max(0, (now - this.lastSampleAt) / 1000)
    this.lastSampleAt = now
    this.processAcceleration(event)
    this.processRotation(event, dt, now)
  }

  private processAcceleration(event: DeviceMotionEvent) {
    const raw = event.accelerationIncludingGravity
    if (!raw || raw.x === null || raw.y === null || raw.z === null) return
    const { x, y, z } = raw as { x: number; y: number; z: number }

    if (!this.gravityInitialized) {
      this.gravity = { x, y, z }
      this.gravityInitialized = true
      return
    }
    this.gravity.x = GRAVITY_SMOOTHING * this.gravity.x + (1 - GRAVITY_SMOOTHING) * x
    this.gravity.y = GRAVITY_SMOOTHING * this.gravity.y + (1 - GRAVITY_SMOOTHING) * y
    this.gravity.z = GRAVITY_SMOOTHING * this.gravity.z + (1 - GRAVITY_SMOOTHING) * z

    const lx = x - this.gravity.x
    const ly = y - this.gravity.y
    const lz = z - this.gravity.z
    const magnitude = Math.sqrt(lx * lx + ly * ly + lz * lz)

    const now = performance.now()
    if (magnitude > this.lastMagnitude) {
      this.rising = true
    } else if (this.rising && magnitude < this.lastMagnitude) {
      // We just passed a peak.
      if (
        this.lastMagnitude > STEP_THRESHOLD &&
        now - this.lastStepAt > STEP_MIN_INTERVAL_MS
      ) {
        this.stepCount += 1
        this.lastStepAt = now
        this.handlers.onStep?.(this.stepCount)
      }
      this.rising = false
    }
    this.lastMagnitude = magnitude
  }

  private processRotation(event: DeviceMotionEvent, dt: number, now: number) {
    const rate = event.rotationRate?.alpha
    if (rate === null || rate === undefined || dt === 0) return

    if (Math.abs(rate) > TURN_RATE_THRESHOLD) {
      this.turning = true
      this.turnBelowThresholdSince = null
      this.turnAccumDegrees += rate * dt
      return
    }

    if (this.turning) {
      if (this.turnBelowThresholdSince === null) {
        this.turnBelowThresholdSince = now
      } else if (now - this.turnBelowThresholdSince > TURN_END_DEBOUNCE_MS) {
        this.finishTurn()
      }
    }
  }

  private finishTurn() {
    const degrees = this.turnAccumDegrees
    this.turning = false
    this.turnAccumDegrees = 0
    this.turnBelowThresholdSince = null
    if (Math.abs(degrees) >= TURN_MIN_DEGREES) {
      const direction: TurnDirection = degrees > 0 ? 'right' : 'left'
      this.handlers.onTurn?.(direction, Math.round(Math.abs(degrees)))
    }
  }
}
