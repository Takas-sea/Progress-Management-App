'use client'

import { useState } from 'react'

interface StudyLogFormProps {
  onSubmit: (title: string, minutes: number) => Promise<{ success: boolean; error?: string }>
}

export const StudyLogForm = ({ onSubmit }: StudyLogFormProps) => {
  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await onSubmit(title, Number(minutes))

      if (result.success) {
        setTitle('')
        setMinutes('')
      } else {
        alert(result.error || 'エラーが発生しました')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">新しい記録を追加</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              タイトル
            </label>
            <input
              placeholder="例：数学の復習"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 transition duration-200 bg-gray-800 text-white placeholder-gray-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              学習時間（分）
            </label>
            <input
              placeholder="60"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 transition duration-200 bg-gray-800 text-white placeholder-gray-500 disabled:opacity-50"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl cursor-pointer active:scale-95 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '追加中...' : '記録を追加'}
        </button>
      </form>
    </div>
  )
}
