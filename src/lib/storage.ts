import type { MapNode, SavedRoute } from '../types'

const NODES_KEY = 'livemap.nodes'
const ROUTES_KEY = 'livemap.routes'

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

export function listNodes(): MapNode[] {
  return read<MapNode>(NODES_KEY).sort((a, b) => a.createdAt - b.createdAt)
}

export function getNode(id: string): MapNode | undefined {
  return listNodes().find((n) => n.id === id)
}

export function saveNode(node: MapNode) {
  const nodes = listNodes()
  write(NODES_KEY, [...nodes, node])
}

export function deleteNode(id: string) {
  write(
    NODES_KEY,
    listNodes().filter((n) => n.id !== id),
  )
  // Routes referencing a deleted node no longer make sense.
  write(
    ROUTES_KEY,
    listRoutes().filter((r) => r.fromNodeId !== id && r.toNodeId !== id),
  )
}

export function listRoutes(): SavedRoute[] {
  return read<SavedRoute>(ROUTES_KEY).sort((a, b) => b.createdAt - a.createdAt)
}

export function getRoute(id: string): SavedRoute | undefined {
  return listRoutes().find((r) => r.id === id)
}

export function routesFromNode(nodeId: string): SavedRoute[] {
  return listRoutes().filter((r) => r.fromNodeId === nodeId)
}

export function saveRoute(route: SavedRoute) {
  const routes = listRoutes()
  write(ROUTES_KEY, [...routes, route])
}

export function deleteRoute(id: string) {
  write(
    ROUTES_KEY,
    listRoutes().filter((r) => r.id !== id),
  )
}

export function newId(): string {
  return crypto.randomUUID()
}
