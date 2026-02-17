'use client'

import type { StudyLog } from '@/hooks/useStudyLogs'

interface StudyLogsListProps {
  logs: StudyLog[]
  deletingId: string | null
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
}

export const StudyLogsList = ({ logs, deletingId, onDelete }: StudyLogsListProps) => {
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('本当に削除しますか？')
    if (!confirmed) return

    const result = await onDelete(id)
    if (!result.success) {
      alert(result.error || '削除に失敗しました')
    }
  }

  return (
    <div className="bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">
        学習記録 ({logs.length}件)
      </h2>
      {logs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">まだ記録がありません。記録を追加しましょう！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex justify-between items-center p-4 bg-gray-800 bg-opacity-50 border-2 border-gray-700 rounded-xl hover:shadow-md transition duration-200 hover:border-cyan-500"
            >
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{log.title}</h3>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="bg-cyan-900 bg-opacity-60 text-cyan-300 px-3 py-1 rounded-full font-semibold border border-cyan-700">
                    {log.minutes}分
                  </span>
                  <span className="bg-blue-900 bg-opacity-60 text-blue-300 px-3 py-1 rounded-full font-semibold border border-blue-700">
                    {log.date}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(log.id)}
                disabled={deletingId === log.id}
                className={`ml-4 font-semibold py-2 px-4 rounded-lg transition-all duration-300 ${
                  deletingId === log.id
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white hover:shadow-lg transform hover:scale-110 active:scale-95 cursor-pointer'
                }`}
              >
                {deletingId === log.id ? '削除中...' : '削除'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
