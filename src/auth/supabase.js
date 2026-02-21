import { createClient } from '@supabase/supabase-js'

let _client = null

export const supabaseConfigured =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY

export function getSupabase() {
  if (!supabaseConfigured) return null
  if (!_client) {
    _client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          flowType: 'implicit',
          detectSessionInUrl: true,
        },
      },
    )
  }
  return _client
}
