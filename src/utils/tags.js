/**
 * Parse #hashtags from text. Returns array of unique lowercase tag names.
 */
export function parseTags(text) {
  const matches = text.match(/#([a-zA-Z0-9_-]+)/g)
  if (!matches) return []
  const tags = matches.map((m) => m.slice(1).toLowerCase())
  return [...new Set(tags)]
}

/**
 * Strip #hashtags from text for display purposes.
 * Removes the tags and cleans up extra whitespace.
 */
export function stripTags(text) {
  return text.replace(/#[a-zA-Z0-9_-]+/g, '').replace(/  +/g, ' ').trim()
}

/**
 * Detect "— Author, Source" pattern at end of text.
 * Returns { text, source } if detected, otherwise { text, source: '' }.
 */
export function detectSource(text) {
  // Match patterns like: — Author Name, Book Title  or  — Author Name
  const pattern = /\n?\s*[—–-]\s*(.+?)\s*$/
  const match = text.match(pattern)
  if (match) {
    const cleanedText = text.slice(0, match.index).trim()
    const source = match[1].trim()
    // Only extract if the "source" part looks like a name (not too long, not a sentence)
    if (source.length < 120 && !source.includes('.')) {
      return { text: cleanedText, source }
    }
  }
  return { text, source: '' }
}
