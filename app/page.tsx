'use client'
import { useState, useEffect, useRef } from 'react'
import { User, Target, CalendarDays, BarChart2, Users, Download, Upload, Plus, X, Edit2, Trash2, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react'
import type { BrandProfile, StrategyData, Goal, AudienceDimension, ContentRubric, PromotionChannel, CalEvent, CalEventType, PostData, SubEntry, Client, ClientStatus, Competitor } from '@/types'
import { K, ld, sv, DP, DS, exportBackup, importBackup } from '@/lib/storage'

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0A1E14', surf: '#14342B', surf2: '#1A3D30',
  border: 'rgba(96,147,93,0.22)', accent: '#C8D96F',
  green: '#60935D', text: '#F5F0E8',
  muted: 'rgba(245,240,232,0.5)', dim: 'rgba(245,240,232,0.18)',
}

type Section = 'profile' | 'strategy' | 'calendar' | 'analytics' | 'clients'

// ─── Shared UI ────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', backgroundColor: 'rgba(0,0,0,0.28)',
  border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.text, fontFamily: 'var(--font-body)', fontSize: 14,
  padding: '10px 12px', boxSizing: 'border-box',
}

function Field({ label, value, onChange, multiline, rows = 4, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void
  multiline?: boolean; rows?: number; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</label>
      {multiline
        ? <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, height: 40 }} />}
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', sm, disabled }: {
  children: React.ReactNode; onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'; sm?: boolean; disabled?: boolean
}) {
  const vs = {
    primary: { background: C.accent, color: C.surf, border: 'none' },
    ghost: { background: 'transparent', color: C.text, border: `1px solid ${C.border}` },
    danger: { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
  }
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...vs[variant], padding: sm ? '5px 12px' : '9px 20px', borderRadius: 8, fontSize: sm ? 12 : 14, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.surf, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, ...style }}>{children}</div>
}

function Hd({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: 'var(--font-head)', color: C.text, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 18, textTransform: 'uppercase' }}>{children}</h2>
}

function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="slide-up" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
      onClick={onClose}>
      <div style={{ background: C.surf, borderRadius: 18, padding: 30, width: '100%', maxWidth: wide ? 680 : 500, maxHeight: '88vh', overflowY: 'auto', border: `1px solid ${C.border}` }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', color: C.text, fontSize: 16 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV: [Section, string, React.ElementType][] = [
  ['profile', 'Профіль', User],
  ['strategy', 'Стратегія', Target],
  ['calendar', 'Календар', CalendarDays],
  ['analytics', 'Аналітика', BarChart2],
  ['clients', 'Клієнти', Users],
]

