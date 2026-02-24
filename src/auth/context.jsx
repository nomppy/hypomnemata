import { createContext } from 'preact'
import { useState, useEffect, useContext, useCallback } from 'preact/hooks'
import { getSupabase, supabaseConfigured } from './supabase.js'

const AuthContext = createContext(null)

const SESSION_COOKIE = 'hypo:auth-relay'
const isStandalone = typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone)

function setSessionCookie(session) {
  if (!session) return
  const payload = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })
  // Set cookie with 5-minute expiry — just long enough to relay
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(payload)};path=/;max-age=300;SameSite=Lax`
}

function getSessionCookie() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1]))
  } catch {
    return null
  }
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=;path=/;max-age=0`
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [showSafariRelay, setShowSafariRelay] = useState(false)

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    const init = async () => {
      // In PWA mode, check for a relayed session cookie from Safari
      if (isStandalone) {
        const relayed = getSessionCookie()
        if (relayed) {
          clearSessionCookie()
          const { error } = await supabase.auth.setSession(relayed)
          if (!error) {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            setLoading(false)
            return
          }
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (_event === 'SIGNED_IN') {
        // If in Safari (not PWA), relay session via cookie for the PWA to pick up
        if (!isStandalone && session) {
          setSessionCookie(session)
          setShowSafariRelay(true)
        }
        const redirect = sessionStorage.getItem('hypo:auth-redirect')
        if (redirect) {
          sessionStorage.removeItem('hypo:auth-redirect')
          window.location.hash = '#' + redirect
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email) => {
    const supabase = getSupabase()
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    return supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/#/settings',
      },
    })
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading, configured: supabaseConfigured, showSafariRelay, dismissSafariRelay: () => setShowSafariRelay(false) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
