import { useMemo } from 'react'
import type { StudyLog } from './useStudyLogs'

export type WeeklyData = {
  day: string
  date: string
  minutes: number
  isToday: boolean
}

export const useWeeklyData = (logs: StudyLog[]): WeeklyData[] => {
  return useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 (日曜) から 6 (土曜)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek) // 今週の日曜日
    startOfWeek.setHours(0, 0, 0, 0)

    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土']
    const weekData = daysOfWeek.map((day, index) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + index)
      const dateStr = date.toISOString().split('T')[0]
      
      const totalMinutes = logs
        .filter(log => log.date === dateStr)
        .reduce((sum, log) => sum + log.minutes, 0)
      
      return {
        day,
        date: dateStr,
        minutes: totalMinutes,
        isToday: index === dayOfWeek
      }
    })

    return weekData
  }, [logs])
}
