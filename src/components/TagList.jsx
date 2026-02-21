import { useState, useEffect } from 'preact/hooks'
import { getAllTags, renameTag } from '../db/operations.js'

export function TagList({ onTagClick, onDataChange }) {
  const [tags, setTags] = useState([])
  const [renamingTag, setRenamingTag] = useState(null)
  const [newName, setNewName] = useState('')

  const loadTags = async () => {
    const t = await getAllTags()
    setTags(t)
  }

  useEffect(() => {
    loadTags()
  }, [])

  const handleRename = async (oldName) => {
    const trimmed = newName.trim().toLowerCase()
    if (!trimmed || trimmed === oldName) {
      setRenamingTag(null)
      return
    }
    await renameTag(oldName, trimmed)
    setRenamingTag(null)
    setNewName('')
    loadTags()
    onDataChange()
  }

  return (
    <div>
      <h2>Tags</h2>
      <div class="divider" />

      {tags.length === 0 && (
        <div class="empty-state">
          <h3>No tags yet</h3>
          <p>Add #hashtags in your entries to organize them.</p>
        </div>
      )}

      <div class="tag-management">
        {tags.map((tag) => (
          <div key={tag.name} class="tag-management-row">
            {renamingTag === tag.name ? (
              <input
                type="text"
                value={newName}
                onInput={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(tag.name)
                  if (e.key === 'Escape') setRenamingTag(null)
                }}
                onBlur={() => handleRename(tag.name)}
                style={{ maxWidth: '200px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                autoFocus
              />
            ) : (
              <button
                class="tag"
                onClick={() => onTagClick(tag.name)}
              >
                #{tag.name}
              </button>
            )}
            <button
              style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
              onClick={() => {
                setRenamingTag(tag.name)
                setNewName(tag.name)
              }}
            >
              rename
            </button>
            <span class="count">{tag.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
