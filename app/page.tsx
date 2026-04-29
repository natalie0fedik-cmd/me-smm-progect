'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FolderOpen, TrendingUp, Calendar, ChevronLeft, ChevronRight, ChevronDown, X, Clock, BarChart2, Check, LayoutDashboard, Settings, Zap, CalendarDays, Lightbulb, Edit3, type LucideIcon } from 'lucide-react'
import { Project, ProjectData, CalendarEvent, CalendarEventType, PostMetric } from '@/types'
import { getProjects, createProject, deleteProject, getProgress, saveProject, getCalendarEvents, saveCalendarEvents, getPostMetrics, savePostMetric, deletePostMetric } from '@/lib/storage'

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

// ─── Post metrics constants ───────────────────────────────────────────────────

const POST_PLATFORM_METRICS: Record<string, string[]> = {
  Instagram:  ['Охоплення','Покази','Лайки','Коментарі','Репости','Збережень','ER%','Перегляди'],
  TikTok:     ['Перегляди','Лайки','Коментарі','Репости','Збережень','ER%','Час перегляду (сек)'],
  Facebook:   ['Охоплення','Покази','Лайки','Коментарі','Репости','ER%'],
  LinkedIn:   ['Покази','Кліки','Лайки','Коментарі','CTR%','ER%'],
  YouTube:    ['Перегляди','Лайки','Коментарі','Підписники+','CTR%','Час перегляду (год)'],
  Telegram:   ['Перегляди','Репости','Реакції','ERR%'],
  'Twitter/X':['Покази','Лайки','Репости','Цитати','Кліки'],
  Pinterest:  ['Покази','Кліки','Збережень','ER%'],
  Threads:    ['Лайки','Репости','Відповіді','Цитати'],
}

const POST_PLATFORM_FORMATS: Record<string, string[]> = {
  Instagram:   ['Пост','Рілс','Сторіс','Карусель','Прямий ефір'],
  TikTok:      ['Відео','Слайдшоу','Прямий ефір'],
  Facebook:    ['Пост','Відео','Рілс','Сторіс','Прямий ефір'],
  LinkedIn:    ['Пост','Стаття','Відео','Карусель','Опитування'],
  YouTube:     ['Відео','Shorts','Прямий ефір'],
  Telegram:    ['Пост','Відео','Опитування','Голосування'],
  'Twitter/X': ['Твіт','Тред','Відповідь'],
  Pinterest:   ['Пін','Відео-пін','Ідея-пін'],
  Threads:     ['Пост','Відповідь'],
}

const POST_CATEGORIES = [
  'Експертний','Розважальний','Продаючий','Навчальний',
  'Надихаючий','UGC','За лаштунками','Новини/Тренди',
]

const DEFAULT_ALL_PLATFORMS = Object.keys(POST_PLATFORM_METRICS)

