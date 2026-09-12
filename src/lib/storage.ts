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

function nodesCol(uid: string) {
  return collection(db, 'users', uid, 'nodes')
}

function routesCol(uid: string) {
  return collection(db, 'users', uid, 'routes')
}

export async function listNodes(uid: string): Promise<MapNode[]> {
  const snap = await getDocs(nodesCol(uid))
  return snap.docs.map((d) => d.data() as MapNode).sort((a, b) => a.createdAt - b.createdAt)
}

export async function getNode(uid: string, id: string): Promise<MapNode | undefined> {
  const snap = await getDoc(doc(nodesCol(uid), id))
  return snap.exists() ? (snap.data() as MapNode) : undefined
}

export async function saveNode(uid: string, node: MapNode): Promise<void> {
  await setDoc(doc(nodesCol(uid), node.id), node)
}

export async function deleteNode(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(nodesCol(uid), id))
  const routes = await listRoutes(uid)
  await Promise.all(
    routes
      .filter((r) => r.fromNodeId === id || r.toNodeId === id)
      .map((r) => deleteDoc(doc(routesCol(uid), r.id))),
  )
}

export async function listRoutes(uid: string): Promise<SavedRoute[]> {
  const snap = await getDocs(routesCol(uid))
  return snap.docs.map((d) => d.data() as SavedRoute).sort((a, b) => b.createdAt - a.createdAt)
}

export async function getRoute(uid: string, id: string): Promise<SavedRoute | undefined> {
  const snap = await getDoc(doc(routesCol(uid), id))
  return snap.exists() ? (snap.data() as SavedRoute) : undefined
}

export async function routesFromNode(uid: string, nodeId: string): Promise<SavedRoute[]> {
  const q = query(routesCol(uid), where('fromNodeId', '==', nodeId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as SavedRoute)
}

export async function saveRoute(uid: string, route: SavedRoute): Promise<void> {
  await setDoc(doc(routesCol(uid), route.id), route)
}

export async function deleteRoute(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(routesCol(uid), id))
}

export function newId(): string {
  return crypto.randomUUID()
}
