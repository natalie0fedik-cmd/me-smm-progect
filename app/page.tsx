'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FolderOpen, TrendingUp, Calendar, ChevronLeft, ChevronRight, X, Clock, BarChart2, Check } from 'lucide-react'
import { Project, ProjectData, CalendarEvent, CalendarEventType } from '@/types'
import { getProjects, createProject, deleteProject, getProgress, saveProject, getCalendarEvents, saveCalendarEvents } from '@/lib/storage'

// ─── Analytics types & helpers ───────────────────────────────────────────────

interface KpiM { id: string; name: string; target: string; current: string; period: string }
interface MonthlyRep { id: string; month: string; actuals: Record<string, string>; notes: string }

function parseKM(raw: string): KpiM[] {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
}
function parseMR(raw: string): MonthlyRep[] {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
}

function exportCsvA(kpis: KpiM[], reports: MonthlyRep[], name: string) {
  const headers = ['Місяць', ...kpis.flatMap(k => [`${k.name} (план)`, `${k.name} (факт)`]), 'Нотатки']
  const rows = [...reports].sort((a, b) => a.month.localeCompare(b.month)).map(r => [
    r.month, ...kpis.flatMap(k => [k.target, r.actuals[k.name] ?? '']), r.notes,
  ])
  const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `${name.replace(/\s+/g, '_')}_analytics.csv`; a.click()
  URL.revokeObjectURL(url)
}

const KPI_QUICK: KpiM[] = [
  { id: '', name: 'Підписники',          target: '+500 / місяць',   current: '', period: 'Щомісяця' },
  { id: '', name: 'Охоплення',           target: '50 000 / місяць', current: '', period: 'Щомісяця' },
  { id: '', name: 'ER (залученість)',     target: 'від 3%',          current: '', period: 'По кожному посту' },
  { id: '', name: 'Трафік на сайт',      target: '1 000 кліків',    current: '', period: 'Щомісяця' },
  { id: '', name: 'Конверсія в продажі', target: 'від 2%',          current: '', period: 'Щомісяця' },
  { id: '', name: 'Вартість підписника', target: 'до 30 грн',       current: '', period: 'На кампанію' },
]

const MONTHS_UK_LONG = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
function fmtMonthLong(m: string) {
  const [y, mo] = m.split('-')
  return `${MONTHS_UK_LONG[parseInt(mo) - 1]} ${y}`
}

// ─── Inline KPI panel ────────────────────────────────────────────────────────

