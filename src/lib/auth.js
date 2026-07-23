import { supabase } from './supabase.js'
import { LS_ANALYSIS, LS_TRACKED, LS_AGENT_PERF } from './storage.js'

export async function signUpWithEmail(email, password, name) {
  return supabase.auth.signUp({
    email, password,
    options: {
      // Confirmation emails must land back on this app, not the project's
      // default Site URL (which points at localhost until configured).
      emailRedirectTo: window.location.origin,
      ...(name ? { data: { name } } : {}),
    },
  })
}

export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
}

export async function resetPasswordForEmail(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })
}

export async function updatePassword(password) {
  return supabase.auth.updateUser({ password })
}

export async function signOut() {
  const res = await supabase.auth.signOut()
  // On a shared device the next account must not inherit this one's data.
  // Theme and the onboarding flag are device prefs and deliberately survive.
  try {
    ;[LS_ANALYSIS, LS_TRACKED, LS_AGENT_PERF].forEach(k => window.localStorage.removeItem(k))
  } catch { /* storage unavailable — nothing cached to clear */ }
  return res
}

export async function resendConfirmation(email) {
  return supabase.auth.resend({ type: 'signup', email })
}

export async function getSession() {
  return supabase.auth.getSession()
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

/* Plain-language error copy — raw Supabase strings never reach the UI */
export function friendlyAuthError(message = '') {
  const m = String(message).toLowerCase()
  if (m.includes('invalid login credentials')) return "That email and password don't match. Check them and try again."
  if (m.includes('already registered') || m.includes('already been registered')) return 'That email already has an account — try signing in instead.'
  if (m.includes('password should be at least') || m.includes('at least 6')) return 'Passwords need at least 6 characters.'
  if (m.includes('valid email') || m.includes('invalid format')) return "That doesn't look like a valid email address."
  if (m.includes('email not confirmed')) return 'Your email hasn’t been confirmed yet — check your inbox for the confirmation link.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts in a row — give it a minute and try again.'
  if (m.includes('network') || m.includes('fetch')) return 'We couldn’t reach the sign-in service. Check your connection and try again.'
  return 'Something went wrong signing you in. Please try again.'
}
