import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Sun, Moon, ChevronLeft, ChevronRight, X as XIcon, Check, Heart,
  Mail, ArrowUpRight, Plus, Minus,
} from 'lucide-react'
import '@fontsource-variable/inter'

import {
  LS_THEME, LS_ANALYSIS, LS_TRACKED, LS_AGENT_PERF, LS_DIAG_OPEN,
  delay, readJSON, writeJSON, readRaw, writeRaw,
} from './lib/storage.js'
import { SYSTEM_PROMPT, buildPrompt } from './lib/prompts.js'
import {
  calculateKelly, runMultiMarketAnalysis, updateAgentPerformance, autoResolve,
  edgeToOutcome, AGENT_PERF_EMPTY,
} from './lib/analysis.js'
import { ODDS_SPORTS, lookupOddsForFixture } from './lib/odds.js'
import { useApiHealth } from './hooks/useApiHealth.js'
import { useFixtures } from './hooks/useFixtures.js'
import { authConfigured } from './lib/supabase.js'
import {
  signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, friendlyAuthError,
} from './lib/auth.js'
import { useAuth } from './hooks/useAuth.js'
import { useUserData } from './hooks/useUserData.js'

/* ============================================================
 * QUIET SIGNAL — design language
 * Near-monochrome surfaces, one blue accent, Inter with tight
 * confident headlines, generous space, gentle scroll reveals.
 * ============================================================ */

const T = {
  bg:        'var(--iq-bg)',
  card:      'var(--iq-card)',
  card2:     'var(--iq-card2)',
  line:      'var(--iq-line)',
  lineHi:    'var(--iq-lineHi)',
  ink:       'var(--iq-ink)',
  sub:       'var(--iq-sub)',
  faint:     'var(--iq-faint)',
  accent:    'var(--iq-accent)',
  accentInk: 'var(--iq-accentInk)',
  accentBg:  'var(--iq-accentBg)',
  good:      'var(--iq-good)',
  goodBg:    'var(--iq-goodBg)',
  bad:       'var(--iq-bad)',
  badBg:     'var(--iq-badBg)',
  live:      'var(--iq-live)',
  glow:      'var(--iq-glow)',
  shadow:    'var(--iq-shadow)',
  shadowLg:  'var(--iq-shadowLg)',

  sans: "'Inter Variable', -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', monospace",

  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
}

const LIGHT = {
  bg:        '#FBFBFD',
  card:      '#FFFFFF',
  card2:     '#F5F5F7',
  line:      'rgba(0,0,0,0.07)',
  lineHi:    'rgba(0,0,0,0.14)',
  ink:       '#1D1D1F',
  sub:       '#6E6E73',
  faint:     '#98989D',
  accent:    '#0071E3',
  accentInk: '#FFFFFF',
  accentBg:  'rgba(0,113,227,0.08)',
  good:      '#1D7F3E',
  goodBg:    'rgba(29,127,62,0.08)',
  bad:       '#C93400',
  badBg:     'rgba(201,52,0,0.07)',
  live:      '#E8481C',
  glow:      'none',
  shadow:    '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)',
  shadowLg:  '0 12px 48px rgba(0,0,0,0.12)',
}

/* Dark mode is glass: translucent white surfaces over a near-black base, edges
 * from hairlines, depth from luminance — no dark drop shadows. The @supports-not
 * block in GlobalStyles raises surface opacity where backdrop-filter is missing. */
const DARK = {
  bg:        '#0B0B0D',
  card:      'rgba(255,255,255,0.04)',
  card2:     'rgba(255,255,255,0.06)',
  line:      'rgba(255,255,255,0.08)',
  lineHi:    'rgba(255,255,255,0.12)',
  ink:       '#F5F5F7',
  sub:       '#A1A1A6',
  faint:     '#6E6E73',
  accent:    '#2997FF',
  accentInk: '#00080F',
  accentBg:  'rgba(41,151,255,0.13)',
  good:      '#3DD968',
  goodBg:    'rgba(61,217,104,0.11)',
  bad:       '#FF7A66',
  badBg:     'rgba(255,122,102,0.10)',
  live:      '#FF7A66',
  glow:      '0 0 40px 0 rgba(41,151,255,0.15)',
  shadow:    'none',
  shadowLg:  'none',
}

const cssVars = (p) => Object.entries(p).map(([k, v]) => `--iq-${k}:${v};`).join('')

function GlobalStyles() {
  return (
    <style>{`
      [data-theme="light"] { ${cssVars(LIGHT)} color-scheme: light; }
      [data-theme="dark"]  { ${cssVars(DARK)}  color-scheme: dark; }

      html, body, #root { margin: 0; padding: 0; min-height: 100%; }
      body {
        background: ${T.bg};
        color: ${T.ink};
        font-family: ${T.sans};
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        font-optical-sizing: auto;
        overflow-x: hidden;
      }
      /* The theme vars live on the wrapper div, so the page base must paint
         there too — body sits outside the var scope and can't resolve them. */
      [data-theme] { background: var(--iq-bg); min-height: 100vh; min-height: 100dvh; width: 100%; }
      /* Dark background — one barely-visible neutral wash on a near-black base.
         Calm and chromatically silent; richness comes from the surfaces above. */
      [data-theme="dark"] {
        background:
          radial-gradient(ellipse 100% 50% at 50% 0%,
            rgba(255, 255, 255, 0.04),
            transparent 70%),
          #0B0B0D;
        background-attachment: fixed;
      }

      /* Glass surfaces — dark mode only, where backdrop-filter exists.
         Tuned for a neutral base; the inset top hairline is the light-catching edge. */
      @supports ((backdrop-filter: blur(8px)) or (-webkit-backdrop-filter: blur(8px))) {
        [data-theme="dark"] .iq-glass,
        [data-theme="dark"] .iq-bar {
          background: linear-gradient(180deg,
            rgba(255, 255, 255, 0.05),
            rgba(255, 255, 255, 0.03)) !important;
          backdrop-filter: blur(20px) saturate(120%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(120%) !important;
          border-color: rgba(255, 255, 255, 0.09) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
        }
        [data-theme="dark"] .iq-elevated {
          background: linear-gradient(180deg,
            rgba(255, 255, 255, 0.07),
            rgba(255, 255, 255, 0.04)) !important;
          backdrop-filter: blur(30px) saturate(140%) !important;
          -webkit-backdrop-filter: blur(30px) saturate(140%) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
        }
      }
      /* No backdrop-filter: raise surface opacity so glass still reads as surface */
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        [data-theme="dark"] {
          --iq-card: rgba(255,255,255,0.12);
          --iq-card2: rgba(255,255,255,0.14);
        }
        [data-theme="dark"] .iq-bar { background: rgba(255, 255, 255, 0.12) !important; }
        [data-theme="dark"] .iq-elevated { background: rgba(255, 255, 255, 0.16) !important; }
      }

      /* Accent glow on the verdict headline only (primary button gets it via --iq-glow) */
      .iq-halo { position: relative; }
      [data-theme="dark"] .iq-halo {
        box-shadow: 0 0 40px 0 rgba(41, 151, 255, 0.15);
        border-radius: 28px;
      }
      *, *::before, *::after { box-sizing: border-box; overflow-wrap: break-word; }
      button { font-family: inherit; }
      a { color: inherit; }

      [data-theme] * {
        transition: background-color 300ms ${T.ease}, color 300ms ${T.ease},
          border-color 300ms ${T.ease}, box-shadow 300ms ${T.ease};
      }
      *:focus { outline: none; }
      button:focus-visible, a:focus-visible, [tabindex]:focus-visible, summary:focus-visible {
        outline: 2px solid ${T.accent}; outline-offset: 3px; border-radius: 10px;
      }
      ::selection { background: ${T.accentBg}; }

      @keyframes iq-breathe { 0%,100% { opacity: .5; } 50% { opacity: .95; } }
      .iq-skel { animation: iq-breathe 1.6s ease-in-out infinite; background: ${T.card2}; border-radius: 10px; }

      @keyframes iq-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.55); opacity: .5; } }
      .iq-pulse { animation: iq-pulse 1.8s ease-in-out infinite; }

      @keyframes iq-livedot { 0%,100% { opacity: .6; } 50% { opacity: 1; } }
      .iq-livedot { animation: iq-livedot 2s ease-in-out infinite; }

      @keyframes iq-think { to { transform: rotate(360deg); } }

      .iq-row { transition: background-color 180ms ${T.ease}; }
      .iq-row:hover { background: ${T.card2}; }
      .iq-lift { transition: transform 260ms ${T.ease}, box-shadow 260ms ${T.ease}; }
      .iq-lift:hover { transform: translateY(-2px); box-shadow: ${T.shadowLg}; }
      .iq-lift:active { transform: translateY(0); }

      details.iq-fold > summary { list-style: none; cursor: pointer; }
      details.iq-fold > summary::-webkit-details-marker { display: none; }
      details.iq-fold[open] .iq-fold-chev { transform: rotate(90deg); }
      .iq-fold-chev { display: inline-flex; transition: transform 240ms ${T.ease}; }

      [data-theme] *::-webkit-scrollbar { width: 10px; height: 8px; }
      [data-theme] *::-webkit-scrollbar-track { background: transparent; }
      [data-theme] *::-webkit-scrollbar-thumb {
        background: ${T.lineHi}; border-radius: 99px;
        border: 3px solid transparent; background-clip: padding-box;
      }
      .iq-scroll-x { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }

      @media (prefers-reduced-motion: reduce) {
        [data-theme] *, [data-theme] *::before, [data-theme] *::after {
          animation-duration: 0.001ms !important; transition-duration: 0.001ms !important;
        }
      }
    `}</style>
  )
}

/* Gentle scroll reveal — a soft fade and a few pixels of drift, nothing more */
function Reveal({ children, delay: d = 0, style, className }) {
  const reduce = useReducedMotion()
  if (reduce) return <div style={style} className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.65, delay: d, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  )
}

/* Theme mode is 'light' | 'dark' | 'system'; the resolved theme follows the
 * OS preference (live) when mode is 'system'. Stored values from older builds
 * ('light'/'dark') read back unchanged. */
function useTheme() {
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'system'
    const saved = readRaw(LS_THEME)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  })
  const [sysDark, setSysDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches : false)
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const on = (e) => setSysDark(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => { writeRaw(LS_THEME, mode) }, [mode])
  const theme = mode === 'system' ? (sysDark ? 'dark' : 'light') : mode
  const toggle = () => setMode(theme === 'dark' ? 'light' : 'dark')
  return [theme, toggle, setMode, mode]
}

function useWindowWidth() {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth))
  useEffect(() => {
    const on = () => setW(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}

/* ============================================================
 * Identity, contact
 * ============================================================ */

const CONTACT_EMAIL = 'agwunobisomtochukwu@gmail.com'
const SOCIAL_LINKS = {
  github:   'https://github.com/bright1122-os',
  linkedin: 'https://www.linkedin.com/in/agwunobi-somtochukwu-a61870342',
  x:        'https://x.com/gramzfgs',
  email:    `mailto:${CONTACT_EMAIL}`,
}
const mailto = (subject) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`

/* Brand marks have no Lucide equivalents, so they stay minimal inline glyphs */
const Github = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
)
const Linkedin = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 01.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
  </svg>
)
const XSocial = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/>
  </svg>
)

/* ============================================================
 * Team crest with initials fallback — everywhere teams appear
 * ============================================================ */

function initialsOf(name = '') {
  const words = name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean)
  if (!words.length) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function Crest({ src, name, size = 26 }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [src])
  if (!src || failed) {
    return (
      <span aria-hidden="true" style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: T.card2, border: `1px solid ${T.line}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.sans, fontWeight: 650, fontSize: Math.max(9, size * 0.34),
        color: T.sub, letterSpacing: '0.01em',
      }}>{initialsOf(name)}</span>
    )
  }
  return (
    <img src={src} alt="" onError={() => setFailed(true)} style={{
      width: size, height: size, borderRadius: '50%', objectFit: 'contain',
      background: '#fff', border: `1px solid ${T.line}`, flexShrink: 0, padding: 1,
    }} />
  )
}

/* ============================================================
 * Type scale + small atoms
 * ============================================================ */

const type = {
  display: { fontFamily: T.sans, fontWeight: 650, letterSpacing: '-0.025em', lineHeight: 1.08 },
  title:   { fontFamily: T.sans, fontWeight: 620, letterSpacing: '-0.015em', lineHeight: 1.2 },
  eyebrow: {
    fontFamily: T.sans, fontSize: 12, fontWeight: 620, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: T.faint,
  },
  body:  { fontFamily: T.sans, fontSize: 16, lineHeight: 1.6, color: T.ink, fontWeight: 420 },
  small: { fontFamily: T.sans, fontSize: 13.5, lineHeight: 1.55, color: T.sub, fontWeight: 440 },
  num:   { fontFamily: T.mono, fontWeight: 500 },
}

function Card({ children, style, className, onClick }) {
  return (
    <div className={`iq-glass${className ? ` ${className}` : ''}`} onClick={onClick} style={{
      background: T.card, border: `1px solid ${T.line}`,
      borderRadius: 20, boxShadow: T.shadow, ...style,
    }}>{children}</div>
  )
}

function Eyebrow({ children, style }) {
  return <div style={{ ...type.eyebrow, ...style }}>{children}</div>
}

function Button({ children, onClick, kind = 'primary', style, disabled }) {
  const kinds = {
    primary: { background: T.accent, color: T.accentInk, border: '1px solid transparent', boxShadow: T.glow },
    ghost:   { background: 'transparent', color: T.ink, border: `1px solid ${T.lineHi}` },
    soft:    { background: T.card2, color: T.ink, border: '1px solid transparent' },
    danger:  { background: 'transparent', color: T.bad, border: `1px solid ${T.bad}` },
  }
  return (
    <button onClick={onClick} disabled={disabled} className="iq-lift" style={{
      ...kinds[kind], borderRadius: 999, padding: '10px 22px',
      fontFamily: T.sans, fontSize: 14.5, fontWeight: 560, cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
      ...style,
    }}>{children}</button>
  )
}

function Skel({ w = '100%', h = 14, style }) {
  return <div className="iq-skel" style={{ width: w, height: h, ...style }} />
}

function EmptyNote({ title, hint, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 28px' }}>
      <div style={{ ...type.title, fontSize: 22, color: T.ink }}>{title}</div>
      {hint && <div style={{ ...type.small, maxWidth: 360, margin: '12px auto 0' }}>{hint}</div>}
      {action && <div style={{ marginTop: 22 }}>{action}</div>}
    </div>
  )
}

function LiveDot({ size = 8 }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
      <span className="iq-pulse" style={{
        position: 'absolute', inset: 0, borderRadius: '50%', background: T.live,
      }} />
      <span style={{ position: 'absolute', inset: 1, borderRadius: '50%', background: T.live }} />
    </span>
  )
}

/* In-play signal: a soft accent dot on a slow 2s pulse — felt, not shouted */
function PulseDot({ size = 7 }) {
  return (
    <span className="iq-livedot" aria-label="In play" style={{
      width: size, height: size, borderRadius: '50%', background: T.accent,
      boxShadow: `0 0 8px 2px color-mix(in oklab, ${T.accent} 30%, transparent)`,
      display: 'inline-block', flexShrink: 0,
    }} />
  )
}

