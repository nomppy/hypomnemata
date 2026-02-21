import { relativeDate } from '../utils/dates.js'
import { stripTags } from '../utils/tags.js'

export function EntryCard({ entry, onTagClick, onEdit }) {
  const displayText = entry.tags.length > 0 ? stripTags(entry.text) : entry.text
  return (
    <div class="entry-card" onClick={() => onEdit(entry)}>
      <div class="entry-card-text">{displayText}</div>
      {entry.source && (
        <div class="entry-card-source">— {entry.source}</div>
      )}
      <div class="entry-card-meta">
        <div class="entry-card-tags">
          {entry.tags.map((tag) => (
            <button
              key={tag}
              class="tag"
              onClick={(e) => {
                e.stopPropagation()
                onTagClick(tag)
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
        <span class="entry-card-date">{relativeDate(entry.createdAt)}</span>
      </div>
    </div>
  )
}
