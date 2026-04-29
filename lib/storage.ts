import { Project, ProjectData, EMPTY_PROJECT_DATA, CalendarEvent } from '@/types'

const STORAGE_KEY = 'smm_projects'
const CALENDAR_KEY = 'smm_calendar_events'

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