/* Score digit that crossfades vertically when its value changes */
function AnimatedScore({ value, style }) {
  return (
    <span style={{ display: 'inline-grid', overflow: 'hidden', ...style }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={String(value)}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ gridArea: '1 / 1' }}>
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/* Friendly language helpers — plain words first, numbers second */
function confidencePhrase(conf) {
  const c = conf || 0
  if (c >= 0.78) return 'and we feel strongly about it'
  if (c >= 0.68) return 'and we’re fairly confident'
  if (c >= 0.55) return 'though we hold it loosely'
  return 'but only as a slight lean'
}
function pickHeadline(pick, fx) {
  if (pick === 'home_win') return `${fx.homeTeam} to win`
  if (pick === 'away_win') return `${fx.awayTeam} to win`
  return 'A draw looks likeliest'
}
function pickShort(pick, fx) {
  return ({ home_win: fx.homeTeam, away_win: fx.awayTeam, draw: 'Draw' })[pick] || pick
}

/* ============================================================
 * Header + navigation
 * ============================================================ */

const NAV = [
  { key: 'matches',   label: 'Matches' },
  { key: 'bets',      label: 'Best Bets' },
  { key: 'following', label: 'Following' },
  { key: 'record',    label: 'Track Record' },
  { key: 'about',     label: 'About' },
]

/* Brand mark — three ascending bars: three independent angles rising to one
 * verdict. Monochrome via currentColor so it recolors with the theme. */
function LogoMark({ size = 20, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={style}>
      <rect x="3.5" y="12.5" width="4.4" height="8" rx="2.2" fill="currentColor" opacity="0.4" />
      <rect x="9.8" y="8" width="4.4" height="12.5" rx="2.2" fill="currentColor" opacity="0.68" />
      <rect x="16.1" y="3.5" width="4.4" height="17" rx="2.2" fill="currentColor" />
    </svg>
  )
}

/* Brand signature: the wordmark always sets tighter (-0.045em) than any other
 * text in the product — one consistent typographic detail, nothing else. */
function Wordmark({ size = 22, withMark = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.42, color: T.ink }}>
      {withMark && <LogoMark size={size * 0.95} style={{ flexShrink: 0 }} />}
      <span style={{
        fontFamily: T.sans, fontWeight: 680, fontSize: size,
        letterSpacing: '-0.045em', display: 'inline-flex', alignItems: 'baseline',
      }}>
        MatchIQ
      </span>
    </span>
  )
}

