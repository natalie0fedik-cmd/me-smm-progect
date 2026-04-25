'use client'

import { useEffect } from 'react'

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Project Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-2xl w-full">
        <h2 className="text-red-400 font-bold text-xl mb-4">Помилка сторінки проєкту</h2>
        <div className="bg-slate-900 rounded-xl p-4 mb-6 overflow-auto">
          <p className="text-red-300 font-mono text-sm break-all">{error.message}</p>
          {error.stack && (
            <pre className="text-slate-400 font-mono text-xs mt-3 whitespace-pre-wrap break-all">
              {error.stack}
            </pre>
          )}
        </div>
        <button
          onClick={reset}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          Спробувати ще раз
        </button>
      </div>
    </div>
  )
}
