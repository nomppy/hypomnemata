import { useState, useEffect, useRef } from 'preact/hooks'
import { addEntry, updateEntry, deleteEntry } from '../db/operations.js'
import { parseTags, detectSource } from '../utils/tags.js'

export function EntryForm({ entry, onSave, onCancel, onDelete }) {
  const [text, setText] = useState(entry ? entry.text : '')
  const [source, setSource] = useState(entry ? entry.source : '')
  const [showSource, setShowSource] = useState(!!entry?.source)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const textRef = useRef(null)

  useEffect(() => {
    if (textRef.current) {
      textRef.current.focus()
      // Auto-size
      textRef.current.style.height = 'auto'
      textRef.current.style.height = textRef.current.scrollHeight + 'px'
    }
  }, [])

  const handleTextInput = (e) => {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  const handleSave = async () => {
    const trimmed = text.trim()
    if (!trimmed) return

    let finalText = trimmed
    let finalSource = source.trim()

    // Auto-detect source pattern if source field is empty
    if (!finalSource) {
      const detected = detectSource(finalText)
      if (detected.source) {
        finalText = detected.text
        finalSource = detected.source
      }
    }

    const tags = parseTags(finalText)

    if (entry) {
      await updateEntry(entry.id, { text: finalText, source: finalSource, tags })
      onSave({ ...entry, text: finalText, source: finalSource, tags })
    } else {
      const id = await addEntry({ text: finalText, source: finalSource, tags })
      onSave({ id, text: finalText, source: finalSource, tags, createdAt: Date.now() })
    }
  }

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  const handleDeleteClick = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    const remoteId = await deleteEntry(entry.id)
    onDelete(entry.id, remoteId)
  }

  const tags = parseTags(text)

  return (
    <div class="entry-form" onKeyDown={handleKeyDown}>
      <textarea
        ref={textRef}
        value={text}
        onInput={handleTextInput}
        placeholder="What have you encountered worth keeping?"
      />

      {tags.length > 0 && (
        <div class="entry-form-tags">
          {tags.map((tag) => (
            <span key={tag} class="tag">#{tag}</span>
          ))}
        </div>
      )}

      {showSource ? (
        <div class="entry-form-source">
          <input
            type="text"
            value={source}
            onInput={(e) => setSource(e.target.value)}
            placeholder="Source — author, book, etc."
          />
        </div>
      ) : (
        <button class="source-toggle" onClick={() => setShowSource(true)}>
          + add source
        </button>
      )}

      <div class="entry-form-actions">
        <span class="hint">{'\u2318'}+Enter to save</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onDelete && (
            <button
              class={showDeleteConfirm ? 'danger' : ''}
              style={showDeleteConfirm ? { color: 'var(--accent-red)', borderColor: 'var(--accent-red)' } : {}}
              onClick={handleDeleteClick}
            >
              {showDeleteConfirm ? 'confirm delete' : 'delete'}
            </button>
          )}
          <button onClick={onCancel}>cancel</button>
          <button class="primary" onClick={handleSave}>save</button>
        </div>
      </div>
    </div>
  )
}
