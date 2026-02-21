import { useState, useEffect, useCallback } from 'preact/hooks'
import { getAllEntries, getEntriesByTag } from './db/operations.js'
import { initSearch, search, addToIndex, removeFromIndex, updateInIndex } from './search/text.js'
import { EntryCard } from './components/EntryCard.jsx'
import { EntryForm } from './components/EntryForm.jsx'
import { SearchBar } from './components/SearchBar.jsx'
import { TagList } from './components/TagList.jsx'
import { Meditate } from './components/Meditate.jsx'
import { Settings } from './components/Settings.jsx'

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

  useEffect(() => {
    const onHash = () => {
      setRoute(getRoute())
      setFilterTag(null)
      setSearchQuery('')
      setSearchResults(null)
      setShowForm(false)
      setEditingEntry(null)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setShowForm(true)
        setEditingEntry(null)
      }
      if (e.key === 'Escape') {
        setShowForm(false)
        setEditingEntry(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults(null)
      return
    }
    const ids = search(query)
    setSearchResults(new Set(ids))
  }

  const handleSave = (entry) => {
    if (editingEntry) {
      updateInIndex(entry)
    } else {
      addToIndex(entry)
    }
    setShowForm(false)
    setEditingEntry(null)
    loadEntries()
  }

  const handleDelete = (id) => {
    removeFromIndex(id)
    setEditingEntry(null)
    loadEntries()
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setShowForm(true)
  }

  const handleTagClick = (tag) => {
    setFilterTag(tag)
    setRoute('/')
    if (getRoute() !== '/') {
      window.location.hash = '#/'
    }
  }

  const displayEntries = searchResults
    ? entries.filter((e) => searchResults.has(e.id))
    : entries

  const navItems = [
    { path: '/', label: 'entries' },
    { path: '/tags', label: 'tags' },
    { path: '/meditate', label: 'meditate' },
    { path: '/settings', label: 'settings' },
  ]

  return (
    <div>
      <header class="app-header">
        <h1>
          <a href="#/" style={{ color: 'inherit', textDecoration: 'none' }}>Hypo</a>
        </h1>
        <nav>
          {navItems.map((item) => (
            <a
              key={item.path}
              href={`#${item.path}`}
              class={route === item.path ? 'active' : ''}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <div class="divider" />

      {route === '/' && (
        <div>
          <SearchBar query={searchQuery} onSearch={handleSearch} />

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

          {displayEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
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
    </div>
  )
}
