import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { getAllEntries, getEntriesByTag, getEntry } from './db/operations.js'
import { initSearch, search, addToIndex, removeFromIndex, updateInIndex } from './search/text.js'
import { EntryCard } from './components/EntryCard.jsx'
import { EntryForm } from './components/EntryForm.jsx'
import { SearchBar } from './components/SearchBar.jsx'
import { TagList } from './components/TagList.jsx'
import { Meditate } from './components/Meditate.jsx'
import { Settings } from './components/Settings.jsx'
import { KeyboardHelp } from './components/KeyboardHelp.jsx'
import { About } from './components/About.jsx'
import { SyncIndicator } from './components/SyncIndicator.jsx'
import { useAuth } from './auth/context.jsx'
import { syncAll, pushEntry, deleteRemoteEntry } from './sync/engine.js'
import { useSyncStatus } from './sync/status.js'

function getRoute() {
  return window.location.hash.slice(1) || '/'
}

export function App() {
  const [route, setRoute] = useState(getRoute)
  const [entries, setEntries] = useState([])
  const [filterTag, setFilterTag] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showHelp, setShowHelp] = useState(false)

  const pendingFilterTag = useRef(null)
  const searchRef = useRef(null)

  const { user, configured } = useAuth()
  const [syncHintDismissed, setSyncHintDismissed] = useState(
    () => localStorage.getItem('hypo:sync-hint-dismissed') === '1',
  )
  const showSyncHint = configured && !user && !syncHintDismissed
  const dismissSyncHint = () => {
    localStorage.setItem('hypo:sync-hint-dismissed', '1')
    setSyncHintDismissed(true)
  }
  const syncStatus = useSyncStatus()

  const runSync = useCallback(async () => {
    if (!user) return
    if (!navigator.onLine) { syncStatus.setOffline(); return }
    syncStatus.setSyncing()
    try {
      await syncAll(user.id)
      syncStatus.setSynced()
    } catch (err) {
      syncStatus.setErrorStatus(err.message)
    }
  }, [user])

  const loadEntries = useCallback(async () => {
    let data
    if (filterTag) {
      data = await getEntriesByTag(filterTag)
    } else {
      data = await getAllEntries()
    }
    setEntries(data)
    if (!filterTag) {
      initSearch(data)
    }
  }, [filterTag])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  // Sync on sign-in and on coming back online, then reload entries
  useEffect(() => {
    if (!user) return
    const doSync = async () => {
      await runSync()
      loadEntries()
    }
    doSync()
    const handleOnline = () => doSync()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [user, runSync, loadEntries])

  useEffect(() => {
    const onHash = () => {
      setRoute(getRoute())
      if (pendingFilterTag.current) {
        setFilterTag(pendingFilterTag.current)
        pendingFilterTag.current = null
      } else {
        setFilterTag(null)
      }
      setSearchQuery('')
      setSearchResults(null)
      setShowForm(false)
      setEditingEntry(null)
      setSelectedIndex(-1)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const displayEntries = searchResults
    ? entries.filter((e) => searchResults.has(e.id))
    : entries

  useEffect(() => {
    const isInput = () => {
      const tag = document.activeElement?.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA'
    }

    const onKey = (e) => {
      // Help overlay
      if (e.key === '?' && !isInput() && !showForm) {
        e.preventDefault()
        setShowHelp((v) => !v)
        return
      }

      // Close help / form on Escape
      if (e.key === 'Escape') {
        if (showHelp) { setShowHelp(false); return }
        if (showForm) { setShowForm(false); setEditingEntry(null); return }
        // If search is focused, blur it
        if (document.activeElement === searchRef.current) {
          searchRef.current.blur()
          return
        }
        return
      }

      // Don't handle other shortcuts when help is open
      if (showHelp) return

      // Focus search: / or Cmd+K
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !isInput() && !showForm) {
        e.preventDefault()
        if (route !== '/') {
          window.location.hash = '#/'
        }
        // Wait a tick for route change to render search bar
        setTimeout(() => searchRef.current?.focus(), 0)
        return
      }

      // Don't handle remaining shortcuts in input fields
      if (isInput()) return
      if (showForm) return

      // New entry
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        if (route !== '/') window.location.hash = '#/'
        setShowForm(true)
        setEditingEntry(null)
        return
      }

      // Navigate tabs: 1-4
      const navRoutes = ['/', '/tags', '/meditate', '/settings', '/about']
      const num = parseInt(e.key)
      if (num >= 1 && num <= 5 && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        window.location.hash = '#' + navRoutes[num - 1]
        return
      }

      // Entry list navigation (only on entries view)
      if (route === '/' && displayEntries.length > 0) {
        if (e.key === 'j' || e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, displayEntries.length - 1))
          return
        }
        if (e.key === 'k' || e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          return
        }
        if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < displayEntries.length) {
          e.preventDefault()
          setEditingEntry(displayEntries[selectedIndex])
          setShowForm(true)
          return
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showForm, showHelp, route, displayEntries, selectedIndex])

  // Reset selection when entries change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [searchResults, filterTag])

  // Scroll selected entry into view
  useEffect(() => {
    if (selectedIndex >= 0) {
      const cards = document.querySelectorAll('.entry-card')
      cards[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults(null)
      return
    }
    const ids = search(query)
    setSearchResults(new Set(ids))
  }

  const handleSave = async (entry) => {
    if (editingEntry) {
      updateInIndex(entry)
    } else {
      addToIndex(entry)
    }
    setShowForm(false)
    setEditingEntry(null)
    await loadEntries()
    // Fire-and-forget remote push
    if (user) {
      const fresh = await getEntry(entry.id)
      if (fresh) pushEntry(fresh, user.id).catch(() => {})
    }
  }

  const handleDelete = async (id, remoteId) => {
    removeFromIndex(id)
    setShowForm(false)
    setEditingEntry(null)
    await loadEntries()
    // Fire-and-forget remote delete
    if (user && remoteId) {
      deleteRemoteEntry(remoteId).catch(() => {})
    }
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setShowForm(true)
  }

  const handleTagClick = (tag) => {
    setFilterTag(tag)
    setRoute('/')
    if (getRoute() !== '/') {
      pendingFilterTag.current = tag
      window.location.hash = '#/'
    }
  }

  const navItems = [
    { path: '/', label: 'entries', key: '1' },
    { path: '/tags', label: 'tags', key: '2' },
    { path: '/meditate', label: 'meditate', key: '3' },
    { path: '/settings', label: 'settings', key: '4' },
    { path: '/about', label: 'about', key: '5' },
  ]

  return (
    <div>
      <header class="app-header">
        <h1>
          <a href="#/" style={{ color: 'inherit', textDecoration: 'none' }}>Hypomnēmata</a>
          <SyncIndicator syncStatus={syncStatus} />
        </h1>
        <nav>
          {navItems.map((item) => (
            <a
              key={item.path}
              href={`#${item.path}`}
              class={route === item.path ? 'active' : ''}
            >
              {item.label}
              {item.path === '/settings' && user && <span class="auth-dot" title={user.email} />}
            </a>
          ))}
        </nav>
      </header>

      <div class="divider" />

      {showSyncHint && (
        <div class="sync-hint">
          <a href="#/settings">Sign in to sync entries across devices</a>
          <button class="sync-hint-dismiss" onClick={dismissSyncHint} aria-label="Dismiss">&times;</button>
        </div>
      )}

      {route === '/' && (
        <div>
          <SearchBar query={searchQuery} onSearch={handleSearch} inputRef={searchRef} />

          {filterTag && (
            <div class="filter-bar">
              <span>filtered by</span>
              <span class="tag">{filterTag}</span>
              <button class="clear" onClick={() => { setFilterTag(null); loadEntries() }}>
                clear
              </button>
            </div>
          )}

          {showForm && (
            <EntryForm
              entry={editingEntry}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingEntry(null) }}
              onDelete={editingEntry ? handleDelete : null}
            />
          )}

          {searchResults && (
            <div class="search-results-count">
              {displayEntries.length} result{displayEntries.length !== 1 ? 's' : ''}
            </div>
          )}

          {displayEntries.length === 0 && !showForm && (
            <div class="empty-state">
              <h3>Nothing here yet</h3>
              <p>Press <strong>n</strong> or tap + to begin collecting.</p>
            </div>
          )}

          {displayEntries.map((entry, i) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              selected={i === selectedIndex}
              onTagClick={handleTagClick}
              onEdit={handleEdit}
            />
          ))}

          {!showForm && (
            <button class="fab" onClick={() => { setShowForm(true); setEditingEntry(null) }}>
              +
            </button>
          )}
        </div>
      )}

      {route === '/tags' && (
        <TagList onTagClick={handleTagClick} onDataChange={loadEntries} />
      )}

      {route === '/meditate' && <Meditate />}

      {route === '/settings' && <Settings onDataChange={loadEntries} />}

      {route === '/about' && <About />}

      {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}
    </div>
  )
}
