import { useState, useCallback } from 'preact/hooks'

// States: idle | syncing | synced | offline | error
export function useSyncStatus() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const setSyncing = useCallback(() => {
    setStatus('syncing')
    setError(null)
  }, [])

  const setSynced = useCallback(() => {
    setStatus('synced')
    setError(null)
  }, [])

  const setOffline = useCallback(() => {
    setStatus('offline')
  }, [])

  const setErrorStatus = useCallback((err) => {
    setStatus('error')
    setError(err)
  }, [])

  return { status, error, setSyncing, setSynced, setOffline, setErrorStatus }
}
