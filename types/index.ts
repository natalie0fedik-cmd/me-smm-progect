export interface BrandProfile {
  brandName: string
  tagline: string
  niche: string
  mission: string
  vision: string
  values: string
  audience: string
  uvp: string
  toneOfVoice: string
  instagram: string
  tiktok: string
  facebook: string
  youtube: string
  website: string
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
