import { useAuth } from '../auth/context.jsx'

const labels = {
  idle: '',
  syncing: 'syncing',
  synced: 'synced',
  offline: 'offline',
  error: 'sync error',
}

export function SyncIndicator({ syncStatus }) {
  const { user, configured } = useAuth()
  if (!configured || !user) return null
  if (syncStatus.status === 'idle') return null

  return (
    <span class={`sync-indicator sync-${syncStatus.status}`} title={syncStatus.error || ''}>
      <span class="sync-dot" />
      {labels[syncStatus.status]}
    </span>
  )
}
