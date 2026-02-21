import Dexie from 'dexie'

export const db = new Dexie('hypo')

db.version(1).stores({
  entries: '++id, createdAt, updatedAt, *tags',
})

db.version(2).stores({
  entries: '++id, createdAt, updatedAt, *tags',
  embeddings: 'entryId',
})

db.version(3).stores({
  entries: '++id, createdAt, updatedAt, *tags, remoteId',
  embeddings: 'entryId',
})
