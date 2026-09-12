import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
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
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  function signIn() {
    if (!firebaseConfigured) return
    setError(null)
    // Popup, not redirect: Safari's tracking protection blocks the storage
    // handoff the redirect flow needs with the *.firebaseapp.com authDomain,
    // which silently drops the user back on the sign-in screen. Popup
    // resolves in-place and doesn't hit that.
    signInWithPopup(auth, googleProvider).catch((err) => {
      setError(err instanceof Error ? err.message : 'Sign-in failed.')
    })
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
