export type NodeType = 'elevator' | 'stairs' | 'custom'

export interface MapNode {
  id: string
  label: string
  floor: string
  type: NodeType
  createdAt: number
}

export type TurnDirection = 'left' | 'right'

export interface RouteSegment {
  steps: number
  turn: TurnDirection | null
  turnDegrees: number
}

export interface SavedRoute {
  id: string
  label: string
  fromNodeId: string
  toNodeId: string
  segments: RouteSegment[]
  createdAt: number
}

export const QR_PREFIX = 'livemap:node:'
