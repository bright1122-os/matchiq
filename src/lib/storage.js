/* localStorage keys + safe access helpers.
 * Every read/write in the app went through a bare try/catch; this centralises
 * that so a disabled-storage browser degrades identically everywhere. */

export const LS_THEME      = 'matchiq_theme'
export const LS_ANALYSIS   = 'matchiq_analysis_cache'
export const LS_TRACKED    = 'matchiq_tracked'
export const LS_AGENT_PERF = 'matchiq_agent_performance'
export const LS_SWIPE_HINT = 'matchiq_swipe_hint_shown'
export const LS_DIAG_OPEN  = 'matchiq_diag_open'

export const delay = (ms) => new Promise(r => setTimeout(r, ms))

export function readRaw(key) {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(key) } catch { return null }
}

export function writeRaw(key, value) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, value) } catch {}
}

export function readJSON(key, fallback) {
  const raw = readRaw(key)
  if (raw == null) return fallback
  try { return JSON.parse(raw) } catch { return fallback }
}

export function writeJSON(key, value) {
  try { writeRaw(key, JSON.stringify(value)) } catch {}
}
