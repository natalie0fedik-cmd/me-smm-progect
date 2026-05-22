import type { BrandProfile, StrategyData, CalEvent, PostData, SubEntry, Client } from '@/types'

export const K = {
  prof: 'bp_profile',
  strat: 'bp_strategy',
  cal: 'bp_calendar',
  posts: 'bp_posts',
  subs: 'bp_subs',
  clients: 'bp_clients',
  nav: 'bp_nav',
}

export function ld<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const r = localStorage.getItem(key)
    return r ? JSON.parse(r) : fallback
  } catch {
    return fallback
  }
}

export const sv = (key: string, val: unknown) =>
  localStorage.setItem(key, JSON.stringify(val))

export const DP: BrandProfile = {
  brandName: '', tagline: '', niche: '', mission: '', vision: '',
  values: '', audience: '', uvp: '', toneOfVoice: '',
  instagram: '', tiktok: '', facebook: '', youtube: '', website: '',
}

export const DS: StrategyData = {
  goals: [], rubrics: [], paid: '', organic: '', funnel: '',
}

export function exportBackup(): void {
  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    profile: localStorage.getItem(K.prof),
    strategy: localStorage.getItem(K.strat),
    calendar: localStorage.getItem(K.cal),
    posts: localStorage.getItem(K.posts),
    subs: localStorage.getItem(K.subs),
    clients: localStorage.getItem(K.clients),
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `brand-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importBackup(json: string): { ok: boolean; error?: string } {
  try {
    const b = JSON.parse(json)
    if (!b || typeof b !== 'object') return { ok: false, error: 'Невірний формат' }
    if (b.profile) localStorage.setItem(K.prof, b.profile)
    if (b.strategy) localStorage.setItem(K.strat, b.strategy)
    if (b.calendar) localStorage.setItem(K.cal, b.calendar)
    if (b.posts) localStorage.setItem(K.posts, b.posts)
    if (b.subs) localStorage.setItem(K.subs, b.subs)
    if (b.clients) localStorage.setItem(K.clients, b.clients)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Помилка читання файлу' }
  }
}
