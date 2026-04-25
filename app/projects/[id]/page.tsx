'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Menu,
  X,
  TrendingUp,
  Edit3,
  Check,
} from 'lucide-react'
import { Project, ProjectData } from '@/types'
import { getProject, saveProject, getProgress } from '@/lib/storage'

// ─── Group definitions ────────────────────────────────────────────────────────

interface TabDef {
  id: keyof ProjectData
  label: string
  number: string
  placeholder: string
  description: string
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
        description: 'Опис компанії, сфера діяльності, продукти / послуги, ключові факти',
        placeholder: 'Ми — [назва компанії], займаємось [сфера]. Наша аудиторія — [опис]. Ключові продукти/послуги: ...',
      },
      {
        id: 'goals',
        label: 'ЦІЛІ',
        number: '2',
        description: 'Стратегічні та тактичні цілі на визначений період',
        placeholder: 'Ціль 1: збільшити охоплення на X%\nЦіль 2: залучити N нових підписників\nЦіль 3: ...',
      },
      {
        id: 'tasks',
        label: 'ЗАДАЧІ',
        number: '3',
        description: 'Конкретні задачі для досягнення цілей',
        placeholder: '— Задача 1\n— Задача 2\n— Задача 3',
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
  return group.tabs.filter((t) => data[t.id]?.trim().length > 0).length
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
                  const isFilled = project.data[tab.id]?.trim().length > 0
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
                {project.data[activeTab.id]?.trim().length > 0 && (
                  <CheckCircle2 size={18} className="text-emerald-400 mt-1 flex-shrink-0" />
                )}
              </div>
              <p className="text-slate-500 text-sm mb-4">{activeTab.description}</p>
              <textarea
                value={project.data[activeTab.id] || ''}
                onChange={(e) => updateField(activeTab.id, e.target.value)}
                placeholder={activeTab.placeholder}
                rows={10}
                className="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm leading-relaxed transition-colors resize-y"
              />
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
