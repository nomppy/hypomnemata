import { getSupabase } from '../auth/supabase.js'
import { db } from '../db/index.js'
import { getEntryByRemoteId, updateRemoteId } from '../db/operations.js'

let syncLock = false

function normalizeSource(s) {
  return (s || '').trim().replace(/\s+/g, ' ')
}

function stripInlineTags(text) {
  return (text || '')
    .replace(/#[a-zA-Z0-9_-]+/g, '')  // #hashtags
    .replace(/\[.*?\]/g, '')           // [bracket tags]
    .replace(/\s+/g, ' ')
    .trim()
}

function contentKey(content, source) {
  return `${stripInlineTags(content)}|||${normalizeSource(source)}`
}

function toRemote(entry, userId) {
  return {
    user_id: userId,
    content: entry.text,
    source: entry.source || '',
    tags: entry.tags || [],
    created_at: new Date(entry.createdAt).toISOString(),
    updated_at: new Date(entry.updatedAt).toISOString(),
  }
}

function toLocal(remote) {
  return {
    remoteId: remote.id,
    text: remote.content,
    source: remote.source || '',
    tags: remote.tags || [],
    createdAt: new Date(remote.created_at).getTime(),
    updatedAt: new Date(remote.updated_at).getTime(),
  }
}

export async function pushEntry(entry, userId) {
  const supabase = getSupabase()
  if (!supabase || !userId) return

  const remote = toRemote(entry, userId)

  if (entry.remoteId) {
    const { error } = await supabase
      .from('entries')
      .update(remote)
      .eq('id', entry.remoteId)
    if (error) console.error('pushEntry update failed:', error.message)
  } else {
    const { data, error } = await supabase
      .from('entries')
      .insert(remote)
      .select('id')
      .single()
    if (error) {
      console.error('pushEntry insert failed:', error.message)
    } else if (data) {
      await updateRemoteId(entry.id, data.id)
    }
  }
}

export async function deleteRemoteEntry(remoteId) {
  const supabase = getSupabase()
  if (!supabase || !remoteId) return
  const { error } = await supabase.from('entries').delete().eq('id', remoteId)
  if (error) console.error('deleteRemoteEntry failed:', error.message)
}

export async function syncAll(userId) {
  if (syncLock) return
  syncLock = true
  try {
    await _syncAll(userId)
  } finally {
    syncLock = false
  }
}

async function _syncAll(userId) {
  const supabase = getSupabase()
  if (!supabase || !userId) return

  const { data: remoteEntries, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error

  const localEntries = await db.entries.toArray()

  // Build a map of ALL remote entries by content key for dedup
  const allRemoteByContent = new Map()
  for (const r of remoteEntries) {
    const key = contentKey(r.content, r.source)
    // Keep the oldest by created_at if there are dupes
    if (!allRemoteByContent.has(key) || r.created_at < allRemoteByContent.get(key).created_at) {
      allRemoteByContent.set(key, r)
    }
  }

  const remoteById = new Map(remoteEntries.map((r) => [r.id, r]))
  const localByRemoteId = new Map()
  const localWithoutRemote = []

  for (const local of localEntries) {
    if (local.remoteId) {
      localByRemoteId.set(local.remoteId, local)
    } else {
      localWithoutRemote.push(local)
    }
  }

  // 1. Entries with matching remoteId: compare updatedAt, latest wins
  for (const [remoteId, local] of localByRemoteId) {
    const remote = remoteById.get(remoteId)
    if (!remote) {
      // Remote was deleted — remove local
      await db.entries.delete(local.id)
      await db.embeddings.delete(local.id).catch(() => {})
      continue
    }
    remoteById.delete(remoteId)

    const remoteTime = new Date(remote.updated_at).getTime()
    if (remoteTime > local.updatedAt) {
      // Remote is newer — update local
      await db.entries.update(local.id, {
        text: remote.content,
        source: remote.source || '',
        tags: remote.tags || [],
        updatedAt: remoteTime,
      })
    } else if (local.updatedAt > remoteTime) {
      // Local is newer — push to remote
      await supabase
        .from('entries')
        .update(toRemote(local, userId))
        .eq('id', remoteId)
    }
  }

  // 2. Local entries without remoteId: dedupe against ALL remotes by content+source, or push
  for (const local of localWithoutRemote) {
    const key = contentKey(local.text, local.source)
    const matchedRemote = allRemoteByContent.get(key)
    if (matchedRemote) {
      // Link them
      await updateRemoteId(local.id, matchedRemote.id)
      remoteById.delete(matchedRemote.id)
    } else {
      await pushEntry(local, userId)
    }
  }

  // 3. Remote-only entries: insert into Dexie (only if no local with same content exists)
  for (const [, remote] of remoteById) {
    const key = contentKey(remote.content, remote.source)
    const existing = await db.entries.filter(
      (e) => contentKey(e.text, e.source) === key
    ).first()
    if (!existing) {
      await db.entries.add(toLocal(remote))
    } else if (!existing.remoteId) {
      // Local exists but isn't linked — link it
      await updateRemoteId(existing.id, remote.id)
    }
  }

  // 4. Auto-deduplicate remote after sync
  await deduplicateRemote(userId)

  // 5. Deduplicate local entries (merge by content, keep one with remoteId)
  await deduplicateLocal()
}

export async function deduplicateLocal() {
  const entries = await db.entries.toArray()
  const seen = new Map() // contentKey -> entry (prefer one with remoteId)
  const dupeIds = []

  for (const entry of entries) {
    const key = contentKey(entry.text, entry.source)
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, entry)
    } else {
      // Keep the one with remoteId, or the older one
      if (entry.remoteId && !existing.remoteId) {
        dupeIds.push(existing.id)
        seen.set(key, entry)
      } else {
        dupeIds.push(entry.id)
      }
    }
  }

  for (const id of dupeIds) {
    await db.entries.delete(id)
    await db.embeddings.delete(id).catch(() => {})
  }

  return { removed: dupeIds.length }
}

export async function deduplicateRemote(userId) {
  const supabase = getSupabase()
  if (!supabase || !userId) return { removed: 0 }

  const { data: remoteEntries, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error

  const seen = new Map()
  const dupeIds = []

  for (const r of remoteEntries) {
    const key = contentKey(r.content, r.source)
    if (seen.has(key)) {
      dupeIds.push(r.id)
    } else {
      seen.set(key, r)
    }
  }

  if (dupeIds.length > 0) {
    // Also unlink any local entries pointing to the dupes
    for (const dupeId of dupeIds) {
      const local = await db.entries.where('remoteId').equals(dupeId).first()
      if (local) {
        const canonical = seen.get(contentKey(local.text, local.source))
        if (canonical) {
          await updateRemoteId(local.id, canonical.id)
        }
      }
    }

    const { error: delError } = await supabase
      .from('entries')
      .delete()
      .in('id', dupeIds)
    if (delError) throw delError
  }

  return { removed: dupeIds.length }
}
