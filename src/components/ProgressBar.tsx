interface Props {
  value: number
  max: number
}

export function ProgressBar({ value, max }: Props) {
  const pct = max <= 0 ? 100 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