function InlineKpiPanel({ project, onSave }: { project: Project; onSave: (kpis: KpiM[]) => void }) {
  const list = parseKM(project.data.kpi)
  const quickNames = new Set(KPI_QUICK.map(k => k.name))
  const customList = list.filter(k => !quickNames.has(k.name))

  function save(next: KpiM[]) { onSave(next) }

  function toggleQuick(ex: KpiM) {
    const idx = list.findIndex(k => k.name === ex.name)
    if (idx >= 0) save(list.filter((_, i) => i !== idx))
    else save([...list, { ...ex, id: crypto.randomUUID() }])
  }
  function updQuick(name: string, field: 'target' | 'period', value: string) {
    save(list.map(k => k.name === name ? { ...k, [field]: value } : k))
  }
  function addCustom() { save([...list, { id: crypto.randomUUID(), name: '', target: '', current: '', period: '' }]) }
  function updCustom(id: string, field: keyof KpiM, value: string) {
    save(list.map(k => k.id === id ? { ...k, [field]: value } : k))
  }
  function removeCustom(id: string) { save(list.filter(k => k.id !== id)) }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Оберіть KPI для відстеження</p>
        <div className="space-y-2">
          {KPI_QUICK.map(ex => {
            const saved = list.find(k => k.name === ex.name)
            const isOn = !!saved
            return (
              <div key={ex.name}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
                style={isOn
                  ? { backgroundColor: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.4)' }
                  : { backgroundColor: 'rgba(15,23,42,0.4)', borderColor: 'rgba(51,65,85,0.5)' }}>
                <button
                  onClick={() => toggleQuick(ex)}
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all border"
                  style={isOn
                    ? { backgroundColor: '#6366f1', borderColor: '#6366f1' }
                    : { backgroundColor: 'transparent', borderColor: '#475569' }}>
                  {isOn && <Check size={11} color="#ffffff" />}
                </button>
                <span
                  className="flex-1 text-sm font-medium cursor-pointer select-none transition-colors"
                  onClick={() => toggleQuick(ex)}
                  style={{ color: isOn ? '#e2e8f0' : '#64748b' }}>
                  {ex.name}
                </span>
                {isOn ? (
                  <>
                    <input
                      type="text" value={saved!.target}
                      onChange={e => updQuick(ex.name, 'target', e.target.value)}
                      placeholder="Ціль" onClick={e => e.stopPropagation()}
                      className="bg-slate-800 border border-indigo-500/30 focus:border-indigo-500 rounded-lg px-2 py-1.5 text-xs text-indigo-300 placeholder-slate-600 outline-none text-center w-32"
                    />
                    <input
                      type="text" value={saved!.period}
                      onChange={e => updQuick(ex.name, 'period', e.target.value)}
                      placeholder="Período" onClick={e => e.stopPropagation()}
                      className="bg-slate-800 border border-slate-700 focus:border-slate-500 rounded-lg px-2 py-1.5 text-xs text-slate-400 placeholder-slate-600 outline-none text-center w-28"
                    />
                  </>
                ) : (
                  <span className="text-xs text-slate-600">{ex.target}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {customList.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Власні KPI</p>
          <div className="space-y-2">
            {customList.map(k => (
              <div key={k.id} className="flex items-center gap-2 bg-slate-900/50 border border-slate-700/60 rounded-xl px-3 py-2.5">
                <input type="text" value={k.name} onChange={e => updCustom(k.id, 'name', e.target.value)} placeholder="Назва метрики" className="bg-transparent text-slate-100 text-sm placeholder-slate-600 outline-none flex-1 min-w-0" />
                <input type="text" value={k.target} onChange={e => updCustom(k.id, 'target', e.target.value)} placeholder="Ціль" className="bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg px-2 py-1.5 text-xs text-indigo-300 placeholder-slate-600 outline-none text-center w-28" />
                <input type="text" value={k.period} onChange={e => updCustom(k.id, 'period', e.target.value)} placeholder="Щомісяця" className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-400 placeholder-slate-600 outline-none text-center w-24" />
                <button onClick={() => removeCustom(k.id)} className="text-slate-600 hover:text-red-400 transition-colors"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={addCustom} className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl text-slate-500 hover:text-indigo-400 text-sm transition-all flex items-center justify-center gap-2">
        <Plus size={14} /> Власний KPI
      </button>
    </div>
  )
}

// ─── Inline Monthly Reports panel ─────────────────────────────────────────────

function parseDelta(fact: string, plan: string): { value: string; positive: boolean } | null {
  const f = parseFloat(fact.replace(/[^\d.]/g, ''))
  const p = parseFloat(plan.replace(/[^\d.]/g, ''))
  if (isNaN(f) || isNaN(p) || p === 0) return null
  const pct = ((f - p) / Math.abs(p)) * 100
  return { value: `${pct >= 0 ? '+' : ''}${Math.round(pct)}%`, positive: pct >= 0 }
}

function InlineReportsPanel({ project, onSave }: { project: Project; onSave: (reports: MonthlyRep[]) => void }) {
  const kpis = parseKM(project.data.kpi)
  const reports = parseMR(project.data.monthlyReports)

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [draftMonth, setDraftMonth] = useState(thisMonth)
  const [draftActuals, setDraftActuals] = useState<Record<string, string>>({})
  const [draftNotes, setDraftNotes] = useState('')

  function save(next: MonthlyRep[]) { onSave(next) }
  function removeReport(id: string) { save(reports.filter(r => r.id !== id)) }

  function loadMonth(month: string) {
    const r = reports.find(rep => rep.month === month)
    setDraftMonth(month)
    setDraftActuals(r ? { ...r.actuals } : {})
    setDraftNotes(r ? r.notes : '')
  }

  function saveReport() {
    const existing = reports.find(r => r.month === draftMonth)
    if (existing) {
      save(reports.map(r => r.month === draftMonth ? { ...r, actuals: draftActuals, notes: draftNotes } : r))
    } else {
      save([{ id: crypto.randomUUID(), month: draftMonth, actuals: draftActuals, notes: draftNotes }, ...reports])
    }
    // After save, reset form and advance to next empty month
    const [y, m] = draftMonth.split('-').map(Number)
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
    setDraftMonth(next)
    setDraftActuals({})
    setDraftNotes('')
  }

  if (kpis.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center space-y-2">
        <p className="text-2xl">📊</p>
        <p className="text-sm font-medium text-slate-300">Спочатку заповніть KPI (план)</p>
        <p className="text-xs text-slate-500">Перейдіть на вкладку «KPI (план)» і виберіть показники</p>
      </div>
    )
  }

  const isEdit = reports.some(r => r.month === draftMonth)
  const anyFact = kpis.some(k => (draftActuals[k.name] ?? '').trim())

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-slate-800/60 border-b border-slate-700/60 flex-wrap">
          <span className="text-sm font-semibold text-white">{isEdit ? 'Редагувати звіт' : 'Новий звіт'}</span>
          <input
            type="month" value={draftMonth}
            onChange={e => loadMonth(e.target.value)}
            className="bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-white outline-none transition-colors"
          />
          {isEdit && <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg">Звіт існує — оновлюється</span>}
        </div>

        <div className="p-5 space-y-4">
          {/* KPI rows */}
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_130px_130px_70px] gap-3 text-xs font-semibold text-slate-600 uppercase tracking-wider px-1">
              <span>Показник</span>
              <span className="text-center">План</span>
              <span className="text-center">Факт</span>
              <span className="text-center">Δ</span>
            </div>
            {kpis.map(kpi => {
              const fact = draftActuals[kpi.name] ?? ''
              const delta = parseDelta(fact, kpi.target)
              return (
                <div key={kpi.id} className="grid grid-cols-[1fr_130px_130px_70px] gap-3 items-center rounded-xl px-3 py-2.5 border"
                  style={{ backgroundColor: 'rgba(15,23,42,0.5)', borderColor: 'rgba(51,65,85,0.5)' }}>
                  <span className="text-sm text-slate-300">{kpi.name}</span>
                  <span className="text-sm text-slate-500 text-center">{kpi.target}</span>
                  <input
                    type="text" value={fact}
                    onChange={e => setDraftActuals(a => ({ ...a, [kpi.name]: e.target.value }))}
                    placeholder="Вкажіть факт"
                    className="border rounded-lg px-2 py-1.5 text-sm text-center outline-none transition-colors placeholder-slate-600 bg-slate-800"
                    style={{ borderColor: fact ? 'rgba(16,185,129,0.5)' : '#334155', color: fact ? '#6ee7b7' : '#94a3b8' }}
                  />
                  <span className="text-sm text-center font-semibold"
                    style={{ color: delta === null ? '#475569' : delta.positive ? '#6ee7b7' : '#f87171' }}>
                    {delta ? delta.value : '—'}
                  </span>
                </div>
              )
            })}
          </div>

          <textarea
            value={draftNotes} onChange={e => setDraftNotes(e.target.value)}
            placeholder="Нотатки за місяць: що спрацювало, що ні..."
            rows={2}
            className="w-full bg-slate-800/50 border border-slate-700 focus:border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none resize-none transition-colors"
          />

          <button
            onClick={saveReport}
            disabled={!anyFact}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: anyFact ? '#4f46e5' : '#1e293b', color: '#ffffff' }}
          >
            {isEdit ? '✓ Оновити звіт' : '✓ Зберегти звіт'}
          </button>
        </div>
      </div>

      {/* History */}
      {reports.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Попередні звіти</p>
            <button onClick={() => exportCsvA(kpis, [...reports].reverse(), project.name)}
              className="text-xs text-slate-500 hover:text-white transition-colors">⬇ CSV</button>
          </div>
          {[...reports].sort((a, b) => b.month.localeCompare(a.month)).map(report => (
            <div key={report.id} className="bg-slate-900/40 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/40">
                <span className="text-sm font-bold text-slate-300">{fmtMonthLong(report.month)}</span>
                <span className="text-xs text-slate-600 flex-1">
                  {kpis.filter(k => report.actuals[k.name]?.trim()).length}/{kpis.length} заповнено
                </span>
                <button onClick={() => loadMonth(report.month)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Редагувати</button>
                <button onClick={() => removeReport(report.id)} className="text-slate-600 hover:text-red-400 transition-colors ml-2"><X size={13} /></button>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {kpis.map(kpi => {
                  const fact = report.actuals[kpi.name] ?? ''
                  const delta = parseDelta(fact, kpi.target)
                  return (
                    <div key={kpi.id} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 flex-1 min-w-0 truncate">{kpi.name}</span>
                      <span className="text-slate-600 text-right whitespace-nowrap">{kpi.target}</span>
                      <span className="text-slate-700 mx-1">→</span>
                      <span className="font-medium w-20 text-right whitespace-nowrap" style={{ color: fact ? '#6ee7b7' : '#475569' }}>{fact || '—'}</span>
                      {delta && <span className="w-10 text-right font-semibold" style={{ color: delta.positive ? '#6ee7b7' : '#f87171' }}>{delta.value}</span>}
                    </div>
                  )
                })}
                {report.notes && <p className="text-xs text-slate-600 pt-1.5 border-t border-slate-700/40 mt-1">{report.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Analytics view ───────────────────────────────────────────────────────────

function AnalyticsView({ projects, onUpdate }: { projects: Project[]; onUpdate: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [section, setSection] = useState<'kpi' | 'reports'>('kpi')

  const project = projects.find(p => p.id === selectedId) ?? null

  function saveKpi(proj: Project, kpis: KpiM[]) {
    saveProject({ ...proj, data: { ...proj.data, kpi: JSON.stringify(kpis) }, updatedAt: new Date().toISOString() })
    onUpdate()
  }
  function saveReps(proj: Project, reps: MonthlyRep[]) {
    saveProject({ ...proj, data: { ...proj.data, monthlyReports: JSON.stringify(reps) }, updatedAt: new Date().toISOString() })
    onUpdate()
  }

  const totalKpi    = projects.reduce((a, p) => a + parseKM(p.data.kpi).length, 0)
  const totalMonths = projects.reduce((a, p) => a + parseMR(p.data.monthlyReports).length, 0)
  const withKpi     = projects.filter(p => parseKM(p.data.kpi).length > 0).length

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Проєктів з KPI',    value: withKpi,      sub: `з ${projects.length} всього` },
          { label: 'Місяців залоговано', value: totalMonths,  sub: 'звітів у всіх проєктах' },
          { label: 'KPI відстежується', value: totalKpi,     sub: 'показників сумарно' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            <p className="text-sm font-medium text-slate-300">{label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 items-start">
        {/* Left: project list */}
        <div className="w-52 flex-shrink-0">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-2">Проєкти</p>
          <div className="space-y-1">
            {projects.length === 0 ? (
              <p className="text-xs text-slate-600 px-2">Немає проєктів</p>
            ) : projects.map(p => {
              const kpiCount = parseKM(p.data.kpi).length
              const repCount = parseMR(p.data.monthlyReports).length
              const isSel = p.id === selectedId
              return (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all text-left border"
                  style={isSel
                    ? { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.4)', color: '#ffffff' }
                    : { backgroundColor: 'transparent', borderColor: 'transparent', color: '#94a3b8' }}>
                  <span className="text-base flex-shrink-0">{p.emoji}</span>
                  <span className="flex-1 min-w-0 truncate font-medium">{p.name}</span>
                  <span className="text-xs flex-shrink-0" style={{ color: kpiCount ? '#818cf8' : repCount ? '#6ee7b7' : '#475569' }}>
                    {kpiCount > 0 ? `${kpiCount} KPI` : repCount > 0 ? `${repCount}м` : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: detail */}
        <div className="flex-1 min-w-0">
          {!project ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-600 gap-3 border border-dashed border-slate-700/60 rounded-2xl">
              <p className="text-2xl">👈</p>
              <p className="text-sm">Оберіть проєкт зліва</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl">{project.emoji}</span>
                <h2 className="text-white font-bold text-lg flex-1 min-w-0 truncate">{project.name}</h2>
                <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
                  <button onClick={() => setSection('kpi')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${section === 'kpi' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    KPI (план)
                  </button>
                  <button onClick={() => setSection('reports')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${section === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    Звіти (факт)
                  </button>
                </div>
              </div>
              {section === 'kpi' && (
                <InlineKpiPanel key={project.id} project={project} onSave={kpis => saveKpi(project, kpis)} />
              )}
              {section === 'reports' && (
                <InlineReportsPanel key={project.id} project={project} onSave={reps => saveReps(project, reps)} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
  const [activeTab, setActiveTab] = useState<'projects' | 'calendar' | 'analytics'>('projects')
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
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <BarChart2 size={14} /> Аналітика
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

        {/* ── Analytics tab ── */}
        {activeTab === 'analytics' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Аналітика</h1>
              <p className="text-slate-400">Зведені звіти по всіх проєктах: план vs факт</p>
            </div>
            <AnalyticsView projects={projects} onUpdate={() => setProjects(getProjects())} />
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
