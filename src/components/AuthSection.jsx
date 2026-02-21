import { useState } from 'preact/hooks'
import { useAuth } from '../auth/context.jsx'

export function AuthSection() {
  const { user, signIn, signOut, loading, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (!configured) return null

  if (loading) {
    return (
      <div class="settings-section auth-section">
        <h3>Account</h3>
        <p class="auth-loading">Loading...</p>
      </div>
    )
  }

  if (user) {
    return (
      <div class="settings-section auth-section">
        <h3>Account</h3>
        <p>Signed in as <strong>{user.email}</strong></p>
        <button onClick={signOut}>Sign out</button>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const { error: err } = await signIn(email)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div class="settings-section auth-section">
        <h3>Account</h3>
        <p>Check your email for a magic link to sign in.</p>
        <button onClick={() => { setSent(false); setEmail('') }}>Try again</button>
      </div>
    )
  }

  return (
    <div class="settings-section auth-section">
      <h3>Account</h3>
      <p>Sign in to sync entries across devices.</p>
      <form class="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onInput={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send magic link</button>
      </form>
      {error && <p class="auth-error">{error}</p>}
    </div>
  )
}
