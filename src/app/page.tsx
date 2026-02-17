'use client'

import { Header } from '@/components/Header'
import { LoginPage } from '@/components/LoginPage'
import { WeeklyChart } from '@/components/WeeklyChart'
import { StudyLogForm } from '@/components/StudyLogForm'
import { StudyLogsList } from '@/components/StudyLogsList'
import { useAuth } from '@/hooks/useAuth'
import { useStudyLogs } from '@/hooks/useStudyLogs'
import { useWeeklyData } from '@/hooks/useWeeklyData'

export default function Home() {
  const { session, logout } = useAuth()
  const { logs, deletingId, createLog, deleteLog } = useStudyLogs(session)
  const weeklyData = useWeeklyData(logs)

  if (!session) {
    return <LoginPage />
  }

  return (
    <div
      className="min-h-screen bg-center bg-fixed"
      style={{
        backgroundImage: "url('/images/black_00032.jpg')",
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0"></div>

      {/* ヘッダー */}
      <Header onLogout={logout} />

      {/* メインコンテント */}
      <div className="relative z-10 max-w-4xl mx-auto p-6">
        <WeeklyChart data={weeklyData} />
        <StudyLogForm onSubmit={createLog} />
        <StudyLogsList logs={logs} deletingId={deletingId} onDelete={deleteLog} />
      </div>
    </div>
  )
}
