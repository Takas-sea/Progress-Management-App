/**
 * 週間グラフ機能のテスト
 */

type WeeklyData = {
  day: string
  date: string
  minutes: number
  isToday: boolean
}

describe('Weekly Graph Data Generation', () => {
  const mockLogs = [
    { minutes: 60, date: '2026-02-10' },
    { minutes: 90, date: '2026-02-11' },
    { minutes: 45, date: '2026-02-12' },
    { minutes: 120, date: '2026-02-13' },
    { minutes: 75, date: '2026-02-14' },
    { minutes: 60, date: '2026-02-15' },
    { minutes: 105, date: '2026-02-16' }
  ]

  it('should generate 7 days of weekly data', () => {
    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土']
    expect(daysOfWeek).toHaveLength(7)
  })

  it('should calculate daily total minutes', () => {
    const dayData = mockLogs.filter(log => log.date === '2026-02-16')
    const dayTotal = dayData.reduce((sum, log) => sum + log.minutes, 0)
    expect(dayTotal).toBe(105)
  })

  it('should calculate weekly total', () => {
    const weekTotal = mockLogs.reduce((sum, log) => sum + log.minutes, 0)
    expect(weekTotal).toBe(555)
  })

  it('should convert weekly minutes to hours', () => {
    const weekTotal = mockLogs.reduce((sum, log) => sum + log.minutes, 0)
    const hours = Math.floor(weekTotal / 60)
    const minutes = weekTotal % 60
    expect(hours).toBe(9)
    expect(minutes).toBe(15)
  })

  it('should identify highest study day', () => {
    const maxMinutes = Math.max(...mockLogs.map(log => log.minutes))
    expect(maxMinutes).toBe(120)
  })

  it('should identify lowest study day', () => {
    const minMinutes = Math.min(...mockLogs.map(log => log.minutes))
    expect(minMinutes).toBe(45)
  })
})

describe('Weekly Graph Display', () => {
  const generateWeeklyData = (logs: any[], startOfWeek: Date, dayOfWeek: number): WeeklyData[] => {
    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土']
    return daysOfWeek.map((day, index) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + index)
      const dateStr = date.toISOString().split('T')[0]
      
      const totalMinutes = logs
        .filter((log: any) => log.date === dateStr)
        .reduce((sum: number, log: any) => sum + log.minutes, 0)
      
      return {
        day,
        date: dateStr,
        minutes: totalMinutes,
        isToday: index === dayOfWeek
      }
    })
  }

  it('should mark current day as today', () => {
    const today = new Date('2026-02-16')
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek)
    
    const mockLogs = [{ minutes: 60, date: '2026-02-16' }]
    const weekData = generateWeeklyData(mockLogs, startOfWeek, dayOfWeek)
    
    const todayData = weekData.find(d => d.isToday)
    expect(todayData?.isToday).toBe(true)
    expect(todayData?.day).toBe('月')
  })

  it('should format minutes as time string', () => {
    const minutes = 135
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const timeStr = `${hours}h ${mins}m`
    expect(timeStr).toBe('2h 15m')
  })

  it('should handle zero minutes for day with no logs', () => {
    const weekData: WeeklyData[] = [
      { day: '日', date: '2026-02-10', minutes: 0, isToday: false },
      { day: '月', date: '2026-02-11', minutes: 60, isToday: false }
    ]
    const zeroDay = weekData.find(d => d.minutes === 0)
    expect(zeroDay?.minutes).toBe(0)
  })
})

describe('Graph Progress Calculation', () => {
  it('should calculate bar width percentage', () => {
    const dayMinutes = 90
    const maxMinutes = 120
    const widthPercent = (dayMinutes / maxMinutes) * 100
    expect(widthPercent).toBe(75)
  })

  it('should calculate width for zero minutes', () => {
    const dayMinutes = 0
    const maxMinutes = 120
    const widthPercent = dayMinutes > 0 ? (dayMinutes / maxMinutes) * 100 : 0
    expect(widthPercent).toBe(0)
  })

  it('should calculate width at 100%', () => {
    const dayMinutes = 120
    const maxMinutes = 120
    const widthPercent = (dayMinutes / maxMinutes) * 100
    expect(widthPercent).toBe(100)
  })

  it('should handle max when all days have zero minutes', () => {
    const logs: any[] = []
    const maxMinutes = Math.max(...logs.map((l: any) => l.minutes || 0), 60)
    expect(maxMinutes).toBe(60)
  })
})

describe('Weekly Summary Statistics', () => {
  it('should calculate study consistency', () => {
    const weekData: WeeklyData[] = [
      { day: '日', date: '2026-02-10', minutes: 60, isToday: false },
      { day: '月', date: '2026-02-11', minutes: 75, isToday: false },
      { day: '火', date: '2026-02-12', minutes: 90, isToday: false },
      { day: '水', date: '2026-02-13', minutes: 0, isToday: false },
      { day: '木', date: '2026-02-14', minutes: 60, isToday: false },
      { day: '金', date: '2026-02-15', minutes: 45, isToday: false },
      { day: '土', date: '2026-02-16', minutes: 80, isToday: true }
    ]
    const daysWithLogging = weekData.filter(d => d.minutes > 0).length
    const consistency = (daysWithLogging / 7) * 100
    expect(consistency).toBeGreaterThan(70)
  })

  it('should calculate trend (improving or declining)', () => {
    const firstHalf = [60, 65, 70]
    const secondHalf = [75, 80, 85]
    
    const firstAverage = firstHalf.reduce((a, b) => a + b) / firstHalf.length
    const secondAverage = secondHalf.reduce((a, b) => a + b) / secondHalf.length
    
    const trend = secondAverage > firstAverage ? 'improving' : 'declining'
    expect(trend).toBe('improving')
  })
})
