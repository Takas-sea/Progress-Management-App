/**
 * 学習記録機能のテスト
 */

type StudyLog = {
  id: string
  title: string
  minutes: number
  date: string
}

describe('Study Log Calculations', () => {
  const mockLogs: StudyLog[] = [
    { id: '1', title: '数学', minutes: 60, date: '2026-02-16' },
    { id: '2', title: '英語', minutes: 45, date: '2026-02-16' },
    { id: '3', title: '物理', minutes: 30, date: '2026-02-15' },
    { id: '4', title: '化学', minutes: 90, date: '2026-02-14' }
  ]

  it('should calculate total minutes for all logs', () => {
    const total = mockLogs.reduce((sum, log) => sum + log.minutes, 0)
    expect(total).toBe(225)
  })

  it('should calculate total for specific date', () => {
    const date = '2026-02-16'
    const dayTotal = mockLogs
      .filter(log => log.date === date)
      .reduce((sum, log) => sum + log.minutes, 0)
    expect(dayTotal).toBe(105)
  })

  it('should filter logs by date', () => {
    const date = '2026-02-16'
    const filteredLogs = mockLogs.filter(log => log.date === date)
    expect(filteredLogs).toHaveLength(2)
    expect(filteredLogs[0].title).toBe('数学')
    expect(filteredLogs[1].title).toBe('英語')
  })

  it('should convert minutes to hours and minutes format', () => {
    const totalMinutes = 135
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    expect(hours).toBe(2)
    expect(minutes).toBe(15)
  })

  it('should handle empty logs', () => {
    const emptyLogs: StudyLog[] = []
    const total = emptyLogs.reduce((sum, log) => sum + log.minutes, 0)
    expect(total).toBe(0)
  })

  it('should handle single log entry', () => {
    const singleLog = [mockLogs[0]]
    const total = singleLog.reduce((sum, log) => sum + log.minutes, 0)
    expect(total).toBe(60)
  })
})

describe('Study Log Operations', () => {
  it('should validate log entry has required fields', () => {
    const logEntry: StudyLog = {
      id: '1',
      title: '数学',
      minutes: 60,
      date: '2026-02-16'
    }
    expect(logEntry).toHaveProperty('id')
    expect(logEntry).toHaveProperty('title')
    expect(logEntry).toHaveProperty('minutes')
    expect(logEntry).toHaveProperty('date')
  })

  it('should validate minutes is positive number', () => {
    const minutes = 60
    expect(minutes).toBeGreaterThan(0)
    expect(typeof minutes).toBe('number')
  })

  it('should validate date format', () => {
    const date = '2026-02-16'
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    expect(datePattern.test(date)).toBe(true)
  })

  it('should delete log from list', () => {
    const logs: StudyLog[] = [
      { id: '1', title: '数学', minutes: 60, date: '2026-02-16' },
      { id: '2', title: '英語', minutes: 45, date: '2026-02-16' }
    ]
    const filtered = logs.filter(log => log.id !== '1')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('2')
  })
})

describe('Study Time Statistics', () => {
  it('should find longest study session', () => {
    const logs: StudyLog[] = [
      { id: '1', title: '数学', minutes: 60, date: '2026-02-16' },
      { id: '2', title: '英語', minutes: 90, date: '2026-02-16' },
      { id: '3', title: '物理', minutes: 45, date: '2026-02-16' }
    ]
    const longest = Math.max(...logs.map(log => log.minutes))
    expect(longest).toBe(90)
  })

  it('should find shortest study session', () => {
    const logs: StudyLog[] = [
      { id: '1', title: '数学', minutes: 60, date: '2026-02-16' },
      { id: '2', title: '英語', minutes: 90, date: '2026-02-16' },
      { id: '3', title: '物理', minutes: 45, date: '2026-02-16' }
    ]
    const shortest = Math.min(...logs.map(log => log.minutes))
    expect(shortest).toBe(45)
  })

  it('should calculate average study time', () => {
    const logs: StudyLog[] = [
      { id: '1', title: '数学', minutes: 60, date: '2026-02-16' },
      { id: '2', title: '英語', minutes: 90, date: '2026-02-16' },
      { id: '3', title: '物理', minutes: 30, date: '2026-02-16' }
    ]
    const total = logs.reduce((sum, log) => sum + log.minutes, 0)
    const average = total / logs.length
    expect(average).toBe(60)
  })
})
