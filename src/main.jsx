import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/600-italic.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/crimson-text/400.css'
import '@fontsource/crimson-text/400-italic.css'
import '@fontsource/crimson-text/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './styles/global.css'
import './styles/components.css'
import { render } from 'preact'
import { App } from './app.jsx'
import { AuthProvider } from './auth/context.jsx'

// Fix Supabase implicit flow + hash routing conflict.
// Magic link redirects to /#/settings#access_token=... but Supabase
// can't parse tokens when they follow a route after a second #.
// Extract the auth params so Supabase can detect the session cleanly.
;(function fixAuthRedirect() {
  const h = window.location.hash
  if (!h.includes('access_token=') && !h.includes('error_description=')) return
  const idx = h.indexOf('#', 1)
  if (idx > 0) {
    // e.g. #/settings#access_token=xxx → save "/settings", fix hash to #access_token=xxx
    sessionStorage.setItem('hypo:auth-redirect', h.substring(1, idx))
    window.location.hash = h.substring(idx)
  }
})()

render(
  <AuthProvider>
    <App />
  </AuthProvider>,
  document.getElementById('app'),
)
