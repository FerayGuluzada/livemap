import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { MapNode, SavedRoute } from '../types'

// One shared board: every checkpoint and route lives in these two
// top-level collections, visible and editable by anyone with the link.
const nodesCol = () => collection(db, 'checkpoints')
const routesCol = () => collection(db, 'routes')

export async function listNodes(): Promise<MapNode[]> {
  const snap = await getDocs(nodesCol())
  return snap.docs.map((d) => d.data() as MapNode).sort((a, b) => a.createdAt - b.createdAt)
}

export async function getNode(id: string): Promise<MapNode | undefined> {
  const snap = await getDoc(doc(nodesCol(), id))
  return snap.exists() ? (snap.data() as MapNode) : undefined
}

export async function saveNode(node: MapNode): Promise<void> {
  await setDoc(doc(nodesCol(), node.id), node)
}

export async function deleteNode(id: string): Promise<void> {
  await deleteDoc(doc(nodesCol(), id))
  // Best-effort cleanup: a failure here shouldn't make the primary delete
  // above look like it failed too (the caller's UI refresh would never run).
  try {
    const routes = await listRoutes()
    await Promise.all(
      routes
        .filter((r) => r.fromNodeId === id || r.toNodeId === id)
        .map((r) => deleteDoc(doc(routesCol(), r.id))),
    )
  } catch (err) {
    console.error('Failed to clean up routes for deleted checkpoint', id, err)
  }
}

export async function listRoutes(): Promise<SavedRoute[]> {
  const snap = await getDocs(routesCol())
  return snap.docs.map((d) => d.data() as SavedRoute).sort((a, b) => b.createdAt - a.createdAt)
}

export async function getRoute(id: string): Promise<SavedRoute | undefined> {
  const snap = await getDoc(doc(routesCol(), id))
  return snap.exists() ? (snap.data() as SavedRoute) : undefined
}

export async function routesFromNode(nodeId: string): Promise<SavedRoute[]> {
  const q = query(routesCol(), where('fromNodeId', '==', nodeId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as SavedRoute)
}

export async function saveRoute(route: SavedRoute): Promise<void> {
  await setDoc(doc(routesCol(), route.id), route)
}

export async function deleteRoute(id: string): Promise<void> {
  await deleteDoc(doc(routesCol(), id))
}

export function newId(): string {
  return crypto.randomUUID()
}
