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
    label: 'Основи',
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
    label: 'Аналітика',
    number: '4',
    icon: '📊',
    tabs: [
      {
        id: 'analytics',
        label: 'Аналітика',
        number: '4',
        description: 'Поточний стан акаунтів, ключові показники, точка старту',
        placeholder: 'Підписників: ...\nОхоплення: ...\nER: ...\nТоп-контент: ...',
      },
      {
        id: 'competitorAnalysis',
        label: 'Конкуренти',
        number: '4.1',
        description: 'Огляд конкурентів: сильні/слабкі сторони, контент, аудиторія',
        placeholder: 'Конкурент 1: [назва]\n— Акаунт: ...\n— Сильні сторони: ...\n— Слабкі сторони: ...\n\nКонкурент 2: ...',
      },
    ],
  },
  {
    id: 'positioning',
    label: 'Позиціювання',
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
        placeholder: '1. Цінність — опис\n2. Цінність — опис\n3. Цінність — опис',
      },
      {
        id: 'brandArchetypes',
        label: 'Архетипи',
        number: '5.4',
        description: 'Архетип(и) бренду за Юнгом та їх прояв у комунікації',
        placeholder: 'Основний архетип: [назва]\nОпис: ...\nЯк проявляється: ...',
      },
      {
        id: 'brandEnemies',
        label: 'Вороги',
        number: '5.5',
        description: 'Що бренд відкидає, чому протистоїть, від чого дистанціюється',
        placeholder: 'Бренд виступає проти:\n— ...\n— ...',
      },
      {
        id: 'communicationPillars',
        label: 'Кити',
        number: '5.6',
        description: 'Ключові теми та напрямки, навколо яких будується комунікація',
        placeholder: 'Кит 1: [назва] — опис\nКит 2: [назва] — опис\nКит 3: [назва] — опис',
      },
    ],
  },
  {
    id: 'uvp',
    label: 'УЦП',
    number: '6',
    icon: '💎',
    tabs: [
      {
        id: 'uvp',
        label: 'УЦП',
        number: '6',
        description: 'Унікальна ціннісна пропозиція — що відрізняє бренд від конкурентів',
        placeholder: 'Ми допомагаємо [цільова аудиторія] досягти [результат] завдяки [унікальний підхід/перевага].',
      },
    ],
  },
  {
    id: 'content',
    label: 'Контент-стратегія',
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
        placeholder: 'Ми: [прикметники]\nМи НЕ: [що уникаємо]\n\nПриклади:\n— Так: "..."\n— Не так: "..."',
      },
      {
        id: 'contentRubricator',
        label: 'Рубрикатор',
        number: '7.3',
        description: 'Категорії контенту, їх частота та мета',
        placeholder: '📌 Рубрика 1 — [назва]\nМета: ...\nЧастота: ...\nФормат: ...\n\n📌 Рубрика 2 — ...',
      },
      {
        id: 'visualConcept',
        label: 'Візуал',
        number: '7.4',
        description: 'Колірна палітра, шрифти, стиль фото, настрій та референси',
        placeholder: 'Колірна палітра: ...\nШрифти: ...\nСтиль фото: ...\nНастрій: ...\nРеференси: ...',
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
        placeholder: '— Facebook/Instagram Ads: ...\n— Google Ads: ...\n— Інфлюенсери: ...\n— Бюджет: ...',
      },
      {
        id: 'organicTools',
        label: 'Органічні',
        number: '8.2',
        description: 'SEO, колаборації, UGC, хештеги, взаємодія з аудиторією',
        placeholder: '— Хештег-стратегія: ...\n— Колаборації: ...\n— UGC: ...\n— Активність у коментарях: ...',
      },
      {
        id: 'salesFunnels',
        label: 'Воронки',
        number: '8.3',
        description: 'Шлях клієнта від першого дотику до конверсії',
        placeholder: 'Воронка 1:\nУсвідомлення → Інтерес → Бажання → Дія\n1. ...\n2. ...\n3. ...',
      },
    ],
  },
  {
    id: 'bio',
    label: 'БІО та Highlights',
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
    label: 'Етапи реалізації',
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
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
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
  if (!raw) return structuredClone(DEFAULT_GOALS)
  try { return JSON.parse(raw) } catch { return structuredClone(DEFAULT_GOALS) }
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
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Опис</label>
                <textarea
                  value={goal.description}
                  onChange={(e) => updateStrategic(goal.id, 'description', e.target.value)}
                  placeholder="Деталізуйте: в якому регіоні, серед якої аудиторії, показники та канали"
                  rows={2}
                  className="w-full bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 text-sm transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Метрики успіху</label>
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

interface TaskGroup { id: string; title: string; tasks: string[] }
interface TasksData { groups: TaskGroup[] }

function parseTasks(rawTasks: string, rawGoals: string): TasksData {
  if (rawTasks) {
    try { return JSON.parse(rawTasks) } catch { /* fall through */ }
  }
  // Auto-populate groups from strategic goals
  const goals = parseGoals(rawGoals)
  if (goals.strategic.length > 0) {
    return { groups: goals.strategic.map((g) => ({ id: g.id, title: g.title, tasks: [] })) }
  }
  return { groups: [{ id: crypto.randomUUID(), title: '', tasks: [] }] }
}

function TasksForm({ data, updateField }: { data: ProjectData; updateField: (f: keyof ProjectData, v: string) => void }) {
  const tasksData = parseTasks(data.tasks, data.goals)

  function save(next: TasksData) { updateField('tasks', JSON.stringify(next)) }

  function addGroup() {
    save({ groups: [...tasksData.groups, { id: crypto.randomUUID(), title: '', tasks: [] }] })
  }
  function removeGroup(id: string) {
    save({ groups: tasksData.groups.filter((g) => g.id !== id) })
  }
  function updateGroupTitle(id: string, title: string) {
    save({ groups: tasksData.groups.map((g) => g.id === id ? { ...g, title } : g) })
  }
  function addTask(groupId: string) {
    save({ groups: tasksData.groups.map((g) => g.id === groupId ? { ...g, tasks: [...g.tasks, ''] } : g) })
  }
  function updateTask(groupId: string, idx: number, value: string) {
    save({
      groups: tasksData.groups.map((g) => {
        if (g.id !== groupId) return g
        const tasks = [...g.tasks]; tasks[idx] = value
        return { ...g, tasks }
      }),
    })
  }
  function removeTask(groupId: string, idx: number) {
    save({ groups: tasksData.groups.map((g) => g.id === groupId ? { ...g, tasks: g.tasks.filter((_, i) => i !== idx) } : g) })
  }

  return (
    <div className="space-y-5">
      {tasksData.groups.map((group, gi) => (
        <div key={group.id} className="bg-slate-900/50 border border-slate-700/60 rounded-xl p-4">
          {/* Group header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {gi + 1}
            </span>
            <input
              type="text"
              value={group.title}
              onChange={(e) => updateGroupTitle(group.id, e.target.value)}
              placeholder="Назва групи задач (ціль)"
              className="flex-1 bg-transparent border-b border-slate-700 focus:border-indigo-500 pb-1 text-white text-sm font-semibold placeholder-slate-600 outline-none transition-colors"
            />
            <button onClick={() => removeGroup(group.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>

          {/* Tasks list */}
          <div className="space-y-2 pl-9">
            {group.tasks.map((task, ti) => (
              <div key={ti} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                <input
                  type="text"
                  value={task}
                  onChange={(e) => updateTask(group.id, ti, e.target.value)}
                  placeholder="Задача"
                  className="flex-1 bg-slate-800/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-600 text-sm transition-colors"
                />
                <button onClick={() => removeTask(group.id, ti)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => addTask(group.id)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors mt-1 pl-3"
            >
              <Plus size={12} /> Додати задачу
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addGroup}
        className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl text-slate-500 hover:text-indigo-400 text-sm transition-all flex items-center justify-center gap-2"
      >
        <Plus size={14} /> Додати групу задач
      </button>
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
