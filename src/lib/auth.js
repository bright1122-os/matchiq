import { supabase } from './supabase.js'

export async function signUpWithEmail(email, password, name) {
  return supabase.auth.signUp({
    email, password,
    ...(name ? { options: { data: { name } } } : {}),
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

export async function signOut() {
  return supabase.auth.signOut()
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
