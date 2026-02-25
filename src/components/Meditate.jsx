import { useState, useEffect, useCallback } from 'preact/hooks'
import { getRandomEntry } from '../db/operations.js'
import { relativeDate } from '../utils/dates.js'
import { stripTags } from '../utils/tags.js'

const PROMPTS = [
  'Sit with this for a moment.',
  'What does this stir in you now?',
  'Has your understanding changed?',
  'Read it slowly, once more.',
  'Let it rest.',
  'What did you need to hear today?',
  'Notice what surfaces.',
]

// Session-level persistence so navigating away and back keeps the same quote
let sessionEntry = null
let sessionPrompt = ''

export function Meditate() {
  const [entry, setEntry] = useState(sessionEntry)
  const [prompt, setPrompt] = useState(sessionPrompt)
  const [loading, setLoading] = useState(!sessionEntry)

  const draw = useCallback(async (excludeId) => {
    setLoading(true)
    const e = await getRandomEntry(excludeId)
    const p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
    sessionEntry = e
    sessionPrompt = p
    setEntry(e)
    setPrompt(p)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!sessionEntry) draw()
  }, [draw])

  // Keyboard: Space or Enter draws another
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (entry) draw(entry.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entry, draw])

  if (loading) return null

  if (!entry) {
    return (
      <div class="meditate">
        <p class="meditate-empty">
          No entries to reflect upon yet.
        </p>
      </div>
    )
  }

  const displayText = entry.tags.length > 0 ? stripTags(entry.text) : entry.text

  return (
    <div class="meditate">
      <div class="meditate-entry">
        <blockquote class="meditate-quote">{displayText}</blockquote>
        {entry.source && (
          <div class="meditate-source">— {entry.source}</div>
        )}
      </div>

      <div class="meditate-footer">
        <p class="meditate-prompt">{prompt}</p>
        <div class="meditate-controls">
          <button class="meditate-draw" onClick={() => draw(entry.id)}>
            draw another
          </button>
        </div>
        <span class="meditate-date">{relativeDate(entry.createdAt)}</span>
      </div>
    </div>
  )
}
