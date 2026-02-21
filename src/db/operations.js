import { db } from './index.js'

export async function addEntry({ text, source, tags }) {
  const now = Date.now()
  return db.entries.add({
    text,
    source: source || '',
    tags: tags || [],
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateEntry(id, changes) {
  return db.entries.update(id, {
    ...changes,
    updatedAt: Date.now(),
  })
}

export async function deleteEntry(id) {
  const entry = await db.entries.get(id)
  const remoteId = entry?.remoteId || null
  await db.entries.delete(id)
  await db.embeddings.delete(id).catch(() => {})
  return remoteId
}

export async function getEntry(id) {
  return db.entries.get(id)
}

export async function getAllEntries() {
  return db.entries.orderBy('createdAt').reverse().toArray()
}

export async function getEntriesByTag(tag) {
  return db.entries.where('tags').equals(tag).reverse().sortBy('createdAt')
}

export async function getAllTags() {
  const entries = await db.entries.toArray()
  const tagCounts = {}
  for (const entry of entries) {
    for (const tag of entry.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }
  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export async function renameTag(oldName, newName) {
  const entries = await db.entries.where('tags').equals(oldName).toArray()
  const updates = entries.map((entry) => {
    const tags = entry.tags.map((t) => (t === oldName ? newName : t))
    // deduplicate
    return db.entries.update(entry.id, { tags: [...new Set(tags)], updatedAt: Date.now() })
  })
  return Promise.all(updates)
}

export async function mergeTags(sourceTag, targetTag) {
  return renameTag(sourceTag, targetTag)
}

export async function getRandomEntry(excludeId) {
  const count = await db.entries.count()
  if (count === 0) return null
  // Weighted toward less recently viewed, but simple random for now
  const entries = await db.entries.toArray()
  const candidates = excludeId ? entries.filter((e) => e.id !== excludeId) : entries
  if (candidates.length === 0) return entries[0]
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export async function exportData() {
  const entries = await db.entries.toArray()
  return JSON.stringify({ version: 1, entries, exportedAt: new Date().toISOString() }, null, 2)
}

export async function importData(json) {
  const data = JSON.parse(json)
  if (!data.entries || !Array.isArray(data.entries)) {
    throw new Error('Invalid import data')
  }
  await db.entries.clear()
  await db.entries.bulkAdd(data.entries)
  return data.entries.length
}

export async function getEntryByRemoteId(remoteId) {
  return db.entries.where('remoteId').equals(remoteId).first()
}

export async function updateRemoteId(id, remoteId) {
  return db.entries.update(id, { remoteId })
}

export async function clearAllData() {
  await db.entries.clear()
  await db.embeddings.clear().catch(() => {})
}
