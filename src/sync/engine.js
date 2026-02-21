import { getSupabase } from '../auth/supabase.js'
import { db } from '../db/index.js'
import { getEntryByRemoteId, updateRemoteId } from '../db/operations.js'

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
  const supabase = getSupabase()
  if (!supabase || !userId) return

  const { data: remoteEntries, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error

  const localEntries = await db.entries.toArray()

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

  // 2. Local entries without remoteId: dedupe by content+source, or push
  for (const local of localWithoutRemote) {
    let matched = false
    for (const [remoteId, remote] of remoteById) {
      if (remote.content === local.text && (remote.source || '') === (local.source || '')) {
        // Link them
        await updateRemoteId(local.id, remoteId)
        remoteById.delete(remoteId)
        matched = true
        break
      }
    }
    if (!matched) {
      await pushEntry(local, userId)
    }
  }

  // 3. Remote-only entries: insert into Dexie
  for (const [, remote] of remoteById) {
    await db.entries.add(toLocal(remote))
  }
}