function Header({ theme, onToggleTheme, tab, onTab, isMobile, liveCount, user, onOpenProfile }) {
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <header className="iq-bar" style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: `color-mix(in oklab, ${T.bg} 82%, transparent)`,
      backdropFilter: 'saturate(1.6) blur(18px)', WebkitBackdropFilter: 'saturate(1.6) blur(18px)',
      borderBottom: `1px solid ${T.line}`,
    }}>
      <div style={{
        maxWidth: 1024, margin: '0 auto', padding: isMobile ? '13px 20px' : '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, minWidth: 0 }}>
          <Wordmark size={isMobile ? 19 : 21} />
          {!isMobile && <span style={{ ...type.small, fontSize: 13, color: T.faint }}>{dateStr}</span>}
          {liveCount > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, ...type.small, fontSize: 13, color: T.live, fontWeight: 600 }}>
              <LiveDot size={7} /> {liveCount} live
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isMobile && (
            <nav style={{ display: 'flex', gap: 2, marginRight: 8 }}>
              {NAV.map(n => {
                const on = n.key === tab
                return (
                  <button key={n.key} onClick={() => onTab(n.key)} style={{
                    background: 'transparent', border: 'none',
                    borderRadius: 999, padding: '8px 14px', cursor: 'pointer',
                    fontFamily: T.sans, fontSize: 13.5, fontWeight: on ? 620 : 460,
                    color: on ? T.ink : T.sub, position: 'relative',
                  }}>
                    {n.label}
                    {on && (
                      <motion.span layoutId="nav-dot" style={{
                        position: 'absolute', left: '50%', bottom: -1, width: 4, height: 4,
                        marginLeft: -2, borderRadius: '50%', background: T.accent,
                      }} />
                    )}
                  </button>
                )
              })}
            </nav>
          )}
          <button onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'transparent', border: `1px solid ${T.line}`, borderRadius: '50%',
              width: 36, height: 36, cursor: 'pointer', color: T.sub,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {theme === 'dark' ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
          </button>
          {user && (
            <button onClick={onOpenProfile} aria-label="Open your profile" style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 2,
              display: 'inline-flex', borderRadius: '50%',
            }}>
              <Avatar user={user} size={28} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function MobileNav({ tab, onTab }) {
  return (
    <nav className="iq-bar" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: `color-mix(in oklab, ${T.card} 88%, transparent)`,
      backdropFilter: 'saturate(1.6) blur(20px)', WebkitBackdropFilter: 'saturate(1.6) blur(20px)',
      borderTop: `1px solid ${T.line}`,
      display: 'flex', height: 58,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {NAV.map(n => {
        const on = n.key === tab
        return (
          <button key={n.key} onClick={() => onTab(n.key)} style={{
            flex: 1, minWidth: 0, background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4, color: on ? T.ink : T.faint, position: 'relative', padding: 0,
          }}>
            {on && (
              <motion.span layoutId="mnav-dot" style={{
                width: 4, height: 4, borderRadius: '50%', background: T.accent,
                position: 'absolute', top: 8,
              }} />
            )}
            <span style={{
              fontFamily: T.sans, fontSize: 11, fontWeight: on ? 620 : 480,
              whiteSpace: 'nowrap', marginTop: 8,
            }}>{n.label === 'Track Record' ? 'Record' : n.label === 'Best Bets' ? 'Bets' : n.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/* ============================================================
 * MATCHES — browse + league tables
 * ============================================================ */

function MatchRow({ fixture: f, analyzed, tracked, onOpen, onToggleTrack }) {
  const isLive = f.status === 'IN_PLAY' || f.status === 'LIVE'
  const isFT = f.status === 'FINISHED'
  const hasScore = f.goalsHome != null && f.goalsAway != null

  const TeamLine = ({ name, logo, goals }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <Crest src={logo} name={name} size={22} />
      <span style={{
        fontFamily: T.sans, fontSize: 14.5, fontWeight: 520, color: T.ink,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1,
      }}>{name}</span>
      {goals != null && (
        <AnimatedScore value={goals} style={{ ...type.num, fontSize: 15, fontWeight: 600, color: isLive ? T.live : T.ink }} />
      )}
    </div>
  )

  return (
    <div className="iq-row" role="button" tabIndex={0}
      aria-label={`${f.homeTeam} versus ${f.awayTeam}`}
      onClick={() => onOpen(f)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(f) } }}
      style={{
        display: 'grid', gridTemplateColumns: '64px minmax(0,1fr) auto',
        gap: 14, alignItems: 'center', padding: '22px 22px',
        borderBottom: `1px solid ${T.line}`, cursor: 'pointer',
        background: isLive ? T.card2 : undefined,
      }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {isLive ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', paddingLeft: 2 }}>
            <PulseDot size={8} />
          </span>
        ) : isFT ? (
          <span style={{ ...type.small, fontWeight: 560, color: T.faint, fontSize: 12 }}>Ended</span>
        ) : (
          <span style={{ ...type.num, fontSize: 13, color: T.sub }}>{f.kickoff}</span>
        )}
        {f.matchDate && <span style={{ fontSize: 10.5, color: T.faint, fontFamily: T.sans }}>{f.matchDate}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <TeamLine name={f.homeTeam} logo={f.homeLogo} goals={hasScore ? f.goalsHome : null} />
        <TeamLine name={f.awayTeam} logo={f.awayLogo} goals={hasScore ? f.goalsAway : null} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {analyzed && (
          <span title="Already analysed" style={{
            fontSize: 11.5, fontWeight: 560, color: T.accent, background: T.accentBg,
            borderRadius: 999, padding: '3px 10px', fontFamily: T.sans, whiteSpace: 'nowrap',
          }}>Read</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); onToggleTrack(f.id) }}
          aria-label={tracked ? 'Unfollow this match' : 'Follow this match'}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 6,
            color: tracked ? T.accent : T.faint, display: 'inline-flex',
          }}>
          <Heart size={17} strokeWidth={1.8} fill={tracked ? 'currentColor' : 'none'} />
        </button>
        <span style={{ color: T.faint, display: 'inline-flex' }}><ChevronRight size={16} strokeWidth={1.8} /></span>
      </div>
    </div>
  )
}

function MatchesSkeleton() {
  return (
    <div>
      <Skel w={240} h={40} style={{ marginBottom: 12 }} />
      <Skel w={320} h={16} style={{ marginBottom: 32 }} />
      <Card style={{ overflow: 'hidden' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ padding: '16px 22px', borderBottom: `1px solid ${T.line}`, display: 'flex', gap: 14, alignItems: 'center' }}>
            <Skel w={44} h={13} />
            <div style={{ flex: 1 }}>
              <Skel w="55%" h={14} style={{ marginBottom: 8 }} />
              <Skel w="45%" h={14} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

function LeagueTables({ fixtures, standingsCache, scorersCache, compDetailsCache }) {
  const compKeys = useMemo(() => {
    const keys = new Set()
    fixtures.forEach(f => { if (f.competitionCode) keys.add(f.competitionCode) })
    return Array.from(keys)
  }, [fixtures])

  const comps = compKeys.map(code => ({
    code,
    name: compDetailsCache[code]?.name || fixtures.find(f => f.competitionCode === code)?.competition || code,
    table: standingsCache[code]?.[0]?.table || [],
    scorers: scorersCache[code] || [],
  })).filter(c => c.table.length > 0 || c.scorers.length > 0)

  if (!comps.length) {
    return (
      <EmptyNote title="Tables are on their way"
        hint="League standings and top scorers load quietly in the background as match data arrives. Check back in a moment." />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {comps.map(c => (
        <Reveal key={c.code}>
          <Card style={{ padding: 28 }}>
            <div style={{ ...type.title, fontSize: 20, color: T.ink }}>{c.name}</div>
            {c.table.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <Eyebrow style={{ marginBottom: 10 }}>Standings — top 6</Eyebrow>
                {c.table.slice(0, 6).map(row => (
                  <div key={row.team?.id} style={{
                    display: 'grid', gridTemplateColumns: '22px 26px minmax(0,1fr) 34px 34px',
                    gap: 8, alignItems: 'center', padding: '8px 0',
                    borderBottom: `1px solid ${T.line}`,
                  }}>
                    <span style={{ ...type.num, fontSize: 12, color: T.faint }}>{row.position}</span>
                    <Crest src={row.team?.crest} name={row.team?.shortName || row.team?.name} size={20} />
                    <span style={{ ...type.small, color: T.ink, fontWeight: 540, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.team?.shortName || row.team?.name}
                    </span>
                    <span style={{ ...type.num, fontSize: 12, color: T.sub, textAlign: 'right' }}>{row.playedGames}</span>
                    <span style={{ ...type.num, fontSize: 13, fontWeight: 600, color: T.ink, textAlign: 'right' }}>{row.points}</span>
                  </div>
                ))}
              </div>
            )}
            {c.scorers.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <Eyebrow style={{ marginBottom: 10 }}>Leading scorers</Eyebrow>
                {c.scorers.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', alignItems: 'baseline' }}>
                    <span style={{ ...type.small, color: T.ink, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.player?.name}
                      <span style={{ color: T.faint }}> · {s.team?.shortName || s.team?.name}</span>
                    </span>
                    <span style={{ ...type.num, fontSize: 14, fontWeight: 600, color: T.ink, flexShrink: 0 }}>
                      {s.goals || 0} goals
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Reveal>
      ))}
    </div>
  )
}

function MatchesScreen({
  fixtures, fixturesLoading, fixturesError, onRetry,
  analysisCache, tracked, onOpen, onToggleTrack,
  standingsCache, scorersCache, compDetailsCache,
}) {
  const [view, setView] = useState('fixtures') // 'fixtures' | 'tables'
  const [comp, setComp] = useState('all')
  const [when, setWhen] = useState('all') // all | live | soon

  const live = fixtures.filter(f => f.status === 'IN_PLAY' || f.status === 'LIVE')
  const isMobile = useWindowWidth() < 768

  /* The single highest-conviction verdict already written, if any — real data only */
  const topPick = useMemo(() => {
    let best = null
    for (const [id, a] of Object.entries(analysisCache)) {
      if (!a?.recommendation?.pick) continue
      const fx = fixtures.find(f => String(f.id) === String(id))
      if (!fx) continue
      if (!best || (a.recommendation.confidence || 0) > (best.a.recommendation.confidence || 0)) best = { fx, a }
    }
    return best
  }, [analysisCache, fixtures])
  const topPickReason = topPick
    ? ((topPick.a.recommendation.reasoning || '').split(/(?<=[.!?])\s+/)[0] || '')
    : ''

  const compOptions = useMemo(() => {
    const m = new Map()
    fixtures.forEach(f => {
      const code = f.competitionCode || f.competition
      if (!m.has(code)) m.set(code, { code, name: f.competition })
    })
    return Array.from(m.values())
  }, [fixtures])

  const filtered = useMemo(() => {
    let list = fixtures
    if (comp !== 'all') list = list.filter(f => (f.competitionCode || f.competition) === comp)
    if (when === 'live') list = list.filter(f => f.status === 'IN_PLAY' || f.status === 'LIVE')
    if (when === 'soon') list = list.filter(f => f.status === 'SCHEDULED' || f.status === 'TIMED')
    return list
  }, [fixtures, comp, when])

  const groups = useMemo(() => {
    const m = new Map()
    filtered.forEach(f => {
      const arr = m.get(f.competition) || []
      arr.push(f); m.set(f.competition, arr)
    })
    return Array.from(m.entries())
  }, [filtered])

  if (fixturesLoading) return <MatchesSkeleton />
  if (fixturesError) {
    return (
      <Card style={{ padding: 32 }}>
        <div style={{ ...type.title, fontSize: 21, color: T.ink }}>We couldn't fetch today's matches</div>
        <div style={{ ...type.small, margin: '10px 0 20px' }}>{fixturesError}</div>
        <Button onClick={onRetry} kind="soft">Try again</Button>
      </Card>
    )
  }

  const countWords = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']
  const headline = fixtures.length === 0
    ? 'A quiet day.'
    : `${countWords[fixtures.length] || fixtures.length} ${fixtures.length === 1 ? 'match' : 'matches'} today.`
  const dateLine = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div>
      <Reveal>
        <div style={{
          padding: isMobile ? '48px 0 8px' : '80px 0 16px',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'flex-end',
          justifyContent: 'space-between', gap: 28,
        }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ ...type.display, fontSize: isMobile ? 38 : 46, color: T.ink, margin: 0 }}>{headline}</h1>
            <div style={{ ...type.body, fontSize: 17, color: T.sub, marginTop: 10 }}>
              {dateLine}
              {live.length > 0 && <> · <span style={{ color: T.live, fontWeight: 560 }}>{live.length} in play</span></>}
            </div>
          </div>
          {topPick && (
            <Card className="iq-elevated iq-lift" onClick={() => onOpen(topPick.fx)} style={{
              padding: 22, cursor: 'pointer', flexShrink: 0,
              width: isMobile ? '100%' : 300,
            }}>
              <Eyebrow style={{ color: T.accent }}>Strongest read today</Eyebrow>
              <div style={{ ...type.title, fontSize: 18, color: T.ink, marginTop: 10 }}>
                {pickHeadline(topPick.a.recommendation.pick, topPick.fx)}
              </div>
              <div style={{ ...type.small, fontSize: 13, marginTop: 7 }}>
                <strong style={{ color: T.ink, fontWeight: 560 }}>
                  {Math.round((topPick.a.recommendation.confidence || 0) * 100)}% sure
                </strong>
                {topPickReason && <> — {topPickReason}</>}
              </div>
            </Card>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <div style={{ height: 1, background: T.line, margin: isMobile ? '28px 0 4px' : '40px 0 8px' }} />
      </Reveal>

      {/* View toggle */}
      <Reveal delay={0.06}>
        <div style={{ display: 'flex', gap: 4, marginTop: 26, background: T.card2, borderRadius: 999, padding: 3, width: 'fit-content' }}>
          {[{ k: 'fixtures', l: 'Fixtures' }, { k: 'tables', l: 'League tables' }].map(o => (
            <button key={o.k} onClick={() => setView(o.k)} style={{
              background: view === o.k ? T.card : 'transparent',
              color: view === o.k ? T.ink : T.sub,
              border: 'none', boxShadow: view === o.k ? T.shadow : 'none',
              borderRadius: 999, padding: '8px 18px', cursor: 'pointer',
              fontFamily: T.sans, fontSize: 13.5, fontWeight: view === o.k ? 600 : 480,
            }}>{o.l}</button>
          ))}
        </div>
      </Reveal>

      {view === 'tables' ? (
        <div style={{ marginTop: 24 }}>
          <LeagueTables fixtures={fixtures} standingsCache={standingsCache}
            scorersCache={scorersCache} compDetailsCache={compDetailsCache} />
        </div>
      ) : (
        <>
          {/* Filters */}
          <Reveal delay={0.1}>
            <div className="iq-scroll-x" style={{ display: 'flex', gap: 6, marginTop: 18, paddingBottom: 4, whiteSpace: 'nowrap' }}>
              {[{ k: 'all', l: 'Everything' }, { k: 'live', l: `Live now${live.length ? ` · ${live.length}` : ''}` }, { k: 'soon', l: 'Upcoming' }].map(o => (
                <button key={o.k} onClick={() => setWhen(o.k)} style={{
                  background: when === o.k ? T.ink : 'transparent',
                  color: when === o.k ? T.bg : T.sub,
                  border: `1px solid ${when === o.k ? T.ink : T.line}`,
                  borderRadius: 999, padding: '6px 15px', cursor: 'pointer',
                  fontFamily: T.sans, fontSize: 12.5, fontWeight: 560, flexShrink: 0,
                }}>{o.l}</button>
              ))}
              <span style={{ width: 1, background: T.line, margin: '4px 4px', flexShrink: 0 }} />
              {[{ code: 'all', name: 'All leagues' }, ...compOptions].map(c => (
                <button key={c.code} onClick={() => setComp(c.code)} style={{
                  background: comp === c.code ? T.card2 : 'transparent',
                  color: comp === c.code ? T.ink : T.sub,
                  border: `1px solid ${comp === c.code ? T.lineHi : T.line}`,
                  borderRadius: 999, padding: '6px 15px', cursor: 'pointer',
                  fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, flexShrink: 0,
                }}>{c.name}</button>
              ))}
            </div>
          </Reveal>

          {filtered.length === 0 ? (
            <Card style={{ marginTop: 24 }}>
              <EmptyNote title="Nothing here right now" hint="Try a different filter, or check back closer to kick-off." />
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 44, marginTop: 28 }}>
              {groups.map(([name, list]) => (
                <Reveal key={name}>
                  <Card style={{ overflow: 'hidden' }}>
                    <div style={{
                      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                      padding: '18px 22px 12px',
                    }}>
                      <span style={{ ...type.title, fontSize: 17, color: T.ink }}>{name}</span>
                      <span style={{ ...type.small, color: T.faint }}>{list.length}</span>
                    </div>
                    {list.map(f => (
                      <MatchRow key={f.id} fixture={f}
                        analyzed={!!analysisCache[f.id]} tracked={tracked.has(f.id)}
                        onOpen={onOpen} onToggleTrack={onToggleTrack} />
                    ))}
                  </Card>
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ============================================================
 * MATCH DETAIL — preview, thinking state, verdict story
 * ============================================================ */

function DetailHeader({ fixture: f, onBack, tracked, onToggleTrack }) {
  const isLive = f.status === 'IN_PLAY' || f.status === 'LIVE'
  const hasScore = f.goalsHome != null && f.goalsAway != null
  return (
    <Reveal>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 30px' }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', color: T.sub,
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0,
          fontFamily: T.sans, fontSize: 14.5, fontWeight: 500,
        }}><ChevronLeft size={17} strokeWidth={1.8} /> Back</button>
        <button onClick={() => onToggleTrack(f.id)}
          aria-label={tracked ? 'Unfollow this match' : 'Follow this match'}
          style={{
            background: tracked ? T.accentBg : 'transparent',
            border: `1px solid ${tracked ? 'transparent' : T.line}`, borderRadius: 999,
            padding: '7px 16px', cursor: 'pointer',
            color: tracked ? T.accent : T.sub,
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontFamily: T.sans, fontSize: 13, fontWeight: 560,
          }}>
          <Heart size={14} strokeWidth={1.8} fill={tracked ? 'currentColor' : 'none'} /> {tracked ? 'Following' : 'Follow'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
        {[{ n: f.homeTeam, l: f.homeLogo, g: f.goalsHome }, null, { n: f.awayTeam, l: f.awayLogo, g: f.goalsAway }].map((side, i) =>
          side === null ? (
            <div key="mid" style={{ textAlign: 'center' }}>
              {hasScore ? (
                <div style={{ ...type.num, fontSize: 32, fontWeight: 600, color: isLive ? T.live : T.ink }}>
                  {f.goalsHome}–{f.goalsAway}
                </div>
              ) : (
                <div style={{ ...type.small, fontSize: 15, color: T.faint }}>v</div>
              )}
              <div style={{ ...type.small, color: T.faint, marginTop: 6, fontSize: 12.5 }}>
                {isLive ? <span style={{ color: T.live, fontWeight: 620 }}>Live now</span>
                  : f.status === 'FINISHED' ? 'Full time'
                  : `${f.matchDate ? f.matchDate + ' · ' : ''}${f.kickoff}`}
              </div>
            </div>
          ) : (
            <div key={i} style={{ textAlign: 'center', minWidth: 0 }}>
              <Crest src={side.l} name={side.n} size={56} />
              <div style={{
                ...type.title, fontSize: 17, color: T.ink, marginTop: 12, lineHeight: 1.25,
              }}>{side.n}</div>
            </div>
          )
        )}
      </div>
      <div style={{ textAlign: 'center', ...type.small, color: T.faint, marginTop: 14 }}>{f.competition}</div>
    </Reveal>
  )
}

function FormBeads({ form }) {
  const items = (form && form.length ? form : ['-', '-', '-', '-', '-'])
  return (
    <span style={{ display: 'inline-flex', gap: 5 }}>
      {items.map((r, i) => {
        const color = r === 'W' ? T.good : r === 'L' ? T.bad : r === 'D' ? T.faint : 'transparent'
        return (
          <span key={i} title={r === 'W' ? 'Won' : r === 'L' ? 'Lost' : r === 'D' ? 'Drew' : 'No data'} style={{
            width: 9, height: 9, borderRadius: '50%',
            background: r === '-' ? 'transparent' : color,
            border: r === '-' ? `1.5px dashed ${T.faint}` : 'none',
            display: 'inline-block',
          }} />
        )
      })}
    </span>
  )
}

function MarketBar({ fixture: f }) {
  const o = f.odds || {}
  if (o.home == null) {
    return (
      <div style={{ ...type.small, color: T.faint }}>
        No live betting prices for this one yet — we'll read it from form and history instead.
      </div>
    )
  }
  const imp = (v) => (v ? 1 / parseFloat(v) : 0)
  const total = imp(o.home) + imp(o.draw) + imp(o.away) || 1
  const segs = [
    { l: f.homeTeam.split(' ')[0], p: imp(o.home) / total, c: T.ink, odds: o.home },
    { l: 'Draw', p: imp(o.draw) / total, c: T.faint, odds: o.draw },
    { l: f.awayTeam.split(' ')[0], p: imp(o.away) / total, c: T.sub, odds: o.away },
  ]
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ width: `${s.p * 100}%`, background: s.c, opacity: 0.75, borderRadius: 999 }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center', minWidth: 0 }}>
            <div style={{ ...type.small, fontWeight: 560, color: T.ink, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.l}</div>
            <div style={{ ...type.num, fontSize: 12, color: T.sub }}>
              {Math.round(s.p * 100)}% <span style={{ color: T.faint }}>({parseFloat(s.odds).toFixed(2)})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchPreview({ fixture: f, onAnalyze }) {
  const hasH2h = f.h2h?.matches?.length > 0
  return (
    <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Reveal>
        <Card style={{ padding: 28 }}>
          <Eyebrow>Recent form — last five games</Eyebrow>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {[{ n: f.homeTeam, fm: f.homeForm }, { n: f.awayTeam, fm: f.awayForm }].map((s, i) => (
              <div key={i}>
                <div style={{ ...type.small, fontWeight: 560, color: T.ink, marginBottom: 8 }}>{s.n}</div>
                <FormBeads form={s.fm} />
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.05}>
        <Card style={{ padding: 28 }}>
          <Eyebrow>What the betting market thinks</Eyebrow>
          <div style={{ marginTop: 16 }}><MarketBar fixture={f} /></div>
        </Card>
      </Reveal>

      {hasH2h && (
        <Reveal delay={0.1}>
          <Card style={{ padding: 28 }}>
            <Eyebrow>When they've met before</Eyebrow>
            <div style={{ ...type.body, marginTop: 12 }}>{f.h2h.summary}</div>
            {f.h2h.lastMeeting && f.h2h.lastMeeting !== 'Unavailable' && (
              <div style={{ ...type.small, color: T.faint, marginTop: 8 }}>Most recently: {f.h2h.lastMeeting}</div>
            )}
          </Card>
        </Reveal>
      )}

      <Reveal delay={0.14}>
        <div style={{ textAlign: 'center', padding: '18px 0 4px' }}>
          <Button onClick={onAnalyze} style={{ padding: '15px 34px', fontSize: 16, borderRadius: 999 }}>
            Read this match for me
          </Button>
          <div style={{ ...type.small, color: T.faint, marginTop: 14, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            Three independent AI perspectives — form, history, and the market — settled into one honest verdict.
          </div>
        </div>
      </Reveal>
    </div>
  )
}

function ThinkingState({ fixture: f }) {
  const steps = [
    'Weighing recent form and momentum…',
    'Reading the history between these sides…',
    'Comparing our view against the market price…',
    'Writing the verdict…',
  ]
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 3200)
    return () => clearInterval(id)
  }, [])
  return (
    <Reveal>
      <Card style={{ padding: 48, marginTop: 36, textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 44 44" fill="none" aria-hidden="true"
          style={{ animation: 'iq-think 1.6s linear infinite', margin: '0 auto', display: 'block' }}>
          <circle cx="22" cy="22" r="18" stroke={`color-mix(in oklab, ${'var(--iq-accent)'} 20%, transparent)`} strokeWidth="3" />
          <path d="M22 4a18 18 0 0114 6.7" stroke="var(--iq-accent)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={{ ...type.title, fontSize: 21, color: T.ink, marginTop: 24 }}>
          Reading {f.homeTeam} v {f.awayTeam}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            style={{ ...type.small, marginTop: 10 }} aria-live="polite">
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </Card>
    </Reveal>
  )
}

/* Agreement between the three angles, derived from the real analysis JSON */
function angleReads(data, fx) {
  const reads = []
  const fe = data.form_analysis?.form_edge
  if (fe) reads.push({
    key: 'form', name: 'Form', outcome: edgeToOutcome(fe),
    neutral: fe === 'neutral',
    note: fe === 'neutral' ? 'saw the two sides as evenly matched'
      : `leaned towards ${fe === 'home' ? fx.homeTeam : fx.awayTeam} on recent performances`,
  })
  const te = data.tactical_analysis?.tactical_edge
  if (te) reads.push({
    key: 'tactical', name: 'History & matchup', outcome: edgeToOutcome(te),
    neutral: te === 'neutral',
    note: te === 'neutral' ? 'found no clear edge in how these teams match up'
      : `favoured ${te === 'home' ? fx.homeTeam : fx.awayTeam} on how these teams match up`,
  })
  const vb = data.market_analysis?.value_bet
  if (vb) reads.push({
    key: 'market', name: 'Market', outcome: vb === 'none' ? null : edgeToOutcome(vb),
    neutral: vb === 'none',
    note: vb === 'none' ? 'found no mispricing worth acting on'
      : `spotted value in ${vb === 'home' ? fx.homeTeam : vb === 'away' ? fx.awayTeam : 'the draw'} at current prices`,
  })
  return reads
}

function VerdictStory({ fixture: fx, data, onReRun }) {
  const r = data.recommendation || {}
  const conf = Math.round((r.confidence || 0) * 100)
  const modelPct = Math.round((r.model_probability || 0) * 100)
  const edge = r.value_edge || 0
  const kelly = data.kelly
  const halfK = kelly?.halfPercent

  const reads = angleReads(data, fx)
  const opinions = reads.filter(a => a.outcome != null)
  const dissenters = opinions.filter(a => a.outcome !== r.pick)
  const disagreed = dissenters.length > 0

  const marketImplied = ({
    home_win: data.market_analysis?.implied_home_prob,
    draw: data.market_analysis?.implied_draw_prob,
    away_win: data.market_analysis?.implied_away_prob,
  })[r.pick]
  const impliedPct = marketImplied != null ? Math.round(marketImplied * 100) : null

  /* If our pick isn't the market's implied favourite, say so — confidently */
  const impliedAll = [
    ['home_win', data.market_analysis?.implied_home_prob],
    ['draw', data.market_analysis?.implied_draw_prob],
    ['away_win', data.market_analysis?.implied_away_prob],
  ].filter(([, v]) => typeof v === 'number' && v > 0)
  const marketFav = impliedAll.length
    ? impliedAll.reduce((a, b) => (b[1] > a[1] ? b : a))
    : null
  const marketDisagrees = !!(marketFav && r.pick && marketFav[0] !== r.pick)
  const marketFavLabel = marketFav
    ? (marketFav[0] === 'draw' ? 'a draw' : pickShort(marketFav[0], fx))
    : ''
  const reasoningFirstSentence = (r.reasoning || '').split(/(?<=[.!?])\s+/)[0] || ''

  const analysedAt = data._ts
    ? new Date(data._ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null

  const pickLabels = {
    over: 'More than 2.5 goals', under: 'Fewer than 2.5 goals',
    yes: 'Both teams to score', no: 'Not both teams to score',
  }

  return (
    <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* THE VERDICT — one clear thing the eye lands on first */}
      <Reveal>
        <div className="iq-halo" style={{ textAlign: 'center', padding: '16px 0 8px' }}>
          <Eyebrow style={{ color: T.accent, marginBottom: 16 }}>Our verdict</Eyebrow>
          <h1 style={{ ...type.display, fontSize: 40, color: T.ink, margin: 0 }}>
            {pickHeadline(r.pick, fx)}.
          </h1>
          <div style={{ ...type.body, fontSize: 19, color: T.sub, marginTop: 12 }}>
            We're <strong style={{ color: T.ink, fontWeight: 560 }}>{conf}% sure</strong>, {confidencePhrase(r.confidence)}.
          </div>
          <div style={{ maxWidth: 320, margin: '26px auto 0' }}>
            <div style={{ height: 6, background: T.card2, borderRadius: 999, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} whileInView={{ width: `${conf}%` }}
                viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%', borderRadius: 999, background: T.accent }} />
            </div>
          </div>
        </div>
      </Reveal>

      {/* THE WHY — calm, readable prose with breathing room */}
      {r.reasoning && (
        <Reveal>
          <Card className="iq-elevated" style={{ padding: '34px 32px' }}>
            <Eyebrow style={{ marginBottom: 14 }}>Why we think so</Eyebrow>
            <p style={{
              ...type.body, fontSize: 17.5, lineHeight: 1.7, color: T.ink,
              margin: 0, fontWeight: 420,
            }}>{r.reasoning}</p>
          </Card>
        </Reveal>
      )}

      {/* THE MARKET DISAGREES — only when our pick isn't the implied favourite */}
      {marketDisagrees && (
        <Reveal>
          <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 24, padding: '24px 4px 4px' }}>
            <div style={{ ...type.small, fontSize: 13, fontWeight: 560, color: T.faint }}>The market disagrees</div>
            <div style={{ ...type.body, marginTop: 10 }}>
              The market favors {marketFavLabel} at {Math.round(marketFav[1] * 100)}%.
              We think {pickShort(r.pick, fx)} is the better call
              {reasoningFirstSentence ? <> — {reasoningFirstSentence}</> : '.'}
            </div>
          </div>
        </Reveal>
      )}

      {/* AGREEMENT / DISAGREEMENT — quietly highlighted only when it matters */}
      {disagreed ? (
        <Reveal>
          <Card style={{ padding: 30, borderLeft: `3px solid ${T.accent}` }}>
            <Eyebrow style={{ color: T.accent }}>Worth knowing — our angles didn't all agree</Eyebrow>
            <div style={{ ...type.body, marginTop: 12 }}>
              The final call went to <strong style={{ fontWeight: 560 }}>{pickShort(r.pick, fx)}</strong>, but not unanimously.
              That tension is part of the picture:
            </div>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reads.map(a => {
                const agrees = a.outcome === r.pick
                return (
                  <div key={a.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      marginTop: 2, width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: agrees ? T.goodBg : a.outcome == null ? 'transparent' : T.badBg,
                      border: a.outcome == null ? `1.5px dashed ${T.faint}` : 'none',
                      color: agrees ? T.good : T.bad,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {a.outcome != null && (agrees ? <Check size={12} strokeWidth={2.2} /> : <XIcon size={11} strokeWidth={2.2} />)}
                    </span>
                    <span style={{ ...type.small, fontSize: 14, color: T.ink }}>
                      <strong style={{ fontWeight: 560 }}>{a.name}</strong> {a.note}.
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </Reveal>
      ) : (
        <Reveal>
          <div style={{
            ...type.small, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '4px 18px', color: T.good, textAlign: 'center',
          }}>
            <Check size={15} strokeWidth={2} />
            All three of our angles — form, history, and the market — pointed the same way here.
          </div>
        </Reveal>
      )}

      {/* THE PRACTICAL TAKEAWAY */}
      <Reveal>
        <Card style={{ padding: 30 }}>
          <Eyebrow>If you were going to act on this</Eyebrow>
          {edge > 0 && impliedPct != null ? (
            <div style={{ ...type.body, marginTop: 12 }}>
              The market prices this outcome at about <strong style={{ fontWeight: 560 }}>{impliedPct}%</strong>; our read makes
              it <strong style={{ fontWeight: 560 }}>{modelPct}%</strong>. That gap — about <strong style={{ color: T.good, fontWeight: 560 }}>{edge} points in your favour</strong> —
              is what makes this interesting.
            </div>
          ) : edge > 0 ? (
            <div style={{ ...type.body, marginTop: 12 }}>
              We rate this outcome about <strong style={{ color: T.good, fontWeight: 560 }}>{edge} points more likely</strong> than
              the betting market's price suggests.
            </div>
          ) : (
            <div style={{ ...type.body, marginTop: 12 }}>
              Honestly? The market has this priced about right. There's no bargain here — treat this
              as a read on the game, not a reason to bet.
            </div>
          )}

          {halfK != null && halfK > 0 ? (
            <div style={{
              marginTop: 20, padding: '18px 22px', background: T.card2,
              borderRadius: 16, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
            }}>
              <span style={{ ...type.display, fontSize: 26, color: T.ink }}>
                ~{halfK}%
              </span>
              <span style={{ ...type.small, fontSize: 14, color: T.ink }}>
                of your betting pot would be a disciplined stake here.
              </span>
              <details className="iq-fold" style={{ width: '100%' }}>
                <summary style={{ ...type.small, color: T.sub, fontWeight: 560, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span className="iq-fold-chev"><ChevronRight size={13} strokeWidth={2} /></span>
                  How we sized that
                </summary>
                <div style={{ ...type.small, marginTop: 10 }}>
                  This is the <em>Kelly Criterion</em> — a formula for stake sizing from probability edges.
                  Full Kelly says {kelly.fullPercent}%; we suggest half of that ({kelly.halfPercent}%) because
                  it keeps most of the long-term growth with far gentler swings.
                </div>
              </details>
            </div>
          ) : kelly && (
            <div style={{ ...type.small, color: T.faint, marginTop: 16 }}>
              {kelly.label === 'No odds available for Kelly calculation'
                ? 'Without live prices we can’t suggest a stake size for this one.'
                : 'Our math says the sensible stake here is zero.'}
            </div>
          )}
        </Card>
      </Reveal>

      {/* WHAT COULD MAKE THIS WRONG */}
      {r.red_flags?.length > 0 && (
        <Reveal>
          <Card style={{ padding: 30 }}>
            <Eyebrow>What could make us wrong</Eyebrow>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {r.red_flags.map((flag, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <Minus size={15} strokeWidth={1.8} style={{ color: T.faint, flexShrink: 0, marginTop: 3 }} />
                  <span style={{ ...type.small, fontSize: 14, color: T.ink }}>{flag}</span>
                </div>
              ))}
            </div>
            <div style={{ ...type.small, color: T.faint, marginTop: 16 }}>
              Football keeps its own counsel. Nothing here is certain.
            </div>
          </Card>
        </Reveal>
      )}

      {/* OTHER MARKETS */}
      {data.multiMarket?.length > 0 && (
        <Reveal>
          <Card style={{ padding: 30 }}>
            <Eyebrow>A goals angle, if you prefer</Eyebrow>
            <div style={{ marginTop: 14, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {data.multiMarket.map(m => {
                const res = m.result || {}
                const c = Math.round((res.confidence || 0) * 100)
                return (
                  <div key={m.key} style={{ background: T.card2, borderRadius: 16, padding: 20 }}>
                    <div style={{ ...type.small, fontSize: 14, fontWeight: 560, color: T.ink }}>
                      {pickLabels[res.recommendation] || res.recommendation || '—'}
                    </div>
                    <div style={{ ...type.small, color: T.sub, marginTop: 8 }}>{res.reasoning}</div>
                    <div style={{ ...type.num, fontSize: 12, color: T.faint, marginTop: 10 }}>{c}% confident · {m.label}</div>
                  </div>
                )
              })}
            </div>
          </Card>
        </Reveal>
      )}

      {/* EVERY NUMBER — for the curious, revealed on request */}
      <Reveal>
        <details className="iq-fold">
          <summary style={{
            ...type.small, fontSize: 14, fontWeight: 560, color: T.sub, padding: '10px 4px',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span className="iq-fold-chev"><ChevronRight size={14} strokeWidth={2} /></span>
            See every number behind this verdict
          </summary>
          <Card style={{ padding: 28, marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 18 }}>
              {[
                { l: 'Model probability', v: `${modelPct}%` },
                { l: 'Confidence', v: `${conf}% (${r.confidence_label || '—'})` },
                { l: 'Value edge vs market', v: `${edge > 0 ? '+' : ''}${edge}%` },
                { l: 'Implied — home', v: `${Math.round((data.market_analysis?.implied_home_prob || 0) * 100)}%` },
                { l: 'Implied — draw', v: `${Math.round((data.market_analysis?.implied_draw_prob || 0) * 100)}%` },
                { l: 'Implied — away', v: `${Math.round((data.market_analysis?.implied_away_prob || 0) * 100)}%` },
                { l: 'Full Kelly', v: kelly?.fullPercent != null ? `${kelly.fullPercent}%` : '—' },
                { l: 'Half Kelly', v: kelly?.halfPercent != null ? `${kelly.halfPercent}%` : '—' },
                { l: 'Data quality', v: data.data_quality || '—' },
              ].map(x => (
                <div key={x.l}>
                  <div style={{ ...type.eyebrow, fontSize: 10.5 }}>{x.l}</div>
                  <div style={{ ...type.num, fontSize: 16, color: T.ink, marginTop: 5 }}>{x.v}</div>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: T.line, margin: '24px 0' }} />

            {/* Per-angle detail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <Eyebrow>Form angle</Eyebrow>
                <div style={{ ...type.small, marginTop: 10, color: T.ink }}>
                  <strong style={{ fontWeight: 560 }}>{fx.homeTeam}:</strong> {data.form_analysis?.home_verdict}
                </div>
                <div style={{ ...type.small, marginTop: 5, color: T.ink }}>
                  <strong style={{ fontWeight: 560 }}>{fx.awayTeam}:</strong> {data.form_analysis?.away_verdict}
                </div>
                {(data.form_analysis?.key_factors || []).map((k, i) => (
                  <div key={i} style={{ ...type.small, color: T.sub, marginTop: 5, paddingLeft: 12, borderLeft: `2px solid ${T.line}` }}>{k}</div>
                ))}
              </div>
              <div>
                <Eyebrow>History & matchup angle</Eyebrow>
                <div style={{ ...type.small, marginTop: 10, color: T.ink }}>{data.tactical_analysis?.matchup_insight}</div>
                {(data.tactical_analysis?.key_factors || []).map((k, i) => (
                  <div key={i} style={{ ...type.small, color: T.sub, marginTop: 5, paddingLeft: 12, borderLeft: `2px solid ${T.line}` }}>{k}</div>
                ))}
              </div>
              <div>
                <Eyebrow>Market angle</Eyebrow>
                <div style={{ ...type.small, marginTop: 10, color: T.ink }}>{data.market_analysis?.market_signal}</div>
              </div>
            </div>
          </Card>
        </details>
      </Reveal>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 12, flexWrap: 'wrap', padding: '4px 4px 12px',
      }}>
        <span style={{ ...type.small, color: T.faint }}>
          {analysedAt ? `Written ${analysedAt}` : 'From an earlier reading'}
        </span>
        {onReRun && <Button kind="ghost" onClick={onReRun} style={{ padding: '8px 18px', fontSize: 13 }}>Read it again</Button>}
      </div>
    </div>
  )
}

function MatchDetail({ fixture, data, loading, error, onBack, onRetry, onAnalyze, tracked, onToggleTrack }) {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <DetailHeader fixture={fixture} onBack={onBack} tracked={tracked} onToggleTrack={onToggleTrack} />
      {loading ? (
        <ThinkingState fixture={fixture} />
      ) : error ? (
        <Card style={{ padding: 30, marginTop: 36, borderLeft: `3px solid ${T.bad}` }}>
          <div style={{ ...type.title, fontSize: 19, color: T.ink }}>That reading didn't come through</div>
          <div style={{ ...type.small, margin: '10px 0 18px' }}>{error}</div>
          <Button kind="soft" onClick={onRetry}>Try again</Button>
        </Card>
      ) : data ? (
        <VerdictStory fixture={fixture} data={data} onReRun={onAnalyze} />
      ) : (
        <MatchPreview fixture={fixture} onAnalyze={onAnalyze} />
      )}
    </div>
  )
}

/* ============================================================
 * BEST BETS + COMBO SLIP
 * ============================================================ */

function BetCard({ entry, onOpen, comboActive, onToggleCombo }) {
  const { fx, a } = entry
  const r = a.recommendation
  const conf = Math.round((r.confidence || 0) * 100)
  const edge = r.value_edge || 0
  const firstSentence = (r.reasoning || '').split(/(?<=[.!?])\s+/)[0] || ''
  return (
    <Card className="iq-lift" onClick={() => onOpen(fx)} style={{ padding: 26, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Crest src={fx.homeLogo} name={fx.homeTeam} size={20} />
          <Crest src={fx.awayLogo} name={fx.awayTeam} size={20} />
          <span style={{ ...type.small, fontSize: 12.5, color: T.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fx.competition} · {fx.matchDate ? `${fx.matchDate}, ` : ''}{fx.kickoff}
          </span>
        </span>
        {edge > 0 && (
          <span style={{
            fontSize: 12, fontWeight: 560, fontFamily: T.sans, color: T.good,
            background: T.goodBg, borderRadius: 999, padding: '4px 11px', whiteSpace: 'nowrap',
          }}>{edge}-pt edge</span>
        )}
      </div>

      <div style={{ ...type.title, fontSize: 22, color: T.ink, marginTop: 14, letterSpacing: '-0.02em' }}>
        {pickHeadline(r.pick, fx)}
      </div>
      {firstSentence && (
        <div style={{
          ...type.small, fontSize: 14, marginTop: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{firstSentence}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
        <div style={{ flex: 1, height: 5, background: T.card2, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${conf}%`, height: '100%', background: T.accent, borderRadius: 999 }} />
        </div>
        <span style={{ ...type.num, fontSize: 13, color: T.sub }}>{conf}% sure</span>
        <button onClick={(e) => { e.stopPropagation(); onToggleCombo(entry.id) }} style={{
          background: comboActive ? T.accent : 'transparent',
          color: comboActive ? T.accentInk : T.sub,
          border: `1px solid ${comboActive ? T.accent : T.lineHi}`,
          borderRadius: 999, padding: '6px 14px', cursor: 'pointer',
          fontFamily: T.sans, fontSize: 12.5, fontWeight: 560, whiteSpace: 'nowrap',
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          {comboActive ? <Check size={12} strokeWidth={2.4} /> : <Plus size={12} strokeWidth={2.2} />}
          {comboActive ? 'In combo' : 'Combine'}
        </button>
      </div>
    </Card>
  )
}

/* Combo slip — the parlay math and correlation detection preserved exactly */
function ComboSlip({ selections, entries, onRemove, onClear }) {
  if (!selections.length) return null

  const chosen = selections.map(id => entries.find(e => String(e.id) === String(id))).filter(Boolean)
  const allHaveOdds = chosen.every(e => {
    const pick = e.a.recommendation?.pick
    const o = e.fx?.odds
    return pick && o && (pick === 'home_win' ? o.home : pick === 'away_win' ? o.away : o.draw)
  })
  const combinedOdds = allHaveOdds
    ? chosen.reduce((acc, e) => {
        const pick = e.a.recommendation?.pick
        const o = e.fx.odds
        const dec = pick === 'home_win' ? o.home : pick === 'away_win' ? o.away : o.draw
        return acc * parseFloat(dec)
      }, 1)
    : null
  const combinedProb = chosen.reduce((acc, e) => acc * (e.a.recommendation?.model_probability || 0), 1)

  const teamMap = {}
  const matchIds = new Set()
  const warnings = []
  chosen.forEach(e => {
    if (!e.fx) return
    if (matchIds.has(e.fx.id)) warnings.push(`Two of these picks come from the same match (${e.fx.homeTeam} v ${e.fx.awayTeam})`)
    matchIds.add(e.fx.id)
    ;[e.fx.homeTeam, e.fx.awayTeam].forEach(t => {
      if (!t) return
      if (teamMap[t]) warnings.push(`${t} shows up in more than one pick`)
      teamMap[t] = true
    })
  })

  let kellyPct = null
  if (combinedOdds && combinedProb > 0 && warnings.length === 0) {
    const b = combinedOdds - 1
    const p = combinedProb
    const q = 1 - p
    const k = b > 0 ? (b * p - q) / b : 0
    if (k > 0) kellyPct = (k * 50).toFixed(1)
  }

  return (
    <Card className="iq-elevated" style={{
      position: 'sticky', bottom: 84, padding: 28, marginTop: 26,
      boxShadow: T.shadowLg, border: `1px solid ${T.lineHi}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ ...type.title, fontSize: 19, color: T.ink }}>
          Your combo — {selections.length} {selections.length === 1 ? 'pick' : 'picks'}
        </span>
        <button onClick={onClear} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', ...type.small, color: T.faint,
        }}>Clear</button>
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {chosen.map(e => {
          if (!e.fx) return null
          const label = pickShort(e.a.recommendation.pick, e.fx)
          return (
            <div key={e.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 14px', background: T.card2, borderRadius: 12,
            }}>
              <span style={{ ...type.small, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.fx.homeTeam} v {e.fx.awayTeam} — <strong style={{ color: T.ink, fontWeight: 560 }}>{label}</strong>
              </span>
              <button onClick={() => onRemove(e.id)} aria-label="Remove pick" style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: T.faint, padding: 4, display: 'inline-flex', flexShrink: 0,
              }}><XIcon size={14} strokeWidth={2} /></button>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 32, marginTop: 18, flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...type.eyebrow, fontSize: 10.5 }}>Combined price</div>
          <div style={{ ...type.num, fontSize: 22, fontWeight: 600, color: T.ink, marginTop: 4 }}>
            {combinedOdds ? combinedOdds.toFixed(2) : '—'}
          </div>
        </div>
        <div>
          <div style={{ ...type.eyebrow, fontSize: 10.5 }}>Chance it all lands</div>
          <div style={{ ...type.num, fontSize: 22, fontWeight: 600, color: T.sub, marginTop: 4 }}>
            {(combinedProb * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {warnings.length > 0 ? (
        <div style={{ marginTop: 16, padding: '14px 18px', background: T.badBg, borderRadius: 14 }}>
          <div style={{ ...type.small, fontWeight: 560, color: T.bad }}>
            These picks overlap — the combined chance above is too optimistic.
          </div>
          {[...new Set(warnings)].map((w, i) => (
            <div key={i} style={{ ...type.small, marginTop: 5 }}>{w}</div>
          ))}
          <div style={{ ...type.small, color: T.faint, marginTop: 8 }}>
            When picks share a team or a match, their outcomes rise and fall together. The math treats them
            as independent, so it flatters the combo. Tread carefully.
          </div>
        </div>
      ) : kellyPct != null ? (
        <div style={{ marginTop: 16, padding: '14px 18px', background: T.goodBg, borderRadius: 14 }}>
          <span style={{ ...type.title, fontSize: 19, color: T.good }}>~{kellyPct}%</span>
          <span style={{ ...type.small, marginLeft: 8 }}>of your pot would be a disciplined stake on this combo (half-Kelly).</span>
        </div>
      ) : (
        <div style={{ ...type.small, color: T.faint, marginTop: 14 }}>
          Add picks that have live prices and we'll size a stake for the combo.
        </div>
      )}
    </Card>
  )
}

function BestBetsScreen({ fixtures, analysisCache, onOpen, comboSelections, onToggleCombo, onClearCombo }) {
  const entries = useMemo(
    () => Object.entries(analysisCache)
      .map(([id, a]) => {
        const fx = fixtures.find(f => String(f.id) === String(id))
        return { id: fx?.id ?? id, fx, a }
      })
      .filter(e => e.fx)
      .sort((x, y) => (y.a.recommendation?.confidence || 0) - (x.a.recommendation?.confidence || 0)),
    [fixtures, analysisCache]
  )

  const strong = entries.filter(e => (e.a.recommendation?.confidence || 0) >= 0.65)
  const rest = entries.filter(e => (e.a.recommendation?.confidence || 0) < 0.65)

  if (!entries.length) {
    return (
      <div>
        <Reveal>
          <div style={{ padding: '28px 0 8px' }}>
            <div style={{ ...type.display, fontSize: 38, color: T.ink }}>Best bets.</div>
            <div style={{ ...type.body, fontSize: 17, color: T.sub, marginTop: 12, maxWidth: 520 }}>
              Nothing here yet — this page fills up as you have matches read. The strongest verdicts
              rise to the top on their own.
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <Card style={{ padding: 32, marginTop: 26 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {[
                ['Pick a match', 'Open any fixture on the Matches page and tap “Read this match for me”.'],
                ['Three angles, one verdict', 'Form, history, and the market each weigh in; a final pass reconciles them — especially when they disagree.'],
                ['Strong reads land here', 'Anything we’re at least 65% sure about surfaces on this page, ready to combine.'],
              ].map(([t, d], i) => (
                <div key={i} style={{ display: 'flex', gap: 16 }}>
                  <span style={{
                    fontFamily: T.sans, fontSize: 14, fontWeight: 620, color: T.accent,
                    width: 28, height: 28, borderRadius: '50%', background: T.accentBg, flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                  <div>
                    <div style={{ ...type.small, fontSize: 14.5, fontWeight: 560, color: T.ink }}>{t}</div>
                    <div style={{ ...type.small, marginTop: 3 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <Reveal>
        <div style={{ padding: '28px 0 8px' }}>
          <div style={{ ...type.display, fontSize: 38, color: T.ink }}>Best bets.</div>
          <div style={{ ...type.body, fontSize: 17, color: T.sub, marginTop: 12 }}>
            {strong.length > 0
              ? <>Our {strong.length === 1 ? 'strongest current read' : `${strong.length} strongest current reads`}, best first.</>
              : 'Everything we’ve read so far — nothing has cleared our confidence bar yet.'}
          </div>
        </div>
      </Reveal>

      {strong.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 26 }}>
          {strong.map((e, i) => (
            <Reveal key={e.id} delay={Math.min(i * 0.05, 0.2)}>
              <BetCard entry={e} onOpen={onOpen}
                comboActive={comboSelections.includes(e.id)} onToggleCombo={onToggleCombo} />
            </Reveal>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <Reveal><Eyebrow style={{ marginBottom: 14 }}>Weaker leans — read, but not convinced</Eyebrow></Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {rest.map(e => (
              <Reveal key={e.id}>
                <BetCard entry={e} onOpen={onOpen}
                  comboActive={comboSelections.includes(e.id)} onToggleCombo={onToggleCombo} />
              </Reveal>
            ))}
          </div>
        </div>
      )}

      <ComboSlip selections={comboSelections} entries={entries} onRemove={onToggleCombo} onClear={onClearCombo} />
    </div>
  )
}

/* ============================================================
 * FOLLOWING
 * ============================================================ */

function Countdown({ kickoffDate }) {
  const [, force] = useState(0)
  useEffect(() => {
    const id = setInterval(() => force(x => x + 1), 60000)
    return () => clearInterval(id)
  }, [])
  const diff = new Date(kickoffDate).getTime() - Date.now()
  if (diff <= 0) return null
  const totalMin = Math.floor(diff / 60000)
  const days = Math.floor(totalMin / 1440)
  const hours = Math.floor((totalMin - days * 1440) / 60)
  const mins = totalMin - days * 1440 - hours * 60
  const parts = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  return <span style={{ ...type.small, fontSize: 12.5, color: T.faint }}>kicks off in {parts}</span>
}

function FollowCard({ fixture: f, analysis: a, onOpen, onToggleTrack, onResolve, section }) {
  const isLive = section === 'live'
  const isDone = section === 'done'
  const hasScore = f.goalsHome != null && f.goalsAway != null
  return (
    <Card className="iq-lift" onClick={() => onOpen(f)} style={{ padding: 22, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
            <Crest src={f.homeLogo} name={f.homeTeam} size={20} />
            <span style={{ ...type.small, fontSize: 14, fontWeight: 560, color: T.ink }}>{f.homeTeam}</span>
            {hasScore
              ? <span style={{ ...type.num, fontSize: 15, fontWeight: 600, color: isLive ? T.live : T.ink }}>{f.goalsHome}–{f.goalsAway}</span>
              : <span style={{ color: T.faint, fontSize: 13 }}>v</span>}
            <Crest src={f.awayLogo} name={f.awayTeam} size={20} />
            <span style={{ ...type.small, fontSize: 14, fontWeight: 560, color: T.ink }}>{f.awayTeam}</span>
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ ...type.small, color: T.faint, fontSize: 12 }}>{f.competition}</span>
            {isLive && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: T.live, fontSize: 12, fontWeight: 600 }}><LiveDot size={6} /> live</span>}
            {section === 'soon' && <Countdown kickoffDate={f.kickoffDate} />}
            {isDone && <span style={{ ...type.small, fontSize: 12, color: T.faint }}>full time</span>}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleTrack(f.id) }}
          aria-label="Unfollow" style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: T.accent, padding: 4, display: 'inline-flex',
          }}><Heart size={17} strokeWidth={1.8} fill="currentColor" /></button>
      </div>

      {a && (
        <div style={{
          marginTop: 14, padding: '11px 16px', background: T.card2, borderRadius: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <span style={{ ...type.small, color: T.ink }}>
            We said <strong style={{ fontWeight: 560 }}>{pickShort(a.recommendation.pick, f)}</strong>
            <span style={{ color: T.faint }}> · {Math.round((a.recommendation.confidence || 0) * 100)}% sure</span>
          </span>
          {a.resolved && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12.5, fontWeight: 560, fontFamily: T.sans,
              color: a.correct ? T.good : T.bad,
            }}>
              {a.correct ? <Check size={13} strokeWidth={2.2} /> : <XIcon size={12} strokeWidth={2.2} />}
              {a.correct ? 'We were right' : 'We were wrong'}
            </span>
          )}
        </div>
      )}

      {isDone && a && !a.resolved && onResolve && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ ...type.small, fontSize: 12.5 }}>Did the pick land?</span>
          <Button kind="soft" style={{ padding: '5px 15px', fontSize: 12 }}
            onClick={(e) => { e.stopPropagation(); onResolve(f.id, true) }}>Yes</Button>
          <Button kind="ghost" style={{ padding: '5px 15px', fontSize: 12 }}
            onClick={(e) => { e.stopPropagation(); onResolve(f.id, false) }}>No</Button>
        </div>
      )}
    </Card>
  )
}

function FollowingScreen({ fixtures, tracked, analysisCache, onOpen, onToggleTrack, onGoMatches, onResolve }) {
  const list = useMemo(() => fixtures.filter(f => tracked.has(f.id)), [fixtures, tracked])
  const live = list.filter(f => f.status === 'IN_PLAY' || f.status === 'LIVE')
  const soon = list.filter(f => f.status === 'SCHEDULED' || f.status === 'TIMED')
  const done = list.filter(f => f.status === 'FINISHED')

  return (
    <div>
      <Reveal>
        <div style={{ padding: '28px 0 8px' }}>
          <div style={{ ...type.display, fontSize: 38, color: T.ink }}>Following.</div>
          <div style={{ ...type.body, fontSize: 17, color: T.sub, marginTop: 12 }}>
            Matches you've marked with a heart live here.
          </div>
        </div>
      </Reveal>

      {list.length === 0 ? (
        <Reveal delay={0.08}>
          <Card style={{ marginTop: 26 }}>
            <EmptyNote title="You're not following anything yet"
              hint="Tap the heart on any match to keep it close — live scores and your verdicts collect here."
              action={<Button kind="soft" onClick={onGoMatches}>Browse matches</Button>} />
          </Card>
        </Reveal>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 26 }}>
          {[['Playing now', live, 'live'], ['Coming up', soon, 'soon'], ['Finished', done, 'done']].map(([title, arr, sec]) =>
            arr.length > 0 && (
              <Reveal key={sec}>
                <Eyebrow style={{ marginBottom: 12, color: sec === 'live' ? T.live : undefined }}>{title}</Eyebrow>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {arr.map(f => (
                    <FollowCard key={f.id} fixture={f} analysis={analysisCache[f.id]}
                      onOpen={onOpen} onToggleTrack={onToggleTrack} onResolve={onResolve} section={sec} />
                  ))}
                </div>
              </Reveal>
            )
          )}
        </div>
      )}
    </div>
  )
}

/* ============================================================
 * TRACK RECORD — honest accuracy
 * ============================================================ */

function RecordScreen({ fixtures, analysisCache, agentPerf, onResolve, onOpen }) {
  const [openResolve, setOpenResolve] = useState(null)

  const entries = useMemo(() =>
    Object.entries(analysisCache)
      .map(([id, a]) => ({ id, a, fx: fixtures.find(f => String(f.id) === String(id)) }))
      .sort((x, y) => (y.a._ts || 0) - (x.a._ts || 0)),
    [fixtures, analysisCache])

  const resolved = entries.filter(e => e.a.resolved)
  const correct = resolved.filter(e => e.a.correct).length
  const winRate = resolved.length >= 3 ? Math.round((correct / resolved.length) * 100) : null

  const last10 = [...resolved]
    .sort((a, b) => (a.a.resolvedAt || 0) - (b.a.resolvedAt || 0))
    .slice(-10)

  const edges = entries.map(e => e.a.recommendation?.value_edge || 0)
  const avgEdge = edges.length ? edges.reduce((s, x) => s + x, 0) / edges.length : 0

  // Calibration — when we say X, how often are we right?
  const buckets = [
    { key: '50–60', min: 0.50, max: 0.60 }, { key: '60–70', min: 0.60, max: 0.70 },
    { key: '70–80', min: 0.70, max: 0.80 }, { key: '80+', min: 0.80, max: 1.01 },
  ].map(b => {
    const picks = resolved.filter(e => {
      const c = e.a.recommendation?.confidence || 0
      return c >= b.min && c < b.max
    })
    const hit = picks.filter(e => e.a.correct).length
    return { ...b, n: picks.length, rate: picks.length ? Math.round(hit / picks.length * 100) : null }
  })

  const agents = [
    { key: 'form', label: 'Form', sub: 'recent results and momentum' },
    { key: 'tactical', label: 'History & matchup', sub: 'head-to-head patterns' },
    { key: 'market', label: 'Market', sub: 'price and value signals' },
  ]

  return (
    <div>
      <Reveal>
        <div style={{ padding: '28px 0 8px' }}>
          <div style={{ ...type.display, fontSize: 38, color: T.ink }}>Track record.</div>
          <div style={{ ...type.body, fontSize: 17, color: T.sub, marginTop: 12, maxWidth: 560 }}>
            The honest ledger. Every verdict we've written, whether it landed, and whether our
            confidence has been worth trusting.
          </div>
        </div>
      </Reveal>

      {/* Headline */}
      <Reveal delay={0.06}>
        <Card style={{ padding: 34, marginTop: 26 }}>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <Eyebrow>Verdicts that landed</Eyebrow>
              <div style={{ ...type.display, fontSize: 54, lineHeight: 1, marginTop: 10,
                color: winRate == null ? T.faint : winRate >= 55 ? T.good : winRate >= 45 ? T.ink : T.bad }}>
                {winRate == null ? '—' : `${winRate}%`}
              </div>
              <div style={{ ...type.small, marginTop: 8 }}>
                {resolved.length === 0
                  ? 'No settled matches yet.'
                  : winRate == null
                  ? `Only ${resolved.length} settled so far — too few to judge honestly.`
                  : `${correct} right out of ${resolved.length} settled${resolved.length < 10 ? ' — still a small sample, take it lightly' : ''}.`}
              </div>
            </div>
            <div>
              <Eyebrow>Verdicts written</Eyebrow>
              <div style={{ ...type.num, fontSize: 28, fontWeight: 600, color: T.ink, marginTop: 10 }}>{entries.length}</div>
            </div>
            <div>
              <Eyebrow>Average pricing edge</Eyebrow>
              <div style={{ ...type.num, fontSize: 28, fontWeight: 600, marginTop: 10,
                color: avgEdge > 0 ? T.good : avgEdge < 0 ? T.bad : T.ink }}>
                {edges.length ? `${avgEdge >= 0 ? '+' : ''}${avgEdge.toFixed(1)}` : '—'}
              </div>
            </div>
          </div>

          {last10.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.line}` }}>
              <Eyebrow style={{ marginBottom: 10 }}>The last {last10.length}, oldest first</Eyebrow>
              <div style={{ display: 'flex', gap: 7 }}>
                {last10.map((e, i) => (
                  <span key={i} title={e.a.correct ? 'Right' : 'Wrong'} style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: e.a.correct ? T.good : T.bad,
                  }} />
                ))}
              </div>
            </div>
          )}
        </Card>
      </Reveal>

      {/* Calibration — plain words */}
      <Reveal>
        <Card style={{ padding: 30, marginTop: 18 }}>
          <Eyebrow>Is our confidence honest?</Eyebrow>
          <div style={{ ...type.small, marginTop: 10 }}>
            When we say we're 70% sure, we should be right about 70% of the time. Here's how that's held up:
          </div>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {buckets.map(b => (
              <div key={b.key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 92px', gap: 12, alignItems: 'center' }}>
                <span style={{ ...type.small, fontWeight: 560, color: T.ink }}>
                  "{b.key}% sure"
                </span>
                <div style={{ height: 6, background: T.card2, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    width: `${b.rate ?? 0}%`, height: '100%',
                    background: b.rate == null ? 'transparent' : T.accent, borderRadius: 999,
                  }} />
                </div>
                <span style={{ ...type.num, fontSize: 13, color: b.rate == null ? T.faint : T.ink, textAlign: 'right' }}>
                  {b.rate == null ? `no data` : `${b.rate}% right`}
                  <span style={{ color: T.faint }}> · {b.n}</span>
                </span>
              </div>
            ))}
          </div>
          {resolved.length < 3 && (
            <div style={{ ...type.small, color: T.faint, marginTop: 14 }}>
              This chart means very little until a handful of matches have settled.
            </div>
          )}
        </Card>
      </Reveal>

      {/* Agent scoreboard */}
      <Reveal>
        <Card style={{ padding: 30, marginTop: 18 }}>
          <Eyebrow>Which of our three angles has been sharpest?</Eyebrow>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {agents.map(row => {
              const s = agentPerf[row.key] || { correct: 0, total: 0 }
              const rate = s.total > 0 ? Math.round(s.correct / s.total * 100) : null
              return (
                <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <span style={{ ...type.small }}>
                    <strong style={{ color: T.ink, fontWeight: 560 }}>{row.label}</strong>
                    <span style={{ color: T.faint }}> — {row.sub}</span>
                  </span>
                  <span style={{ ...type.num, fontSize: 14, fontWeight: 600, flexShrink: 0,
                    color: rate == null ? T.faint : rate >= 60 ? T.good : rate >= 45 ? T.ink : T.bad }}>
                    {rate == null ? 'no data yet' : `${rate}%`}
                    {rate != null && <span style={{ color: T.faint, fontWeight: 400 }}> · {s.correct}/{s.total}</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </Reveal>

      {/* History */}
      <div style={{ marginTop: 36 }}>
        <Reveal><Eyebrow style={{ marginBottom: 14 }}>Every verdict, newest first</Eyebrow></Reveal>
        {entries.length === 0 ? (
          <Card><EmptyNote title="The ledger is empty" hint="Have a match read and it will be recorded here — wins and losses alike." /></Card>
        ) : (
          <Reveal>
            <Card style={{ overflow: 'hidden' }}>
              {entries.map(({ id, a, fx }, idx) => {
                const r = a.recommendation || {}
                const conf = Math.round((r.confidence || 0) * 100)
                const isOpen = openResolve === id
                return (
                  <div key={id} style={{ borderBottom: idx < entries.length - 1 || isOpen ? `1px solid ${T.line}` : 'none' }}>
                    <div className="iq-row"
                      onClick={() => fx && onOpen(fx)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '15px 22px', cursor: fx ? 'pointer' : 'default',
                      }}>
                      <Crest src={fx?.homeLogo} name={fx?.homeTeam || '?'} size={22} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...type.small, fontSize: 14, fontWeight: 560, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fx ? `${fx.homeTeam} v ${fx.awayTeam}` : `Match #${id}`}
                        </div>
                        <div style={{ ...type.small, fontSize: 12, color: T.faint, marginTop: 2 }}>
                          Said {fx ? pickShort(r.pick, fx) : r.pick} · {conf}% sure
                          {a.finalScore ? ` · ended ${a.finalScore}` : ''}
                        </div>
                      </div>
                      {a.resolved ? (
                        <span style={{
                          fontSize: 12, fontWeight: 560, fontFamily: T.sans, flexShrink: 0,
                          color: a.correct ? T.good : T.bad,
                          background: a.correct ? T.goodBg : T.badBg,
                          borderRadius: 999, padding: '4px 12px',
                        }}>{a.correct ? 'Right' : 'Wrong'}</span>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setOpenResolve(isOpen ? null : id) }} style={{
                          background: 'transparent', border: `1px solid ${T.lineHi}`, borderRadius: 999,
                          padding: '4px 13px', cursor: 'pointer', flexShrink: 0,
                          fontFamily: T.sans, fontSize: 12, fontWeight: 560, color: T.sub,
                        }}>Settle</button>
                      )}
                    </div>
                    {isOpen && (
                      <div style={{ padding: '10px 22px 18px', background: T.card2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ ...type.small }}>Was the pick right?</span>
                        <Button kind="soft" style={{ padding: '5px 16px', fontSize: 12, background: T.card }}
                          onClick={() => { onResolve(id, true); setOpenResolve(null) }}>Yes</Button>
                        <Button kind="ghost" style={{ padding: '5px 16px', fontSize: 12 }}
                          onClick={() => { onResolve(id, false); setOpenResolve(null) }}>No</Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </Card>
          </Reveal>
        )}
      </div>
    </div>
  )
}

/* ============================================================
 * AUTH — sign in / sign up (Supabase, Google OAuth + email)
 * ============================================================ */

/* The one deliberately multi-color mark in the app: users trust the familiar
 * Google G, so it keeps its standard colors. Inline SVG, no raster asset. */
const GoogleG = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

function ButtonSpinner({ color = 'currentColor' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 44 44" fill="none" aria-hidden="true"
      style={{ animation: 'iq-think 1s linear infinite', display: 'block' }}>
      <circle cx="22" cy="22" r="18" stroke={color} strokeOpacity="0.25" strokeWidth="5" />
      <path d="M22 4a18 18 0 0114 6.7" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

function AuthInput({ label, type: inputType, value, onChange, autoComplete, disabled }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ ...type.small, fontSize: 12.5, fontWeight: 560, color: T.sub, display: 'block', marginBottom: 7 }}>{label}</span>
      <input type={inputType} value={value} onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete} disabled={disabled} required
        style={{
          width: '100%', background: T.card2, color: T.ink,
          border: `1px solid ${T.line}`, borderRadius: 12, padding: '12px 15px',
          fontFamily: T.sans, fontSize: 15, outline: 'none',
        }} />
    </label>
  )
}

function BackArrow({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Back" style={{
      background: 'transparent', border: 'none', cursor: 'pointer', color: T.faint,
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 0',
      fontFamily: T.sans, fontSize: 14, fontWeight: 500, marginBottom: 18,
    }}><ChevronLeft size={17} strokeWidth={1.8} /> Back</button>
  )
}

function AuthScreen({ mode, onMode, onBack, initialError, onClearInitialError }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(null) // null | 'google' | 'email'
  const [error, setError] = useState(null)
  const [checkEmail, setCheckEmail] = useState(false)

  const shownError = error || initialError

  function switchMode(m) {
    onMode(m); setError(null); setCheckEmail(false)
    onClearInitialError?.()
  }

  async function handleGoogle() {
    setBusy('google'); setError(null); onClearInitialError?.()
    try {
      const { error: err } = await signInWithGoogle()
      if (err) { setError(friendlyAuthError(err.message)); setBusy(null) }
      // On success the browser navigates away — leave the button in its loading state.
    } catch (e) {
      setError(friendlyAuthError(e.message)); setBusy(null)
    }
  }

  async function handleEmail(e) {
    e.preventDefault()
    setBusy('email'); setError(null); onClearInitialError?.()
    try {
      if (mode === 'signup') {
        const { data, error: err } = await signUpWithEmail(email.trim(), password, name.trim())
        if (err) setError(friendlyAuthError(err.message))
        else if (!data?.session) setCheckEmail(true)
        // With a session, onAuthChange moves the user into the app.
      } else {
        const { error: err } = await signInWithEmail(email.trim(), password)
        if (err) setError(friendlyAuthError(err.message))
      }
    } catch (e2) {
      setError(friendlyAuthError(e2.message))
    } finally {
      setBusy(null)
    }
  }

  const busyAny = busy != null

  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
      {onBack && <BackArrow onClick={onBack} />}
      <div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Wordmark size={24} />
        </div>
        <h1 style={{ ...type.display, fontSize: 32, color: T.ink, textAlign: 'center', margin: '0 0 8px' }}>
          {mode === 'signin' ? 'Welcome back.' : 'Create your account'}
        </h1>
        {mode === 'signup' && (
          <div style={{ ...type.small, fontSize: 14.5, textAlign: 'center', marginBottom: 26 }}>
            So your analyses follow you across devices.
          </div>
        )}
        {mode === 'signin' && <div style={{ marginBottom: 18 }} />}

        <Card className="iq-elevated" style={{ padding: 28 }}>
          {checkEmail ? (
            <div style={{ textAlign: 'center', padding: '18px 4px' }}>
              <div style={{ ...type.title, fontSize: 19, color: T.ink }}>Check your email.</div>
              <div style={{ ...type.small, marginTop: 10 }}>
                We've sent a confirmation link to <strong style={{ color: T.ink, fontWeight: 560 }}>{email}</strong>.
                Follow it and you'll land right back here, signed in.
              </div>
              <button onClick={() => switchMode('signin')} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                ...type.small, color: T.accent, fontWeight: 560, marginTop: 18,
              }}>Back to sign in</button>
            </div>
          ) : (
            <>
              <button onClick={handleGoogle} disabled={busyAny} className="iq-lift" style={{
                width: '100%', background: T.card2, color: T.ink,
                border: `1px solid ${T.lineHi}`, borderRadius: 999, padding: '13px 22px',
                fontFamily: T.sans, fontSize: 15, fontWeight: 560,
                cursor: busyAny ? 'default' : 'pointer', opacity: busy === 'email' ? 0.5 : 1,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                {busy === 'google'
                  ? <ButtonSpinner />
                  : <><GoogleG size={18} /> Continue with Google</>}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
                <span style={{ flex: 1, height: 1, background: T.line }} />
                <span style={{ ...type.small, fontSize: 12, color: T.faint }}>or continue with email</span>
                <span style={{ flex: 1, height: 1, background: T.line }} />
              </div>

              <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {mode === 'signup' && (
                  <AuthInput label="Name" type="text" value={name} onChange={setName}
                    autoComplete="name" disabled={busyAny} />
                )}
                <AuthInput label="Email" type="email" value={email} onChange={setEmail}
                  autoComplete="email" disabled={busyAny} />
                <AuthInput label="Password" type="password" value={password} onChange={setPassword}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} disabled={busyAny} />
                <Button kind="primary" disabled={busyAny}
                  style={{ width: '100%', padding: '13px 22px', fontSize: 15, marginTop: 4 }}
                  onClick={() => {}}>
                  {busy === 'email'
                    ? <ButtonSpinner />
                    : mode === 'signin' ? 'Sign in' : 'Create account'}
                </Button>
              </form>

              {shownError && (
                <div role="alert" style={{
                  ...type.small, fontSize: 13.5, color: T.bad, background: T.badBg,
                  borderRadius: 12, padding: '11px 15px', marginTop: 16,
                }}>{shownError}</div>
              )}

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                {mode === 'signin' ? (
                  <button onClick={() => switchMode('signup')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', ...type.small, color: T.sub }}>
                    New here? <span style={{ color: T.accent, fontWeight: 560 }}>Create an account</span>
                  </button>
                ) : (
                  <button onClick={() => switchMode('signin')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', ...type.small, color: T.sub }}>
                    Already have an account? <span style={{ color: T.accent, fontWeight: 560 }}>Sign in</span>
                  </button>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ============================================================
 * ONBOARDING — welcome → how it works → create account
 * ============================================================ */

const LS_ONBOARD = 'matchiq_onboarding_seen'

function WelcomeScreen({ onStart, onSignIn, isMobile }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 440, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', color: T.ink, marginBottom: 36 }}>
        <LogoMark size={40} />
      </div>
      <h1 style={{ ...type.display, fontSize: isMobile ? 36 : 44, color: T.ink, margin: 0 }}>
        Predictions worth trusting
      </h1>
      <div style={{ ...type.body, fontSize: 17, color: T.sub, marginTop: 16 }}>
        AI analysis that shows its reasoning, for football matches happening today.
      </div>
      <div style={{ marginTop: 40 }}>
        <Button onClick={onStart} style={{
          padding: '14px 30px', fontSize: 16,
          width: isMobile ? '100%' : 260,
        }}>Get started</Button>
      </div>
      <button onClick={onSignIn} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        ...type.small, color: T.sub, marginTop: 22,
      }}>
        Already have an account? <span style={{ color: T.accent, fontWeight: 560 }}>Sign in</span>
      </button>
    </div>
  )
}

const HOW_CARDS = [
  ['Three views on every match',
    'Our system reads each match from three angles — form, tactics, and the market — separately, so their disagreements become the most useful part of the analysis.'],
  ['One clear reasoned verdict',
    'A synthesis step weighs those three views and delivers a plain-language recommendation, with the reasoning always visible.'],
  ['Honest about accuracy',
    'Every prediction is tracked against what actually happened. You see the record, not just the confidence.'],
]

function HowItWorksScreen({ onContinue, onBack, isMobile }) {
  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <BackArrow onClick={onBack} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {HOW_CARDS.map(([heading, body]) => (
          <Card key={heading} style={{ padding: 28 }}>
            <div style={{ ...type.title, fontSize: 18, color: T.ink }}>{heading}</div>
            <div style={{ ...type.small, fontSize: 14.5, marginTop: 9 }}>{body}</div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Button onClick={onContinue} style={{
          padding: '14px 30px', fontSize: 16,
          width: isMobile ? '100%' : 260,
        }}>Continue</Button>
      </div>
    </div>
  )
}

/* Routes the signed-out experience. First-time visitors walk welcome → how →
 * sign up; anyone who has signed in before (LS_ONBOARD set) goes straight to
 * sign in. Screens hand off with a gentle 250ms fade-and-slide. */
function OnboardingFlow({ theme, initialError, onClearInitialError }) {
  const isMobile = useWindowWidth() < 768
  const [stage, setStage] = useState(() =>
    (typeof window !== 'undefined' && window.localStorage.getItem(LS_ONBOARD) === 'true') ? 'signin' : 'welcome')

  return (
    <div data-theme={theme} style={{
      minHeight: '100dvh', width: '100%', display: 'grid', placeItems: 'center',
      padding: '32px 20px', position: 'relative', zIndex: 1, overflow: 'hidden',
    }}>
      <GlobalStyles />
      <AnimatePresence mode="wait">
        <motion.div key={stage}
          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ width: '100%' }}>
          {stage === 'welcome' && (
            <WelcomeScreen isMobile={isMobile}
              onStart={() => setStage('how')} onSignIn={() => setStage('signin')} />
          )}
          {stage === 'how' && (
            <HowItWorksScreen isMobile={isMobile}
              onContinue={() => setStage('signup')} onBack={() => setStage('welcome')} />
          )}
          {(stage === 'signin' || stage === 'signup') && (
            <AuthScreen mode={stage} onMode={setStage}
              onBack={stage === 'signup' ? () => setStage('how') : undefined}
              initialError={initialError} onClearInitialError={onClearInitialError} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ============================================================
 * PROFILE — identity, record, preferences, sign out
 * ============================================================ */

function Avatar({ user, size = 28 }) {
  const [failed, setFailed] = useState(false)
  const url = user?.user_metadata?.avatar_url
  const initial = (user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || '?')
    .trim().charAt(0).toUpperCase() || '?'
  if (url && !failed) {
    return (
      <img src={url} alt="" onError={() => setFailed(true)} referrerPolicy="no-referrer" style={{
        width: size, height: size, borderRadius: '50%', objectFit: 'cover',
        display: 'block', border: `1px solid ${T.line}`,
      }} />
    )
  }
  return (
    <span className="iq-glass" style={{
      width: size, height: size, borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: T.card2, border: `1px solid ${T.line}`,
      color: T.accent, fontFamily: T.sans, fontWeight: 650, fontSize: Math.round(size * 0.42),
    }}>{initial}</span>
  )
}

function Toggle({ on, onChange }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} style={{
      width: 46, height: 28, borderRadius: 999, flexShrink: 0,
      border: `1px solid ${on ? 'transparent' : T.lineHi}`,
      background: on ? T.accent : T.card2, cursor: 'pointer', position: 'relative', padding: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 19 : 2, width: 22, height: 22,
        borderRadius: '50%', background: on ? T.accentInk : T.sub,
        transition: `left 200ms ${T.ease}, background 200ms ${T.ease}`,
      }} />
    </button>
  )
}

function Segmented({ value, options, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3, background: T.card2, borderRadius: 999, padding: 3 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          background: value === o.value ? T.card : 'transparent',
          color: value === o.value ? T.ink : T.sub,
          border: 'none', boxShadow: value === o.value ? T.shadow : 'none',
          borderRadius: 999, padding: '6px 14px', cursor: 'pointer',
          fontFamily: T.sans, fontSize: 12.5, fontWeight: value === o.value ? 600 : 480,
        }}>{o.label}</button>
      ))}
    </div>
  )
}

function ProfileScreen({
  user, analysisCache, themeMode, onThemeMode,
  emailNotifications, onEmailNotifications, onSignOut, isMobile,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || ''
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  /* Everything below is computed from the real analysis cache — no invented numbers */
  const entries = Object.values(analysisCache)
  const total = entries.length
  const uniqueMatches = new Set(Object.keys(analysisCache)).size
  const resolved = entries.filter(a => a.resolved)
  const correct = resolved.filter(a => a.correct).length
  const accuracy = resolved.length ? Math.round((correct / resolved.length) * 100) : 0
  const confs = entries.map(a => a.recommendation?.confidence).filter(c => typeof c === 'number')
  const avgConf = confs.length ? Math.round((confs.reduce((s, c) => s + c, 0) / confs.length) * 100) : null
  let bestStreak = 0
  {
    let run = 0
    resolved.slice().sort((a, b) => (a.resolvedAt || a._ts || 0) - (b.resolvedAt || b._ts || 0))
      .forEach(a => { if (a.correct) { run += 1; if (run > bestStreak) bestStreak = run } else run = 0 })
  }

  const deleteHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Delete my account')}&body=${encodeURIComponent(`Please delete my MatchIQ account associated with ${user?.email || ''}`)}`

  const StatCard = ({ big, bigColor = T.ink, bigSize = 40, context }) => (
    <Card style={{ padding: 26 }}>
      <div style={{ ...type.display, fontSize: bigSize, color: bigColor, fontVariantNumeric: 'tabular-nums' }}>{big}</div>
      <div style={{ ...type.small, fontSize: 13, marginTop: 8 }}>{context}</div>
    </Card>
  )

  const prefRow = { minHeight: isMobile ? 48 : 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      {/* Identity */}
      <Reveal>
        <div style={{ textAlign: 'center', padding: isMobile ? '40px 0' : '64px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar user={user} size={isMobile ? 80 : 96} />
          </div>
          <div style={{ ...type.display, fontSize: isMobile ? 28 : 34, color: T.ink, marginTop: 20 }}>{displayName}</div>
          <div style={{ ...type.small, fontSize: 14, marginTop: 8 }}>{user?.email}</div>
          {memberSince && (
            <span style={{
              display: 'inline-block', marginTop: 14, ...type.small, fontSize: 12, color: T.faint,
              border: `1px solid ${T.line}`, borderRadius: 999, padding: '5px 14px',
            }}>Member since {memberSince}</span>
          )}
        </div>
      </Reveal>

      {/* Record */}
      <Reveal>
        <Eyebrow style={{ marginBottom: 14 }}>Your record</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <StatCard big={total} context={`across ${uniqueMatches} ${uniqueMatches === 1 ? 'match' : 'matches'}`} />
          {resolved.length < 5 ? (
            <StatCard big="Building a record" bigSize={22} bigColor={T.ink}
              context={`${resolved.length} of 5 resolved`} />
          ) : (
            <StatCard big={`${accuracy}%`} bigColor={accuracy >= 50 ? T.accent : T.sub}
              context={`${correct} correct out of ${resolved.length} resolved.`} />
          )}
          <StatCard big={avgConf != null ? `${avgConf}%` : '—'} context="across your analyses." />
          <StatCard big={bestStreak}
            context={bestStreak > 0 ? 'consecutive correct calls.' : 'Track a match to start.'} />
        </div>
      </Reveal>

      {/* Preferences */}
      <Reveal>
        <div style={{ marginTop: 40 }}>
          <Eyebrow style={{ marginBottom: 10 }}>Preferences</Eyebrow>
          <Card style={{ padding: '6px 24px' }}>
            <div style={{ ...prefRow, borderBottom: `1px solid ${T.line}` }}>
              <span style={{ ...type.small, fontSize: 14.5, color: T.ink, fontWeight: 540 }}>Theme</span>
              <Segmented value={themeMode} onChange={onThemeMode} options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]} />
            </div>
            <div style={{ padding: '12px 0 16px' }}>
              <div style={{ ...prefRow, minHeight: 'auto' }}>
                <span style={{ ...type.small, fontSize: 14.5, color: T.ink, fontWeight: 540 }}>Email notifications</span>
                <Toggle on={emailNotifications} onChange={onEmailNotifications} />
              </div>
              <div style={{ ...type.small, fontSize: 12.5, color: T.faint, marginTop: 8 }}>
                We'll email you when a tracked match kicks off. Coming soon.
              </div>
            </div>
          </Card>
        </div>
      </Reveal>

      {/* Sign out / delete */}
      <Reveal>
        <div style={{ marginTop: 48, paddingBottom: 24 }}>
          <button onClick={onSignOut} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: T.sans, fontSize: 15, fontWeight: 560, color: T.sub,
          }}>Sign out</button>
          <div style={{ marginTop: 18 }}>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                fontFamily: T.sans, fontSize: 13, color: T.faint, textDecoration: 'underline',
              }}>Delete account</button>
            ) : (
              <Card style={{ padding: 22, marginTop: 6 }}>
                <div style={{ ...type.small, fontSize: 14, color: T.ink, fontWeight: 540 }}>
                  This permanently deletes your data. Are you sure?
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  <Button kind="soft" onClick={() => setConfirmDelete(false)}
                    style={{ padding: '8px 20px', fontSize: 13.5 }}>Cancel</Button>
                  <a href={deleteHref} style={{ textDecoration: 'none' }}>
                    <Button kind="danger" onClick={() => {}}
                      style={{ padding: '8px 20px', fontSize: 13.5 }}>Delete permanently</Button>
                  </a>
                </div>
                <div style={{ ...type.small, fontSize: 12, color: T.faint, marginTop: 12 }}>
                  This opens your mail app with a deletion request — we handle it within a few days.
                </div>
              </Card>
            )}
          </div>
        </div>
      </Reveal>
    </div>
  )
}

/* ============================================================
 * ABOUT
 * ============================================================ */

function AboutScreen({ apiStatus, user, onSignOut, onOpenProfile }) {
  const statuses = [
    { key: 'football', name: 'Match data' },
    { key: 'odds', name: 'Betting prices' },
    { key: 'analysis', name: 'Analysis engine' },
  ]
  const statusWord = (s) => s === 'operational' ? 'Working' : s === 'degraded' ? 'Having trouble' : 'Not checked yet'
  const statusColor = (s) => s === 'operational' ? T.good : s === 'degraded' ? T.bad : T.faint

  const SocialTile = ({ href, Icon, label }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="iq-lift" style={{
      display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
      background: T.card2, borderRadius: 14,
      padding: '13px 18px', color: T.ink, flex: 1, minWidth: 130,
      fontFamily: T.sans, fontSize: 13.5, fontWeight: 560,
    }}>
      <Icon size={16} /> {label}
    </a>
  )

  return (
    <div style={{ maxWidth: 620 }}>
      <Reveal>
        <div style={{ padding: '28px 0 8px' }}>
          <div style={{ ...type.display, fontSize: 38, color: T.ink }}>About MatchIQ.</div>
          <p style={{ ...type.body, fontSize: 17, color: T.sub, marginTop: 14, marginBottom: 0 }}>
            MatchIQ reads football matches the way a careful analyst would — from three independent
            angles at once. One looks at <em>form</em>, one at the <em>history between the teams</em>,
            and one at what the <em>betting market</em> believes. When those angles disagree, that's
            often the most interesting thing we can tell you — so we never hide it.
          </p>
        </div>
      </Reveal>

      {user && (
        <Reveal delay={0.04}>
          <Card style={{ padding: 30, marginTop: 26 }}>
            <Eyebrow>Your account</Eyebrow>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 14, marginTop: 14, flexWrap: 'wrap',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ ...type.small, fontSize: 14.5, fontWeight: 560, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
                <div style={{ ...type.small, fontSize: 12.5, color: T.faint, marginTop: 3 }}>
                  Your follows, verdicts and theme sync to this account.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button kind="soft" onClick={onOpenProfile} style={{ padding: '8px 20px', fontSize: 13.5 }}>
                  View profile
                </Button>
                <Button kind="ghost" onClick={onSignOut} style={{ padding: '8px 20px', fontSize: 13.5 }}>
                  Sign out
                </Button>
              </div>
            </div>
          </Card>
        </Reveal>
      )}

      <Reveal delay={0.06}>
        <Card style={{ padding: 30, marginTop: 26 }}>
          <Eyebrow>Made by</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
            <span style={{
              width: 48, height: 48, borderRadius: '50%', background: T.accentBg, color: T.accent,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.sans, fontSize: 16, fontWeight: 650,
            }}>BA</span>
            <div>
              <div style={{ ...type.body, fontWeight: 600 }}>Bright Agwunobi</div>
              <div style={{ ...type.small, color: T.faint }}>Final-year Computer Science · AAUA</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <SocialTile href={SOCIAL_LINKS.github} Icon={Github} label="GitHub" />
            <SocialTile href={SOCIAL_LINKS.linkedin} Icon={Linkedin} label="LinkedIn" />
            <SocialTile href={SOCIAL_LINKS.x} Icon={XSocial} label="X" />
            <SocialTile href={SOCIAL_LINKS.email} Icon={Mail} label="Email" />
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <Card style={{ padding: 30, marginTop: 18 }}>
          <Eyebrow>Say hello</Eyebrow>
          {[
            ['Send feedback', mailto('MatchIQ Feedback')],
            ['Report a bug', mailto('MatchIQ Bug Report')],
            ['Suggest a feature', mailto('MatchIQ Feature Request')],
          ].map(([t, href]) => (
            <a key={t} href={href} className="iq-row" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '13px 4px', textDecoration: 'none',
              borderBottom: `1px solid ${T.line}`, color: T.ink,
              fontFamily: T.sans, fontSize: 14.5, fontWeight: 520,
            }}>
              {t} <ArrowUpRight size={15} strokeWidth={1.8} style={{ color: T.faint }} />
            </a>
          ))}
          <div style={{ ...type.small, color: T.faint, marginTop: 14 }}>{CONTACT_EMAIL}</div>
        </Card>
      </Reveal>

      <Reveal>
        <Card style={{ padding: 30, marginTop: 18 }}>
          <Eyebrow>Is everything working?</Eyebrow>
          <div style={{ marginTop: 12 }}>
            {statuses.map(s => (
              <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', alignItems: 'center' }}>
                <span style={{ ...type.small, fontSize: 14, color: T.ink }}>{s.name}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...type.small }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(apiStatus[s.key]) }} />
                  {statusWord(apiStatus[s.key])}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <div style={{ marginTop: 36, color: T.faint }}>
          <Wordmark size={26} />
        </div>
        <div style={{ ...type.small, color: T.faint, marginTop: 14, lineHeight: 1.8 }}>
          Data: football-data.org and the-odds-api.com · Analysis: Groq (llama-3.3-70b-versatile)<br />
          <a href={mailto('Privacy Policy Request')} style={{ color: T.sub }}>Privacy</a> · {' '}
          <a href={mailto('Terms of Service Request')} style={{ color: T.sub }}>Terms</a><br />
          © 2026 MatchIQ · Bright Agwunobi. This is analysis, not financial advice — bet only what
          you'd be at peace losing.
        </div>
      </Reveal>
    </div>
  )
}

/* ============================================================
 * Dev-only diagnostics — never ships to users
 * ============================================================ */

function DiagnosticPanel({ apiHealth, open, onToggle, onRetryFootball, onRetryOdds }) {
  if (!import.meta.env.DEV) return null
  const fmtAt = (ts) => ts ? new Date(ts).toLocaleTimeString('en-GB', { hour12: false }) : '—'
  if (!open) {
    return (
      <button onClick={onToggle} title="Show API diagnostics" style={{
        position: 'fixed', bottom: 84, right: 12, zIndex: 200,
        background: T.card, color: T.sub, border: `1px solid ${T.lineHi}`,
        borderRadius: 999, padding: '6px 12px', fontFamily: T.mono, fontSize: 10,
        fontWeight: 600, cursor: 'pointer', boxShadow: T.shadow,
      }}>DIAG</button>
    )
  }
  const row = (name, h, retry, extra) => (
    <div key={name} style={{
      display: 'grid', gridTemplateColumns: '80px 40px 1fr auto auto', gap: 10,
      alignItems: 'center', padding: '6px 12px', borderTop: `1px solid ${T.line}`,
      fontFamily: T.mono, fontSize: 11,
    }}>
      <span style={{ color: T.ink, fontWeight: 600 }}>{name}</span>
      <span style={{ color: T.sub }}>{h.code ?? '—'}</span>
      <span style={{ color: T.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.msg || ''}>
        {h.msg || 'no request yet'}{extra ? ` · ${extra}` : ''}
      </span>
      <span style={{ color: T.faint }}>{fmtAt(h.at)}</span>
      {retry ? (
        <button onClick={retry} style={{
          background: 'transparent', border: `1px solid ${T.lineHi}`, color: T.sub,
          borderRadius: 6, padding: '2px 8px', fontFamily: T.mono, fontSize: 10, cursor: 'pointer',
        }}>RETRY</button>
      ) : <span />}
    </div>
  )
  return (
    <div style={{
      position: 'fixed', left: 12, right: 12, bottom: 84, zIndex: 200, maxWidth: 640,
      margin: '0 auto', background: T.card, border: `1px solid ${T.lineHi}`,
      borderRadius: 12, boxShadow: T.shadowLg,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: '0.12em' }}>API DIAGNOSTICS</span>
        <button onClick={onToggle} aria-label="Hide diagnostics" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.sub, display: 'inline-flex', padding: 4 }}><XIcon size={12} strokeWidth={2} /></button>
      </div>
      {row('FOOTBALL', apiHealth.football, onRetryFootball, apiHealth.football.count != null ? `${apiHealth.football.count} fixtures` : null)}
      {row('ODDS', apiHealth.odds, onRetryOdds, apiHealth.odds.remaining != null ? `${apiHealth.odds.remaining} credits left` : (apiHealth.odds.count != null ? `${apiHealth.odds.count} events` : null))}
      {row('GROQ', apiHealth.analysis, null, null)}
    </div>
  )
}

/* ============================================================
 * Root — auth gate wraps the app; MatchIQ's logic is preserved
 * ============================================================ */

export default function AuthRoot() {
  const [theme] = useTheme()
  const { user, loading, authError, setAuthError } = useAuth()

  // Once signed in (any method), onboarding never replays — sign-outs land on sign in.
  useEffect(() => {
    if (user) window.localStorage.setItem(LS_ONBOARD, 'true')
  }, [user])

  // Without Supabase keys the app runs un-gated, exactly as before.
  if (!authConfigured) return <MatchIQ />

  if (loading) {
    return (
      <div data-theme={theme} style={{ minHeight: '100dvh', width: '100%', display: 'grid', placeItems: 'center' }}>
        <GlobalStyles />
        <ButtonSpinner color="var(--iq-accent)" />
      </div>
    )
  }

  if (!user) {
    return <OnboardingFlow theme={theme} initialError={authError}
      onClearInitialError={() => setAuthError(null)} />
  }

  return <MatchIQ user={user} />
}

function MatchIQ({ user }) {
  const width = useWindowWidth()
  const isMobile = width < 768

  const [theme, toggleTheme, setThemeMode, themeMode] = useTheme()
  const [emailNotifications, setEmailNotifications] = useState(false)

  const [oddsCache, setOddsCache] = useState([])
  const [oddsUpdatedAt, setOddsUpdatedAt] = useState(null)
  const [oddsQuotaRemaining, setOddsQuotaRemaining] = useState(null)

  const [standingsCache, setStandingsCache] = useState({})
  const [scorersCache, setScorersCache] = useState({})
  const [compDetailsCache, setCompDetailsCache] = useState({})

  const [activeTab, setActiveTab] = useState('matches')
  const { apiStatus, apiHealth, setStatus, setHealth } = useApiHealth()
  const { fixtures, fixturesLoading, fixturesError, loadFixtures, h2hCache, loadH2H } =
    useFixtures({ setStatus, setHealth })

  const [diagOpen, setDiagOpen] = useState(() => readRaw(LS_DIAG_OPEN) !== '0')
  useEffect(() => { writeRaw(LS_DIAG_OPEN, diagOpen ? '1' : '0') }, [diagOpen])

  const [comboSelections, setComboSelections] = useState([])
  const [agentPerf, setAgentPerf] = useState(() => readJSON(LS_AGENT_PERF, AGENT_PERF_EMPTY))

  function toggleCombo(id) {
    setComboSelections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function clearCombo() { setComboSelections([]) }

  const [selected, setSelected] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [analysisCache, setAnalysisCache] = useState(() => readJSON(LS_ANALYSIS, {}))
  const [tracked, setTracked] = useState(() => new Set(readJSON(LS_TRACKED, [])))

  useEffect(() => { writeJSON(LS_ANALYSIS, analysisCache) }, [analysisCache])
  useEffect(() => { writeJSON(LS_AGENT_PERF, agentPerf) }, [agentPerf])

  // Auto-resolve finished fixtures against cached analyses
  useEffect(() => {
    if (!fixtures.length) return
    const byId = Object.fromEntries(fixtures.map(f => [f.id, f]))
    let changed = false
    const next = { ...analysisCache }
    let perf = agentPerf
    for (const [id, a] of Object.entries(analysisCache)) {
      if (a.resolved) continue
      const fx = byId[id]
      if (!fx) continue
      const resolved = autoResolve(a, fx)
      if (resolved) { next[id] = resolved; changed = true; perf = updateAgentPerformance(perf, resolved) }
    }
    if (changed) { setAnalysisCache(next); setAgentPerf(perf) }
  }, [fixtures])

  function resolveManual(id, correct) {
    setAnalysisCache(prev => {
      const a = prev[id]
      if (!a) return prev
      return {
        ...prev,
        [id]: { ...a, resolved: true, autoResolved: false, correct, resolvedAt: Date.now() },
      }
    })
  }

  useEffect(() => { writeJSON(LS_TRACKED, Array.from(tracked)) }, [tracked])

  /* -------- account sync — pull once on sign-in, then debounced push -------- */
  const trackedArr = useMemo(() => Array.from(tracked), [tracked])
  useUserData(user, { tracked: trackedArr, analysisCache, agentPerf, theme, emailNotifications }, (row) => {
    if (row.theme === 'light' || row.theme === 'dark') setThemeMode(row.theme)
    if (typeof row.email_notifications === 'boolean') setEmailNotifications(row.email_notifications)
    if (Array.isArray(row.tracked) && row.tracked.length) {
      setTracked(prev => new Set([...prev, ...row.tracked]))
    }
    if (row.analysis_cache && typeof row.analysis_cache === 'object') {
      // Local entries win per fixture — they're at least as fresh as the remote copy.
      setAnalysisCache(prev => ({ ...row.analysis_cache, ...prev }))
    }
    if (row.agent_perf && typeof row.agent_perf === 'object' && Object.keys(row.agent_perf).length) {
      setAgentPerf(prev => {
        const localTotal = Object.values(prev || {}).reduce((s, v) => s + (v?.total || 0), 0)
        return localTotal > 0 ? prev : row.agent_perf
      })
    }
  })

  useEffect(() => {
    const k = import.meta.env.VITE_GROQ_API_KEY || ''
    console.log('VITE_GROQ_API_KEY prefix:', k ? k.slice(0, 8) + '…' : '(missing)')
  }, [])

  /* -------- competition enrichment trigger -------- */
  const compLoadedRef = useRef('')
  useEffect(() => {
    if (!fixtures.length) return
    const key = [...new Set(fixtures.map(f => f.competitionCode).filter(Boolean))].sort().join(',')
    if (!key || key === compLoadedRef.current) return
    compLoadedRef.current = key
    loadCompetitionData(fixtures)
  }, [fixtures])

  /* -------- odds -------- */
  async function loadOdds() {
    try {
      let lastRemaining = null
      let lastCode = null
      let lastMsg = null
      const results = await Promise.allSettled(
        ODDS_SPORTS.map(async (sport) => {
          const res = await fetch(
            `/api/odds/v4/sports/${sport}/odds/?regions=uk&markets=h2h&oddsFormat=decimal`,
          )
          const rem = res.headers.get('x-requests-remaining')
          if (rem != null) { lastRemaining = rem; console.log(`[odds-api] ${sport} x-requests-remaining:`, rem) }
          lastCode = res.status
          if (!res.ok) {
            try {
              const errBody = await res.json()
              lastMsg = errBody?.message || `HTTP ${res.status}`
            } catch { lastMsg = `HTTP ${res.status}` }
            return []
          }
          const data = await res.json()
          return Array.isArray(data) ? data : []
        })
      )
      const flat = []
      results.forEach(r => { if (r.status === 'fulfilled') flat.push(...r.value) })
      console.log('odds cache size:', flat.length)
      if (lastRemaining != null) setOddsQuotaRemaining(lastRemaining)
      setOddsCache(flat)
      setOddsUpdatedAt(Date.now())
      const healthy = flat.length > 0
      setStatus('odds', healthy ? 'operational' : 'degraded')
      setHealth('odds', {
        code: lastCode,
        msg: healthy ? `OK · ${flat.length} events` : (lastMsg || 'No events returned'),
        count: flat.length,
        at: Date.now(),
        remaining: lastRemaining,
      })
    } catch (err) {
      console.error('odds fetch failed:', err)
      setStatus('odds', 'degraded')
      setHealth('odds', { code: null, msg: `Network: ${err.message}`, count: null, at: Date.now(), remaining: null })
    }
  }

  /* -------- competition enrichment (standings, scorers, details) -------- */
  async function loadCompetitionData(fixturesList) {
    const codes = [...new Set(fixturesList.map(f => f.competitionCode).filter(Boolean))].slice(0, 6)
    for (const code of codes) {
      await delay(300)
      try {
        const [detRes, stRes, scRes] = await Promise.allSettled([
          fetch(`/api/football/v4/competitions/${code}`),
          fetch(`/api/football/v4/competitions/${code}/standings`),
          fetch(`/api/football/v4/competitions/${code}/scorers?limit=10`),
        ])
        if (detRes.status === 'fulfilled' && detRes.value.ok) {
          const d = await detRes.value.json()
          setCompDetailsCache(prev => ({ ...prev, [code]: d }))
        }
        if (stRes.status === 'fulfilled' && stRes.value.ok) {
          const d = await stRes.value.json()
          setStandingsCache(prev => ({ ...prev, [code]: d.standings || [] }))
        }
        if (scRes.status === 'fulfilled' && scRes.value.ok) {
          const d = await scRes.value.json()
          setScorersCache(prev => ({ ...prev, [code]: d.scorers || [] }))
        }
      } catch (e) {
        console.warn(`[comp ${code}] enrichment failed:`, e.message)
      }
    }
  }

  useEffect(() => {
    loadFixtures()
    loadOdds()
  }, [])

  /* -------- selection + analysis -------- */
  async function openFixture(fixture) {
    let f = fixture
    const found = lookupOddsForFixture(fixture, oddsCache)
    if (found) f = { ...fixture, ...found }
    const cachedH2h = h2hCache[f.id]
    if (cachedH2h) f = { ...f, h2h: cachedH2h }
    setSelected(f)
    setError(null)
    window.scrollTo({ top: 0 })
    if (analysisCache[f.id]) {
      setAnalysis(analysisCache[f.id])
      if (!cachedH2h) {
        const h2h = await loadH2H(f)
        if (h2h) setSelected(prev => (prev && prev.id === f.id ? { ...prev, h2h } : prev))
      }
      return
    }
    setAnalysis(null)
    if (!cachedH2h) {
      const h2h = await loadH2H(f)
      if (h2h) setSelected(prev => (prev && prev.id === f.id ? { ...prev, h2h } : prev))
    }
    // No auto-fire — the user asks for the reading from the preview.
  }

  async function runAnalysis(fx) {
    setLoading(true); setError(null); setAnalysis(null)
    try {
      const res = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: buildPrompt(fx) },
            ],
            max_tokens: 1500,
            temperature: 0.75,
            top_p: 0.9,
          }),
        },
      )
      const data = await res.json()
      console.log('Groq response:', JSON.stringify(data, null, 2))
      const raw = data.choices?.[0]?.message?.content || ''
      const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      const noFences = noThink.replace(/```json|```/g, '').trim()
      const first = noFences.indexOf('{')
      const last = noFences.lastIndexOf('}')
      if (first === -1 || last === -1) throw new Error('No JSON object found in model output')
      const jsonSlice = noFences.slice(first, last + 1)
      const parsed = JSON.parse(jsonSlice)
      parsed._ts = Date.now()
      parsed.kelly = calculateKelly(parsed, fx)
      parsed.fixtureId = fx.id
      parsed.competitionCode = fx.competitionCode
      setAnalysis(parsed)
      setAnalysisCache(prev => ({ ...prev, [fx.id]: parsed }))
      setStatus('analysis', 'operational')
      setHealth('analysis', { code: 200, msg: `OK · ${fx.homeTeam} vs ${fx.awayTeam}`, at: Date.now() })

      // Fire multi-market in background (fire-and-forget)
      runMultiMarketAnalysis(fx, parsed).then(multi => {
        if (multi && multi.length) {
          const enriched = { ...parsed, multiMarket: multi }
          setAnalysis(a => a && a.fixtureId === fx.id ? enriched : a)
          setAnalysisCache(prev => ({ ...prev, [fx.id]: enriched }))
        }
      }).catch(e => console.warn('multi-market failed:', e.message))
    } catch (e) {
      console.error('groq call failed:', e)
      setError(e.message || 'Analysis failed.')
      setStatus('analysis', 'degraded')
      setHealth('analysis', { code: null, msg: e.message || 'Groq call failed', at: Date.now() })
    } finally {
      setLoading(false)
    }
  }

  function toggleTracked(id) {
    setTracked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function switchTab(t) {
    setActiveTab(t)
    setSelected(null); setAnalysis(null); setError(null)
    window.scrollTo({ top: 0 })
  }

  const liveCount = fixtures.filter(f => f.status === 'LIVE' || f.status === 'IN_PLAY').length

  function renderTab() {
    if (selected) {
      return (
        <MatchDetail
          fixture={selected} data={analysis} loading={loading} error={error}
          onBack={() => { setSelected(null); setAnalysis(null); setError(null) }}
          onRetry={() => runAnalysis(selected)}
          onAnalyze={() => runAnalysis(selected)}
          tracked={tracked.has(selected.id)}
          onToggleTrack={toggleTracked}
        />
      )
    }
    if (activeTab === 'matches') return (
      <MatchesScreen
        fixtures={fixtures} fixturesLoading={fixturesLoading} fixturesError={fixturesError}
        onRetry={loadFixtures}
        analysisCache={analysisCache} tracked={tracked}
        onOpen={openFixture} onToggleTrack={toggleTracked}
        standingsCache={standingsCache} scorersCache={scorersCache} compDetailsCache={compDetailsCache}
      />
    )
    if (activeTab === 'bets') return (
      <BestBetsScreen
        fixtures={fixtures} analysisCache={analysisCache} onOpen={openFixture}
        comboSelections={comboSelections} onToggleCombo={toggleCombo} onClearCombo={clearCombo}
      />
    )
    if (activeTab === 'following') return (
      <FollowingScreen
        fixtures={fixtures} tracked={tracked} analysisCache={analysisCache}
        onOpen={openFixture} onToggleTrack={toggleTracked}
        onGoMatches={() => switchTab('matches')} onResolve={resolveManual}
      />
    )
    if (activeTab === 'record') return (
      <RecordScreen fixtures={fixtures} analysisCache={analysisCache}
        agentPerf={agentPerf} onResolve={resolveManual} onOpen={openFixture} />
    )
    if (activeTab === 'profile') return (
      <ProfileScreen user={user} analysisCache={analysisCache} isMobile={isMobile}
        themeMode={themeMode} onThemeMode={setThemeMode}
        emailNotifications={emailNotifications} onEmailNotifications={setEmailNotifications}
        onSignOut={async () => { try { await signOut() } catch (e) { console.warn('sign out failed:', e.message) } }} />
    )
    if (activeTab === 'about') return (
      <AboutScreen apiStatus={apiStatus} user={user} onOpenProfile={() => switchTab('profile')}
        onSignOut={async () => { try { await signOut() } catch (e) { console.warn('sign out failed:', e.message) } }} />
    )
    return null
  }

  const screenKey = selected ? `match-${selected.id}` : activeTab

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <GlobalStyles />
      <Header theme={theme} onToggleTheme={toggleTheme}
        tab={activeTab} onTab={switchTab} isMobile={isMobile} liveCount={liveCount}
        user={user} onOpenProfile={() => switchTab('profile')} />
      <main style={{
        maxWidth: 720, margin: '0 auto',
        padding: isMobile ? '18px 20px 100px' : '28px 28px 88px',
      }}>
        <AnimatePresence mode="wait">
          <motion.div key={screenKey}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>
      {isMobile && <MobileNav tab={activeTab} onTab={switchTab} />}
      <DiagnosticPanel
        apiHealth={apiHealth} open={diagOpen} onToggle={() => setDiagOpen(o => !o)}
        onRetryFootball={() => loadFixtures()} onRetryOdds={() => loadOdds()}
      />
    </div>
  )
}
