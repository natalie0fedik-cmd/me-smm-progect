import { Project, ProjectData, EMPTY_PROJECT_DATA } from '@/types'

const STORAGE_KEY = 'smm_projects'

export function getProjects(): Project[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
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

export function createProject(name: string, emoji: string, description: string): Project {
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    emoji,
    description,
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
  const filled = values.filter((v) => v.trim().length > 0).length
  return Math.round((filled / values.length) * 100)
}
