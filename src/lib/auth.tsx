import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
  signOut as firebaseSignOut,
  getRedirectResult,
  type User,
} from 'firebase/auth'
import { auth, firebaseConfigured } from './firebase'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false)
      return
    }
    getRedirectResult(auth).catch((err) => {
      setError(err instanceof Error ? err.message : 'Sign-in failed.')
    })
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  function signIn() {
    if (!firebaseConfigured) return
    setError(null)
    signInWithRedirect(auth, googleProvider)
  }

  function signOut() {
    if (!firebaseConfigured) return
    firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
