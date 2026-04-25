'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FolderOpen, TrendingUp, Calendar } from 'lucide-react'
import { Project } from '@/types'
import { getProjects, createProject, deleteProject, getProgress } from '@/lib/storage'

const EMOJI_OPTIONS = ['🚀', '💼', '🎯', '✨', '🌿', '🔥', '💡', '🎨', '📱', '🛍️', '🏋️', '🍕', '🌍', '💎', '🎵']

export default function HomePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🚀')
  const [newDesc, setNewDesc] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    setProjects(getProjects())
  }, [])

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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="text-white font-semibold text-lg">SMM Стратег</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Новий проєкт
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Мої проєкти</h1>
          <p className="text-slate-400">Управляйте SMM-стратегіями для всіх ваших клієнтів в одному місці</p>
        </div>

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <FolderOpen size={28} className="text-slate-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Ще немає проєктів</h2>
            <p className="text-slate-400 mb-6 max-w-sm">
              Створіть перший проєкт і почніть розробляти SMM-стратегію для вашого клієнта
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              Створити проєкт
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const progress = getProgress(project.data)
              return (
                <div
                  key={project.id}
                  className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10 group cursor-pointer animate-fadeIn"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{project.emoji}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(project.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                      title="Видалити проєкт"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <h3 className="text-white font-semibold text-lg mb-1 truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                  )}

                  <div className="mt-4 space-y-3">
                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <TrendingUp size={11} />
                          Заповненість стратегії
                        </span>
                        <span className="text-xs font-semibold text-indigo-400">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={11} />
                      Оновлено {formatDate(project.updatedAt)}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Add new card */}
            <button
              onClick={() => setShowModal(true)}
              className="border-2 border-dashed border-slate-700 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-slate-800/30 transition-all flex flex-col items-center justify-center gap-3 min-h-[180px] group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                <Plus size={20} className="text-slate-500 group-hover:text-indigo-400" />
              </div>
              <span className="text-slate-500 group-hover:text-slate-300 text-sm font-medium transition-colors">
                Новий проєкт
              </span>
            </button>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white text-xl font-semibold mb-5">Новий проєкт</h2>

            {/* Emoji picker */}
            <div className="mb-4">
              <label className="text-slate-400 text-sm mb-2 block">Іконка</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    onClick={() => setNewEmoji(em)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      newEmoji === em
                        ? 'bg-indigo-500/30 ring-2 ring-indigo-500'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-slate-400 text-sm mb-1.5 block">Назва проєкту *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Наприклад: Кав&apos;ярня «Аромат»"
                className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="text-slate-400 text-sm mb-1.5 block">Опис (необов&apos;язково)</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Стисло про клієнта або проєкт"
                className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Створити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-4 text-center">⚠️</div>
            <h2 className="text-white text-lg font-semibold text-center mb-2">Видалити проєкт?</h2>
            <p className="text-slate-400 text-sm text-center mb-6">Всі дані цього проєкту будуть видалені безповоротно</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
