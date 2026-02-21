import MiniSearch from 'minisearch'

let searchIndex = null

function createIndex() {
  return new MiniSearch({
    fields: ['text', 'source', 'tagsText'],
    storeFields: ['id'],
    searchOptions: {
      boost: { text: 2, source: 1.5 },
      fuzzy: 0.3,
      prefix: true,
    },
  })
}

export function initSearch(entries) {
  searchIndex = createIndex()
  const docs = entries.map((e) => ({
    id: e.id,
    text: e.text,
    source: e.source || '',
    tagsText: e.tags.join(' '),
  }))
  searchIndex.addAll(docs)
}

export function addToIndex(entry) {
  if (!searchIndex) return
  searchIndex.add({
    id: entry.id,
    text: entry.text,
    source: entry.source || '',
    tagsText: entry.tags.join(' '),
  })
}

export function removeFromIndex(id) {
  if (!searchIndex) return
  try {
    searchIndex.discard(id)
  } catch {
    // entry may not be in index
  }
}

export function updateInIndex(entry) {
  removeFromIndex(entry.id)
  addToIndex(entry)
}

export function search(query) {
  if (!searchIndex || !query.trim()) return []
  return searchIndex.search(query).map((r) => r.id)
}
