import { Project, ProjectData, EMPTY_PROJECT_DATA, CalendarEvent, PostMetric } from '@/types'

const STORAGE_KEY = 'smm_projects'
const CALENDAR_KEY = 'smm_calendar_events'
const POST_METRICS_KEY = 'smm_post_metrics'

export function getPostMetrics(projectId: string): PostMetric[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(POST_METRICS_KEY)
    if (!raw) return []
    const all: PostMetric[] = JSON.parse(raw)
    return all.filter(m => m.projectId === projectId)
  } catch { return [] }
}

export function savePostMetric(metric: PostMetric): void {
  const raw = localStorage.getItem(POST_METRICS_KEY)
  const all: PostMetric[] = raw ? JSON.parse(raw) : []
  const idx = all.findIndex(m => m.id === metric.id)
  if (idx >= 0) all[idx] = metric; else all.push(metric)
  localStorage.setItem(POST_METRICS_KEY, JSON.stringify(all))
}

export function deletePostMetric(id: string): void {
  const raw = localStorage.getItem(POST_METRICS_KEY)
  const all: PostMetric[] = raw ? JSON.parse(raw) : []
  localStorage.setItem(POST_METRICS_KEY, JSON.stringify(all.filter(m => m.id !== id)))
}

export function getCalendarEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CALENDAR_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch { return [] }
}

export function saveCalendarEvents(events: CalendarEvent[]): void {
  localStorage.setItem(CALENDAR_KEY, JSON.stringify(events))
}

// Migrate old project data to current schema
function migrateProject(p: Project): Project {
  return {
    ...p,
    platforms: p.platforms ?? [],
    data: { ...EMPTY_PROJECT_DATA, ...p.data },
  }
}

export function getProjects(): Project[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const projects: Project[] = JSON.parse(raw)
    return projects.map(migrateProject)
  } catch {
    return []
  }
}

export function getProject(id: string): Project | null {
  const projects = getProjects()
  return projects.find((p) => p.id === id) ?? null
}

export function saveProject(project: Project): void {
  const projects = getProjects()
  const idx = projects.findIndex((p) => p.id === project.id)
  if (idx >= 0) {
    projects[idx] = { ...project, updatedAt: new Date().toISOString() }
  } else {
    projects.push(project)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function createProject(name: string, emoji: string, description: string, platforms: string[] = []): Project {
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    emoji,
    description,
    platforms,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: { ...EMPTY_PROJECT_DATA },
  }
  saveProject(project)
  return project
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function getProgress(data: ProjectData): number {
  const values = Object.values(data)
  const filled = values.filter((v) => typeof v === 'string' && v.trim().length > 0).length
  return Math.round((filled / values.length) * 100)
}

export function exportAllData(): void {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: localStorage.getItem(STORAGE_KEY),
    calendar: localStorage.getItem(CALENDAR_KEY),
    postMetrics: localStorage.getItem(POST_METRICS_KEY),
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `smm-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importAllData(json: string): { ok: boolean; error?: string } {
  try {
    const backup = JSON.parse(json)
    if (!backup || typeof backup !== 'object') return { ok: false, error: 'Невірний формат файлу' }
    if (backup.projects) localStorage.setItem(STORAGE_KEY, backup.projects)
    if (backup.calendar) localStorage.setItem(CALENDAR_KEY, backup.calendar)
    if (backup.postMetrics) localStorage.setItem(POST_METRICS_KEY, backup.postMetrics)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Не вдалося прочитати файл' }
  }
}
