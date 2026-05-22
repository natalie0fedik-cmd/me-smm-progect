export interface BrandProfile {
  // 1. Хто я
  brandName: string
  services: string
  geography: string
  prices: string

  // 2. Місія, візія, цінності
  mission: string
  vision: string
  values: string

  // 3. Архетипи, вороги, кити
  archetypes: string
  enemies: string
  pillars: string

  // 4. УЦП і ключовий меседж
  uvp: string
  keyMessage: string

  // 5. Tone of Voice
  toneOfVoice: string

  // 6. БІО профілю і хайлайтси
  bioProfile: string
  highlights: string
  instagram: string
  tiktok: string
  facebook: string
  youtube: string
  website: string

  // 7. Конкуренти (JSON: Competitor[])
  competitors: string
}

export interface Goal {
  id: string
  title: string
  target: number
  current: number
  unit: string
  deadline: string
}

export interface Rubric {
  id: string
  name: string
  color: string
  pct: number
  desc: string
}

export interface StrategyData {
  goals: Goal[]
  rubrics: Rubric[]
  paid: string
  organic: string
  funnel: string
}

export type CalEventType = 'task' | 'publication'

export interface CalEvent {
  id: string
  title: string
  date: string
  time: string
  type: CalEventType
  platform: string
  format: string
  notes: string
}

export interface PostData {
  id: string
  date: string
  platform: string
  format: string
  title: string
  reach: string
  views: string
  likes: string
  comments: string
  saves: string
  shares: string
  er: string
  notes: string
}

export interface SubEntry {
  id: string
  date: string
  count: string
}

export type ClientStatus = 'active' | 'paused' | 'ended'

export interface Client {
  id: string
  name: string
  niche: string
  pkg: string
  status: ClientStatus
  start: string
  notes: string
}

export interface Competitor {
  id: string
  name: string
  strengths: string
  weaknesses: string
  diff: string
}
