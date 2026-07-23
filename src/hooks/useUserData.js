import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

/* Syncs the signed-in user's app state (tracked fixtures, analysis cache,
 * agent performance, theme preference) to the `user_data` table.
 * - On sign-in: pulls the remote row once and hands it to onRemote for merging.
 * - After that: pushes changes with a debounce, never before the pull finishes
 *   (so an empty local state can't clobber a populated remote row). */
export function useUserData(user, payload, onRemote) {
  const loadedForRef = useRef(null)
  const timerRef = useRef(null)
  const onRemoteRef = useRef(onRemote)
  onRemoteRef.current = onRemote

  useEffect(() => {
    if (!supabase || !user) { loadedForRef.current = null; return }
    if (loadedForRef.current === user.id) return
    let cancelled = false
    const load = (columns) =>
      supabase.from('user_data').select(columns).eq('user_id', user.id).maybeSingle()
    load('tracked, analysis_cache, agent_perf, theme, email_notifications')
      .then(({ data, error }) => {
        // Migration 002 not run yet: fall back to the original column set.
        if (error && /email_notifications/.test(error.message)) {
          return load('tracked, analysis_cache, agent_perf, theme')
        }
        return { data, error }
      })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { console.warn('[user_data] load failed:', error.message); return }
        loadedForRef.current = user.id
        if (data) onRemoteRef.current?.(data)
      })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!supabase || !user || loadedForRef.current !== user.id) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const row = {
        user_id: user.id,
        tracked: payload.tracked,
        analysis_cache: payload.analysisCache,
        agent_perf: payload.agentPerf,
        theme: payload.theme,
        email_notifications: payload.emailNotifications ?? false,
        updated_at: new Date().toISOString(),
      }
      supabase.from('user_data').upsert(row).then(({ error }) => {
        if (!error) return
        // Migration 002 not run yet: retry without the new column so the
        // rest of the state still syncs instead of failing wholesale.
        if (/email_notifications/.test(error.message)) {
          const { email_notifications, ...legacy } = row
          supabase.from('user_data').upsert(legacy).then(({ error: e2 }) => {
            if (e2) console.warn('[user_data] sync failed:', e2.message)
          })
        } else {
          console.warn('[user_data] sync failed:', error.message)
        }
      })
    }, 1500)
    return () => clearTimeout(timerRef.current)
  }, [user, payload.tracked, payload.analysisCache, payload.agentPerf, payload.theme, payload.emailNotifications])
}
