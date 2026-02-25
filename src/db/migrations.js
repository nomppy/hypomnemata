import { db } from './index.js'
import { getSupabase } from '../auth/supabase.js'

const BRACKET_MIGRATION_KEY = 'hypo:bracket-migration-done'

/**
 * Strip [bracket tags] from entry text, add them to tags array.
 * Runs once, flagged via localStorage.
 */
export async function runBracketTagMigration(userId) {
  if (localStorage.getItem(BRACKET_MIGRATION_KEY) === '1') return

  const entries = await db.entries.toArray()
  const bracketPattern = /\[([^\]]+)\]/g
  let migrated = 0

  for (const entry of entries) {
    const matches = [...(entry.text || '').matchAll(bracketPattern)]
    if (matches.length === 0) continue

    // Extract tag names from brackets
    const bracketTags = []
    for (const m of matches) {
      // Handle [tag1, tag2] and [single-tag]
      const inner = m[1]
      for (const part of inner.split(',')) {
        const tag = part.trim().toLowerCase().replace(/\s+/g, '-')
        if (tag) bracketTags.push(tag)
      }
    }

    // Strip brackets from text
    const cleanText = entry.text
      .replace(bracketPattern, '')
      .replace(/  +/g, ' ')
      .trim()

    // Merge new tags with existing
    const mergedTags = [...new Set([...(entry.tags || []), ...bracketTags])]

    await db.entries.update(entry.id, {
      text: cleanText,
      tags: mergedTags,
      updatedAt: Date.now(),
    })
    migrated++
  }

  // Also update remote entries if signed in
  const supabase = getSupabase()
  if (supabase && userId && migrated > 0) {
    const { data: remoteEntries } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)

    if (remoteEntries) {
      for (const remote of remoteEntries) {
        const matches = [...(remote.content || '').matchAll(bracketPattern)]
        if (matches.length === 0) continue

        const bracketTags = []
        for (const m of matches) {
          for (const part of m[1].split(',')) {
            const tag = part.trim().toLowerCase().replace(/\s+/g, '-')
            if (tag) bracketTags.push(tag)
          }
        }

        const cleanContent = remote.content
          .replace(bracketPattern, '')
          .replace(/  +/g, ' ')
          .trim()

        const mergedTags = [...new Set([...(remote.tags || []), ...bracketTags])]

        await supabase
          .from('entries')
          .update({
            content: cleanContent,
            tags: mergedTags,
            updated_at: new Date().toISOString(),
          })
          .eq('id', remote.id)
      }
    }
  }

  localStorage.setItem(BRACKET_MIGRATION_KEY, '1')
  console.log(`[migration] Stripped bracket tags from ${migrated} local entries`)
  return migrated
}
