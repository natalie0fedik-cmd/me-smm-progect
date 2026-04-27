'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FolderOpen, TrendingUp, Calendar, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react'
import { Project, CalendarEvent, CalendarEventType } from '@/types'
import { getProjects, createProject, deleteProject, getProgress, getCalendarEvents, saveCalendarEvents } from '@/lib/storage'

// ─── Calendar config ──────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<CalendarEventType, { label: string; icon: string; bg: string; border: string; text: string }> = {
  meeting:  { label: 'Нарада',     icon: '🤝', bg: 'rgba(99,102,241,0.18)',  border: 'rgba(99,102,241,0.5)',  text: '#a5b4fc' },
  planning: { label: 'Планування', icon: '📅', bg: 'rgba(139,92,246,0.18)',  border: 'rgba(139,92,246,0.5)',  text: '#c4b5fd' },
  shoot:    { label: 'Зйомка',     icon: '📸', bg: 'rgba(245,158,11,0.18)',  border: 'rgba(245,158,11,0.5)',  text: '#fcd34d' },
  publish:  { label: 'Публікація', icon: '📤', bg: 'rgba(16,185,129,0.18)',  border: 'rgba(16,185,129,0.5)',  text: '#6ee7b7' },
  other:    { label: 'Інше',       icon: '📌', bg: 'rgba(100,116,139,0.18)', border: 'rgba(100,116,139,0.4)', text: '#94a3b8' },
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const MONTHS_UK = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']

function toIsoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function todayIso() {
  const n = new Date()
  return toIsoDate(n.getFullYear(), n.getMonth(), n.getDate())
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({ projects }: { projects: Project[] }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [filterProject, setFilterProject] = useState('')
  const [form, setForm] = useState<{ open: boolean; date: string; editing: CalendarEvent | null }>({ open: false, date: '', editing: null })
  const [draft, setDraft] = useState<Omit<CalendarEvent, 'id'>>({ title: '', date: '', time: '', type: 'meeting', projectId: '', notes: '' })

  useEffect(() => { setEvents(getCalendarEvents()) }, [])

  function persist(next: CalendarEvent[]) {
    saveCalendarEvents(next)
    setEvents(next)
  }

  function openAdd(date: string) {
    setDraft({ title: '', date, time: '', type: 'meeting', projectId: '', notes: '' })
    setForm({ open: true, date, editing: null })
  }

  function openEdit(ev: CalendarEvent, e: React.MouseEvent) {
    e.stopPropagation()
    setDraft({ title: ev.title, date: ev.date, time: ev.time, type: ev.type, projectId: ev.projectId, notes: ev.notes })
    setForm({ open: true, date: ev.date, editing: ev })
  }

  function saveEvent() {
    if (!draft.title.trim()) return
    if (form.editing) {
      persist(events.map(ev => ev.id === form.editing!.id ? { ...draft, id: form.editing!.id } : ev))
    } else {
      persist([...events, { ...draft, id: crypto.randomUUID() }])
    }
    setForm({ open: false, date: '', editing: null })
  }

  function deleteEvent(id: string) {
    persist(events.filter(ev => ev.id !== id))
    setForm({ open: false, date: '', editing: null })
  }

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const today = todayIso()
  const firstDayOfWeek = ((new Date(year, month, 1).getDay() + 6) % 7)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7 }, (_, i) => {
    const d = i - firstDayOfWeek + 1
    return d >= 1 && d <= daysInMonth ? d : null
  })

  const filtered = filterProject ? events.filter(ev => ev.projectId === filterProject) : events
  const byDate = filtered.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = []
    acc[ev.date].push(ev)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-1 py-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ChevronLeft size={16} />
          </button>
          <span className="text-white font-semibold text-sm px-2 min-w-[140px] text-center">
            {MONTHS_UK[month]} {year}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ChevronRight size={16} />
          </button>
        </div>

        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none cursor-pointer"
        >
          <option value="">Всі проєкти</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
        </select>

        <button
          onClick={() => openAdd(today)}
          className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Додати подію
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-700/60">
          {WEEKDAYS.map(d => (
            <div key={d} className={`py-2.5 text-center text-xs font-semibold tracking-wider ${d === 'Сб' || d === 'Нд' ? 'text-slate-500' : 'text-slate-500'}`}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} className="min-h-[90px] border-b border-r border-slate-700/30 bg-slate-900/20" />
            const iso = toIsoDate(year, month, day)
            const dayEvents = byDate[iso] ?? []
            const isToday = iso === today
            const isWeekend = idx % 7 >= 5
            return (
              <div
                key={idx}
                onClick={() => openAdd(iso)}
                className={`min-h-[90px] border-b border-r border-slate-700/30 p-1.5 cursor-pointer transition-colors hover:bg-slate-700/20 ${isWeekend ? 'bg-slate-900/10' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${isToday ? 'bg-indigo-600 text-white' : isWeekend ? 'text-slate-500' : 'text-slate-400'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(ev => {
                    const cfg = EVENT_TYPE_CONFIG[ev.type]
                    return (
                      <div
                        key={ev.id}
                        onClick={e => openEdit(ev, e)}
                        className="rounded px-1.5 py-0.5 text-[11px] leading-tight truncate border cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.text }}
                      >
                        {cfg.icon} {ev.title}
                      </div>
                    )
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-slate-500 px-1">+{dayEvents.length - 3} ще</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(EVENT_TYPE_CONFIG) as [CalendarEventType, typeof EVENT_TYPE_CONFIG[CalendarEventType]][]).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.border }} />
            {cfg.icon} {cfg.label}
          </div>
        ))}
      </div>

      {/* Event form modal */}
      {form.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setForm({ open: false, date: '', editing: null })}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">{form.editing ? 'Редагувати подію' : 'Нова подія'}</h2>
              <button onClick={() => setForm({ open: false, date: '', editing: null })} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Назва *</label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                  placeholder="Що відбувається?"
                  autoFocus
                  className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm transition-colors"
                />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Дата</label>
                  <input
                    type="date"
                    value={draft.date}
                    onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Clock size={11} /> Час (необов.)</label>
                  <input
                    type="time"
                    value={draft.time}
                    onChange={e => setDraft(d => ({ ...d, time: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Тип події</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(EVENT_TYPE_CONFIG) as [CalendarEventType, typeof EVENT_TYPE_CONFIG[CalendarEventType]][]).map(([type, cfg]) => (
                    <button
                      key={type}
                      onClick={() => setDraft(d => ({ ...d, type }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                      style={draft.type === type
                        ? { backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.text }
                        : { backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(71,85,105,0.5)', color: '#64748b' }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Проєкт (необов.)</label>
                <select
                  value={draft.projectId}
                  onChange={e => setDraft(d => ({ ...d, projectId: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                >
                  <option value="">Без проєкту</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Нотатки (необов.)</label>
                <textarea
                  value={draft.notes}
                  onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                  placeholder="Деталі, посилання на зустріч..."
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              {form.editing && (
                <button
                  onClick={() => deleteEvent(form.editing!.id)}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Видалити
                </button>
              )}
              <button
                onClick={() => setForm({ open: false, date: '', editing: null })}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={saveEvent}
                disabled={!draft.title.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {form.editing ? 'Зберегти' : 'Додати'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['🚀', '💼', '🎯', '✨', '🌿', '🔥', '💡', '🎨', '📱', '🛍️', '🏋️', '🍕', '🌍', '💎', '🎵']

export default function HomePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [activeTab, setActiveTab] = useState<'projects' | 'calendar'>('projects')
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🚀')
  const [newDesc, setNewDesc] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { setProjects(getProjects()) }, [])

  function handleCreate() {
    if (!newName.trim()) return
    const project = createProject(newName.trim(), newEmoji, newDesc.trim())
    setProjects(getProjects())
    setShowModal(false)
    setNewName('')
    setNewDesc('')
    setNewEmoji('🚀')
    router.push(`/projects/${project.id}`)
  }

  function handleDelete(id: string) {
    deleteProject(id)
    setProjects(getProjects())
    setDeleteConfirm(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-3 mr-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="text-white font-semibold text-lg">SMM Стратег</span>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Проєкти
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Calendar size={14} /> Календар
            </button>
          </nav>

          <button
            onClick={() => setShowModal(true)}
            className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Новий проєкт
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* ── Projects tab ── */}
        {activeTab === 'projects' && (
          <>
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-white mb-2">Мої проєкти</h1>
              <p className="text-slate-400">Управляйте SMM-стратегіями для всіх ваших клієнтів в одному місці</p>
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                  <FolderOpen size={28} className="text-slate-500" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Ще немає проєктів</h2>
                <p className="text-slate-400 mb-6 max-w-sm">Створіть перший проєкт і почніть розробляти SMM-стратегію для вашого клієнта</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Plus size={18} /> Створити проєкт
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const progress = getProgress(project.data)
                  return (
                    <div
                      key={project.id}
                      className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10 group cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">{project.emoji}</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.id) }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <h3 className="text-white font-semibold text-lg mb-1 truncate">{project.name}</h3>
                      {project.description && <p className="text-slate-400 text-sm mb-4 line-clamp-2">{project.description}</p>}
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp size={11} /> Заповненість стратегії</span>
                            <span className="text-xs font-semibold text-indigo-400">{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar size={11} /> Оновлено {formatDate(project.updatedAt)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <button
                  onClick={() => setShowModal(true)}
                  className="border-2 border-dashed border-slate-700 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-slate-800/30 transition-all flex flex-col items-center justify-center gap-3 min-h-[180px] group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                    <Plus size={20} className="text-slate-500 group-hover:text-indigo-400" />
                  </div>
                  <span className="text-slate-500 group-hover:text-slate-300 text-sm font-medium transition-colors">Новий проєкт</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Calendar tab ── */}
        {activeTab === 'calendar' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Календар</h1>
              <p className="text-slate-400">Плануйте наради, зйомки, контент і публікації</p>
            </div>
            <CalendarView projects={projects} />
          </>
        )}
      </main>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-white text-xl font-semibold mb-5">Новий проєкт</h2>
            <div className="mb-4">
              <label className="text-slate-400 text-sm mb-2 block">Іконка</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(em => (
                  <button key={em} onClick={() => setNewEmoji(em)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${newEmoji === em ? 'bg-indigo-500/30 ring-2 ring-indigo-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="text-slate-400 text-sm mb-1.5 block">Назва проєкту *</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Наприклад: Кав'ярня «Аромат»"
                className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 transition-colors" autoFocus />
            </div>
            <div className="mb-6">
              <label className="text-slate-400 text-sm mb-1.5 block">Опис (необов'язково)</label>
              <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Стисло про клієнта або проєкт"
                className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 transition-colors" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium transition-colors">Скасувати</button>
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors">Створити</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-4 text-center">⚠️</div>
            <h2 className="text-white text-lg font-semibold text-center mb-2">Видалити проєкт?</h2>
            <p className="text-slate-400 text-sm text-center mb-6">Всі дані цього проєкту будуть видалені безповоротно</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium transition-colors">Скасувати</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-medium transition-colors">Видалити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
