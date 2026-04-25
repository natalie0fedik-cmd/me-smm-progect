'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  Edit3,
  Check,
} from 'lucide-react'
import { Project, ProjectData, SECTIONS, SECTION_GROUPS } from '@/types'
import { getProject, saveProject, getProgress } from '@/lib/storage'

const GROUP_LABELS: Record<string, string> = {
  analytics: '4. АНАЛІТИКА',
  brandPositioning: '5. ПОЗИЦІЮВАННЯ БРЕНДУ',
  contentStrategy: '7. КОНТЕНТ-СТРАТЕГІЯ',
  promotionStrategy: '8. СТРАТЕГІЯ ПРОСУВАННЯ',
  profileBio: '9. БІО ТА HIGHLIGHTS',
}

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [activeSection, setActiveSection] = useState<string>('whoWeAre')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(SECTION_GROUPS.map((g) => g.id)))
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const p = getProject(id)
    if (!p) {
      router.push('/')
      return
    }
    setProject(p)
    setTempName(p.name)
  }, [id, router])

  const autoSave = useCallback(
    (updated: Project) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveProject(updated)
        setSaving(false)
        setSavedAt(new Date())
      }, 800)
    },
    []
  )

  function updateField(field: keyof ProjectData, value: string) {
    if (!project) return
    setSaving(true)
    const updated = {
      ...project,
      data: { ...project.data, [field]: value },
    }
    setProject(updated)
    autoSave(updated)
  }

  function saveName() {
    if (!project || !tempName.trim()) return
    const updated = { ...project, name: tempName.trim() }
    setProject(updated)
    saveProject(updated)
    setEditingName(false)
  }

  function scrollToSection(sectionId: string) {
    setActiveSection(sectionId)
    setSidebarOpen(false)
    const el = sectionRefs.current[sectionId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [project])

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Завантаження...</div>
      </div>
    )
  }

  const progress = getProgress(project.data)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Back */}
      <div className="p-4 border-b border-slate-700/50">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm w-full"
        >
          <ArrowLeft size={15} />
          Всі проєкти
        </button>
      </div>

      {/* Project name */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{project.emoji}</span>
          {editingName ? (
            <div className="flex-1 flex items-center gap-1">
              <input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                className="flex-1 bg-slate-700 border border-indigo-500 rounded px-2 py-1 text-white text-sm min-w-0"
                autoFocus
              />
              <button onClick={saveName} className="text-indigo-400 hover:text-indigo-300 flex-shrink-0">
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 group flex-1 min-w-0">
              <span className="text-white font-semibold text-sm truncate">{project.name}</span>
              <button
                onClick={() => setEditingName(true)}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 flex-shrink-0 transition-opacity"
              >
                <Edit3 size={12} />
              </button>
            </div>
          )}
        </div>
        {project.description && (
          <p className="text-slate-500 text-xs mt-1 truncate">{project.description}</p>
        )}

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp size={10} /> Заповненість
            </span>
            <span className="text-xs font-semibold text-indigo-400">{progress}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {SECTION_GROUPS.map((group) => {
          const isExpanded = expandedGroups.has(group.id)
          const hasParentLabel = GROUP_LABELS[group.id]
          const singleSection = group.sections.length === 1

          if (singleSection) {
            const section = SECTIONS.find((s) => s.id === group.sections[0])!
            const isActive = activeSection === section.id
            const isFilled = project.data[section.id as keyof ProjectData]?.trim().length > 0
            return (
              <button
                key={group.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-300 border-r-2 border-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isFilled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className="truncate">{group.label}</span>
              </button>
            )
          }

          return (
            <div key={group.id}>
              {hasParentLabel && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  <span className="truncate">{group.label}</span>
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              )}
              {isExpanded &&
                group.sections.map((sectionId) => {
                  const section = SECTIONS.find((s) => s.id === sectionId)!
                  const isActive = activeSection === section.id
                  const isFilled = project.data[section.id as keyof ProjectData]?.trim().length > 0
                  return (
                    <button
                      key={sectionId}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-2 pl-6 pr-4 py-1.5 text-sm text-left transition-colors ${
                        isActive
                          ? 'bg-indigo-500/20 text-indigo-300 border-r-2 border-indigo-500'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isFilled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span className="truncate text-xs">{section.label}</span>
                    </button>
                  )
                })}
            </div>
          )
        })}
      </nav>

      {/* Save status */}
      <div className="p-4 border-t border-slate-700/50">
        {saving ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Save size={12} className="animate-pulse" />
            Збереження...
          </div>
        ) : savedAt ? (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 size={12} />
            Збережено
          </div>
        ) : (
          <div className="text-xs text-slate-600">Автозбереження увімкнено</div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-800/80 border-r border-slate-700/50 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex flex-col w-72 bg-slate-800 border-r border-slate-700 animate-fadeIn">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{project.emoji}</span>
            <span className="text-white font-medium text-sm truncate max-w-[180px]">{project.name}</span>
          </div>
          <div className="text-xs font-semibold text-indigo-400">{progress}%</div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pb-24 space-y-2">
            {/* Page title */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-4xl">{project.emoji}</span>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              </div>
              {project.description && (
                <p className="text-slate-400 mt-1 ml-1">{project.description}</p>
              )}
            </div>

            {/* Group headers + section cards */}
            {renderSections(project, updateField, sectionRefs)}
          </div>
        </main>
      </div>
    </div>
  )
}

function renderSections(
  project: Project,
  updateField: (field: keyof ProjectData, value: string) => void,
  sectionRefs: React.MutableRefObject<Record<string, HTMLElement | null>>
) {
  const rendered: React.ReactNode[] = []

  SECTION_GROUPS.forEach((group) => {
    const hasParent = GROUP_LABELS[group.id]

    if (hasParent && group.sections.length > 1) {
      rendered.push(
        <div key={`group-${group.id}`} className="mt-8 mb-2">
          <h2 className="text-lg font-bold text-white border-b border-slate-700 pb-3">{GROUP_LABELS[group.id]}</h2>
        </div>
      )
    }

    group.sections.forEach((sectionId) => {
      const section = SECTIONS.find((s) => s.id === sectionId)!
      const value = project.data[section.id as keyof ProjectData] || ''

      rendered.push(
        <section
          key={sectionId}
          id={sectionId}
          ref={(el) => { sectionRefs.current[sectionId] = el }}
          className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 scroll-mt-6"
        >
          <div className="flex items-start justify-between mb-1">
            <h3 className={`font-bold text-white ${section.isSubsection ? 'text-base' : 'text-lg'}`}>
              {section.label}
            </h3>
            {value.trim() && (
              <span className="flex-shrink-0 ml-2 mt-0.5">
                <CheckCircle2 size={16} className="text-emerald-400" />
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mb-4">{section.description}</p>
          <textarea
            value={value}
            onChange={(e) => updateField(section.id as keyof ProjectData, e.target.value)}
            placeholder={section.placeholder}
            rows={6}
            className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm leading-relaxed transition-colors"
          />
        </section>
      )
    })
  })

  return rendered
}
