import { createContext } from 'preact'
import { useState, useEffect, useContext, useCallback } from 'preact/hooks'
import { getSupabase, supabaseConfigured } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(supabaseConfigured)

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      // After sign-in via magic link, redirect to the intended page
      if (_event === 'SIGNED_IN') {
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
    <AuthContext.Provider value={{ user, signIn, signOut, loading, configured: supabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
