import { useState, useRef } from 'preact/hooks'
import { exportData, importData, deleteAllData } from '../db/operations.js'
import { deduplicateRemote, deduplicateLocal } from '../sync/engine.js'
import { AuthSection } from './AuthSection.jsx'
import { useAuth } from '../auth/context.jsx'
import { getSupabase } from '../auth/supabase.js'

export function Settings({ onDataChange }) {
  const [message, setMessage] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const fileRef = useRef(null)
  const { user } = useAuth()

  const handleExport = async () => {
    const json = await exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hypo-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Exported successfully.')
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const count = await importData(text)
      setMessage(`Imported ${count} entries.`)
      onDataChange()
    } catch (err) {
      setMessage(`Import failed: ${err.message}`)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClear = async () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true)
      return
    }
    try {
      await deleteAllData(getSupabase(), user?.id)
      setShowClearConfirm(false)
      setMessage(user ? 'All data deleted (local and synced).' : 'All data deleted.')
      onDataChange()
    } catch (err) {
      setMessage(`Delete failed: ${err.message}`)
      setShowClearConfirm(false)
    }
  }

  return (
    <div class="settings">
      <h2>Settings</h2>
      <div class="divider" />

      <AuthSection />

      <div class="settings-section">
        <h3>Export Data</h3>
        <p>Download all entries as a JSON file.</p>
        <button onClick={handleExport}>Export JSON</button>
      </div>

      <div class="settings-section">
        <h3>Import Data</h3>
        <p>Import entries from a previously exported JSON file. Duplicates are skipped automatically.</p>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ fontSize: '0.85rem' }}
        />
      </div>

      <div class="settings-section">
        <h3>Deduplicate Entries</h3>
        <p>Remove duplicate entries{user ? ' locally and from the sync server' : ''}. Keeps the oldest copy of each.</p>
        <button onClick={async () => {
          try {
            let totalRemoved = 0
            if (user) {
              const { removed } = await deduplicateRemote(user.id)
              totalRemoved += removed
            }
            const { removed: localRemoved } = await deduplicateLocal()
            totalRemoved += localRemoved
            setMessage(totalRemoved > 0 ? `Removed ${totalRemoved} duplicate(s).` : 'No duplicates found.')
            if (totalRemoved > 0) onDataChange()
          } catch (err) {
            setMessage(`Dedup failed: ${err.message}`)
          }
        }}>Deduplicate</button>
      </div>

      <div class="settings-section">
        <h3>Delete All My Data</h3>
        <p>Permanently delete all entries{user ? ' — both local and synced' : ''}. This cannot be undone.</p>
        <button
          class="danger"
          onClick={handleClear}
        >
          {showClearConfirm ? 'Click again to confirm' : 'Delete all my data'}
        </button>
      </div>

      {message && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-slate)', marginTop: '1rem' }}>
          {message}
        </div>
      )}
    </div>
  )
}