function fmtMetricValue(v: string): string {
  const n = parseFloat(v.replace(/[^\d.]/g,''))
  if (isNaN(n)) return v
  if (v.includes('%')) return `${n}%`
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n/1_000).toFixed(n>=10_000?0:1)}K`
  return String(Math.round(n))
}

// ─── PostMetricsPanel ─────────────────────────────────────────────────────────

function PostMetricsPanel({ project }: { project: Project }) {
  const today = new Date().toISOString().slice(0,10)
  const platforms = project.platforms.length > 0 ? project.platforms : DEFAULT_ALL_PLATFORMS

  const emptyDraft = (): PostMetric => ({
    id: '', projectId: project.id,
    date: today, platform: platforms[0], format: '', category: '',
    title: '', metrics: {}, notes: '',
  })

  const [posts, setPosts]   = useState<PostMetric[]>([])
  const [draft, setDraft]   = useState<PostMetric>(emptyDraft)
  const [editId, setEditId] = useState<string|null>(null)

  useEffect(() => { setPosts(getPostMetrics(project.id)) }, [project.id])

  const platformMetrics = POST_PLATFORM_METRICS[draft.platform] ?? []
  const platformFormats = POST_PLATFORM_FORMATS[draft.platform] ?? []

  function setField<K extends keyof PostMetric>(k: K, v: PostMetric[K]) {
    setDraft(d => {
      const next = { ...d, [k]: v }
      if (k === 'platform') {
        next.format = ''
        next.metrics = {}
      }
      return next
    })
  }

  function setMetric(name: string, val: string) {
    setDraft(d => ({ ...d, metrics: { ...d.metrics, [name]: val } }))
  }

  function hasAnyMetric() {
    return Object.values(draft.metrics).some(v => v.trim() !== '')
  }

  function save() {
    if (!draft.format || !draft.category || !hasAnyMetric()) return
    const m: PostMetric = { ...draft, id: editId ?? crypto.randomUUID() }
    savePostMetric(m)
    setPosts(getPostMetrics(project.id))
    setDraft(emptyDraft())
    setEditId(null)
  }

  function startEdit(p: PostMetric) {
    setDraft({ ...p })
    setEditId(p.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function remove(id: string) {
    deletePostMetric(id)
    setPosts(getPostMetrics(project.id))
    if (editId === id) { setDraft(emptyDraft()); setEditId(null) }
  }

  const sortedPosts = [...posts].sort((a,b) => b.date.localeCompare(a.date))

  const inputCls = "w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm outline-none transition-colors"
  const chipBase = "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
  const chipOn   = "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
  const chipOff  = "bg-slate-800/60 border-slate-700/50 text-slate-500 hover:text-slate-300"

  return (
    <div className="space-y-6">
      {/* ── Form ── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {editId ? 'Редагувати пост' : 'Новий пост'}
        </p>

        {/* Row 1: date + platform */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Дата публікації</label>
            <input type="date" value={draft.date} onChange={e=>setField('date',e.target.value)} className={inputCls}/>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Платформа</label>
            <div className="flex flex-wrap gap-1.5">
              {platforms.map(pl=>(
                <button key={pl} onClick={()=>setField('platform',pl)}
                  className={`${chipBase} ${draft.platform===pl?chipOn:chipOff}`}
                  style={draft.platform===pl ? {borderColor:(PLATFORM_COLORS[pl]||'#6366f1')+'88',color:PLATFORM_COLORS[pl]||'#a5b4fc',backgroundColor:(PLATFORM_COLORS[pl]||'#6366f1')+'22'} : {}}>
                  {pl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Format */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Формат</label>
          <div className="flex flex-wrap gap-1.5">
            {platformFormats.map(f=>(
              <button key={f} onClick={()=>setField('format',f)}
                className={`${chipBase} ${draft.format===f?chipOn:chipOff}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Тип контенту</label>
          <div className="flex flex-wrap gap-1.5">
            {POST_CATEGORIES.map(c=>(
              <button key={c} onClick={()=>setField('category',c)}
                className={`${chipBase} ${draft.category===c?chipOn:chipOff}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Опис / заголовок поста (необов.)</label>
          <input value={draft.title} onChange={e=>setField('title',e.target.value)}
            placeholder="Короткий опис або початок підпису…" className={inputCls}/>
        </div>

        {/* Metrics grid */}
        {platformMetrics.length > 0 && (
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Метрики ({draft.platform})</label>
            <div className="grid grid-cols-2 gap-2" style={{gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))'}}>
              {platformMetrics.map(m=>(
                <div key={m}>
                  <label className="text-[11px] text-slate-500 mb-1 block">{m}</label>
                  <input value={draft.metrics[m]??''} onChange={e=>setMetric(m,e.target.value)}
                    placeholder="0" className={inputCls}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Нотатки (необов.)</label>
          <textarea value={draft.notes} onChange={e=>setField('notes',e.target.value)}
            placeholder="Що спрацювало / не спрацювало…" rows={2}
            className={`${inputCls} resize-none`} style={{minHeight:60}}/>
        </div>

        <div className="flex gap-3">
          {editId && (
            <button onClick={()=>{setDraft(emptyDraft());setEditId(null)}}
              className="px-4 py-2 rounded-xl text-sm border border-slate-700 text-slate-400 hover:text-white transition-colors">
              Скасувати
            </button>
          )}
          <button onClick={save}
            disabled={!draft.format || !draft.category || !hasAnyMetric()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2 rounded-xl text-sm font-semibold transition-colors">
            {editId ? 'Зберегти зміни' : '+ Зберегти пост'}
          </button>
        </div>
      </div>

      {/* ── History ── */}
      {sortedPosts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-1">Збережені пости ({sortedPosts.length})</p>
          {sortedPosts.map(post=>{
            const pMetrics = POST_PLATFORM_METRICS[post.platform] ?? []
            const keyMetrics = pMetrics.slice(0,4)
            return (
              <div key={post.id}
                className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">{post.date}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">{post.format}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-400 border border-slate-600/40">{post.category}</span>
                    {post.platform && <span className="text-xs text-slate-600">{post.platform}</span>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={()=>startEdit(post)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                      <Edit3 size={13}/>
                    </button>
                    <button onClick={()=>remove(post.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>

                {post.title && <p className="text-sm text-slate-300 truncate">{post.title}</p>}

                {/* Metric chips */}
                <div className="flex flex-wrap gap-2">
                  {keyMetrics.filter(m=>post.metrics[m]).map(m=>(
                    <span key={m} className="flex items-baseline gap-1">
                      <span className="text-[10px] text-slate-600">{m}</span>
                      <span className="text-xs font-semibold text-slate-300">{fmtMetricValue(post.metrics[m])}</span>
                    </span>
                  ))}
                  {pMetrics.slice(4).filter(m=>post.metrics[m]).map(m=>(
                    <span key={m} className="flex items-baseline gap-1">
                      <span className="text-[10px] text-slate-600">{m}</span>
                      <span className="text-xs font-semibold text-slate-300">{fmtMetricValue(post.metrics[m])}</span>
                    </span>
                  ))}
                </div>

                {post.notes && <p className="text-xs text-slate-600 italic">{post.notes}</p>}
              </div>
            )
          })}
        </div>
      )}

      {sortedPosts.length === 0 && (
        <p className="text-center text-slate-600 text-sm py-6">Ще немає збережених постів — заповніть форму вище</p>
      )}
    </div>
  )
}


// ─── Analytics view ───────────────────────────────────────────────────────────

function AnalyticsView({ projects, onUpdate }: { projects: Project[]; onUpdate: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(() => projects[0]?.id ?? null)
  const [section, setSection] = useState<'kpi' | 'reports' | 'posts'>('kpi')

  useEffect(() => {
    setSelectedId(id => id && projects.find(p => p.id === id) ? id : (projects[0]?.id ?? null))
  }, [projects])

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
      {/* Summary — shown only once there's real data */}
      {(totalKpi > 0 || totalMonths > 0) && (
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
      )}

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
          {project ? (
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
                  <button onClick={() => setSection('posts')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${section === 'posts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    Пости
                  </button>
                </div>
              </div>
              {section === 'kpi' && (
                <InlineKpiPanel key={project.id} project={project} onSave={kpis => saveKpi(project, kpis)} />
              )}
              {section === 'reports' && (
                <InlineReportsPanel key={project.id} project={project} onSave={reps => saveReps(project, reps)} />
              )}
              {section === 'posts' && (
                <PostMetricsPanel key={project.id} project={project} />
              )}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-600 gap-2">
              <p className="text-sm">Немає проєктів — створіть перший у розділі Проєкти</p>
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
  const [viewMode, setViewMode] = useState<'week'|'month'|'list'>('week')
  const [weekAnchor, setWeekAnchor] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  })
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [filterProject, setFilterProject] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [form, setForm] = useState<{ open: boolean; date: string; editing: CalendarEvent | null }>({ open: false, date: '', editing: null })
  const [draft, setDraft] = useState<Omit<CalendarEvent, 'id'>>({ title: '', date: '', time: '', type: 'publish', projectId: '', notes: '' })

  useEffect(() => { setEvents(getCalendarEvents()) }, [])

  function persist(next: CalendarEvent[]) { saveCalendarEvents(next); setEvents(next) }

  function openAdd(date: string, time?: string) {
    setDraft({ title: '', date, time: time ?? '', type: 'publish', projectId: '', notes: '' })
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
  function prevWeek() { const d = new Date(weekAnchor); d.setDate(d.getDate()-7); setWeekAnchor(d.toISOString().slice(0,10)) }
  function nextWeek() { const d = new Date(weekAnchor); d.setDate(d.getDate()+7); setWeekAnchor(d.toISOString().slice(0,10)) }

  const today = todayIso()
  const firstDayOfWeek = ((new Date(year, month, 1).getDay() + 6) % 7)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7 }, (_, i) => {
    const d = i - firstDayOfWeek + 1; return d >= 1 && d <= daysInMonth ? d : null
  })

  const weekDays = Array.from({length:7}, (_,i) => {
    const d = new Date(weekAnchor); d.setDate(d.getDate()+i)
    const iso = d.toISOString().slice(0,10)
    return {iso, day:d.getDate(), monthIdx:d.getMonth(), label:WEEKDAYS[i], isToday:iso===today, isWeekend:i>=5}
  })

  const filtered = filterProject ? events.filter(ev => ev.projectId === filterProject) : events
  const byDate = filtered.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = []; acc[ev.date].push(ev); return acc
  }, {})

  const periodLabel = viewMode==='month' ? `${MONTHS_UK[month]} ${year}` : viewMode==='week' ? (()=>{
    const s=new Date(weekDays[0].iso), e=new Date(weekDays[6].iso)
    if (s.getMonth()===e.getMonth()) return `${s.getDate()}–${e.getDate()} ${MONTHS_UK[e.getMonth()].toLowerCase()} ${e.getFullYear()}`
    return `${s.getDate()} ${MONTHS_UK[s.getMonth()].slice(0,3).toLowerCase()} – ${e.getDate()} ${MONTHS_UK[e.getMonth()].slice(0,3).toLowerCase()} ${e.getFullYear()}`
  })() : 'Список подій'

  const HOURS = Array.from({length:14}, (_,i)=>i+8) // 8..21

  function evStyle(ev: CalendarEvent) {
    if (!filterProject && ev.projectId) {
      const c = getProjectColor(ev.projectId)
      return { bg: c+'25', border: c+'60', text: c, icon: EVENT_TYPE_CONFIG[ev.type].icon }
    }
    const cfg = EVENT_TYPE_CONFIG[ev.type]
    return { bg: cfg.bg, border: cfg.border, text: cfg.text, icon: cfg.icon }
  }

  const allFutureEvents = filtered
    .filter(e=>e.date>=today)
    .sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.time||'').localeCompare(b.time||''))
  const byDateList = allFutureEvents.reduce<Record<string,CalendarEvent[]>>((acc,ev)=>{
    if(!acc[ev.date]) acc[ev.date]=[]; acc[ev.date].push(ev); return acc
  },{})

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-0.5">
          {(['week','month','list'] as const).map(v=>(
            <button key={v} onClick={()=>setViewMode(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode===v?'bg-indigo-600 text-white':'text-slate-400 hover:text-white'}`}>
              {v==='week'?'Тиждень':v==='month'?'Місяць':'Список'}
            </button>
          ))}
        </div>

        {viewMode!=='list'&&(
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-1 py-1">
            <button onClick={viewMode==='week'?prevWeek:prevMonth}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
              <ChevronLeft size={16}/>
            </button>
            <span className="text-white font-semibold text-sm px-2 min-w-[170px] text-center">{periodLabel}</span>
            <button onClick={viewMode==='week'?nextWeek:nextMonth}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
              <ChevronRight size={16}/>
            </button>
          </div>
        )}

        <div className="relative">
          {filterOpen&&<div className="fixed inset-0 z-10" onClick={()=>setFilterOpen(false)}/>}
          <button onClick={()=>setFilterOpen(o=>!o)}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-300 transition-colors">
            {filterProject ? (
              <>
                <span style={{width:8,height:8,borderRadius:4,backgroundColor:getProjectColor(filterProject),flexShrink:0,display:'inline-block'}}/>
                <span className="max-w-[120px] truncate">{projects.find(p=>p.id===filterProject)?.emoji} {projects.find(p=>p.id===filterProject)?.name}</span>
                <span onClick={e=>{e.stopPropagation();setFilterProject('');setFilterOpen(false)}} className="text-slate-500 hover:text-slate-300 cursor-pointer"><X size={11}/></span>
              </>
            ) : <span>Всі проєкти</span>}
            <ChevronDown size={12} className="text-slate-500 flex-shrink-0"/>
          </button>
          {filterOpen&&(
            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl py-1 z-20 min-w-[190px] shadow-xl">
              <button onClick={()=>{setFilterProject('');setFilterOpen(false)}}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${!filterProject?'text-white bg-slate-700/50':'text-slate-400 hover:bg-slate-700/30'}`}>
                <span style={{width:8,height:8,borderRadius:4,backgroundColor:'#374151',display:'inline-block',flexShrink:0}}/>
                Всі проєкти
              </button>
              {projects.map(p=>(
                <button key={p.id} onClick={()=>{setFilterProject(p.id);setFilterOpen(false)}}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${filterProject===p.id?'text-white bg-slate-700/50':'text-slate-400 hover:bg-slate-700/30'}`}>
                  <span style={{width:8,height:8,borderRadius:4,backgroundColor:getProjectColor(p.id),display:'inline-block',flexShrink:0}}/>
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={()=>openAdd(today)}
          className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus size={15}/> Додати подію
        </button>
      </div>

      {/* ── MONTH VIEW ── */}
      {viewMode==='month'&&(
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden relative">
          {events.length===0&&(
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-900/70 backdrop-blur-[2px] rounded-2xl">
              <div className="text-center">
                <p className="text-3xl mb-3">🗓️</p>
                <p className="text-slate-300 font-semibold text-base mb-1">Календар порожній</p>
                <p className="text-slate-500 text-sm mb-5">Додай першу подію — нараду, зйомку або публікацію</p>
                <button onClick={()=>openAdd(today)}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  <Plus size={15}/> Додати подію
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-7 border-b border-slate-700/60">
            {WEEKDAYS.map(d=><div key={d} className="py-2.5 text-center text-xs font-semibold tracking-wider text-slate-500">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day,idx)=>{
              if(!day) return <div key={idx} className="min-h-[90px] border-b border-r border-slate-700/30 bg-slate-900/20"/>
              const iso=toIsoDate(year,month,day)
              const dayEvents=byDate[iso]??[]
              const isToday=iso===today
              const isWeekend=idx%7>=5
              return (
                <div key={idx} onClick={()=>openAdd(iso)}
                  className={`group min-h-[90px] border-b border-r border-slate-700/30 p-1.5 cursor-pointer transition-colors hover:bg-indigo-950/30 ${isWeekend?'bg-slate-900/10':''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${isToday?'bg-indigo-600 text-white':isWeekend?'text-slate-500':'text-slate-400'}`}>{day}</div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 text-sm font-light select-none">+</span>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0,3).map(ev=>{
                      const s=evStyle(ev)
                      return (
                        <div key={ev.id} onClick={e=>openEdit(ev,e)}
                          className="rounded px-1.5 py-0.5 text-[11px] leading-tight truncate border cursor-pointer hover:opacity-80 transition-opacity"
                          style={{backgroundColor:s.bg,borderColor:s.border,color:s.text}}>
                          {s.icon} {ev.title}
                        </div>
                      )
                    })}
                    {dayEvents.length>3&&<div className="text-[10px] text-slate-500 px-1">+{dayEvents.length-3} ще</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {viewMode==='week'&&(
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden">
          {/* Day headers */}
          <div className="grid border-b border-slate-700/60" style={{gridTemplateColumns:'52px repeat(7,1fr)'}}>
            <div className="border-r border-slate-700/30"/>
            {weekDays.map(d=>(
              <div key={d.iso} onClick={()=>openAdd(d.iso)}
                className={`group py-3 text-center border-r border-slate-700/30 last:border-r-0 cursor-pointer transition-colors hover:bg-indigo-950/30 relative ${d.isWeekend?'bg-slate-900/20':''}`}>
                <p className="text-xs text-slate-500 font-medium">{d.label}</p>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mx-auto mt-0.5 ${d.isToday?'bg-indigo-600 text-white':'text-slate-300'}`}>
                  {d.day}
                </div>
                <span className="absolute top-1.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 text-sm select-none">+</span>
              </div>
            ))}
          </div>
          {/* All-day row */}
          {weekDays.some(d=>(byDate[d.iso]??[]).some(e=>!e.time))&&(
            <div className="grid border-b border-slate-700/60" style={{gridTemplateColumns:'52px repeat(7,1fr)'}}>
              <div className="flex items-center justify-center border-r border-slate-700/30 py-1.5">
                <span className="text-[10px] text-slate-600 font-medium rotate-0 leading-none text-center">весь<br/>день</span>
              </div>
              {weekDays.map(d=>{
                const allDay=(byDate[d.iso]??[]).filter(e=>!e.time)
                return (
                  <div key={d.iso} className={`border-r border-slate-700/30 last:border-r-0 p-1 min-h-[28px] ${d.isWeekend?'bg-slate-900/10':''}`}>
                    {allDay.map(ev=>{
                      const s=evStyle(ev)
                      return (
                        <div key={ev.id} onClick={e=>openEdit(ev,e)}
                          className="rounded px-1.5 py-0.5 text-[11px] truncate border cursor-pointer hover:opacity-80 mb-0.5"
                          style={{backgroundColor:s.bg,borderColor:s.border,color:s.text}}>
                          {s.icon} {ev.title}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
          {/* Time grid */}
          <div className="overflow-y-auto" style={{maxHeight:560}}>
            {HOURS.map(h=>(
              <div key={h} className="grid border-b border-slate-700/20 last:border-b-0" style={{gridTemplateColumns:'52px repeat(7,1fr)',minHeight:48}}>
                <div className="border-r border-slate-700/30 flex items-start justify-end pr-2 pt-1">
                  <span className="text-[10px] text-slate-600">{String(h).padStart(2,'0')}:00</span>
                </div>
                {weekDays.map(d=>{
                  const hourEvents=(byDate[d.iso]??[]).filter(ev=>{
                    if(!ev.time) return false
                    const [hh]=ev.time.split(':').map(Number)
                    return hh===h
                  })
                  return (
                    <div key={d.iso} onClick={()=>openAdd(d.iso,`${String(h).padStart(2,'0')}:00`)}
                      className={`group relative border-r border-slate-700/20 last:border-r-0 p-0.5 cursor-pointer hover:bg-indigo-950/30 transition-colors ${d.isWeekend?'bg-slate-900/10':''}`}>
                      {hourEvents.length===0&&<span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-700 text-xs select-none pointer-events-none">+</span>}
                      {hourEvents.map(ev=>{
                        const s=evStyle(ev)
                        return (
                          <div key={ev.id} onClick={e=>openEdit(ev,e)}
                            className="rounded px-1.5 py-1 text-[11px] border cursor-pointer hover:opacity-80 mb-0.5"
                            style={{backgroundColor:s.bg,borderColor:s.border,color:s.text}}>
                            <span className="font-semibold">{ev.time}</span> {s.icon} <span className="truncate">{ev.title}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          {/* Empty week state */}
          {weekDays.every(d=>!(byDate[d.iso]?.length))&&(
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="text-slate-500 text-sm">Цього тижня подій немає</p>
              <button onClick={()=>openAdd(weekDays.find(d=>d.isToday)?.iso??weekDays[0].iso)}
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                <Plus size={14}/> Додати подію
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode==='list'&&(
        <div className="space-y-4">
          {allFutureEvents.length===0?(
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl flex flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-3xl">🗓️</p>
              <p className="text-slate-300 font-semibold">Майбутніх подій немає</p>
              <p className="text-slate-500 text-sm mb-2">Заплануй нараду, зйомку або публікацію</p>
              <button onClick={()=>openAdd(today)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                <Plus size={15}/> Додати подію
              </button>
            </div>
          ):(
            Object.entries(byDateList).map(([date,evs])=>{
              const d=new Date(date)
              const isToday=date===today
              const label=isToday?'Сьогодні':d.toLocaleDateString('uk-UA',{weekday:'long',day:'numeric',month:'long'})
              return (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isToday?'text-indigo-400':'text-slate-500'}`}>{label}</span>
                    <div className="flex-1 h-px bg-slate-700/50"/>
                  </div>
                  <div className="space-y-2">
                    {evs.map(ev=>{
                      const s=evStyle(ev)
                      const proj=projects.find(p=>p.id===ev.projectId)
                      return (
                        <div key={ev.id} onClick={e=>openEdit(ev,e)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer hover:opacity-90 transition-opacity"
                          style={{backgroundColor:s.bg,borderColor:s.border}}>
                          <span className="text-base flex-shrink-0">{s.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm" style={{color:s.text}}>{ev.title}</p>
                            {ev.notes&&<p className="text-xs text-slate-500 truncate mt-0.5">{ev.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {ev.time&&<span className="text-xs font-semibold" style={{color:s.text}}>{ev.time}</span>}
                            {proj&&!filterProject&&<span className="text-xs text-slate-500">{proj.emoji} {proj.name}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(EVENT_TYPE_CONFIG) as [CalendarEventType, typeof EVENT_TYPE_CONFIG[CalendarEventType]][]).map(([,cfg])=>(
          <div key={cfg.label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full" style={{backgroundColor:cfg.border}}/>
            {cfg.icon} {cfg.label}
          </div>
        ))}
      </div>

      {/* Event form modal */}
      {form.open&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setForm({open:false,date:'',editing:null})}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">{form.editing?'Редагувати подію':'Нова подія'}</h2>
              <button onClick={()=>setForm({open:false,date:'',editing:null})} className="text-slate-500 hover:text-white transition-colors">
                <X size={18}/>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Назва *</label>
                <input type="text" value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))}
                  placeholder="Що відбувається?" autoFocus
                  className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm transition-colors"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Дата</label>
                  <input type="date" value={draft.date} onChange={e=>setDraft(d=>({...d,date:e.target.value}))}
                    className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm transition-colors"/>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Clock size={11}/> Час (необов.)</label>
                  <input type="time" value={draft.time} onChange={e=>setDraft(d=>({...d,time:e.target.value}))}
                    className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm transition-colors"/>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Тип події</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(EVENT_TYPE_CONFIG) as [CalendarEventType, typeof EVENT_TYPE_CONFIG[CalendarEventType]][]).map(([type,cfg])=>(
                    <button key={type} onClick={()=>setDraft(d=>({...d,type}))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                      style={draft.type===type
                        ?{backgroundColor:cfg.bg,borderColor:cfg.border,color:cfg.text}
                        :{backgroundColor:'rgba(30,41,59,0.6)',borderColor:'rgba(71,85,105,0.5)',color:'#64748b'}}>
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Проєкт (необов.)</label>
                <select value={draft.projectId} onChange={e=>setDraft(d=>({...d,projectId:e.target.value}))}
                  className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white text-sm outline-none">
                  <option value="">Без проєкту</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Нотатки (необов.)</label>
                <textarea value={draft.notes} onChange={e=>setDraft(d=>({...d,notes:e.target.value}))}
                  placeholder="Деталі, посилання на зустріч..." rows={2}
                  className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm transition-colors resize-none"/>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              {form.editing&&(
                <button onClick={()=>deleteEvent(form.editing!.id)}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors">
                  Видалити
                </button>
              )}
              <button onClick={()=>setForm({open:false,date:'',editing:null})}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                Скасувати
              </button>
              <button onClick={saveEvent} disabled={!draft.title.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {form.editing?'Зберегти':'Додати'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



// ─── Platform + layout config ─────────────────────────────────────────────────

const PLATFORM_OPTIONS = ['Instagram','Facebook','TikTok','LinkedIn','YouTube','Telegram','Twitter/X','Pinterest','Threads']
const PLATFORM_COLORS: Record<string, string> = {
  Instagram:'#e1306c', Facebook:'#1877f2', TikTok:'#69c9d0', LinkedIn:'#0a66c2',
  YouTube:'#ff0000', Telegram:'#229ed9', 'Twitter/X':'#1da1f2', Pinterest:'#e60023', Threads:'#aaaaaa',
}
function getProjectColor(id: string): string {
  const p=['#1d4ed8','#7c3aed','#059669','#dc2626','#d97706','#0891b2','#db2777','#2563eb']
  return p[id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%p.length]
}
function projectInitials(name: string): string {
  return name.split(' ').map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase()||'?'
}

type NavView = 'dashboard'|'projects'|'calendar'|'analytics'

function NavBtn({label,Icon,active,onClick}:{label:string;Icon:LucideIcon;active:boolean;onClick:()=>void}) {
  const [hov,setHov]=useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:10,marginBottom:2,border:'none',cursor:'pointer',
        backgroundColor:active?'rgba(37,99,235,0.18)':hov?'rgba(255,255,255,0.04)':'transparent',
        color:active?'#60a5fa':'#4b5563',fontWeight:active?600:400,fontSize:14,textAlign:'left',transition:'all 0.12s'}}>
      <Icon size={17}/><span>{label}</span>
      {active&&<span style={{marginLeft:'auto',width:6,height:6,borderRadius:3,backgroundColor:'#3b82f6',flexShrink:0}}/>}
    </button>
  )
}

function Sidebar({active,onNav,projects}:{active:NavView;onNav:(v:NavView)=>void;projects:Project[]}) {
  const router = useRouter()
  const [projOpen, setProjOpen] = useState(true)

  const topItems:[NavView,string,LucideIcon][]=[
    ['dashboard','Дашборд',LayoutDashboard],
    ['calendar','Контент-планер',CalendarDays],
    ['analytics','Аналітика',BarChart2],
  ]

  return (
    <aside style={{width:242,flexShrink:0,backgroundColor:'#04090f',display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0,borderRight:'1px solid rgba(255,255,255,0.05)'}}>
      <div style={{padding:'20px 16px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <Zap size={18} color="#fff"/>
          </div>
          <div>
            <p style={{color:'#e2e8f0',fontWeight:700,fontSize:15,lineHeight:1.2}}>SMMFlow</p>
            <p style={{color:'#374151',fontSize:11}}>Операційна система</p>
          </div>
        </div>
      </div>

      <nav style={{flex:1,padding:'8px',overflowY:'auto'}}>
        <NavBtn label="Дашборд" Icon={LayoutDashboard} active={active==='dashboard'} onClick={()=>onNav('dashboard')}/>

        {/* Projects with expandable sub-list */}
        <div style={{marginBottom:2}}>
          <div style={{display:'flex',alignItems:'center',borderRadius:10,overflow:'hidden'}}>
            <button
              onClick={()=>onNav('projects')}
              style={{flex:1,display:'flex',alignItems:'center',gap:10,padding:'9px 8px 9px 12px',border:'none',cursor:'pointer',
                backgroundColor:active==='projects'?'rgba(37,99,235,0.18)':'transparent',
                color:active==='projects'?'#60a5fa':'#4b5563',fontWeight:active==='projects'?600:400,fontSize:14,textAlign:'left',transition:'all 0.12s'}}>
              <FolderOpen size={17}/>
              <span style={{flex:1}}>Проєкти</span>
              {active==='projects'&&<span style={{width:6,height:6,borderRadius:3,backgroundColor:'#3b82f6',flexShrink:0,marginRight:4}}/>}
            </button>
            <button
              onClick={()=>setProjOpen(o=>!o)}
              style={{padding:'9px 10px',border:'none',cursor:'pointer',backgroundColor:'transparent',
                color:'#374151',transition:'color 0.12s,transform 0.15s',
                transform:projOpen?'rotate(90deg)':'rotate(0deg)'}}
              onMouseEnter={e=>(e.currentTarget.style.color='#6b7280')}
              onMouseLeave={e=>(e.currentTarget.style.color='#374151')}>
              <ChevronRight size={14}/>
            </button>
          </div>

          {/* Sub-items */}
          {projOpen && projects.length > 0 && (
            <div style={{paddingLeft:12,marginTop:1}}>
              {projects.map(p=>{
                const color = getProjectColor(p.id)
                return (
                  <button key={p.id}
                    onClick={()=>router.push(`/projects/${p.id}`)}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:8,border:'none',cursor:'pointer',
                      backgroundColor:'transparent',transition:'background 0.1s',textAlign:'left',marginBottom:1}}
                    onMouseEnter={e=>(e.currentTarget.style.backgroundColor='rgba(255,255,255,0.04)')}
                    onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                    <span style={{width:7,height:7,borderRadius:3.5,backgroundColor:color,flexShrink:0}}/>
                    <span style={{fontSize:12,color:'#4b5563',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
                      {p.name}
                    </span>
                    <span style={{fontSize:10,color:'#1f2937',flexShrink:0}}>
                      {getProgress(p.data)}%
                    </span>
                  </button>
                )
              })}
              {projects.length === 0 && (
                <p style={{fontSize:12,color:'#1f2937',padding:'4px 10px'}}>Немає проєктів</p>
              )}
            </div>
          )}

          {projOpen && projects.length === 0 && (
            <div style={{paddingLeft:12,marginTop:1}}>
              <button onClick={()=>onNav('projects')}
                style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:8,border:'none',cursor:'pointer',
                  backgroundColor:'transparent',color:'#374151',fontSize:12,textAlign:'left'}}>
                + Створити перший проєкт
              </button>
            </div>
          )}
        </div>

        <NavBtn label="Контент-планер" Icon={CalendarDays} active={active==='calendar'} onClick={()=>onNav('calendar')}/>
        <NavBtn label="Аналітика" Icon={BarChart2} active={active==='analytics'} onClick={()=>onNav('analytics')}/>

        <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',margin:'8px 0'}}/>
        {([['Центр ідей',Lightbulb],['Навички',TrendingUp]] as [string,LucideIcon][]).map(([label,Icon])=>(
          <button key={label} disabled style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:10,marginBottom:2,border:'none',backgroundColor:'transparent',color:'#1f2937',fontSize:14,textAlign:'left',cursor:'default'}}>
            <Icon size={17}/><span>{label}</span>
            <span style={{marginLeft:'auto',fontSize:10,color:'#1f2937',border:'1px solid #1f2937',padding:'1px 5px',borderRadius:4}}>скоро</span>
          </button>
        ))}
      </nav>

      <div style={{padding:'12px 8px',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
        <button style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:10,border:'none',backgroundColor:'transparent',color:'#374151',fontSize:14,textAlign:'left',cursor:'pointer',marginBottom:4}}>
          <Settings size={17}/>Налаштування
        </button>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px'}}>
          <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,fontWeight:700,flexShrink:0}}>НФ</div>
          <div>
            <p style={{color:'#d1d5db',fontSize:13,fontWeight:600}}>Наталія Федік</p>
            <p style={{color:'#374151',fontSize:11}}>SMM-спеціаліст</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ─── DashboardView ────────────────────────────────────────────────────────────

const SECTION_STEPS: { keys: (keyof ProjectData)[]; label: string }[] = [
  { keys: ['companyName','companyIndustry','companyGeo'],   label: 'базову інформацію' },
  { keys: ['goals'],                                         label: 'цілі' },
  { keys: ['tasks'],                                         label: 'задачі' },
  { keys: ['brandMission','brandVision','brandValues'],     label: 'ДНК бренду' },
  { keys: ['uvp'],                                           label: 'УЦП' },
  { keys: ['toneOfVoice','contentRubricator'],              label: 'контент-стратегію' },
  { keys: ['analytics','competitorAnalysis'],               label: 'аналітику' },
  { keys: ['paidTools','organicTools'],                     label: 'стратегію просування' },
  { keys: ['bioStructure','highlights'],                    label: 'біо та хайлайти' },
  { keys: ['kpi'],                                           label: 'KPI' },
  { keys: ['implementationStages'],                         label: 'план реалізації' },
]

function nextStepLabel(data: ProjectData): string | null {
  for (const s of SECTION_STEPS) {
    if (s.keys.some(k => !data[k]?.trim())) return s.label
  }
  return null
}

const MONTHS_SHORT_UA = ['січ','лют','бер','квіт','трав','черв','лип','серп','вер','жовт','лист','груд']
function fmtUpdated(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_SHORT_UA[d.getMonth()]}.`
}

function DashboardView({projects,onNavigate}:{projects:Project[];onNavigate:(v:NavView)=>void}) {
  const router = useRouter()
  const now = new Date()
  const todayStr = now.toISOString().slice(0,10)
  const weekStart = new Date(now); weekStart.setDate(now.getDate()-now.getDay()+1)
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6)
  const weekStartStr = weekStart.toISOString().slice(0,10)
  const weekEndStr = weekEnd.toISOString().slice(0,10)

  const events = getCalendarEvents().filter(e=>e.date>=weekStartStr && e.date<=weekEndStr)

  const DAY_NAMES=['Пн','Вт','Ср','Чт','Пт','Сб','Нд']
  const weekDays: {label:string;date:string}[] = Array.from({length:7},(_,i)=>{
    const d=new Date(weekStart); d.setDate(weekStart.getDate()+i)
    return {label:DAY_NAMES[i],date:d.toISOString().slice(0,10)}
  })

  const EVENT_COLORS: Record<string,string> = {meeting:'#6366f1',planning:'#0891b2',shoot:'#d97706',publish:'#059669',other:'#6b7280'}
  const EVENT_UA: Record<string,string> = {meeting:'Зустріч',planning:'Планування',shoot:'Зйомка',publish:'Публікація',other:'Інше'}

  const totalProjects = projects.length
  const activeProjects = projects.filter(p=>getProgress(p.data)>0).length

  const hours = now.getHours()
  const realGreeting = hours<12?'Доброго ранку':hours<17?'Добрий день':'Добрий вечір'

  return (
    <div style={{padding:'36px 44px',maxWidth:1200}}>
      {/* Header */}
      <div style={{marginBottom:32}}>
        <h1 style={{color:'#e2e8f0',fontSize:26,fontWeight:700,marginBottom:4}}>{realGreeting}, Наталіє 👋</h1>
        <p style={{color:'#4b5563',fontSize:14}}>{now.toLocaleDateString('uk-UA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
      </div>

      {/* Stat cards — hidden until user has at least one project */}
      {totalProjects === 0 ? (
        <div style={{backgroundColor:'#0c1524',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'28px 32px',marginBottom:32}}>
          <p style={{color:'#e2e8f0',fontSize:16,fontWeight:600,marginBottom:6}}>З чого почати</p>
          <p style={{color:'#4b5563',fontSize:13,marginBottom:24}}>Три кроки, щоб запустити перший SMM-проєкт</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {[
              {step:'01',title:'Створи проєкт',desc:'Додай клієнта або бренд, обери платформи',cta:'Створити →',nav:'projects' as NavView,color:'#3b82f6'},
              {step:'02',title:'Заповни стратегію',desc:'Цілі, аудиторія, УЦП, тон комунікації',cta:'До проєктів →',nav:'projects' as NavView,color:'#8b5cf6'},
              {step:'03',title:'Заплануй перший пост',desc:'Відкрий контент-планер і постав дату',cta:'До планера →',nav:'calendar' as NavView,color:'#10b981'},
            ].map(s=>(
              <div key={s.step} style={{backgroundColor:'#0f1e30',borderRadius:12,padding:'18px 20px',border:'1px solid rgba(255,255,255,0.04)'}}>
                <p style={{color:s.color,fontSize:11,fontWeight:700,letterSpacing:'0.08em',marginBottom:8}}>{s.step}</p>
                <p style={{color:'#e2e8f0',fontSize:13,fontWeight:600,marginBottom:4}}>{s.title}</p>
                <p style={{color:'#4b5563',fontSize:12,marginBottom:14,lineHeight:1.5}}>{s.desc}</p>
                <button onClick={()=>onNavigate(s.nav)}
                  style={{background:'none',border:'none',color:s.color,fontSize:12,fontWeight:600,cursor:'pointer',padding:0}}>
                  {s.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:32}}>
          {[
            {label:'Активних проєктів',value:activeProjects,sub:`з ${totalProjects} загалом`,color:'#3b82f6'},
            {label:'Подій цього тижня',value:events.length,sub:'в контент-планері',color:'#8b5cf6'},
            {label:'Публікацій',value:events.filter(e=>e.type==='publish').length,sub:'цього тижня',color:'#10b981'},
            {label:'Зустрічей',value:events.filter(e=>e.type==='meeting').length,sub:'цього тижня',color:'#f59e0b'},
          ].map(s=>(
            <div key={s.label} style={{backgroundColor:'#0c1524',border:'1px solid rgba(255,255,255,0.05)',borderRadius:14,padding:'20px 22px'}}>
              <p style={{color:'#4b5563',fontSize:12,marginBottom:8}}>{s.label}</p>
              <p style={{fontSize:32,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</p>
              <p style={{color:'#374151',fontSize:12,marginTop:6}}>{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        {/* Projects list */}
        <div style={{backgroundColor:'#0c1524',border:'1px solid rgba(255,255,255,0.05)',borderRadius:14,padding:22}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
            <h2 style={{color:'#e2e8f0',fontSize:15,fontWeight:600}}>Проєкти</h2>
            <button onClick={()=>onNavigate('projects')} style={{color:'#3b82f6',fontSize:12,background:'none',border:'none',cursor:'pointer'}}>Всі проєкти →</button>
          </div>
          {projects.length===0?(
            <p style={{color:'#374151',fontSize:13,textAlign:'center',padding:'24px 0'}}>Ще немає проєктів</p>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {projects.slice(0,5).map(p=>{
                const prog=getProgress(p.data)
                const color=getProjectColor(p.id)
                const next=nextStepLabel(p.data)
                return (
                  <div key={p.id} onClick={()=>router.push(`/projects/${p.id}`)}
                    style={{display:'flex',alignItems:'flex-start',gap:12,padding:'8px 10px',borderRadius:10,cursor:'pointer',transition:'background 0.12s',margin:'0 -10px'}}
                    onMouseEnter={e=>(e.currentTarget.style.backgroundColor='rgba(255,255,255,0.03)')}
                    onMouseLeave={e=>(e.currentTarget.style.backgroundColor='transparent')}>
                    <div style={{width:36,height:36,borderRadius:10,backgroundColor:color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:700,flexShrink:0,marginTop:2}}>
                      {projectInitials(p.name)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                        <p style={{color:'#d1d5db',fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</p>
                        <span style={{color:'#4b5563',fontSize:11,flexShrink:0,marginLeft:8}}>{prog}%</span>
                      </div>
                      <div style={{height:3,backgroundColor:'#0f1e30',borderRadius:2,marginBottom:6}}>
                        <div style={{height:3,borderRadius:2,backgroundColor:color,width:`${prog}%`,transition:'width 0.3s'}}/>
                      </div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        {prog<100&&next
                          ? <span style={{color:'#374151',fontSize:11}}>→ заповнити {next}</span>
                          : <span style={{color:'#10b981',fontSize:11}}>✓ повністю заповнено</span>}
                        <span style={{color:'#1f2937',fontSize:11,flexShrink:0,marginLeft:8}}>{fmtUpdated(p.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Week calendar */}
        <div style={{backgroundColor:'#0c1524',border:'1px solid rgba(255,255,255,0.05)',borderRadius:14,padding:22}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
            <h2 style={{color:'#e2e8f0',fontSize:15,fontWeight:600}}>Контент цього тижня</h2>
            <button onClick={()=>onNavigate('calendar')} style={{color:'#3b82f6',fontSize:12,background:'none',border:'none',cursor:'pointer'}}>Планер →</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:12}}>
            {weekDays.map(d=>(
              <div key={d.date} style={{textAlign:'center'}}>
                <p style={{color:'#374151',fontSize:10,marginBottom:4}}>{d.label}</p>
                <div style={{width:28,height:28,borderRadius:8,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center',
                  backgroundColor:d.date===todayStr?'#1d4ed8':'transparent',
                  border:d.date===todayStr?'none':'1px solid rgba(255,255,255,0.04)'}}>
                  <span style={{color:d.date===todayStr?'#fff':'#4b5563',fontSize:11}}>{d.date.slice(8)}</span>
                </div>
                <div style={{marginTop:4,display:'flex',flexDirection:'column',gap:2}}>
                  {events.filter(e=>e.date===d.date).slice(0,3).map(e=>(
                    <div key={e.id} style={{height:4,borderRadius:2,backgroundColor:EVENT_COLORS[e.type]}}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {events.length===0?(
            <p style={{color:'#374151',fontSize:12,textAlign:'center',paddingTop:8}}>Немає подій цього тижня</p>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {events.slice(0,4).map(e=>(
                <div key={e.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',backgroundColor:'#0f1e30',borderRadius:8}}>
                  <div style={{width:8,height:8,borderRadius:4,backgroundColor:EVENT_COLORS[e.type],flexShrink:0}}/>
                  <p style={{color:'#d1d5db',fontSize:12,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.title}</p>
                  <span style={{color:'#374151',fontSize:11,flexShrink:0}}>{EVENT_UA[e.type]}</span>
                </div>
              ))}
              {events.length>4&&<p style={{color:'#374151',fontSize:11,textAlign:'center'}}>+{events.length-4} подій</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ProjectsView ─────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['🚀','💼','🎯','✨','🌿','🔥','💡','🎨','📱','🛍️','🏋️','🍕','🌍','💎','🎵']

function ProjectsView({projects,onRefresh}:{projects:Project[];onRefresh:()=>void}) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🚀')
  const [newDesc, setNewDesc] = useState('')
  const [newPlatforms, setNewPlatforms] = useState<string[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null)

  function handleCreate() {
    if (!newName.trim()) return
    const p = createProject(newName.trim(), newEmoji, newDesc.trim(), newPlatforms)
    onRefresh()
    setShowCreate(false)
    setNewName(''); setNewDesc(''); setNewEmoji('🚀'); setNewPlatforms([])
    router.push(`/projects/${p.id}`)
  }

  function handleDelete(id:string) {
    deleteProject(id); onRefresh(); setDeleteConfirm(null)
  }

  function togglePlatform(pl:string) {
    setNewPlatforms(prev=>prev.includes(pl)?prev.filter(x=>x!==pl):[...prev,pl])
  }

  return (
    <div style={{padding:'36px 44px',maxWidth:1100}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
        <div>
          <h1 style={{color:'#e2e8f0',fontSize:24,fontWeight:700}}>Проєкти</h1>
          <p style={{color:'#4b5563',fontSize:13,marginTop:2}}>{projects.length} проєктів</p>
        </div>
        <button onClick={()=>setShowCreate(true)}
          style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',backgroundColor:'#1d4ed8',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
          <Plus size={16}/>Новий проєкт
        </button>
      </div>

      {projects.length===0?(
        <div style={{textAlign:'center',padding:'80px 20px'}}>
          <p style={{color:'#374151',fontSize:16,marginBottom:12}}>Поки що немає проєктів</p>
          <button onClick={()=>setShowCreate(true)}
            style={{display:'inline-flex',alignItems:'center',gap:7,padding:'10px 20px',backgroundColor:'#1d4ed8',color:'#fff',border:'none',borderRadius:10,fontSize:14,cursor:'pointer'}}>
            <Plus size={15}/>Створити перший
          </button>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:18}}>
          {projects.map(p=>{
            const prog=getProgress(p.data)
            const color=getProjectColor(p.id)
            return (
              <div key={p.id} onClick={()=>router.push(`/projects/${p.id}`)}
                style={{backgroundColor:'#0c1524',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:22,cursor:'pointer',transition:'border-color 0.15s,transform 0.1s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='rgba(59,130,246,0.3)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-1px)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='rgba(255,255,255,0.06)';(e.currentTarget as HTMLDivElement).style.transform='none'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:44,height:44,borderRadius:12,backgroundColor:color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:15,fontWeight:700,flexShrink:0}}>
                      {projectInitials(p.name)}
                    </div>
                    <div>
                      <p style={{color:'#e2e8f0',fontSize:14,fontWeight:600,lineHeight:1.3}}>{p.name}</p>
                      {p.description&&<p style={{color:'#4b5563',fontSize:12,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{p.description}</p>}
                    </div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setDeleteConfirm(p.id)}}
                    style={{background:'none',border:'none',color:'#374151',cursor:'pointer',padding:4,borderRadius:6,flexShrink:0}}
                    onMouseEnter={e=>(e.currentTarget.style.color='#ef4444')}
                    onMouseLeave={e=>(e.currentTarget.style.color='#374151')}>
                    <Trash2 size={14}/>
                  </button>
                </div>

                {p.platforms.length>0&&(
                  <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:12}}>
                    {p.platforms.map(pl=>(
                      <span key={pl} style={{fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:500,
                        backgroundColor:PLATFORM_COLORS[pl]?PLATFORM_COLORS[pl]+'22':'rgba(255,255,255,0.07)',
                        color:PLATFORM_COLORS[pl]||'#9ca3af',border:`1px solid ${PLATFORM_COLORS[pl]||'#374151'}44`}}>
                        {pl}
                      </span>
                    ))}
                  </div>
                )}

                <div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{color:'#4b5563',fontSize:11}}>Заповнено</span>
                    <span style={{color:'#6b7280',fontSize:11,fontWeight:500}}>{prog}%</span>
                  </div>
                  <div style={{height:5,backgroundColor:'#0f1e30',borderRadius:3}}>
                    <div style={{height:5,borderRadius:3,backgroundColor:color,width:`${prog}%`,transition:'width 0.4s'}}/>
                  </div>
                </div>

                <div style={{marginTop:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{color:'#374151',fontSize:11}}>{new Date(p.updatedAt).toLocaleDateString('uk-UA')}</span>
                  <span style={{color:prog===100?'#10b981':prog>50?'#f59e0b':'#6b7280',fontSize:11,fontWeight:500}}>
                    {prog===100?'Готово':prog>50?'В роботі':'Початок'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate&&(
        <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
          <div style={{backgroundColor:'#0c1524',border:'1px solid rgba(255,255,255,0.08)',borderRadius:18,padding:28,width:480,maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
              <h3 style={{color:'#e2e8f0',fontSize:17,fontWeight:600}}>Новий проєкт</h3>
              <button onClick={()=>setShowCreate(false)} style={{background:'none',border:'none',color:'#4b5563',cursor:'pointer'}}><X size={18}/></button>
            </div>

            <div style={{marginBottom:14}}>
              <p style={{color:'#6b7280',fontSize:12,marginBottom:8}}>Назва</p>
              <input value={newName} onChange={e=>setNewName(e.target.value)}
                placeholder="Назва проєкту"
                style={{width:'100%',backgroundColor:'#0f1e30',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'10px 14px',color:'#e2e8f0',fontSize:14,outline:'none'}}/>
            </div>

            <div style={{marginBottom:14}}>
              <p style={{color:'#6b7280',fontSize:12,marginBottom:8}}>Опис</p>
              <textarea value={newDesc} onChange={e=>setNewDesc(e.target.value)}
                placeholder="Короткий опис"
                rows={2}
                style={{width:'100%',backgroundColor:'#0f1e30',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'10px 14px',color:'#e2e8f0',fontSize:14,outline:'none',resize:'vertical',minHeight:60}}/>
            </div>

            <div style={{marginBottom:14}}>
              <p style={{color:'#6b7280',fontSize:12,marginBottom:8}}>Емодзі</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {EMOJI_OPTIONS.map(em=>(
                  <button key={em} onClick={()=>setNewEmoji(em)}
                    style={{width:34,height:34,borderRadius:8,fontSize:16,border:'none',cursor:'pointer',
                      backgroundColor:newEmoji===em?'rgba(37,99,235,0.3)':'rgba(255,255,255,0.04)',
                      outline:newEmoji===em?'2px solid #3b82f6':'none'}}>
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:22}}>
              <p style={{color:'#6b7280',fontSize:12,marginBottom:8}}>Платформи</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {PLATFORM_OPTIONS.map(pl=>{
                  const sel=newPlatforms.includes(pl)
                  const c=PLATFORM_COLORS[pl]||'#6b7280'
                  return (
                    <button key={pl} onClick={()=>togglePlatform(pl)}
                      style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:500,cursor:'pointer',border:'none',transition:'all 0.12s',
                        backgroundColor:sel?c+'33':'rgba(255,255,255,0.04)',
                        color:sel?c:'#4b5563',
                        outline:sel?`1px solid ${c}55`:'none'}}>
                      {pl}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setShowCreate(false)}
                style={{flex:1,padding:'10px',backgroundColor:'rgba(255,255,255,0.04)',color:'#9ca3af',border:'none',borderRadius:10,fontSize:14,cursor:'pointer'}}>
                Скасувати
              </button>
              <button onClick={handleCreate} disabled={!newName.trim()}
                style={{flex:1,padding:'10px',backgroundColor:'#1d4ed8',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',opacity:newName.trim()?1:0.4}}>
                Створити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm&&(()=>{const p=projects.find(x=>x.id===deleteConfirm);return p?(
        <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
          <div style={{backgroundColor:'#0c1524',border:'1px solid rgba(255,255,255,0.08)',borderRadius:18,padding:28,width:360}}>
            <h3 style={{color:'#e2e8f0',fontSize:16,fontWeight:600,marginBottom:8}}>Видалити проєкт?</h3>
            <p style={{color:'#6b7280',fontSize:13,marginBottom:22}}>«{p.name}» буде видалено назавжди.</p>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setDeleteConfirm(null)}
                style={{flex:1,padding:'10px',backgroundColor:'rgba(255,255,255,0.04)',color:'#9ca3af',border:'none',borderRadius:10,fontSize:14,cursor:'pointer'}}>
                Скасувати
              </button>
              <button onClick={()=>handleDelete(deleteConfirm)}
                style={{flex:1,padding:'10px',backgroundColor:'#dc2626',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
                Видалити
              </button>
            </div>
          </div>
        </div>
      ):null})()}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const NAV_STORAGE_KEY = 'smm_active_nav'
const VALID_VIEWS: NavView[] = ['dashboard','projects','calendar','analytics']

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [nav, setNav] = useState<NavView>('dashboard')
  useEffect(() => {
    setProjects(getProjects())
    const saved = localStorage.getItem(NAV_STORAGE_KEY) as NavView | null
    if (saved && VALID_VIEWS.includes(saved)) setNav(saved)
  }, [])
  function refresh(){setProjects(getProjects())}
  function navigate(v: NavView) { setNav(v); localStorage.setItem(NAV_STORAGE_KEY, v) }
  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',backgroundColor:'#070d1a'}}>
      <Sidebar active={nav} onNav={navigate} projects={projects}/>
      <main style={{flex:1,overflowY:'auto',backgroundColor:'#070d1a'}}>
        {nav==='dashboard'&&<DashboardView projects={projects} onNavigate={navigate}/>}
        {nav==='projects'&&<ProjectsView projects={projects} onRefresh={refresh}/>}
        {nav==='calendar'&&<div style={{padding:'36px 44px'}}><CalendarView projects={projects}/></div>}
        {nav==='analytics'&&<div style={{padding:'36px 44px'}}><AnalyticsView projects={projects} onUpdate={refresh}/></div>}
      </main>
    </div>
  )
}
