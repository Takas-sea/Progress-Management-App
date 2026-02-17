import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export type StudyLog = {
  id: string
  title: string
  minutes: number
  date: string
}

export const useStudyLogs = (session: Session | null) => {
  const [logs, setLogs] = useState<StudyLog[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 読み込み
  const fetchLogs = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      const res = await fetch('/api/study-logs', {
        headers: currentSession?.access_token ? {
          Authorization: `Bearer ${currentSession.access_token}`,
        } : {},
      })
      
      const responseData = await res.json()
      
      if (!res.ok) {
        const errorMsg = responseData.details || responseData.error || 'データ取得に失敗しました'
        console.error('Fetch logs error:', responseData)
        throw new Error(errorMsg)
      }
      
      if (Array.isArray(responseData)) {
        setLogs(responseData)
      } else {
        console.error('Unexpected response format:', responseData)
        setLogs([])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      setLogs([])
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchLogs()
    }
  }, [session, fetchLogs])

  // 作成
  const createLog = useCallback(async (title: string, minutes: number, date: string) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      const res = await fetch('/api/study-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentSession?.access_token && {
            Authorization: `Bearer ${currentSession.access_token}`,
          }),
        },
        body: JSON.stringify({
          title,
          minutes: Number(minutes),
          date,
        }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        const errorMsg = responseData.details || responseData.error || '追加に失敗しました'
        console.error('Create log error:', responseData)
        throw new Error(errorMsg)
      }

      await fetchLogs()
      return { success: true }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'エラーが発生しました'
      console.error('Submit error:', error)
      return { success: false, error: msg }
    }
  }, [fetchLogs])

  // 削除
  const deleteLog = useCallback(async (id: string) => {
    try {
      setDeletingId(id)
      const { data: { session: currentSession } } = await supabase.auth.getSession()

      const res = await fetch(`/api/study-logs?id=${id}`, {
        method: 'DELETE',
        headers: currentSession?.access_token ? {
          Authorization: `Bearer ${currentSession.access_token}`,
        } : {},
      })

      const responseData = await res.json()

      if (!res.ok) {
        const errorMsg = responseData.details || responseData.error || '削除に失敗しました'
        console.error('Delete log error:', responseData)
        throw new Error(errorMsg)
      }

      setLogs((prev) => prev.filter((log) => log.id !== id))
      return { success: true }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '削除に失敗しました'
      console.error('Delete error:', error)
      return { success: false, error: msg }
    } finally {
      setDeletingId(null)
    }
  }, [])

  return { logs, deletingId, fetchLogs, createLog, deleteLog }
}
