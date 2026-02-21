import { useState, useEffect } from 'preact/hooks'
import { getRandomEntry } from '../db/operations.js'
import { relativeDate } from '../utils/dates.js'
import { stripTags } from '../utils/tags.js'

const PROMPTS = [
  'Sit with this for a moment.',
  'What does this stir in you now?',
  'Has your understanding changed?',
  'Read it slowly, once more.',
  'Let it rest.',
]

export function Meditate() {
  const [entry, setEntry] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(true)

  const draw = async (excludeId) => {
    setLoading(true)
    const e = await getRandomEntry(excludeId)
    setEntry(e)
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
    setLoading(false)
  }

  useEffect(() => {
    draw()
  }, [])

  if (loading) return null

  if (!entry) {
    return (
      <div class="meditate">
        <div class="meditate-empty">
          No entries to reflect upon. Begin by collecting something.
        </div>
      </div>
    )
  }

  return (
    <div class="meditate">
      <div class="meditate-entry">
        <div class="text">{entry.tags.length > 0 ? stripTags(entry.text) : entry.text}</div>
        {entry.source && <div class="source">— {entry.source}</div>}
        <div class="date">{relativeDate(entry.createdAt)}</div>
      </div>

      <div class="meditate-prompt">{prompt}</div>

      <div class="meditate-actions">
        <button onClick={() => draw(entry.id)}>draw another</button>
      </div>
    </div>
  )
}
