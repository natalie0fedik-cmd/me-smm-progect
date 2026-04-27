'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Menu,
  X,
  Plus,
  TrendingUp,
  Edit3,
  Check,
} from 'lucide-react'
import { Project, ProjectData } from '@/types'
import { getProject, saveProject, getProgress } from '@/lib/storage'

// ─── Group definitions ────────────────────────────────────────────────────────

interface TabDef {
  id: string
  label: string
  number: string
  placeholder?: string
  description: string
  custom?: boolean
  fields?: (keyof ProjectData)[]
}

interface GroupDef {
  id: string
  label: string
  number: string
  icon: string
  tabs: TabDef[]
}

const GROUPS: GroupDef[] = [
  {
    id: 'basics',
    label: 'Профіль бренду',
    number: '1–3',
    icon: '📋',
    tabs: [
      {
        id: 'whoWeAre',
        label: 'ХТО МИ',
        number: '1',
        description: 'Загальна інформація про компанію та продукти/послуги',
        custom: true,
        fields: ['companyName', 'companyIndustry', 'companyYear', 'companyGeo', 'companyTeam', 'companyProducts'],
      },
      {
        id: 'goals',
        label: 'ЦІЛІ',
        number: '2',
        description: 'Стратегічні та тактичні цілі',
        custom: true,
        fields: ['goals'],
      },
      {
        id: 'tasks',
        label: 'ЗАДАЧІ',
        number: '3',
        description: 'Ключові задачі для досягнення цілей',
        custom: true,
        fields: ['tasks'],
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Аудиторія',
    number: '4',
    icon: '📊',
    tabs: [
      {
        id: 'analytics',
        label: 'Аналітика',
        number: '4',
        description: 'Поточні показники акаунту, сегменти та портрети клієнтів',
        custom: true,
        fields: ['analytics'],
      },
      {
        id: 'competitorAnalysis',
        label: 'Конкуренти',
        number: '4.1',
        description: 'Аналіз конкурентів: посилання, сильні та слабкі сторони',
        custom: true,
        fields: ['competitorAnalysis'],
      },
    ],
  },
  {
    id: 'positioning',
    label: 'ДНК бренду',
    number: '5',
    icon: '🎯',
    tabs: [
      {
        id: 'brandMission',
        label: 'Місія',
        number: '5.1',
        description: 'Навіщо існує бренд, яку проблему вирішує',
        placeholder: 'Наша місія — ...',
      },
      {
        id: 'brandVision',
        label: 'Візія',
        number: '5.2',
        description: 'Яким хоче стати бренд через 3–5 років',
        placeholder: 'Наша візія — стати ...',
      },
      {
        id: 'brandValues',
        label: 'Цінності',
        number: '5.3',
        description: 'Ключові принципи та цінності, якими керується бренд',
        custom: true,
        fields: ['brandValues'],
      },
      {
        id: 'brandArchetypes',
        label: 'Архетипи',
        number: '5.4',
        description: 'Архетип(и) бренду за Юнгом та їх прояв у комунікації',
        custom: true,
        fields: ['brandArchetypes'],
      },
      {
        id: 'brandEnemies',
        label: 'Вороги',
        number: '5.5',
        description: 'Що бренд відкидає, чому протистоїть, від чого дистанціюється',
        custom: true,
        fields: ['brandEnemies'],
      },
      {
        id: 'communicationPillars',
        label: 'Кити',
        number: '5.6',
        description: 'Ключові теми та напрямки, навколо яких будується комунікація',
        custom: true,
        fields: ['communicationPillars'],
      },
    ],
  },
  {
    id: 'uvp',
    label: 'Унікальність',
    number: '6',
    icon: '💎',
    tabs: [
      {
        id: 'uvp',
        label: 'УЦП',
        number: '6',
        description: 'Унікальна ціннісна пропозиція — що відрізняє бренд від конкурентів',
        custom: true,
        fields: ['uvp'],
      },
    ],
  },
  {
    id: 'content',
    label: 'Голос і контент',
    number: '7',
    icon: '✍️',
    tabs: [
      {
        id: 'unifyingIdea',
        label: 'Ідея',
        number: '7.1',
        description: "Головна ідея, що проходить через весь контент і об'єднує аудиторію",
        placeholder: "Наша об'єднуюча ідея: ...",
      },
      {
        id: 'toneOfVoice',
        label: 'Tone of Voice',
        number: '7.2',
        description: 'Голос і тон бренду: як говоримо, що уникаємо, приклади',
        custom: true,
        fields: ['toneOfVoice'],
      },
      {
        id: 'contentRubricator',
        label: 'Рубрикатор',
        number: '7.3',
        description: 'Категорії контенту, їх частота та мета',
        custom: true,
        fields: ['contentRubricator'],
      },
      {
        id: 'visualConcept',
        label: 'Візуал',
        number: '7.4',
        description: 'Колірна палітра, шрифти, стиль фото, настрій та референси',
        custom: true,
        fields: ['visualConcept'],
      },
    ],
  },
  {
    id: 'promotion',
    label: 'Просування',
    number: '8',
    icon: '🚀',
    tabs: [
      {
        id: 'paidTools',
        label: 'Платні',
        number: '8.1',
        description: 'Таргетована реклама, інфлюенсер-маркетинг, платні розміщення',
        custom: true,
        fields: ['paidTools'],
      },
      {
        id: 'organicTools',
        label: 'Органічні',
        number: '8.2',
        description: 'SEO, колаборації, UGC, хештеги, взаємодія з аудиторією',
        custom: true,
        fields: ['organicTools'],
      },
      {
        id: 'salesFunnels',
        label: 'Воронки',
        number: '8.3',
        description: 'Шлях клієнта від першого дотику до конверсії',
        custom: true,
        fields: ['salesFunnels'],
      },
    ],
  },
  {
    id: 'bio',
    label: 'Оформлення профілю',
    number: '9',
    icon: '👤',
    tabs: [
      {
        id: 'bioStructure',
        label: 'БІО',
        number: '9.1',
        description: 'Текст біо для профілю: хто, для кого, що, заклик до дії',
        placeholder: 'Рядок 1: [хто ми / що робимо]\nРядок 2: [для кого]\nРядок 3: [результат / перевага]\nРядок 4: [CTA + посилання]',
      },
      {
        id: 'highlights',
        label: 'Highlights',
        number: '9.2',
        description: 'Актуальні сторіс: назви, порядок, зміст кожного хайлайту',
        placeholder: '📁 Хайлайт 1 — [назва]\nЗміст: ...\n\n📁 Хайлайт 2 — [назва]\nЗміст: ...',
      },
    ],
  },
  {
    id: 'kpi',
    label: 'КРІ та Метрики',
    number: '10',
    icon: '📈',
    tabs: [
      {
        id: 'kpi',
        label: 'КРІ та Метрики',
        number: '10',
        description: 'Ключові показники ефективності та як їх вимірювати',
        placeholder: 'Охоплення: ... на місяць\nER: ...%\nПідписники: +... на місяць\nКліки: ...\nКонверсії: ...',
      },
    ],
  },
  {
    id: 'stages',
    label: 'План дій',
    number: '11',
    icon: '🗓️',
    tabs: [
      {
        id: 'implementationStages',
        label: 'Етапи реалізації',
        number: '11',
        description: 'Покроковий план впровадження стратегії з дедлайнами',
        placeholder: '🟢 Етап 1 — [назва] (дедлайн: ...)\n— Задача\n— Задача\n\n🟡 Етап 2 — ...',
      },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupFilled(group: GroupDef, data: ProjectData): number {
  return group.tabs.filter((t) => {
    if (t.custom && t.fields) {
      return t.fields.some((f) => data[f]?.trim().length > 0)
    }
    return data[t.id as keyof ProjectData]?.trim().length > 0
  }).length
}

// ─── WhoWeAre structured form ─────────────────────────────────────────────────

interface FieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}

function Field({ label, placeholder, value, onChange, multiline }: FieldProps) {
  return (
    <div className="group">
      <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm leading-relaxed transition-colors resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm transition-colors"
        />
      )}
    </div>
  )
}

function WhoWeAreForm({
  data,
  updateField,
}: {
  data: ProjectData
  updateField: (f: keyof ProjectData, v: string) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">i</span>
          Загальна інформація про компанію
        </h3>
        <div className="space-y-4">
          <Field
            label="Назва компанії"
            placeholder="Вкажіть повну назву"
            value={data.companyName}
            onChange={(v) => updateField('companyName', v)}
          />
          <Field
            label="Сфера діяльності"
            placeholder="Опишіть основний напрямок бізнесу"
            value={data.companyIndustry}
            onChange={(v) => updateField('companyIndustry', v)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Рік заснування"
              placeholder="Наприклад: 2018"
              value={data.companyYear}
              onChange={(v) => updateField('companyYear', v)}
            />
            <Field
              label="Географія присутності"
              placeholder="Міста / країни"
              value={data.companyGeo}
              onChange={(v) => updateField('companyGeo', v)}
            />
          </div>
          <Field
            label="Команда"
            placeholder="Кількість співробітників, ключові особи"
            value={data.companyTeam}
            onChange={(v) => updateField('companyTeam', v)}
          />
        </div>
      </div>

      <div className="border-t border-slate-700/50 pt-6">
        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs">★</span>
          Продукти / послуги
        </h3>
        <Field
          label="Опис продуктів та послуг"
          placeholder="Опишіть детально що саме пропонуєте клієнтам, унікальні особливості кожного продукту/послуги..."
          value={data.companyProducts}
          onChange={(v) => updateField('companyProducts', v)}
          multiline
        />
      </div>
    </div>
  )
}

// ─── Goals structured form ────────────────────────────────────────────────────

interface StrategicGoal { id: string; title: string; description: string; metrics: string }
interface GoalsData { strategic: StrategicGoal[]; tactical: string[] }

const DEFAULT_GOALS: GoalsData = {
  strategic: [
    { id: '1', title: 'Підвищити впізнаваність бренду', description: '', metrics: '' },
    { id: '2', title: 'Побудувати лояльну спільноту', description: '', metrics: '' },
    { id: '3', title: 'Збільшити продажі', description: '', metrics: '' },
  ],
  tactical: [],
}

function parseGoals(raw: string): GoalsData {
  const fallback = (): GoalsData => JSON.parse(JSON.stringify(DEFAULT_GOALS))
  if (!raw) return fallback()
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return fallback()
    return {
      strategic: Array.isArray(parsed.strategic) ? parsed.strategic : fallback().strategic,
      tactical: Array.isArray(parsed.tactical) ? parsed.tactical : [],
    }
  } catch { return fallback() }
}

function GoalsForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const goals = parseGoals(data.goals)

  function save(next: GoalsData) { updateField('goals', JSON.stringify(next)) }

  function addStrategic() {
    save({ ...goals, strategic: [...goals.strategic, { id: crypto.randomUUID(), title: '', description: '', metrics: '' }] })
  }
  function removeStrategic(id: string) {
    save({ ...goals, strategic: goals.strategic.filter((g) => g.id !== id) })
  }
  function updateStrategic(id: string, field: keyof StrategicGoal, value: string) {
    save({ ...goals, strategic: goals.strategic.map((g) => g.id === id ? { ...g, [field]: value } : g) })
  }
  function addTactical() { save({ ...goals, tactical: [...goals.tactical, ''] }) }
  function removeTactical(i: number) { save({ ...goals, tactical: goals.tactical.filter((_, idx) => idx !== i) }) }
  function updateTactical(i: number, value: string) {
    const t = [...goals.tactical]; t[i] = value; save({ ...goals, tactical: t })
  }

  return (
    <div className="space-y-8">
      {/* Strategic */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">★</span>
          Стратегічні цілі (на рік)
        </h3>
        <div className="space-y-4">
          {goals.strategic.map((goal, i) => (
            <div key={goal.id} className="bg-slate-900/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={goal.title}
                  onChange={(e) => updateStrategic(goal.id, 'title', e.target.value)}
                  placeholder="Назва цілі"
                  className="flex-1 bg-transparent border-b border-slate-700 focus:border-indigo-500 pb-1 text-white text-sm font-medium placeholder-slate-600 outline-none transition-colors"
                />
                <button
                  onClick={() => removeStrategic(goal.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
              <div>
                <label className="text-xs text-slate-500 tracking-wider mb-1 block">Опис</label>
                <textarea
                  value={goal.description}
                  onChange={(e) => updateStrategic(goal.id, 'description', e.target.value)}
                  placeholder="Деталізуйте: в якому регіоні, серед якої аудиторії, показники та канали"
                  rows={2}
                  className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 tracking-wider mb-1 block">Метрики успіху</label>
                <input
                  type="text"
                  value={goal.metrics}
                  onChange={(e) => updateStrategic(goal.id, 'metrics', e.target.value)}
                  placeholder="Наприклад: +50% охоплення, 10к підписників"
                  className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors"
                />
              </div>
            </div>
          ))}
          <button
            onClick={addStrategic}
            className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl text-slate-500 hover:text-indigo-400 text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати ціль
          </button>
        </div>
      </div>

      {/* Tactical */}
      <div className="border-t border-slate-700/50 pt-6">
        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold">◎</span>
          Тактичні цілі (на квартал)
        </h3>
        <div className="space-y-2">
          {goals.tactical.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0 mt-px" />
              <input
                type="text"
                value={t}
                onChange={(e) => updateTactical(i, e.target.value)}
                placeholder="Тактична ціль на квартал"
                className="flex-1 bg-slate-900/50 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors"
              />
              <button onClick={() => removeTactical(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={addTactical}
            className="w-full py-2.5 border border-dashed border-slate-700 hover:border-violet-500/50 rounded-xl text-slate-500 hover:text-violet-400 text-sm transition-all flex items-center justify-center gap-2 mt-2"
          >
            <Plus size={14} /> Додати тактичну ціль
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tasks structured form ────────────────────────────────────────────────────

type TaskPriority = 'high' | 'medium' | 'low'
type TaskStatus = 'planned' | 'inprogress' | 'done'

interface Task {
  id: string
  title: string
  deadline: string
  priority: TaskPriority
  status: TaskStatus
  assignee: string
  goalId: string
}

interface TasksData { tasks: Task[] }

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  high:   { label: 'Високий', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  medium: { label: 'Середній', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  low:    { label: 'Низький', color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; dot: string }> = {
  planned:    { label: 'Заплановано', color: 'text-slate-400', dot: 'bg-slate-500' },
  inprogress: { label: 'В процесі',   color: 'text-indigo-400', dot: 'bg-indigo-500' },
  done:       { label: 'Виконано',    color: 'text-emerald-400', dot: 'bg-emerald-500' },
}

function parseTasksList(raw: string): TasksData {
  if (!raw) return { tasks: [] }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.tasks)) return parsed
    return { tasks: [] } // handles old { groups: [...] } format
  } catch { return { tasks: [] } }
}

function TasksForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const td = parseTasksList(data.tasks)
  const strategicGoals = parseGoals(data.goals).strategic.filter(g => g.title.trim())

  function save(next: TasksData) { updateField('tasks', JSON.stringify(next)) }

  function addTask() {
    const newTask: Task = { id: crypto.randomUUID(), title: '', deadline: '', priority: 'medium', status: 'planned', assignee: '', goalId: '' }
    save({ tasks: [...td.tasks, newTask] })
  }
  function removeTask(id: string) { save({ tasks: td.tasks.filter((t) => t.id !== id) }) }
  function updateTask(id: string, field: keyof Task, value: string) {
    save({ tasks: td.tasks.map((t) => t.id === id ? { ...t, [field]: value } : t) })
  }

  const total = td.tasks.length
  const done  = td.tasks.filter((t) => t.status === 'done').length

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {total > 0 && (
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((done / total) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0">{done}/{total} виконано</span>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-300">Що потрібно зробити для цього проєкту?</p>
            <p className="text-xs text-slate-500">Додайте конкретні задачі з дедлайнами і відповідальними. Клікніть на приклад — він одразу з&apos;явиться у списку.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Типові задачі SMM</p>
            {([
              { title: 'Провести аудит поточного акаунту', priority: 'high' as TaskPriority },
              { title: 'Скласти контент-план на місяць', priority: 'high' as TaskPriority },
              { title: 'Розробити шаблони для сторіс та постів', priority: 'medium' as TaskPriority },
              { title: 'Налаштувати рекламний кабінет', priority: 'medium' as TaskPriority },
              { title: 'Зібрати та оформити відгуки клієнтів', priority: 'low' as TaskPriority },
            ]).map(({ title, priority }) => (
              <button
                key={title}
                onClick={() => {
                  const t: Task = { id: crypto.randomUUID(), title, deadline: '', priority, status: 'planned', assignee: '', goalId: '' }
                  save({ tasks: [...td.tasks, t] })
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg transition-all text-left group"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priority === 'high' ? 'bg-red-400' : priority === 'medium' ? 'bg-yellow-400' : 'bg-slate-500'}`} />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">{title}</span>
                <span className={`text-xs flex-shrink-0 ${PRIORITY_CONFIG[priority].color} px-2 py-0.5 rounded-md border`}>{PRIORITY_CONFIG[priority].label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={addTask}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати власну задачу
          </button>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {td.tasks.map((task) => (
          <div key={task.id} className={`bg-slate-900/50 border rounded-xl p-4 transition-all ${task.status === 'done' ? 'border-emerald-500/20 opacity-70' : 'border-slate-700/60'}`}>
            {/* Row 1: status dot + title + remove */}
            <div className="flex items-start gap-3">
              {/* Status toggle */}
              <button
                onClick={() => {
                  const next: TaskStatus = task.status === 'planned' ? 'inprogress' : task.status === 'inprogress' ? 'done' : 'planned'
                  updateTask(task.id, 'status', next)
                }}
                title={STATUS_CONFIG[task.status].label}
                className="mt-0.5 flex-shrink-0"
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  task.status === 'done' ? 'bg-emerald-500 border-emerald-500' :
                  task.status === 'inprogress' ? 'border-indigo-500 bg-indigo-500/20' :
                  'border-slate-600 bg-transparent'
                }`}>
                  {task.status === 'done' && <Check size={10} className="text-white" />}
                  {task.status === 'inprogress' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                </span>
              </button>

              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                  placeholder="Назва задачі"
                  className={`w-full bg-transparent text-sm placeholder-slate-600 outline-none transition-colors ${
                    task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-100'
                  }`}
                />
                {task.goalId && (() => {
                  const linked = strategicGoals.find(g => g.id === task.goalId)
                  return linked ? (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-indigo-400/70">
                      <span>🎯</span> {linked.title}
                    </span>
                  ) : null
                })()}
              </div>
              <button onClick={() => removeTask(task.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                <X size={13} />
              </button>
            </div>

            {/* Row 2: meta fields */}
            <div className="flex flex-wrap gap-2 mt-3 pl-7">
              {/* Deadline */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">📅</span>
                <input
                  type="date"
                  value={task.deadline}
                  onChange={(e) => updateTask(task.id, 'deadline', e.target.value)}
                  className="bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-300 transition-colors"
                />
              </div>

              {/* Priority */}
              <select
                value={task.priority}
                onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                className={`border rounded-lg px-2 py-1 text-xs font-medium transition-colors outline-none cursor-pointer ${PRIORITY_CONFIG[task.priority].color}`}
              >
                <option value="high">🔴 Високий</option>
                <option value="medium">🟡 Середній</option>
                <option value="low">⚪ Низький</option>
              </select>

              {/* Status */}
              <select
                value={task.status}
                onChange={(e) => updateTask(task.id, 'status', e.target.value as TaskStatus)}
                className={`bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs transition-colors outline-none cursor-pointer ${STATUS_CONFIG[task.status].color}`}
              >
                <option value="planned">⬜ Заплановано</option>
                <option value="inprogress">🔷 В процесі</option>
                <option value="done">✅ Виконано</option>
              </select>

              {/* Assignee */}
              <input
                type="text"
                value={task.assignee}
                onChange={(e) => updateTask(task.id, 'assignee', e.target.value)}
                placeholder="👤 Відповідальний"
                className="bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-300 placeholder-slate-600 transition-colors"
              />

              {/* Linked goal */}
              {strategicGoals.length > 0 && (
                <select
                  value={task.goalId ?? ''}
                  onChange={(e) => updateTask(task.id, 'goalId', e.target.value)}
                  className={`bg-slate-800 border rounded-lg px-2 py-1 text-xs transition-colors outline-none cursor-pointer max-w-[180px] truncate ${
                    task.goalId ? 'border-indigo-500/50 text-indigo-300' : 'border-slate-700 text-slate-500'
                  }`}
                >
                  <option value="">🎯 Ціль...</option>
                  {strategicGoals.map((g, i) => (
                    <option key={g.id} value={g.id}>{g.title || `Ціль ${i + 1}`}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addTask}
        className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl text-slate-500 hover:text-indigo-400 text-sm transition-all flex items-center justify-center gap-2"
      >
        <Plus size={14} /> Додати задачу
      </button>
    </div>
  )
}

// ─── Competitor Analysis form ────────────────────────────────────────────────

interface Competitor { id: string; name: string; website: string; instagram: string; tiktok: string; strengths: string; weaknesses: string }

function parseCompetitors(raw: string): Competitor[] {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
}

function CompetitorForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const list = parseCompetitors(data.competitorAnalysis)
  function save(next: Competitor[]) { updateField('competitorAnalysis', JSON.stringify(next)) }
  function add() { save([...list, { id: crypto.randomUUID(), name: '', website: '', instagram: '', tiktok: '', strengths: '', weaknesses: '' }]) }
  function remove(id: string) { save(list.filter(c => c.id !== id)) }
  function update(id: string, field: keyof Competitor, value: string) {
    save(list.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  return (
    <div className="space-y-4">
      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-5 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-300">Хто ваші основні конкуренти?</p>
            <p className="text-xs text-slate-500">Додайте 3–5 конкурентів: посилання на їх сайт і соцмережі, що роблять добре і де їхні слабкі місця. Це основа для відбудови позиціювання.</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3 space-y-1.5">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2">Що заповнювати</p>
            {[['🌐 Сайт', 'Посилання на основний сайт'], ['📸 Instagram', 'Нік акаунту (@назва)'], ['🎵 TikTok', 'Нік акаунту'], ['✅ Сильні сторони', 'Що роблять добре: контент, спільнота, оффер...'], ['❌ Слабкі сторони', 'Де є прогалини, що можна зробити краще']].map(([label, hint]) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="text-xs text-slate-400 flex-shrink-0 w-28">{label}</span>
                <span className="text-xs text-slate-600">{hint}</span>
              </div>
            ))}
          </div>
          <button
            onClick={add}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати першого конкурента
          </button>
        </div>
      )}
      {list.map((c, i) => (
        <div key={c.id} className="bg-slate-900/50 border border-slate-700/60 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60 bg-slate-800/40">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
            <input
              type="text"
              value={c.name}
              onChange={e => update(c.id, 'name', e.target.value)}
              placeholder="Назва конкурента"
              className="flex-1 bg-transparent text-white text-sm font-semibold placeholder-slate-600 outline-none"
            />
            <button onClick={() => remove(c.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Links row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                ['website',   '🌐 Сайт',      'https://example.com'],
                ['instagram', '📸 Instagram',  '@назва'],
                ['tiktok',    '🎵 TikTok',     '@назва'],
              ] as [keyof Competitor, string, string][]).map(([field, label, ph]) => (
                <div key={field}>
                  <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                  <input
                    type="text"
                    value={c[field] as string}
                    onChange={e => update(c.id, field, e.target.value)}
                    placeholder={ph}
                    className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Strengths / Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-emerald-400 tracking-wider mb-1.5 flex items-center gap-1 block">
                  <span>✅</span> Сильні сторони
                </label>
                <textarea
                  value={c.strengths}
                  onChange={e => update(c.id, 'strengths', e.target.value)}
                  placeholder="— Великий охоплення&#10;— Якісний візуал&#10;— Активна спільнота"
                  rows={4}
                  className="w-full bg-slate-800/60 border border-slate-700 focus:border-emerald-500/50 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-red-400 tracking-wider mb-1.5 flex items-center gap-1 block">
                  <span>❌</span> Слабкі сторони
                </label>
                <textarea
                  value={c.weaknesses}
                  onChange={e => update(c.id, 'weaknesses', e.target.value)}
                  placeholder="— Немає відео-контенту&#10;— Рідкі публікації&#10;— Слабке залучення"
                  rows={4}
                  className="w-full bg-slate-800/60 border border-slate-700 focus:border-red-500/50 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={add}
        className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl text-slate-500 hover:text-indigo-400 text-sm transition-all flex items-center justify-center gap-2"
      >
        <Plus size={14} /> Додати конкурента
      </button>
    </div>
  )
}

// ─── Analytics structured form ───────────────────────────────────────────────

interface BrandChampion { id: string; name: string; demographics: string; profession: string; needs: string; pains: string }
interface AnalyticsData {
  subscribers: string; audience: string; er: string
  comments: string; reposts: string; reach: string
  interests: string; income: string
  champions: BrandChampion[]
}

function parseAnalytics(raw: string): AnalyticsData {
  const empty: AnalyticsData = { subscribers: '', audience: '', er: '', comments: '', reposts: '', reach: '', interests: '', income: '', champions: [] }
  if (!raw) return empty
  try {
    const p = JSON.parse(raw)
    return { ...empty, ...p, champions: Array.isArray(p.champions) ? p.champions : [] }
  } catch { return empty }
}

function AnalyticsForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const a = parseAnalytics(data.analytics)
  function save(next: AnalyticsData) { updateField('analytics', JSON.stringify(next)) }
  function addChampion() {
    save({ ...a, champions: [...a.champions, { id: crypto.randomUUID(), name: '', demographics: '', profession: '', needs: '', pains: '' }] })
  }
  function removeChampion(id: string) { save({ ...a, champions: a.champions.filter(c => c.id !== id) }) }
  function updateChampion(id: string, field: keyof BrandChampion, value: string) {
    save({ ...a, champions: a.champions.map(c => c.id === id ? { ...c, [field]: value } : c) })
  }

  const metric = (label: string, key: keyof AnalyticsData, placeholder: string, hint?: string) => (
    <div>
      <label className="text-xs font-semibold text-slate-400 tracking-wider mb-1 block">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={a[key] as string}
          onChange={e => save({ ...a, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 text-sm transition-colors"
        />
        {hint && <span className="absolute right-3 top-2.5 text-xs text-slate-600">{hint}</span>}
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">📊</span>
          Кількісні показники
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metric('Підписники', 'subscribers', '10 000')}
          {metric('Охоплення', 'reach', '25 000')}
          {metric('ER', 'er', '3.5', '%')}
          {metric('Аудиторія', 'audience', 'Жінки 25–34')}
          {metric('Коментарі', 'comments', '~80 / пост')}
          {metric('Репости', 'reposts', '~40 / пост')}
        </div>
      </div>

      {/* Segments */}
      <div className="border-t border-slate-700/50 pt-6">
        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs">◉</span>
          Основні сегменти
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 tracking-wider mb-1 block">Інтереси аудиторії</label>
            <textarea
              value={a.interests}
              onChange={e => save({ ...a, interests: e.target.value })}
              placeholder="Фітнес, здорове харчування, саморозвиток, подорожі..."
              rows={3}
              className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm transition-colors resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 tracking-wider mb-1 block">Дохід / платоспроможність</label>
            <input
              type="text"
              value={a.income}
              onChange={e => save({ ...a, income: e.target.value })}
              placeholder="Середній і вище середнього, 30 000–80 000 грн/міс"
              className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 text-sm transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Brand Champions */}
      <div className="border-t border-slate-700/50 pt-6">
        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">★</span>
          Бренд-чемпіони (портрети клієнтів)
        </h3>
        <div className="space-y-4">
          {a.champions.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-300">Хто ваш ідеальний клієнт?</p>
                <p className="text-xs text-slate-500">Бренд-чемпіон — детальний портрет типового покупця. 2–3 портрети допомагають писати контент «для конкретної людини», а не «для всіх».</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Приклади портретів</p>
                {([
                  { name: 'Молода мама', demographics: 'Жінка, 28–34 р., Київ', profession: 'В декреті або часткова зайнятість', needs: 'Економія часу, зручність, перевірена якість', pains: 'Немає часу на дослідження, все дорожчає' },
                  { name: 'Активний підприємець', demographics: 'Чоловік, 32–45 р., великі міста', profession: 'CEO або власник малого бізнесу', needs: 'Ефективність, статус, готові рішення', pains: 'Немає часу, хочу результату тут і зараз' },
                ] as Omit<BrandChampion, 'id'>[]).map((ex) => (
                  <button
                    key={ex.name}
                    onClick={() => {
                      const c: BrandChampion = { id: crypto.randomUUID(), ...ex }
                      save({ ...a, champions: [...a.champions, c] })
                    }}
                    className="w-full text-left p-3 bg-slate-800 hover:bg-emerald-500/5 border border-slate-700 hover:border-emerald-500/30 rounded-lg transition-all group"
                  >
                    <p className="text-sm font-semibold text-slate-300 group-hover:text-white mb-1 transition-colors">{ex.name}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      {[['Демографія', ex.demographics], ['Професія', ex.profession], ['Потреби', ex.needs], ['Болі', ex.pains]].map(([lbl, val]) => (
                        <p key={lbl} className="text-xs text-slate-500"><span className="text-slate-600">{lbl}: </span>{val}</p>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={addChampion}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white text-sm transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Додати власний портрет
              </button>
            </div>
          )}
          {a.champions.map((c, i) => (
            <div key={c.id} className="bg-slate-900/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <input
                  type="text"
                  value={c.name}
                  onChange={e => updateChampion(c.id, 'name', e.target.value)}
                  placeholder="Назва портрету (напр. «Молода мама»)"
                  className="flex-1 bg-transparent border-b border-slate-700 focus:border-indigo-500 pb-1 text-white text-sm font-semibold placeholder-slate-600 outline-none transition-colors"
                />
                <button onClick={() => removeChampion(c.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                {([['demographics', 'Демографія', 'Жінка, 28 р., Київ'], ['profession', 'Професія', 'Маркетолог'], ['needs', 'Потреби', 'Економія часу, якість...'], ['pains', 'Болі', 'Не вистачає часу, дорого...']] as [keyof BrandChampion, string, string][]).map(([field, label, ph]) => (
                  <div key={field}>
                    <label className="text-xs text-slate-500 tracking-wider mb-1 block">{label}</label>
                    <input
                      type="text"
                      value={c[field] as string}
                      onChange={e => updateChampion(c.id, field, e.target.value)}
                      placeholder={ph}
                      className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={addChampion}
            className="w-full py-2.5 border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl text-slate-500 hover:text-emerald-400 text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати портрет клієнта
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── UVP structured form ─────────────────────────────────────────────────────

interface UvpFeature { id: string; what: string; difference: string; proof: string }
interface UvpData { features: UvpFeature[]; keyMessage: string; insight: string }

const EMPTY_UVP: UvpData = { features: [], keyMessage: '', insight: '' }

function parseUvp(raw: string): UvpData {
  if (!raw) return JSON.parse(JSON.stringify(EMPTY_UVP))
  try {
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object') return JSON.parse(JSON.stringify(EMPTY_UVP))
    const rawFeatures = Array.isArray(p.features) ? p.features : []
    const features: UvpFeature[] = rawFeatures.map((f: unknown) => {
      if (typeof f === 'string') return { id: crypto.randomUUID(), what: f, difference: '', proof: '' }
      if (f && typeof f === 'object') {
        const fo = f as Record<string, unknown>
        return { id: String(fo.id ?? crypto.randomUUID()), what: String(fo.what ?? ''), difference: String(fo.difference ?? ''), proof: String(fo.proof ?? '') }
      }
      return { id: crypto.randomUUID(), what: '', difference: '', proof: '' }
    })
    return {
      features,
      keyMessage: typeof p.keyMessage === 'string' ? p.keyMessage : '',
      insight:    typeof p.insight    === 'string' ? p.insight    : '',
    }
  } catch { return JSON.parse(JSON.stringify(EMPTY_UVP)) }
}

const UVP_EXAMPLES: UvpFeature[] = [
  {
    id: '',
    what:       'Закріплюємо персонального менеджера за кожним клієнтом',
    difference: 'Конкуренти передають клієнта між відділами — у нас одна точка контакту від старту до результату',
    proof:      '98% клієнтів працюють з одним менеджером весь проєкт — підтверджено відгуками',
  },
  {
    id: '',
    what:       'Даємо гарантію: якщо не досягнемо узгодженого KPI — повертаємо оплату',
    difference: 'Жоден конкурент у ніші не дає фінансових гарантій на результат',
    proof:      'За 3 роки повернули кошти лише 2 клієнтам з 200+',
  },
  {
    id: '',
    what:       'Відповідаємо на будь-який запит клієнта протягом 1 робочої години',
    difference: 'Стандарт ринку — 24–48 годин, ми відповідаємо за 43 хвилини в середньому',
    proof:      'Середній час відповіді підтверджений статистикою CRM за останні 6 місяців',
  },
]

function UvpForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const u = parseUvp(data.uvp)
  function save(next: UvpData) { updateField('uvp', JSON.stringify(next)) }
  function addFeature() {
    save({ ...u, features: [...u.features, { id: crypto.randomUUID(), what: '', difference: '', proof: '' }] })
  }
  function removeFeature(id: string) { save({ ...u, features: u.features.filter(f => f.id !== id) }) }
  function updateFeature(id: string, field: keyof UvpFeature, value: string) {
    save({ ...u, features: u.features.map(f => f.id === id ? { ...f, [field]: value } : f) })
  }

  return (
    <div className="space-y-8">
      {/* Unique features */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">💎</span>
            Унікальні особливості
          </h3>
        </div>
        <div className="space-y-3">
          {u.features.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-300">Що відрізняє вас від конкурентів?</p>
                <p className="text-xs text-slate-500">Для кожної особливості — три питання: що конкретно робимо, чим це відрізняється від конкурентів і яким доказом підтверджуємо. «Якість» і «досвід» без доказу — не унікальність.</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Приклади</p>
                {UVP_EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => save({ ...u, features: [...u.features, { ...ex, id: crypto.randomUUID() }] })}
                    className="w-full text-left p-3 bg-slate-800 hover:bg-indigo-500/5 border border-slate-700 hover:border-indigo-500/30 rounded-lg transition-all group space-y-1.5"
                  >
                    <p className="text-xs text-slate-500"><span className="text-slate-400 font-medium">Що робимо: </span>{ex.what}</p>
                    <p className="text-xs text-slate-500"><span className="text-slate-400 font-medium">Відмінність: </span>{ex.difference}</p>
                    <p className="text-xs text-slate-500"><span className="text-emerald-600 font-medium">Доказ: </span>{ex.proof}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={addFeature}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white text-sm transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Додати власну особливість
              </button>
            </div>
          )}
          {u.features.map((feature, i) => (
            <div key={feature.id} className="bg-slate-900/50 border border-indigo-500/20 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60 bg-indigo-500/5">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex-1">Особливість {i + 1}</span>
                <button onClick={() => removeFeature(feature.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
              {/* Fields */}
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 tracking-wider mb-1.5 block flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" /> Що робимо
                  </label>
                  <input
                    type="text"
                    value={feature.what}
                    onChange={e => updateFeature(feature.id, 'what', e.target.value)}
                    placeholder="Конкретна дія або сервіс, який ми надаємо клієнту"
                    className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-600 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 tracking-wider mb-1.5 block">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block mr-1.5" /> Чим відрізняємось
                  </label>
                  <input
                    type="text"
                    value={feature.difference}
                    onChange={e => updateFeature(feature.id, 'difference', e.target.value)}
                    placeholder="Чому це рідкість на ринку, що роблять конкуренти замість цього"
                    className="w-full bg-slate-800/60 border border-slate-700 focus:border-violet-500/60 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-600 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 tracking-wider mb-1.5 block">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5" /> Доказ
                  </label>
                  <input
                    type="text"
                    value={feature.proof}
                    onChange={e => updateFeature(feature.id, 'proof', e.target.value)}
                    placeholder="Цифра, факт, відгук або кейс, який це підтверджує"
                    className="w-full bg-slate-800/60 border border-slate-700 focus:border-emerald-500/60 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-600 text-sm transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
          {u.features.length > 0 && (
            <button
              onClick={addFeature}
              className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl text-slate-500 hover:text-indigo-400 text-sm transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Додати особливість
            </button>
          )}
        </div>
      </div>

      {/* Key message */}
      <div className="border-t border-slate-700/50 pt-6">
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs">💬</span>
          Ключовий меседж бренду
        </h3>
        <textarea
          value={u.keyMessage}
          onChange={e => save({ ...u, keyMessage: e.target.value })}
          placeholder="Головний посил до аудиторії — одне речення, яке передає суть бренду..."
          rows={3}
          className="w-full bg-slate-900/60 border border-slate-700 focus:border-violet-500/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm leading-relaxed transition-colors resize-none"
        />
      </div>

      {/* Insight */}
      <div className="border-t border-slate-700/50 pt-6">
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">🔍</span>
          Інсайт бренду
        </h3>
        <textarea
          value={u.insight}
          onChange={e => save({ ...u, insight: e.target.value })}
          placeholder="Глибоке розуміння потреб аудиторії — що насправді хочуть чи відчувають клієнти..."
          rows={3}
          className="w-full bg-slate-900/60 border border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm leading-relaxed transition-colors resize-none"
        />
      </div>
    </div>
  )
}

// ─── Brand Values form ───────────────────────────────────────────────────────

interface BrandValue { id: string; title: string; description: string; translation: string }

function parseBrandValues(raw: string): BrandValue[] {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
}

function BrandValuesForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const list = parseBrandValues(data.brandValues)
  function save(next: BrandValue[]) { updateField('brandValues', JSON.stringify(next)) }
  function add() { save([...list, { id: crypto.randomUUID(), title: '', description: '', translation: '' }]) }
  function remove(id: string) { save(list.filter(v => v.id !== id)) }
  function update(id: string, field: keyof BrandValue, value: string) {
    save(list.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const VALUES_EXAMPLES: BrandValue[] = [
    { id: '', title: 'Якість', description: 'Ми не йдемо на компроміс з продуктом — кожна деталь продумана.', translation: 'Детальні кейси, BTS-контент, відгуки з реальними результатами' },
    { id: '', title: 'Чесність', description: 'Говоримо відкрито — про ціни, процеси і навіть помилки.', translation: 'Прозорість у постах, щирі відповіді на коментарі, визнання прорахунків' },
    { id: '', title: 'Турбота', description: 'Кожен клієнт — це конкретна людина з конкретними потребами.', translation: 'Персональний підхід, швидка підтримка, контент «для вас, а не для всіх»' },
  ]

  return (
    <div className="space-y-4">
      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-300">Які принципи лежать в основі бренду?</p>
            <p className="text-xs text-slate-500">Цінності — це не слова на сайті. Це реальні орієнтири для контенту і рішень. 3–5 цінностей достатньо. Натисніть на приклад, щоб додати і відредагувати.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Приклади</p>
            {VALUES_EXAMPLES.map(ex => (
              <button
                key={ex.title}
                onClick={() => save([...list, { ...ex, id: crypto.randomUUID() }])}
                className="w-full text-left p-3 bg-slate-800 hover:bg-violet-500/5 border border-slate-700 hover:border-violet-500/30 rounded-lg transition-all group"
              >
                <p className="text-sm font-semibold text-slate-300 group-hover:text-white mb-1 transition-colors">{ex.title}</p>
                <p className="text-xs text-slate-500"><span className="text-slate-600">Опис: </span>{ex.description}</p>
                <p className="text-xs text-slate-500 mt-0.5"><span className="text-slate-600">Транслюємо: </span>{ex.translation}</p>
              </button>
            ))}
          </div>
          <button
            onClick={add}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати власну цінність
          </button>
        </div>
      )}
      {list.map((v, i) => (
        <div key={v.id} className="bg-slate-900/50 border border-slate-700/60 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60 bg-slate-800/40">
            <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
            <input
              type="text"
              value={v.title}
              onChange={e => update(v.id, 'title', e.target.value)}
              placeholder="Назва цінності"
              className="flex-1 bg-transparent text-white text-sm font-semibold placeholder-slate-600 outline-none"
            />
            <button onClick={() => remove(v.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs text-slate-500 tracking-wider mb-1 block">Опис</label>
              <textarea
                value={v.description}
                onChange={e => update(v.id, 'description', e.target.value)}
                placeholder="Що означає ця цінність для бренду..."
                rows={2}
                className="w-full bg-slate-800/60 border border-slate-700 focus:border-violet-500/50 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 tracking-wider mb-1 block">Як транслюємо</label>
              <textarea
                value={v.translation}
                onChange={e => update(v.id, 'translation', e.target.value)}
                placeholder="Через що проявляємо цю цінність у комунікації..."
                rows={2}
                className="w-full bg-slate-800/60 border border-slate-700 focus:border-violet-500/50 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full py-2.5 border border-dashed border-slate-700 hover:border-violet-500/50 rounded-xl text-slate-500 hover:text-violet-400 text-sm transition-all flex items-center justify-center gap-2"
      >
        <Plus size={14} /> Додати цінність
      </button>
    </div>
  )
}

// ─── Brand Archetypes form ────────────────────────────────────────────────────

interface ArchetypeEntry { name: string; description: string; keywords: string }
interface BrandArchetypesData { primary: ArchetypeEntry; secondary: ArchetypeEntry }

const EMPTY_ARCHETYPES: BrandArchetypesData = {
  primary:   { name: '', description: '', keywords: '' },
  secondary: { name: '', description: '', keywords: '' },
}

function parseBrandArchetypes(raw: string): BrandArchetypesData {
  if (!raw) return JSON.parse(JSON.stringify(EMPTY_ARCHETYPES))
  try {
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object') return JSON.parse(JSON.stringify(EMPTY_ARCHETYPES))
    return {
      primary:   { ...EMPTY_ARCHETYPES.primary,   ...(p.primary   ?? {}) },
      secondary: { ...EMPTY_ARCHETYPES.secondary, ...(p.secondary ?? {}) },
    }
  } catch { return JSON.parse(JSON.stringify(EMPTY_ARCHETYPES)) }
}

function BrandArchetypesForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const a = parseBrandArchetypes(data.brandArchetypes)
  function save(next: BrandArchetypesData) { updateField('brandArchetypes', JSON.stringify(next)) }
  function updateEntry(key: 'primary' | 'secondary', field: keyof ArchetypeEntry, value: string) {
    save({ ...a, [key]: { ...a[key], [field]: value } })
  }

  const archetypeBlock = (key: 'primary' | 'secondary', label: string, color: string, accent: string) => (
    <div className={`bg-slate-900/50 border ${accent} rounded-xl overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${accent} bg-slate-800/40`}>
        <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs text-slate-500 tracking-wider mb-1 block">Назва архетипу</label>
          <input
            type="text"
            value={a[key].name}
            onChange={e => updateEntry(key, 'name', e.target.value)}
            placeholder="Наприклад: Герой, Мудрець, Творець..."
            className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 tracking-wider mb-1 block">Опис</label>
          <textarea
            value={a[key].description}
            onChange={e => updateEntry(key, 'description', e.target.value)}
            placeholder="Як цей архетип проявляється у бренді..."
            rows={3}
            className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors resize-none"
          />
        </div>
        {key === 'primary' && (
          <div>
            <label className="text-xs text-slate-500 tracking-wider mb-1 block">Слова-маячки</label>
            <input
              type="text"
              value={a[key].keywords}
              onChange={e => updateEntry(key, 'keywords', e.target.value)}
              placeholder="Сміливо, перемога, дія, результат..."
              className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {archetypeBlock('primary',   'Основний архетип',     'text-indigo-400', 'border-indigo-500/30')}
      {archetypeBlock('secondary', 'Додатковий архетип',   'text-slate-400',  'border-slate-700/60')}
    </div>
  )
}

// ─── Brand Enemies form ───────────────────────────────────────────────────────

function parseBrandEnemies(raw: string): string[] {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
}

function BrandEnemiesForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const list = parseBrandEnemies(data.brandEnemies)
  function save(next: string[]) { updateField('brandEnemies', JSON.stringify(next)) }
  function add() { save([...list, '']) }
  function remove(i: number) { save(list.filter((_, idx) => idx !== i)) }
  function update(i: number, value: string) { const n = [...list]; n[i] = value; save(n) }

  const ENEMIES_EXAMPLES = ['Халтура і дешевизна', 'Обман клієнтів', 'Безликий контент', 'Нерівність і упередження', 'Маніпуляція страхом']

  return (
    <div className="space-y-3">
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-300">Проти чого виступає бренд?</p>
            <p className="text-xs text-slate-500">Ворог бренду — це не конкурент, а явище або поведінка, яку бренд публічно відкидає. Це загострює позиціювання і притягує однодумців.</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Приклади</p>
            <div className="flex flex-wrap gap-2">
              {ENEMIES_EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => save([...list, ex])}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/40 rounded-lg text-xs text-slate-400 hover:text-red-300 transition-all"
                >
                  <span className="text-red-500/60">✕</span> {ex}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={add}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати свого ворога
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {list.map((enemy, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-red-400 flex-shrink-0 text-sm">✕</span>
                <input
                  type="text"
                  value={enemy}
                  onChange={e => update(i, e.target.value)}
                  placeholder="Ворог бренду..."
                  className="flex-1 bg-slate-900/50 border border-slate-700 focus:border-red-500/50 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors"
                />
                <button onClick={() => remove(i)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={add}
            className="w-full py-2.5 border border-dashed border-slate-700 hover:border-red-500/40 rounded-xl text-slate-500 hover:text-red-400 text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати ворога бренду
          </button>
        </>
      )}
    </div>
  )
}

// ─── Communication Pillars form ───────────────────────────────────────────────

interface CommunicationPillar { id: string; topic: string; description: string }

function parsePillars(raw: string): CommunicationPillar[] {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
}

function CommunicationPillarsForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const list = parsePillars(data.communicationPillars)
  function save(next: CommunicationPillar[]) { updateField('communicationPillars', JSON.stringify(next)) }
  function add() { save([...list, { id: crypto.randomUUID(), topic: '', description: '' }]) }
  function remove(id: string) { save(list.filter(p => p.id !== id)) }
  function update(id: string, field: keyof CommunicationPillar, value: string) {
    save(list.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const PILLARS_EXAMPLES: Array<{ topic: string; description: string }> = [
    { topic: 'Експертиза', description: 'Корисний контент, кейси, навчальні пости, відповіді на питання аудиторії' },
    { topic: 'За лаштунками', description: 'Команда, процеси, щоденне життя бренду — що робить нас живими' },
    { topic: 'Клієнти і результати', description: 'Відгуки, трансформації, до/після, реальні історії' },
    { topic: 'Цінності бренду', description: 'Позиція бренду з важливих тем, те що нас об\'єднує з аудиторією' },
  ]

  return (
    <div className="space-y-4">
      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-300">Навколо яких тем будується контент?</p>
            <p className="text-xs text-slate-500">Кити — це 3–5 постійних тематичних напрямків. Вони дають структуру контент-плану і роблять акаунт впізнаваним.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Приклади</p>
            {PILLARS_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => save([...list, { id: crypto.randomUUID(), topic: ex.topic, description: ex.description }])}
                className="w-full text-left p-3 bg-slate-800 hover:bg-emerald-500/5 border border-slate-700 hover:border-emerald-500/30 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{ex.topic}</span>
                </div>
                <p className="text-xs text-slate-500 pl-6">{ex.description}</p>
              </button>
            ))}
          </div>
          <button
            onClick={add}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати власний кит
          </button>
        </div>
      )}
      {list.map((p, i) => (
        <div key={p.id} className="bg-slate-900/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
            <input
              type="text"
              value={p.topic}
              onChange={e => update(p.id, 'topic', e.target.value)}
              placeholder="Тема / назва кита"
              className="flex-1 bg-transparent border-b border-slate-700 focus:border-emerald-500/50 pb-1 text-white text-sm font-semibold placeholder-slate-600 outline-none transition-colors"
            />
            <button onClick={() => remove(p.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>
          <div className="pl-9">
            <label className="text-xs text-slate-500 tracking-wider mb-1 block">Опис</label>
            <textarea
              value={p.description}
              onChange={e => update(p.id, 'description', e.target.value)}
              placeholder="Про що говоримо, який контент публікуємо в межах цього напрямку..."
              rows={3}
              className="w-full bg-slate-800/60 border border-slate-700 focus:border-emerald-500/50 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors resize-none"
            />
          </div>
        </div>
      ))}
      {list.length > 0 && (
        <button
          onClick={add}
          className="w-full py-2.5 border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl text-slate-500 hover:text-emerald-400 text-sm transition-all flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Додати кит комунікації
        </button>
      )}
    </div>
  )
}

// ─── Tone of Voice form ───────────────────────────────────────────────────────

interface ToneOfVoiceData {
  formality: string
  address: string
  emotion: string
  humor: string
  position: string
  notes: string
}

const EMPTY_TOV: ToneOfVoiceData = { formality: '', address: '', emotion: '', humor: '', position: '', notes: '' }

function parseToneOfVoice(raw: string): ToneOfVoiceData {
  if (!raw) return { ...EMPTY_TOV }
  try {
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object') return { ...EMPTY_TOV }
    return { ...EMPTY_TOV, ...p }
  } catch { return { ...EMPTY_TOV } }
}

function ToneToggle({ label, options, value, onChange }: { label: string; options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-700/40 last:border-0">
      <span className="text-sm text-slate-300 font-medium min-w-0">{label}</span>
      <div className="flex rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
        {options.map(([val, text], i) => (
          <button
            key={val}
            onClick={() => onChange(value === val ? '' : val)}
            className={`px-4 py-1.5 text-xs font-medium transition-all ${i > 0 ? 'border-l border-slate-700' : ''} ${
              value === val
                ? 'bg-indigo-600 text-white'
                : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

function ToneOfVoiceForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const t = parseToneOfVoice(data.toneOfVoice)
  function save(next: ToneOfVoiceData) { updateField('toneOfVoice', JSON.stringify(next)) }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 border border-slate-700/60 rounded-xl px-5 py-2">
        <ToneToggle label="Формальність"  options={[['informal','Неформально'], ['formal','Формально']]}          value={t.formality} onChange={v => save({ ...t, formality: v })} />
        <ToneToggle label="Звертання"     options={[['ty','На «ти»'], ['vy','На «Ви»']]}                          value={t.address}   onChange={v => save({ ...t, address: v })} />
        <ToneToggle label="Емоційність"   options={[['restrained','Стримано'], ['emotional','Емоційно']]}          value={t.emotion}   onChange={v => save({ ...t, emotion: v })} />
        <ToneToggle label="Гумор"         options={[['use','Використовуємо'], ['avoid','Уникаємо']]}               value={t.humor}     onChange={v => save({ ...t, humor: v })} />
        <ToneToggle label="Позиція"       options={[['expert','Експерт'], ['partner','Партнер']]}                  value={t.position}  onChange={v => save({ ...t, position: v })} />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-400 tracking-wider mb-2 block">Додаткові нотатки</label>
        <textarea
          value={t.notes}
          onChange={e => save({ ...t, notes: e.target.value })}
          placeholder="Що ще важливо знати про стиль комунікації бренду: табу, особливі прийоми, приклади..."
          rows={4}
          className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm leading-relaxed transition-colors resize-none"
        />
      </div>
    </div>
  )
}

// ─── Content Rubricator form ──────────────────────────────────────────────────

interface ContentRubric { id: string; name: string; frequency: string; format: string; goal: string }

function parseRubricator(raw: string): ContentRubric[] {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
}

function ContentRubricatorForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const list = parseRubricator(data.contentRubricator)
  function save(next: ContentRubric[]) { updateField('contentRubricator', JSON.stringify(next)) }
  function add() { save([...list, { id: crypto.randomUUID(), name: '', frequency: '', format: '', goal: '' }]) }
  function remove(id: string) { save(list.filter(r => r.id !== id)) }
  function update(id: string, field: keyof ContentRubric, value: string) {
    save(list.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const RUBRIC_EXAMPLES: ContentRubric[] = [
    { id: '', name: 'Корисний контент', frequency: '2× на тиждень', format: 'Каруселі, Reels', goal: 'Підвищення довіри та органічного охоплення' },
    { id: '', name: 'Відгуки і кейси', frequency: '2–3× на тиждень', format: 'Stories, пости', goal: 'Social proof, підштовхування до покупки' },
    { id: '', name: 'За лаштунками', frequency: '1–2× на тиждень', format: 'Reels, Stories', goal: 'Людяність бренду, лояльність аудиторії' },
    { id: '', name: 'Продаючий контент', frequency: '1× на тиждень', format: 'Пост + Stories', goal: 'Прямі продажі та конверсії' },
  ]

  return (
    <div className="space-y-4">
      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-300">За якими рубриками виходитиме контент?</p>
            <p className="text-xs text-slate-500">Рубрикатор — це каркас контент-плану. 4–6 рубрик дають різноманітність і системність. Клікніть на приклад, щоб додати і відредагувати.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Приклади рубрик</p>
            {RUBRIC_EXAMPLES.map(ex => (
              <button
                key={ex.name}
                onClick={() => save([...list, { ...ex, id: crypto.randomUUID() }])}
                className="w-full text-left p-3 bg-slate-800 hover:bg-indigo-500/5 border border-slate-700 hover:border-indigo-500/30 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-indigo-400 text-xs">📌</span>
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{ex.name}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 pl-5">
                  {[['Частота', ex.frequency], ['Формат', ex.format], ['Мета', ex.goal]].map(([lbl, val]) => (
                    <p key={lbl} className="text-xs text-slate-500"><span className="text-slate-600">{lbl}: </span>{val}</p>
                  ))}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={add}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати власну рубрику
          </button>
        </div>
      )}
      {list.map((r, i) => (
        <div key={r.id} className="bg-slate-900/50 border border-slate-700/60 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60 bg-slate-800/40">
            <span className="text-indigo-400 flex-shrink-0 text-sm">📌</span>
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
            <input
              type="text"
              value={r.name}
              onChange={e => update(r.id, 'name', e.target.value)}
              placeholder="Назва рубрики"
              className="flex-1 bg-transparent text-white text-sm font-semibold placeholder-slate-600 outline-none"
            />
            <button onClick={() => remove(r.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              ['frequency', 'Частота', '1 раз на тиждень'],
              ['format',    'Формат',  'Reels, каруселі'],
              ['goal',      'Мета',    'Залучення, продажі...'],
            ] as [keyof ContentRubric, string, string][]).map(([field, label, ph]) => (
              <div key={field}>
                <label className="text-xs text-slate-500 tracking-wider mb-1 block">{label}</label>
                <input
                  type="text"
                  value={r[field] as string}
                  onChange={e => update(r.id, field, e.target.value)}
                  placeholder={ph}
                  className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl text-slate-500 hover:text-indigo-400 text-sm transition-all flex items-center justify-center gap-2"
      >
        <Plus size={14} /> Додати рубрику
      </button>
    </div>
  )
}

// ─── Visual Concept form ──────────────────────────────────────────────────────

interface VisualConceptData {
  style: string
  colorMain: string
  colorSecondary: string
  colorAccent: string
  fontHeadings: string
  fontBody: string
  references: string
}

const EMPTY_VISUAL: VisualConceptData = { style: '', colorMain: '#ffffff', colorSecondary: '#ffffff', colorAccent: '#ffffff', fontHeadings: '', fontBody: '', references: '' }

function parseVisualConcept(raw: string): VisualConceptData {
  if (!raw) return { ...EMPTY_VISUAL }
  try {
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object') return { ...EMPTY_VISUAL }
    return { ...EMPTY_VISUAL, ...p }
  } catch { return { ...EMPTY_VISUAL } }
}

const STYLE_OPTIONS = ['Мінімалізм', 'Яскравий', 'Елегантний', 'Натуральний', 'Технологічний', 'Ретро', 'Інший']

function VisualConceptForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const v = parseVisualConcept(data.visualConcept)
  function save(next: VisualConceptData) { updateField('visualConcept', JSON.stringify(next)) }

  return (
    <div className="space-y-6">
      {/* Style */}
      <div>
        <label className="text-xs font-semibold text-slate-400 tracking-wider mb-3 block">Стиль</label>
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => save({ ...v, style: v.style === s ? '' : s })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                v.style === s
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {v.style === 'Інший' && (
          <input
            type="text"
            value={v.style === 'Інший' ? '' : v.style}
            onChange={e => save({ ...v, style: e.target.value })}
            placeholder="Опишіть стиль..."
            className="mt-2 w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 text-sm transition-colors"
          />
        )}
      </div>

      {/* Colors */}
      <div className="border-t border-slate-700/50 pt-5">
        <label className="text-xs font-semibold text-slate-400 tracking-wider mb-3 block">Кольорова гама</label>
        <div className="grid grid-cols-3 gap-4">
          {([
            ['colorMain',      'Основний'],
            ['colorSecondary', 'Додатковий'],
            ['colorAccent',    'Акцентний'],
          ] as [keyof VisualConceptData, string][]).map(([field, label]) => (
            <div key={field} className="flex flex-col items-center gap-2">
              <label className="text-xs text-slate-500">{label}</label>
              <div className="relative">
                <input
                  type="color"
                  value={v[field] as string}
                  onChange={e => save({ ...v, [field]: e.target.value })}
                  className="w-12 h-12 rounded-xl border-2 border-slate-700 cursor-pointer bg-transparent p-0.5"
                />
              </div>
              <span className="text-xs text-slate-500 font-mono">{v[field] as string}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="border-t border-slate-700/50 pt-5">
        <label className="text-xs font-semibold text-slate-400 tracking-wider mb-3 block">Шрифти</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Заголовки</label>
            <input
              type="text"
              value={v.fontHeadings}
              onChange={e => save({ ...v, fontHeadings: e.target.value })}
              placeholder="Montserrat Bold"
              className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 text-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Основний текст</label>
            <input
              type="text"
              value={v.fontBody}
              onChange={e => save({ ...v, fontBody: e.target.value })}
              placeholder="Inter Regular"
              className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 text-sm transition-colors"
            />
          </div>
        </div>
      </div>

      {/* References */}
      <div className="border-t border-slate-700/50 pt-5">
        <label className="text-xs font-semibold text-slate-400 tracking-wider mb-2 block">Референси</label>
        <textarea
          value={v.references}
          onChange={e => save({ ...v, references: e.target.value })}
          placeholder="Посилання на акаунти, мудборди, приклади, які надихають..."
          rows={3}
          className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm leading-relaxed transition-colors resize-none"
        />
      </div>
    </div>
  )
}

// ─── Paid Tools form ─────────────────────────────────────────────────────────

interface TargetedAd { id: string; segment: string; message: string; creative: string; budget: string; kpi: string }
interface Influencer  { id: string; category: string; format: string; budget: string }
interface PaidToolsData { ads: TargetedAd[]; influencers: Influencer[] }

const EMPTY_PAID: PaidToolsData = { ads: [], influencers: [] }

function parsePaidTools(raw: string): PaidToolsData {
  if (!raw) return JSON.parse(JSON.stringify(EMPTY_PAID))
  try {
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object') return JSON.parse(JSON.stringify(EMPTY_PAID))
    return {
      ads:         Array.isArray(p.ads)         ? p.ads         : [],
      influencers: Array.isArray(p.influencers) ? p.influencers : [],
    }
  } catch { return JSON.parse(JSON.stringify(EMPTY_PAID)) }
}

function PaidToolsForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const d = parsePaidTools(data.paidTools)
  function save(next: PaidToolsData) { updateField('paidTools', JSON.stringify(next)) }

  function addAd() { save({ ...d, ads: [...d.ads, { id: crypto.randomUUID(), segment: '', message: '', creative: '', budget: '', kpi: '' }] }) }
  function removeAd(id: string) { save({ ...d, ads: d.ads.filter(a => a.id !== id) }) }
  function updateAd(id: string, field: keyof TargetedAd, value: string) {
    save({ ...d, ads: d.ads.map(a => a.id === id ? { ...a, [field]: value } : a) })
  }

  function addInfluencer() { save({ ...d, influencers: [...d.influencers, { id: crypto.randomUUID(), category: '', format: '', budget: '' }] }) }
  function removeInfluencer(id: string) { save({ ...d, influencers: d.influencers.filter(i => i.id !== id) }) }
  function updateInfluencer(id: string, field: keyof Influencer, value: string) {
    save({ ...d, influencers: d.influencers.map(i => i.id === id ? { ...i, [field]: value } : i) })
  }

  return (
    <div className="space-y-8">
      {/* Targeted ads */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">🎯</span>
          Таргетована реклама
        </h3>
        <div className="space-y-3">
          {d.ads.map((ad, i) => (
            <div key={ad.id} className="bg-slate-900/50 border border-slate-700/60 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60 bg-slate-800/40">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <span className="text-xs font-semibold text-slate-400 flex-1">Кампанія {i + 1}</span>
                <button onClick={() => removeAd(ad.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  ['segment',  'Сегмент ЦА',  'Жінки 25–34, Київ, інтерес до фітнесу'],
                  ['message',  'Меседж',       'Головний посил рекламного оголошення'],
                  ['creative', 'Креатив',      'Відео, карусель, статичний банер...'],
                  ['budget',   'Бюджет',       '5 000 грн / місяць'],
                  ['kpi',      'КРІ',          'CPL до 150 грн, CTR від 2%'],
                ] as [keyof TargetedAd, string, string][]).map(([field, label, ph]) => (
                  <div key={field} className={field === 'message' || field === 'creative' ? 'sm:col-span-2' : ''}>
                    <label className="text-xs text-slate-500 tracking-wider mb-1 block">{label}</label>
                    <input
                      type="text"
                      value={ad[field] as string}
                      onChange={e => updateAd(ad.id, field, e.target.value)}
                      placeholder={ph}
                      className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={addAd}
            className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl text-slate-500 hover:text-indigo-400 text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати кампанію
          </button>
        </div>
      </div>

      {/* Influencers */}
      <div className="border-t border-slate-700/50 pt-6">
        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs">🤝</span>
          Робота з блогерами
        </h3>
        <div className="space-y-3">
          {d.influencers.map((inf, i) => (
            <div key={inf.id} className="bg-slate-900/50 border border-slate-700/60 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60 bg-slate-800/40">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <span className="text-xs font-semibold text-slate-400 flex-1">Блогер / колаборація {i + 1}</span>
                <button onClick={() => removeInfluencer(inf.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  ['category', 'Категорія',         "Б'юті, фітнес, лайфстайл..."],
                  ['format',   'Формат співпраці',   'Огляд, інтеграція, спільний Reels'],
                  ['budget',   'Бюджет',             '3 000–10 000 грн / розміщення'],
                ] as [keyof Influencer, string, string][]).map(([field, label, ph]) => (
                  <div key={field}>
                    <label className="text-xs text-slate-500 tracking-wider mb-1 block">{label}</label>
                    <input
                      type="text"
                      value={inf[field] as string}
                      onChange={e => updateInfluencer(inf.id, field, e.target.value)}
                      placeholder={ph}
                      className="w-full bg-slate-800/60 border border-slate-700 focus:border-violet-500/50 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={addInfluencer}
            className="w-full py-2.5 border border-dashed border-slate-700 hover:border-violet-500/50 rounded-xl text-slate-500 hover:text-violet-400 text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати блогера
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Organic Tools form ───────────────────────────────────────────────────────

interface OrganicToolsData { seo: string; contests: string; ugc: string; collaborations: string; community: string }

const EMPTY_ORGANIC: OrganicToolsData = { seo: '', contests: '', ugc: '', collaborations: '', community: '' }

function parseOrganicTools(raw: string): OrganicToolsData {
  if (!raw) return { ...EMPTY_ORGANIC }
  try {
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object') return { ...EMPTY_ORGANIC }
    return { ...EMPTY_ORGANIC, ...p }
  } catch { return { ...EMPTY_ORGANIC } }
}

const ORGANIC_SECTIONS: { key: keyof OrganicToolsData; label: string; icon: string; placeholder: string }[] = [
  { key: 'seo',            label: 'SEO та хештеги',   icon: '🔍', placeholder: 'Ключові слова для підписів, хештег-стратегія, оптимізація профілю...' },
  { key: 'contests',       label: 'Конкурси і активації', icon: '🎁', placeholder: 'Формат конкурсу, умови участі, призи, частота, цілі (охоплення, підписники)...' },
  { key: 'ugc',            label: 'UGC-кампанії',     icon: '📸', placeholder: 'Як стимулюємо створення контенту користувачами: механіка, хештег, репости...' },
  { key: 'collaborations', label: 'Колаборації',      icon: '🤝', placeholder: "Спільні проєкти з брендами, ком'юніті, медіа: формат, аудиторія, умови..." },
  { key: 'community',      label: "Ком'юніті",        icon: '💬', placeholder: 'Робота з коментарями, залучення в діалог, чат, закрита група, амбасадори...' },
]

function OrganicToolsForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const d = parseOrganicTools(data.organicTools)
  function save(next: OrganicToolsData) { updateField('organicTools', JSON.stringify(next)) }

  return (
    <div className="space-y-5">
      {ORGANIC_SECTIONS.map(({ key, label, icon, placeholder }) => (
        <div key={key}>
          <label className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2 block">
            <span>{icon}</span> {label}
          </label>
          <textarea
            value={d[key]}
            onChange={e => save({ ...d, [key]: e.target.value })}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm leading-relaxed transition-colors resize-none"
          />
        </div>
      ))}
    </div>
  )
}

// ─── Sales Funnels form ───────────────────────────────────────────────────────

const FUNNEL_STAGES = [
  { key: 'awareness',     label: 'Знайомство',        color: 'bg-slate-500/20 text-slate-300',   border: 'border-slate-600/50' },
  { key: 'warmup',        label: 'Прогрів',           color: 'bg-blue-500/20 text-blue-300',     border: 'border-blue-600/40' },
  { key: 'presentation',  label: 'Презентація',        color: 'bg-indigo-500/20 text-indigo-300', border: 'border-indigo-600/40' },
  { key: 'sale',          label: 'Продаж',            color: 'bg-violet-500/20 text-violet-300', border: 'border-violet-600/40' },
  { key: 'retention',     label: 'Повторні продажі',  color: 'bg-emerald-500/20 text-emerald-300',border: 'border-emerald-600/40' },
] as const

type FunnelStageKey = typeof FUNNEL_STAGES[number]['key']
interface SalesFunnel { id: string; name: string; awareness: string; warmup: string; presentation: string; sale: string; retention: string }

function parseSalesFunnels(raw: string): SalesFunnel[] {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
}

function SalesFunnelsForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const list = parseSalesFunnels(data.salesFunnels)
  function save(next: SalesFunnel[]) { updateField('salesFunnels', JSON.stringify(next)) }
  function addFunnel() {
    save([...list, { id: crypto.randomUUID(), name: '', awareness: '', warmup: '', presentation: '', sale: '', retention: '' }])
  }
  function removeFunnel(id: string) { save(list.filter(f => f.id !== id)) }
  function updateFunnel(id: string, field: keyof SalesFunnel, value: string) {
    save(list.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  return (
    <div className="space-y-5">
      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-300">Як виглядає шлях клієнта до покупки?</p>
            <p className="text-xs text-slate-500">Опишіть тактики та контент для кожного етапу воронки. Окрема воронка — для кожного продукту або сегменту.</p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {FUNNEL_STAGES.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${s.color} border ${s.border}`}>{s.label}</span>
                {i < FUNNEL_STAGES.length - 1 && <span className="text-slate-600 text-xs">→</span>}
              </div>
            ))}
          </div>
          <button
            onClick={addFunnel}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Додати воронку
          </button>
        </div>
      )}
      {list.map((funnel, fi) => (
        <div key={funnel.id} className="bg-slate-900/50 border border-slate-700/60 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60 bg-slate-800/40">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{fi + 1}</span>
            <input
              type="text"
              value={funnel.name}
              onChange={e => updateFunnel(funnel.id, 'name', e.target.value)}
              placeholder="Назва воронки (напр. «Основний продукт», «Upsell»)"
              className="flex-1 bg-transparent text-white text-sm font-semibold placeholder-slate-600 outline-none"
            />
            <button onClick={() => removeFunnel(funnel.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>
          {/* Stages */}
          <div className="p-4 space-y-3">
            {FUNNEL_STAGES.map((stage, si) => (
              <div key={stage.key} className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${stage.color} border ${stage.border}`}>
                    {stage.label}
                  </span>
                  {si < FUNNEL_STAGES.length - 1 && (
                    <div className="w-px flex-1 bg-slate-700/50 mt-1 min-h-[8px]" />
                  )}
                </div>
                <textarea
                  value={funnel[stage.key as FunnelStageKey]}
                  onChange={e => updateFunnel(funnel.id, stage.key as keyof SalesFunnel, e.target.value)}
                  placeholder={
                    stage.key === 'awareness'    ? 'Reels, колаборації, таргет — як вперше потрапляємо у поле зору' :
                    stage.key === 'warmup'       ? 'Корисний контент, сторіс, розсилка — будуємо довіру' :
                    stage.key === 'presentation' ? 'Кейси, відгуки, демо, офер — показуємо продукт' :
                    stage.key === 'sale'         ? 'CTA, дедлайн, бонус, спрощення оплати — закриваємо угоду' :
                                                   'Онбординг, допродажі, реферальна програма — утримуємо клієнта'
                  }
                  rows={2}
                  className="flex-1 bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      {list.length > 0 && (
        <button
          onClick={addFunnel}
          className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl text-slate-500 hover:text-indigo-400 text-sm transition-all flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Додати воронку
        </button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string>('basics')
  const [activeTabId, setActiveTabId] = useState<string>('whoWeAre')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const p = getProject(id)
    if (!p) { router.push('/'); return }
    setProject(p)
    setTempName(p.name)
  }, [id, router])

  const autoSave = useCallback((updated: Project) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(() => {
      saveProject(updated)
      setSaving(false)
      setSavedAt(new Date())
    }, 800)
  }, [])

  function updateField(field: keyof ProjectData, value: string) {
    if (!project) return
    const updated = { ...project, data: { ...project.data, [field]: value } }
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

  function selectGroup(groupId: string) {
    const group = GROUPS.find((g) => g.id === groupId)!
    setActiveGroupId(groupId)
    setActiveTabId(group.tabs[0].id)
    setSidebarOpen(false)
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Завантаження...</div>
      </div>
    )
  }

  const progress = getProgress(project.data)
  const activeGroup = GROUPS.find((g) => g.id === activeGroupId) ?? GROUPS[0]
  const activeTab = activeGroup.tabs.find((t) => t.id === activeTabId) ?? activeGroup.tabs[0]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Back */}
      <div className="p-4 border-b border-slate-700/50">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
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
            <div className="flex-1 flex items-center gap-1 min-w-0">
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
        {project.description && <p className="text-slate-500 text-xs mt-1 truncate">{project.description}</p>}

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp size={10} /> Заповненість
            </span>
            <span className="text-xs font-semibold text-indigo-400">{progress}%</span>
          </div>

          {/* Segmented bar — one segment per group */}
          <div className="flex gap-0.5 h-2 mb-2.5">
            {GROUPS.map((g) => {
              const filled = groupFilled(g, project.data)
              const pct = Math.round((filled / g.tabs.length) * 100)
              return (
                <div
                  key={g.id}
                  style={{ flex: g.tabs.length }}
                  title={`${g.label}: ${pct}%`}
                  className="bg-slate-700 rounded-sm overflow-hidden"
                >
                  <div
                    className={`h-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )
            })}
          </div>

          {/* Per-section breakdown */}
          <div className="text-xs leading-relaxed">
            {GROUPS.map((g, i) => {
              const pct = Math.round((groupFilled(g, project.data) / g.tabs.length) * 100)
              return (
                <span key={g.id}>
                  {i > 0 && <span className="text-slate-700 mx-1">·</span>}
                  <span className={pct === 100 ? 'text-emerald-400' : pct > 0 ? 'text-slate-300' : 'text-slate-600'}>
                    {g.label}
                  </span>
                  {' '}
                  <span className={pct === 100 ? 'text-emerald-500' : pct > 0 ? 'text-indigo-400' : 'text-slate-700'}>
                    {pct}%
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin space-y-0.5 px-2">
        {GROUPS.map((group) => {
          const filled = groupFilled(group, project.data)
          const total = group.tabs.length
          const isActive = activeGroupId === group.id
          const allFilled = filled === total

          return (
            <button
              key={group.id}
              onClick={() => selectGroup(group.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-indigo-500/20 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
              }`}
            >
              <span className="text-lg flex-shrink-0">{group.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{group.label}</div>
                {total > 1 && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {filled}/{total} заповнено
                  </div>
                )}
              </div>
              {allFilled && <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />}
              {!allFilled && filled > 0 && (
                <span className="text-xs text-indigo-400 flex-shrink-0">{filled}/{total}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Save status */}
      <div className="p-4 border-t border-slate-700/50">
        {saving ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Save size={12} className="animate-pulse" /> Збереження...
          </div>
        ) : savedAt ? (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 size={12} /> Збережено
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
      <aside className="hidden lg:flex flex-col w-60 bg-slate-800/80 border-r border-slate-700/50 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex flex-col w-72 bg-slate-800 border-r border-slate-700 animate-fadeIn">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{project.emoji}</span>
            <span className="text-white font-medium text-sm truncate max-w-[160px]">{project.name}</span>
          </div>
          <span className="text-xs font-semibold text-indigo-400">{progress}%</span>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">

            {/* Block header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">{activeGroup.icon}</span>
                <div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Розділ {activeGroup.number}
                  </div>
                  <h1 className="text-2xl font-bold text-white">{activeGroup.label}</h1>
                </div>
              </div>
            </div>

            {/* Tab switcher — the "white blocks" */}
            {activeGroup.tabs.length > 1 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {activeGroup.tabs.map((tab) => {
                  const isFilled = tab.custom && tab.fields
                    ? tab.fields.some((f) => project.data[f]?.trim().length > 0)
                    : project.data[tab.id as keyof ProjectData]?.trim().length > 0
                  const isActive = activeTabId === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabId(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        isActive
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      <span className="text-xs opacity-60">{tab.number}</span>
                      {tab.label}
                      {isFilled && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-200' : 'bg-emerald-400'}`} />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Content card */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 animate-fadeIn" key={activeTabId}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className="text-xs text-slate-500 font-mono">{activeTab.number}</span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{activeTab.label}</h2>
                </div>
              </div>
              <p className="text-slate-500 text-sm mb-5">{activeTab.description}</p>

              {activeTab.custom && activeTab.id === 'whoWeAre' ? (
                <WhoWeAreForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'goals' ? (
                <GoalsForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'tasks' ? (
                <TasksForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'analytics' ? (
                <AnalyticsForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'competitorAnalysis' ? (
                <CompetitorForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'uvp' ? (
                <UvpForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'brandValues' ? (
                <BrandValuesForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'brandArchetypes' ? (
                <BrandArchetypesForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'brandEnemies' ? (
                <BrandEnemiesForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'communicationPillars' ? (
                <CommunicationPillarsForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'toneOfVoice' ? (
                <ToneOfVoiceForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'contentRubricator' ? (
                <ContentRubricatorForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'visualConcept' ? (
                <VisualConceptForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'paidTools' ? (
                <PaidToolsForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'organicTools' ? (
                <OrganicToolsForm data={project.data} updateField={updateField} />
              ) : activeTab.custom && activeTab.id === 'salesFunnels' ? (
                <SalesFunnelsForm data={project.data} updateField={updateField} />
              ) : (
                <textarea
                  value={project.data[activeTab.id as keyof ProjectData] || ''}
                  onChange={(e) => updateField(activeTab.id as keyof ProjectData, e.target.value)}
                  placeholder={activeTab.placeholder}
                  rows={10}
                  className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm leading-relaxed transition-colors resize-y"
                />
              )}
            </div>

            {/* Next block nav */}
            <div className="flex justify-between mt-4">
              {GROUPS.findIndex((g) => g.id === activeGroupId) > 0 && (
                <button
                  onClick={() => {
                    const idx = GROUPS.findIndex((g) => g.id === activeGroupId)
                    selectGroup(GROUPS[idx - 1].id)
                  }}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  ← {GROUPS[GROUPS.findIndex((g) => g.id === activeGroupId) - 1].label}
                </button>
              )}
              <div className="flex-1" />
              {GROUPS.findIndex((g) => g.id === activeGroupId) < GROUPS.length - 1 && (
                <button
                  onClick={() => {
                    const idx = GROUPS.findIndex((g) => g.id === activeGroupId)
                    selectGroup(GROUPS[idx + 1].id)
                  }}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800"
                >
                  {GROUPS[GROUPS.findIndex((g) => g.id === activeGroupId) + 1].label} →
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