function Sidebar({ active, onChange, onExport, onImport }: {
  active: Section; onChange: (s: Section) => void
  onExport: () => void; onImport: () => void
}) {
  return (
    <aside style={{ width: 230, flexShrink: 0, background: C.surf, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, borderRight: `1px solid ${C.border}` }}>
      <div style={{ padding: '24px 16px 16px' }}>
        <div style={{ fontFamily: 'var(--font-head)', color: C.accent, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Brand</div>
        <div style={{ fontFamily: 'var(--font-head)', color: C.muted, fontSize: 11, marginTop: 2 }}>Dashboard</div>
      </div>
      <nav style={{ flex: 1, padding: '8px 10px' }}>
        {NAV.map(([id, label, Icon]) => {
          const active_ = active === id
          return (
            <button key={id} onClick={() => onChange(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, marginBottom: 2, border: 'none', cursor: 'pointer',
              background: active_ ? 'rgba(200,217,111,0.12)' : 'transparent',
              color: active_ ? C.accent : C.muted, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: active_ ? 600 : 400,
            }}>
              <Icon size={17} />{label}
            </button>
          )
        })}
      </nav>
      <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}` }}>
        <button onClick={onExport} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: C.dim, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)' }}>
          <Download size={14} />Зберегти дані
        </button>
        <button onClick={onImport} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: C.dim, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)' }}>
          <Upload size={14} />Відновити дані
        </button>
      </div>
    </aside>
  )
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function parseCompetitors(raw: string): Competitor[] {
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
}

function ProfileSection() {
  const [p, setP] = useState<BrandProfile>(() => ld(K.prof, DP))
  const u = (f: keyof BrandProfile) => (v: string) => {
    const next = { ...p, [f]: v }
    setP(next); sv(K.prof, next)
  }

  const competitors = parseCompetitors(p.competitors)
  const saveCompetitors = (list: Competitor[]) => u('competitors')(JSON.stringify(list))
  const addCompetitor = () => saveCompetitors([...competitors, { id: crypto.randomUUID(), name: '', strengths: '', weaknesses: '', diff: '' }])
  const updCompetitor = (id: string, f: keyof Competitor, v: string) =>
    saveCompetitors(competitors.map(c => c.id === id ? { ...c, [f]: v } : c))
  const delCompetitor = (id: string) => saveCompetitors(competitors.filter(c => c.id !== id))

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 40px' }}>
      <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, marginBottom: 32, color: C.text }}>Профіль бренду</h1>

      {/* 1. Хто я */}
      <Card style={{ marginBottom: 20 }}>
        <Hd>Хто я</Hd>
        <Field label="Ім'я / Назва бренду" value={p.brandName} onChange={u('brandName')} placeholder="Як вас звати або назва бренду" />
        <Field label="Послуги" value={p.services} onChange={u('services')} multiline rows={3} placeholder="Що саме ви пропонуєте?" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <Field label="Географія" value={p.geography} onChange={u('geography')} placeholder="Місто, країна, онлайн…" />
          <Field label="Ціни" value={p.prices} onChange={u('prices')} placeholder="Від … грн / пакет від …" />
        </div>
      </Card>

      {/* 2. Місія, візія, цінності */}
      <Card style={{ marginBottom: 20 }}>
        <Hd>Місія, візія, цінності</Hd>
        <Field label="Місія" value={p.mission} onChange={u('mission')} multiline rows={3} placeholder="Навіщо ви існуєте? Яку проблему вирішуєте?" />
        <Field label="Візія" value={p.vision} onChange={u('vision')} multiline rows={3} placeholder="Яким ви бачите бренд через 3–5 років?" />
        <Field label="Цінності" value={p.values} onChange={u('values')} multiline rows={3} placeholder="Принципи, якими керується бренд" />
      </Card>

      {/* 3. Архетипи, вороги, кити */}
      <Card style={{ marginBottom: 20 }}>
        <Hd>Архетипи, вороги, кити</Hd>
        <Field label="Архетипи бренду" value={p.archetypes} onChange={u('archetypes')} multiline rows={3} placeholder="Герой, Мудрець, Творець… який архетип і чому?" />
        <Field label="Вороги бренду" value={p.enemies} onChange={u('enemies')} multiline rows={3} placeholder="Від чого рятуєте клієнта? Що ви відкидаєте?" />
        <Field label="Кити (комунікаційні стовпи)" value={p.pillars} onChange={u('pillars')} multiline rows={3} placeholder="3–5 ключових тем, навколо яких будується весь контент" />
      </Card>

      {/* 4. УЦП і ключовий меседж */}
      <Card style={{ marginBottom: 20 }}>
        <Hd>УЦП і ключовий меседж</Hd>
        <Field label="Унікальна ціннісна пропозиція (УЦП)" value={p.uvp} onChange={u('uvp')} multiline rows={3} placeholder="Що вирізняє вас серед усіх інших?" />
        <Field label="Ключовий меседж" value={p.keyMessage} onChange={u('keyMessage')} multiline rows={3} placeholder="Одне речення, яке описує суть вашого бренду" />
      </Card>

      {/* 5. Tone of Voice */}
      <Card style={{ marginBottom: 20 }}>
        <Hd>Tone of Voice</Hd>
        <Field label="Тон і стиль спілкування" value={p.toneOfVoice} onChange={u('toneOfVoice')} multiline rows={6} placeholder={'Як ви говорите з аудиторією?\n\nНаприклад:\n— Дружній, відкритий, без канцеляриту\n— Звертаємось на «ти»\n— Використовуємо гумор, але без зарозумілості\n— Не вживаємо: синергія, інноваційний, унікальний'} />
      </Card>

      {/* 6. БІО профілю і хайлайтси */}
      <Card style={{ marginBottom: 20 }}>
        <Hd>БІО профілю і хайлайтси</Hd>
        <Field label="БІО профілю" value={p.bioProfile} onChange={u('bioProfile')} multiline rows={4} placeholder={'Текст шапки профілю в Instagram/TikTok\n\nНаприклад:\nSMM-стратег для малого бізнесу 🌿\nДопомагаю продавати через Instagram\n↓ Безкоштовна консультація'} />
        <Field label="Хайлайтси" value={p.highlights} onChange={u('highlights')} multiline rows={3} placeholder="Які рубрики хайлайтсів? Що в кожній?" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <Field label="Instagram" value={p.instagram} onChange={u('instagram')} placeholder="@username" />
          <Field label="TikTok" value={p.tiktok} onChange={u('tiktok')} placeholder="@username" />
          <Field label="Facebook" value={p.facebook} onChange={u('facebook')} placeholder="URL сторінки" />
          <Field label="YouTube" value={p.youtube} onChange={u('youtube')} placeholder="URL каналу" />
          <Field label="Сайт" value={p.website} onChange={u('website')} placeholder="https://…" />
        </div>
      </Card>

      {/* 7. Конкуренти */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <Hd>Конкуренти</Hd>
          <Btn sm onClick={addCompetitor}><Plus size={14} />Додати</Btn>
        </div>
        {competitors.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>Ще немає конкурентів. Додайте першого.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {competitors.map((c, i) => (
            <div key={c.id} style={{ background: C.surf2, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Конкурент {i + 1}</span>
                <button onClick={() => delCompetitor(c.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>
              <Field label="Назва / Ім'я" value={c.name} onChange={v => updCompetitor(c.id, 'name', v)} placeholder="Хто це?" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <Field label="Сильні сторони" value={c.strengths} onChange={v => updCompetitor(c.id, 'strengths', v)} multiline rows={3} placeholder="Що вони роблять добре?" />
                <Field label="Слабкі сторони" value={c.weaknesses} onChange={v => updCompetitor(c.id, 'weaknesses', v)} multiline rows={3} placeholder="Де вони програють?" />
              </div>
              <Field label="Моя відмінність" value={c.diff} onChange={v => updCompetitor(c.id, 'diff', v)} multiline rows={2} placeholder="Чому клієнт оберe мене, а не їх?" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Strategy Section ─────────────────────────────────────────────────────────
const RUBRIC_COLORS = ['#C8D96F','#60935D','#F5F0E8','#4ade80','#facc15','#f97316','#818cf8','#f472b6']

const AUDIENCE_DIMS_META = [
  { key: 'who',         label: 'Хто це' },
  { key: 'pains',       label: 'Болі та проблеми' },
  { key: 'desires',     label: 'Бажання та мрії' },
  { key: 'fears',       label: 'Страхи та сумніви' },
  { key: 'objections',  label: 'Заперечення' },
  { key: 'values',      label: 'Цінності' },
  { key: 'triggers',    label: 'Тригери до дії' },
  { key: 'behavior',    label: 'Поведінка онлайн' },
  { key: 'touchpoints', label: 'Точки дотику' },
]
const DFLT_AUDIENCE: AudienceDimension[] = AUDIENCE_DIMS_META.map(d => ({ key: d.key, label: d.label, details: '', content: '', action: '' }))
const DFLT_RUBRICS: ContentRubric[] = [
  { id: 'r1', name: '', description: '', format: '', frequency: '', goal: '', color: '#C8D96F' },
  { id: 'r2', name: '', description: '', format: '', frequency: '', goal: '', color: '#60935D' },
  { id: 'r3', name: '', description: '', format: '', frequency: '', goal: '', color: '#F5F0E8' },
]

function StrategySection() {
  const [s, setS] = useState<StrategyData>(() => {
    const saved = ld(K.strat, DS)
    return {
      ...saved,
      goals: (saved.goals ?? []).map(g => ({ ...g, type: (g as Goal).type ?? 'strategic' })),
      audience: (saved.audience && saved.audience.length === 9) ? saved.audience : DFLT_AUDIENCE,
      rubrics: (saved.rubrics && saved.rubrics.length === 3 && (saved.rubrics[0] as ContentRubric).description !== undefined)
        ? saved.rubrics as ContentRubric[] : DFLT_RUBRICS,
      channels: saved.channels ?? [],
    }
  })
  const save = (next: StrategyData) => { setS(next); sv(K.strat, next) }

  const [goalModal, setGoalModal] = useState<'strategic' | 'tactical' | null>(null)
  const gDraft = useRef<Goal>({ id: '', title: '', target: 100, current: 0, unit: '', deadline: '', type: 'strategic' })

  function openGoal(type: 'strategic' | 'tactical', g?: Goal) {
    gDraft.current = g ? { ...g } : { id: '', title: '', target: 100, current: 0, unit: '', deadline: '', type }
    setGoalModal(type)
  }
  function saveGoal() {
    const d = gDraft.current
    if (!d.title) return
    const goals = d.id ? s.goals.map(g => g.id === d.id ? d : g) : [...s.goals, { ...d, id: crypto.randomUUID() }]
    save({ ...s, goals }); setGoalModal(null)
  }
  function delGoal(id: string) { save({ ...s, goals: s.goals.filter(g => g.id !== id) }) }
  function updGoalCurrent(id: string, v: number) { save({ ...s, goals: s.goals.map(g => g.id === id ? { ...g, current: v } : g) }) }

  function updAudience(key: string, field: keyof AudienceDimension, value: string) {
    save({ ...s, audience: s.audience.map(a => a.key === key ? { ...a, [field]: value } : a) })
  }
  function updRubric(id: string, field: keyof ContentRubric, value: string) {
    save({ ...s, rubrics: s.rubrics.map(r => r.id === id ? { ...r, [field]: value } : r) })
  }
  function addChannel() {
    save({ ...s, channels: [...(s.channels ?? []), { id: crypto.randomUUID(), name: '', actions: '', budget: '' }] })
  }
  function updChannel(id: string, field: keyof PromotionChannel, value: string) {
    save({ ...s, channels: s.channels.map(ch => ch.id === id ? { ...ch, [field]: value } : ch) })
  }
  function delChannel(id: string) { save({ ...s, channels: s.channels.filter(ch => ch.id !== id) }) }

  const strategic = s.goals.filter(g => g.type === 'strategic')
  const tactical = s.goals.filter(g => g.type === 'tactical')

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 40px' }}>
      <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, marginBottom: 32, color: C.text }}>Стратегія і контент</h1>

      {/* 1. ЦІЛІ */}
      <Card style={{ marginBottom: 20 }}>
        <Hd>Цілі</Hd>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: C.accent, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Стратегічні</span>
              <Btn sm onClick={() => openGoal('strategic')}><Plus size={13} />Додати</Btn>
            </div>
            {strategic.length === 0 && <p style={{ color: C.dim, fontSize: 13 }}>Немає стратегічних цілей</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {strategic.map(g => <GoalRow key={g.id} g={g} onEdit={() => openGoal('strategic', g)} onDel={() => delGoal(g.id)} onCurrent={v => updGoalCurrent(g.id, v)} />)}
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: C.green, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Тактичні</span>
              <Btn sm onClick={() => openGoal('tactical')}><Plus size={13} />Додати</Btn>
            </div>
            {tactical.length === 0 && <p style={{ color: C.dim, fontSize: 13 }}>Немає тактичних цілей</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tactical.map(g => <GoalRow key={g.id} g={g} onEdit={() => openGoal('tactical', g)} onDel={() => delGoal(g.id)} onCurrent={v => updGoalCurrent(g.id, v)} />)}
            </div>
          </div>
        </div>
      </Card>

      {/* 2. ЦА — 9 вимірів */}
      <Card style={{ marginBottom: 20 }}>
        <Hd>ЦА — 9 вимірів шляху клієнта</Hd>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 660 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '155px 1fr 1fr 1fr', gap: 2, marginBottom: 2 }}>
              <div style={{ background: C.surf2, borderRadius: '8px 0 0 0', padding: '8px 12px' }} />
              {['Опис аудиторії', 'Контент', 'Дія'].map((h, i, arr) => (
                <div key={h} style={{ background: C.surf2, padding: '8px 12px', borderRadius: i === arr.length - 1 ? '0 8px 0 0' : 0, color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
              ))}
            </div>
            {s.audience.map((a, i) => (
              <div key={a.key} style={{ display: 'grid', gridTemplateColumns: '155px 1fr 1fr 1fr', gap: 2, marginBottom: 2 }}>
                <div style={{ background: C.surf2, display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: i === 8 ? '0 0 0 8px' : 0 }}>
                  <span style={{ color: C.accent, fontWeight: 700, fontSize: 13, lineHeight: 1.35 }}>{a.label}</span>
                </div>
                {(['details', 'content', 'action'] as const).map((f, fi) => (
                  <textarea key={f} value={a[f]} onChange={e => updAudience(a.key, f, e.target.value)} rows={3}
                    placeholder={f === 'details' ? 'Хто/що...' : f === 'content' ? 'Який контент...' : 'Яка дія...'}
                    style={{ ...inputStyle, minHeight: 80, background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: fi === 2 && i === 8 ? '0 0 8px 0' : 0, resize: 'none', fontSize: 13 }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 3. РУБРИКИ */}
      <Card style={{ marginBottom: 20 }}>
        <Hd>Рубрики контенту</Hd>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {s.rubrics.map((r, i) => (
            <div key={r.id} style={{ background: C.surf2, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ height: 5, background: r.color }} />
              <div style={{ padding: '14px 16px' }}>
                <input value={r.name} onChange={e => updRubric(r.id, 'name', e.target.value)} placeholder={`Рубрика ${i + 1}`}
                  style={{ ...inputStyle, fontWeight: 700, fontSize: 15, marginBottom: 12, border: 'none', background: 'transparent', padding: '2px 0' }} />
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: C.muted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Колір</label>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {RUBRIC_COLORS.map(c => (
                      <button key={c} onClick={() => updRubric(r.id, 'color', c)} style={{ width: 20, height: 20, borderRadius: 4, background: c, border: r.color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
                <Field label="Опис" value={r.description} onChange={v => updRubric(r.id, 'description', v)} multiline rows={3} placeholder="Про що ця рубрика?" />
                <Field label="Формат" value={r.format} onChange={v => updRubric(r.id, 'format', v)} placeholder="Reels, Пост, Сторіс…" />
                <Field label="Частота" value={r.frequency} onChange={v => updRubric(r.id, 'frequency', v)} placeholder="2× на тиждень" />
                <Field label="Мета" value={r.goal} onChange={v => updRubric(r.id, 'goal', v)} placeholder="Залучити, продати…" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. ПРОСУВАННЯ */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <Hd>Просування</Hd>
          <Btn sm onClick={addChannel}><Plus size={14} />Канал</Btn>
        </div>
        {(s.channels ?? []).length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>Додайте канали просування.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(s.channels ?? []).map(ch => (
            <div key={ch.id} style={{ background: C.surf2, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <Field label="Канал" value={ch.name} onChange={v => updChannel(ch.id, 'name', v)} placeholder="Instagram, TikTok, Email, Telegram…" />
                </div>
                <div style={{ width: 160 }}>
                  <Field label="Бюджет / Ресурс" value={ch.budget} onChange={v => updChannel(ch.id, 'budget', v)} placeholder="5 000 грн/міс" />
                </div>
                <button onClick={() => delChannel(ch.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', marginBottom: 18 }}><Trash2 size={15} /></button>
              </div>
              <Field label="Дії та тактики" value={ch.actions} onChange={v => updChannel(ch.id, 'actions', v)} multiline rows={3} placeholder="Що саме робимо на цьому каналі?" />
            </div>
          ))}
        </div>
      </Card>

      {/* Goal modal */}
      <Modal open={!!goalModal} onClose={() => setGoalModal(null)} title={gDraft.current.id ? 'Редагувати ціль' : goalModal === 'strategic' ? 'Нова стратегічна ціль' : 'Нова тактична ціль'}>
        <StratGoalForm draft={gDraft.current} onChange={d => { gDraft.current = d }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <div>{gDraft.current.id && <Btn variant="danger" sm onClick={() => { delGoal(gDraft.current.id); setGoalModal(null) }}><Trash2 size={13} />Видалити</Btn>}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setGoalModal(null)}>Скасувати</Btn>
            <Btn onClick={saveGoal}>Зберегти</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function GoalRow({ g, onEdit, onDel, onCurrent }: { g: Goal; onEdit: () => void; onDel: () => void; onCurrent: (v: number) => void }) {
  const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0
  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{g.title || '—'}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><Edit2 size={13} /></button>
          <button onClick={onDel} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={13} /></button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, height: 5, background: 'rgba(0,0,0,0.3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: C.accent, borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
        <span style={{ color: C.accent, fontSize: 12, fontWeight: 700, minWidth: 34 }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: C.muted, fontSize: 12 }}>Факт:</span>
        <input type="number" value={g.current} onChange={e => onCurrent(Number(e.target.value) || 0)}
          style={{ ...inputStyle, width: 80, height: 30, padding: '4px 8px', fontSize: 12 }} />
        <span style={{ color: C.muted, fontSize: 12 }}>/ {g.target} {g.unit}</span>
        {g.deadline && <span style={{ color: C.dim, fontSize: 11, marginLeft: 'auto' }}>до {g.deadline}</span>}
      </div>
    </div>
  )
}

function StratGoalForm({ draft, onChange }: { draft: Goal; onChange: (d: Goal) => void }) {
  const [d, setD] = useState(draft)
  const u = (f: keyof Goal, v: string | number) => { const next = { ...d, [f]: v }; setD(next); onChange(next) }
  return (
    <div>
      <Field label="Назва цілі" value={d.title} onChange={v => u('title', v)} placeholder="Досягти 10К підписників" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
        <Field label="Поточне" value={String(d.current)} onChange={v => u('current', Number(v) || 0)} />
        <Field label="Ціль" value={String(d.target)} onChange={v => u('target', Number(v) || 0)} />
        <Field label="Одиниця" value={d.unit} onChange={v => u('unit', v)} placeholder="підп., грн…" />
      </div>
      <Field label="Дедлайн" value={d.deadline} onChange={v => u('deadline', v)} placeholder="2025-12-31" />
    </div>
  )
}

// ─── Calendar Section ─────────────────────────────────────────────────────────
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const MONTHS_UK = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']
const PLATFORMS = ['Instagram', 'TikTok', 'Facebook', 'YouTube', 'LinkedIn', 'Інше']
const FORMATS = ['Reels', 'Пост', 'Сторіс', 'Карусель', 'Live', 'Інше']
const today = () => new Date().toISOString().slice(0, 10)

function CalendarSection() {
  const [events, setEvents] = useState<CalEvent[]>(() => ld(K.cal, []))
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [vDate, setVDate] = useState(new Date())
  const [modal, setModal] = useState<CalEvent | null | 'new'>(null)
  const [prefill, setPrefill] = useState<Partial<CalEvent>>({})
  const draft = useRef<CalEvent>({ id: '', title: '', date: today(), time: '', type: 'task', platform: '', format: '', notes: '' })

  const save = (next: CalEvent[]) => { setEvents(next); sv(K.cal, next) }

  function openNew(date?: string) {
    draft.current = { id: '', title: '', date: date ?? today(), time: '', type: 'task', platform: '', format: '', notes: '' }
    setPrefill(date ? { date } : {})
    setModal('new')
  }
  function openEdit(e: CalEvent) { draft.current = { ...e }; setModal(e) }
  function saveEvent() {
    const d = draft.current
    if (!d.title) return
    const next = d.id ? events.map(e => e.id === d.id ? d : e) : [...events, { ...d, id: crypto.randomUUID() }]
    save(next); setModal(null)
  }
  function delEvent(id: string) { save(events.filter(e => e.id !== id)) }

  function eventStatus(e: CalEvent) {
    if (e.type !== 'publication') return null
    const t = today()
    if (e.date > t) return null
    const diffH = (Date.now() - new Date(e.date).getTime()) / 3600000
    if (diffH >= 24) return 'analytics'
    return 'published'
  }

  const navPrev = () => {
    const d = new Date(vDate)
    if (view === 'month') d.setMonth(d.getMonth() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else d.setDate(d.getDate() - 1)
    setVDate(d)
  }
  const navNext = () => {
    const d = new Date(vDate)
    if (view === 'month') d.setMonth(d.getMonth() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else d.setDate(d.getDate() + 1)
    setVDate(d)
  }

  function monthDays(): (string | null)[] {
    const y = vDate.getFullYear(), m = vDate.getMonth()
    const first = new Date(y, m, 1)
    const startDow = (first.getDay() + 6) % 7
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const cells: (string | null)[] = Array(startDow).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }

  function weekDays(): string[] {
    const d = new Date(vDate)
    const dow = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - dow)
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(d); dd.setDate(dd.getDate() + i)
      return dd.toISOString().slice(0, 10)
    })
  }

  function fmtLabel() {
    if (view === 'month') return `${MONTHS_UK[vDate.getMonth()]} ${vDate.getFullYear()}`
    if (view === 'week') {
      const days = weekDays()
      return `${days[0].slice(8)}.${days[0].slice(5, 7)} — ${days[6].slice(8)}.${days[6].slice(5, 7)}`
    }
    return `${vDate.getDate()} ${MONTHS_UK[vDate.getMonth()]} ${vDate.getFullYear()}`
  }

  function EventPill({ e }: { e: CalEvent }) {
    const st = eventStatus(e)
    const isTask = e.type === 'task'
    return (
      <div style={{ background: isTask ? 'rgba(96,147,93,0.25)' : 'rgba(200,217,111,0.18)', borderLeft: `3px solid ${isTask ? C.green : C.accent}`, borderRadius: 5, padding: '3px 7px', marginBottom: 3, cursor: 'pointer', fontSize: 11 }}
        onClick={ev => { ev.stopPropagation(); openEdit(e) }}>
        <div style={{ color: C.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
        {st === 'analytics' && <div style={{ color: '#fbbf24', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}><AlertCircle size={9} />Аналітика</div>}
        {st === 'published' && <div style={{ color: C.green, fontSize: 10 }}>✓ Опубліковано</div>}
      </div>
    )
  }

  const viewDateStr = vDate.toISOString().slice(0, 10)

  return (
    <div style={{ padding: '40px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, color: C.text }}>Календар</h1>
        <Btn onClick={() => openNew()}><Plus size={15} />Подія</Btn>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['month', 'week', 'day'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: view === v ? 600 : 400, background: view === v ? C.accent : C.surf2, color: view === v ? C.surf : C.muted }}>
              {v === 'month' ? 'Місяць' : v === 'week' ? 'Тиждень' : 'День'}
            </button>
          ))}
        </div>
        <button onClick={navPrev} style={{ background: C.surf, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', color: C.text, cursor: 'pointer' }}><ChevronLeft size={16} /></button>
        <span style={{ color: C.text, fontWeight: 600, fontSize: 15, minWidth: 180, textAlign: 'center' }}>{fmtLabel()}</span>
        <button onClick={navNext} style={{ background: C.surf, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', color: C.text, cursor: 'pointer' }}><ChevronRight size={16} /></button>
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div style={{ background: C.surf, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: `1px solid ${C.border}` }}>
            {WEEKDAYS.map(d => <div key={d} style={{ padding: '10px 0', textAlign: 'center', color: C.muted, fontSize: 12, fontWeight: 600 }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {monthDays().map((date, i) => {
              const dayEvents = date ? events.filter(e => e.date === date) : []
              const isToday = date === today()
              return (
                <div key={i} onClick={() => date && openNew(date)}
                  style={{ minHeight: 90, padding: '8px 8px 6px', borderRight: (i + 1) % 7 !== 0 ? `1px solid ${C.border}` : 'none', borderBottom: `1px solid ${C.border}`, cursor: date ? 'pointer' : 'default', background: date ? 'transparent' : 'rgba(0,0,0,0.1)' }}>
                  {date && (
                    <>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: isToday ? C.accent : 'transparent', color: isToday ? C.surf : C.muted, fontSize: 12, fontWeight: isToday ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                        {Number(date.slice(8))}
                      </div>
                      {dayEvents.slice(0, 3).map(e => <EventPill key={e.id} e={e} />)}
                      {dayEvents.length > 3 && <div style={{ color: C.muted, fontSize: 10 }}>+{dayEvents.length - 3}</div>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week view */}
      {view === 'week' && (
        <div style={{ background: C.surf, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {weekDays().map((date, i) => {
              const dayEvents = events.filter(e => e.date === date)
              const isToday = date === today()
              const dd = Number(date.slice(8))
              return (
                <div key={date} onClick={() => openNew(date)}
                  style={{ minHeight: 180, padding: '10px 8px', borderRight: i < 6 ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{WEEKDAYS[i]}</div>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: isToday ? C.accent : 'transparent', color: isToday ? C.surf : C.text, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{dd}</div>
                  {dayEvents.map(e => <EventPill key={e.id} e={e} />)}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Day view */}
      {view === 'day' && (
        <div style={{ background: C.surf, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Btn sm onClick={() => openNew(viewDateStr)}><Plus size={13} />Додати</Btn>
          </div>
          {events.filter(e => e.date === viewDateStr).length === 0
            ? <p style={{ color: C.muted, fontSize: 14 }}>Немає подій. Натисніть + щоб додати.</p>
            : events.filter(e => e.date === viewDateStr).sort((a, b) => a.time.localeCompare(b.time)).map(e => (
              <div key={e.id} style={{ background: C.surf2, borderRadius: 10, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ color: C.muted, fontSize: 13, minWidth: 40 }}>{e.time || '–'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontWeight: 600 }}>{e.title}</div>
                  {e.platform && <div style={{ color: C.muted, fontSize: 12 }}>{e.platform} {e.format && `· ${e.format}`}</div>}
                  {eventStatus(e) === 'analytics' && <div style={{ color: '#fbbf24', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}><AlertCircle size={12} />Заповни аналітику</div>}
                </div>
                <button onClick={() => openEdit(e)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><Edit2 size={14} /></button>
                <button onClick={() => delEvent(e.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>
            ))
          }
        </div>
      )}

      {/* Event modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={draft.current.id ? 'Редагувати подію' : 'Нова подія'}>
        <EventForm draft={draft.current} onChange={d => { draft.current = d }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <div>
            {draft.current.id && <Btn variant="danger" sm onClick={() => { delEvent(draft.current.id); setModal(null) }}><Trash2 size={13} />Видалити</Btn>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Скасувати</Btn>
            <Btn onClick={saveEvent}>Зберегти</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function EventForm({ draft, onChange }: { draft: CalEvent; onChange: (d: CalEvent) => void }) {
  const [d, setD] = useState(draft)
  const u = (f: keyof CalEvent, v: string) => { const next = { ...d, [f]: v }; setD(next); onChange(next) }
  return (
    <div>
      <Field label="Назва" value={d.title} onChange={v => u('title', v)} placeholder="Що публікуємо / що робимо?" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Field label="Дата" value={d.date} onChange={v => u('date', v)} placeholder="РРРР-ММ-ДД" />
        <Field label="Час" value={d.time} onChange={v => u('time', v)} placeholder="ГГ:ХХ" />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Тип</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['task', 'publication'] as CalEventType[]).map(t => (
            <button key={t} onClick={() => u('type', t)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, background: d.type === t ? C.accent : C.surf2, color: d.type === t ? C.surf : C.muted }}>
              {t === 'task' ? 'Задача' : 'Публікація'}
            </button>
          ))}
        </div>
      </div>
      {d.type === 'publication' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Платформа</label>
            <select value={d.platform} onChange={e => u('platform', e.target.value)} style={{ ...inputStyle, height: 40 }}>
              <option value="">Оберіть…</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Формат</label>
            <select value={d.format} onChange={e => u('format', e.target.value)} style={{ ...inputStyle, height: 40 }}>
              <option value="">Оберіть…</option>
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      )}
      <Field label="Нотатки" value={d.notes} onChange={v => u('notes', v)} multiline rows={3} />
    </div>
  )
}

// ─── Analytics Section ────────────────────────────────────────────────────────
const POST_FIELDS: { key: keyof PostData; label: string }[] = [
  { key: 'reach', label: 'Охоплення' }, { key: 'views', label: 'Перегляди' },
  { key: 'likes', label: 'Лайки' }, { key: 'comments', label: 'Коментарі' },
  { key: 'saves', label: 'Збереження' }, { key: 'shares', label: 'Поширення' },
  { key: 'er', label: 'ER%' },
]

const MONTHS_SHORT = ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру']

function AnalyticsSection() {
  const [posts, setPosts] = useState<PostData[]>(() => ld(K.posts, []))
  const [subs, setSubs] = useState<SubEntry[]>(() => ld(K.subs, []))
  const [postModal, setPostModal] = useState<PostData | null | 'new'>(null)
  const [subModal, setSubModal] = useState(false)
  const [agg, setAgg] = useState<'month' | 'quarter' | 'year'>('month')
  const pDraft = useRef<PostData>({ id: '', date: today(), platform: '', format: '', title: '', reach: '', views: '', likes: '', comments: '', saves: '', shares: '', er: '', notes: '' })
  const sDraft = useRef<SubEntry>({ id: '', date: today(), count: '' })

  const savePosts = (next: PostData[]) => { setPosts(next); sv(K.posts, next) }
  const saveSubs = (next: SubEntry[]) => { setSubs(next); sv(K.subs, next) }

  function openPost(p?: PostData) {
    pDraft.current = p ? { ...p } : { id: '', date: today(), platform: '', format: '', title: '', reach: '', views: '', likes: '', comments: '', saves: '', shares: '', er: '', notes: '' }
    setPostModal(p ?? 'new')
  }
  function savePost() {
    const d = pDraft.current
    if (!d.date) return
    const next = d.id ? posts.map(p => p.id === d.id ? d : p) : [...posts, { ...d, id: crypto.randomUUID() }]
    savePosts(next); setPostModal(null)
  }
  function delPost(id: string) { savePosts(posts.filter(p => p.id !== id)) }

  function saveSub() {
    const d = sDraft.current
    if (!d.date || !d.count) return
    saveSubs([...subs, { ...d, id: crypto.randomUUID() }].sort((a, b) => b.date.localeCompare(a.date)))
    setSubModal(false)
  }

  function aggKey(date: string) {
    const [y, m] = date.split('-')
    if (agg === 'year') return y
    if (agg === 'quarter') return `${y} Q${Math.ceil(Number(m) / 3)}`
    return `${MONTHS_SHORT[Number(m) - 1]} ${y}`
  }

  const grouped: Record<string, PostData[]> = {}
  posts.forEach(p => {
    const k = aggKey(p.date)
    if (!grouped[k]) grouped[k] = []
    grouped[k].push(p)
  })

  const totalReach = posts.reduce((s, p) => s + (Number(p.reach) || 0), 0)
  const avgER = posts.length ? (posts.reduce((s, p) => s + (parseFloat(p.er) || 0), 0) / posts.length).toFixed(2) : '0'

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 40px' }}>
      <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, marginBottom: 28, color: C.text }}>Аналітика</h1>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {[['Публікацій', posts.length], ['Заг. охоплення', totalReach.toLocaleString('uk')], ['Середній ER', avgER + '%']].map(([l, v]) => (
          <Card key={String(l)}>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{l}</div>
            <div style={{ color: C.accent, fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700 }}>{v}</div>
          </Card>
        ))}
      </div>

      {/* Posts */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <Hd>Публікації</Hd>
          <Btn sm onClick={() => openPost()}><Plus size={14} />Додати</Btn>
        </div>
        {posts.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>Ще немає записів.</p>}
        <div style={{ overflowX: 'auto' }}>
          {posts.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Дата', 'Платформа', 'Формат', 'Назва', 'Охоплення', 'ER%', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: C.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...posts].sort((a, b) => b.date.localeCompare(a.date)).map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.dim}` }}>
                    <td style={{ padding: '9px 10px', color: C.muted, whiteSpace: 'nowrap' }}>{p.date}</td>
                    <td style={{ padding: '9px 10px', color: C.text }}>{p.platform}</td>
                    <td style={{ padding: '9px 10px', color: C.muted }}>{p.format}</td>
                    <td style={{ padding: '9px 10px', color: C.text, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</td>
                    <td style={{ padding: '9px 10px', color: C.text }}>{p.reach ? Number(p.reach).toLocaleString('uk') : '–'}</td>
                    <td style={{ padding: '9px 10px', color: C.accent, fontWeight: 700 }}>{p.er || '–'}</td>
                    <td style={{ padding: '9px 10px', display: 'flex', gap: 8 }}>
                      <button onClick={() => openPost(p)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><Edit2 size={13} /></button>
                      <button onClick={() => delPost(p.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Subscribers */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <Hd>Підписники</Hd>
          <Btn sm onClick={() => setSubModal(true)}><Plus size={14} />Запис</Btn>
        </div>
        {subs.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>Додай кількість підписників раз на тиждень.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {subs.slice(0, 12).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: C.surf2, borderRadius: 8 }}>
              <span style={{ color: C.muted, fontSize: 13 }}>{s.date}</span>
              <span style={{ color: C.accent, fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-head)' }}>{Number(s.count).toLocaleString('uk')}</span>
              <button onClick={() => saveSubs(subs.filter(e => e.id !== s.id))} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer' }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </Card>

      {/* Aggregation */}
      {posts.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <Hd>Зведення</Hd>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['month', 'quarter', 'year'] as const).map(a => (
                <button key={a} onClick={() => setAgg(a)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 600, background: agg === a ? C.accent : C.surf2, color: agg === a ? C.surf : C.muted }}>
                  {a === 'month' ? 'Місяць' : a === 'quarter' ? 'Квартал' : 'Рік'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Період', 'Постів', 'Охоплення', 'Перегляди', 'Лайки', 'Коментарі', 'ER%'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([k, ps]) => {
                  const sum = (f: keyof PostData) => ps.reduce((s, p) => s + (Number(p[f]) || 0), 0)
                  const er = ps.length ? (ps.reduce((s, p) => s + (parseFloat(p.er) || 0), 0) / ps.length).toFixed(2) : '–'
                  return (
                    <tr key={k} style={{ borderBottom: `1px solid ${C.dim}` }}>
                      <td style={{ padding: '9px 10px', color: C.text, fontWeight: 600 }}>{k}</td>
                      <td style={{ padding: '9px 10px', color: C.muted }}>{ps.length}</td>
                      <td style={{ padding: '9px 10px', color: C.text }}>{sum('reach').toLocaleString('uk')}</td>
                      <td style={{ padding: '9px 10px', color: C.text }}>{sum('views').toLocaleString('uk')}</td>
                      <td style={{ padding: '9px 10px', color: C.text }}>{sum('likes').toLocaleString('uk')}</td>
                      <td style={{ padding: '9px 10px', color: C.text }}>{sum('comments').toLocaleString('uk')}</td>
                      <td style={{ padding: '9px 10px', color: C.accent, fontWeight: 700 }}>{er}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Post modal */}
      <Modal open={!!postModal} onClose={() => setPostModal(null)} title={pDraft.current.id ? 'Редагувати публікацію' : 'Нова публікація'} wide>
        <PostForm draft={pDraft.current} onChange={d => { pDraft.current = d }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <div>{pDraft.current.id && <Btn variant="danger" sm onClick={() => { delPost(pDraft.current.id); setPostModal(null) }}><Trash2 size={13} />Видалити</Btn>}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setPostModal(null)}>Скасувати</Btn>
            <Btn onClick={savePost}>Зберегти</Btn>
          </div>
        </div>
      </Modal>

      {/* Sub modal */}
      <Modal open={subModal} onClose={() => setSubModal(false)} title="Кількість підписників">
        <SubForm draft={sDraft.current} onChange={d => { sDraft.current = d }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Btn variant="ghost" onClick={() => setSubModal(false)}>Скасувати</Btn>
          <Btn onClick={saveSub}>Зберегти</Btn>
        </div>
      </Modal>
    </div>
  )
}

function PostForm({ draft, onChange }: { draft: PostData; onChange: (d: PostData) => void }) {
  const [d, setD] = useState(draft)
  const u = (f: keyof PostData, v: string) => { const next = { ...d, [f]: v }; setD(next); onChange(next) }
  return (
    <div>
      <Field label="Назва / опис" value={d.title} onChange={v => u('title', v)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
        <Field label="Дата" value={d.date} onChange={v => u('date', v)} placeholder="РРРР-ММ-ДД" />
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Платформа</label>
          <select value={d.platform} onChange={e => u('platform', e.target.value)} style={{ ...inputStyle, height: 40 }}>
            <option value="">Оберіть…</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Формат</label>
          <select value={d.format} onChange={e => u('format', e.target.value)} style={{ ...inputStyle, height: 40 }}>
            <option value="">Оберіть…</option>
            {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0 16px' }}>
        {POST_FIELDS.map(({ key, label }) => (
          <Field key={key} label={label} value={d[key]} onChange={v => u(key, v)} />
        ))}
      </div>
      <Field label="Нотатки" value={d.notes} onChange={v => u('notes', v)} multiline rows={2} />
    </div>
  )
}

function SubForm({ draft, onChange }: { draft: SubEntry; onChange: (d: SubEntry) => void }) {
  const [d, setD] = useState(draft)
  const u = (f: keyof SubEntry, v: string) => { const next = { ...d, [f]: v }; setD(next); onChange(next) }
  return (
    <div>
      <Field label="Дата" value={d.date} onChange={v => u('date', v)} placeholder="РРРР-ММ-ДД" />
      <Field label="Кількість підписників" value={d.count} onChange={v => u('count', v)} placeholder="10000" />
    </div>
  )
}

// ─── Clients Section ──────────────────────────────────────────────────────────
const STATUS_LABELS: Record<ClientStatus, string> = { active: 'Активний', paused: 'Пауза', ended: 'Завершено' }
const STATUS_COLORS: Record<ClientStatus, string> = { active: C.accent, paused: '#fbbf24', ended: C.muted }

function ClientsSection() {
  const [clients, setClients] = useState<Client[]>(() => ld(K.clients, []))
  const [modal, setModal] = useState<Client | null | 'new'>(null)
  const [filter, setFilter] = useState<ClientStatus | 'all'>('all')
  const draft = useRef<Client>({ id: '', name: '', niche: '', pkg: '', status: 'active', start: '', notes: '' })

  const save = (next: Client[]) => { setClients(next); sv(K.clients, next) }

  function openClient(c?: Client) {
    draft.current = c ? { ...c } : { id: '', name: '', niche: '', pkg: '', status: 'active', start: '', notes: '' }
    setModal(c ?? 'new')
  }
  function saveClient() {
    const d = draft.current
    if (!d.name) return
    const next = d.id ? clients.map(c => c.id === d.id ? d : c) : [...clients, { ...d, id: crypto.randomUUID() }]
    save(next); setModal(null)
  }
  function delClient(id: string) { save(clients.filter(c => c.id !== id)) }

  const visible = filter === 'all' ? clients : clients.filter(c => c.status === filter)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, color: C.text }}>Клієнти</h1>
        <Btn onClick={() => openClient()}><Plus size={15} />Новий клієнт</Btn>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {(['all', 'active', 'paused', 'ended'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${C.border}`, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, background: filter === f ? C.accent : C.surf, color: filter === f ? C.surf : C.muted }}>
            {f === 'all' ? 'Всі' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {visible.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>Немає клієнтів у цій категорії.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {visible.map(c => (
          <Card key={c.id}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                {c.niche && <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{c.niche}</div>}
              </div>
              <span style={{ background: `rgba(0,0,0,0.25)`, color: STATUS_COLORS[c.status], fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, border: `1px solid ${STATUS_COLORS[c.status]}40`, whiteSpace: 'nowrap' }}>
                {STATUS_LABELS[c.status]}
              </span>
            </div>
            {c.pkg && <div style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>📦 {c.pkg}</div>}
            {c.start && <div style={{ color: C.dim, fontSize: 12, marginBottom: 8 }}>З {c.start}</div>}
            {c.notes && <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.5, marginBottom: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>{c.notes}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn sm variant="ghost" onClick={() => openClient(c)}><Edit2 size={13} />Редагувати</Btn>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={draft.current.id ? 'Редагувати клієнта' : 'Новий клієнт'}>
        <ClientForm draft={draft.current} onChange={d => { draft.current = d }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <div>{draft.current.id && <Btn variant="danger" sm onClick={() => { delClient(draft.current.id); setModal(null) }}><Trash2 size={13} />Видалити</Btn>}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Скасувати</Btn>
            <Btn onClick={saveClient}>Зберегти</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ClientForm({ draft, onChange }: { draft: Client; onChange: (d: Client) => void }) {
  const [d, setD] = useState(draft)
  const u = (f: keyof Client, v: string) => { const next = { ...d, [f]: v }; setD(next); onChange(next) }
  return (
    <div>
      <Field label="Ім'я / Назва" value={d.name} onChange={v => u('name', v)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Field label="Ніша" value={d.niche} onChange={v => u('niche', v)} placeholder="Краса, фітнес…" />
        <Field label="Пакет" value={d.pkg} onChange={v => u('pkg', v)} placeholder="Базовий, Про…" />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Статус</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['active', 'paused', 'ended'] as ClientStatus[]).map(st => (
            <button key={st} onClick={() => u('status', st)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600, background: d.status === st ? STATUS_COLORS[st] : C.surf2, color: d.status === st ? C.surf : C.muted }}>
              {STATUS_LABELS[st]}
            </button>
          ))}
        </div>
      </div>
      <Field label="Початок співпраці" value={d.start} onChange={v => u('start', v)} placeholder="РРРР-ММ-ДД" />
      <Field label="Нотатки" value={d.notes} onChange={v => u('notes', v)} multiline rows={4} />
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [section, setSection] = useState<Section>(() => {
    if (typeof window === 'undefined') return 'profile'
    return (localStorage.getItem(K.nav) as Section) ?? 'profile'
  })
  const [toast, setToast] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const navigate = (s: Section) => { setSection(s); localStorage.setItem(K.nav, s) }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const r = new FileReader()
    r.onload = ev => {
      const res = importBackup(ev.target?.result as string)
      showToast(res.ok ? 'Дані відновлено!' : res.error ?? 'Помилка')
    }
    r.readAsText(file)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0A1E14' }}>
      <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: C.surf, color: C.text, padding: '12px 24px', borderRadius: 12, fontSize: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.5)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={16} color={C.accent} />{toast}
        </div>
      )}
      <Sidebar active={section} onChange={navigate} onExport={exportBackup} onImport={() => importRef.current?.click()} />
      <main style={{ flex: 1, overflowY: 'auto', background: '#0A1E14' }}>
        {section === 'profile' && <ProfileSection />}
        {section === 'strategy' && <StrategySection />}
        {section === 'calendar' && <CalendarSection />}
        {section === 'analytics' && <AnalyticsSection />}
        {section === 'clients' && <ClientsSection />}
      </main>
    </div>
  )
}
