import type { TurnDirection } from '../types'

interface Props {
  direction: TurnDirection | 'straight' | 'arrived'
}

export function TurnArrow({ direction }: Props) {
  if (direction === 'arrived') {
    return <div className="instruction-arrow">🎉</div>
  }
  const rotation = direction === 'left' ? -90 : direction === 'right' ? 90 : 0
  return (
    <div className="instruction-arrow" style={{ transform: `rotate(${rotation}deg)` }}>
      ↑
    </div>
  )
}
