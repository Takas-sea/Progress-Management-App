/**
 * studyUtils 関数のテスト
 */

import {
  validateEmail,
  calculateDayTotal,
  generateWeeklyData,
  calculateWeeklyTotal,
  convertMinutesToTimeString,
  isValidStudyLog,
  filterLogsByDateRange,
  calculateStatistics,
  StudyLog
} from '@/lib/studyUtils'

describe('Email Validation', () => {
  it('should validate correct email format', () => {
    expect(validateEmail('user@example.com')).toBe(true)
  })

  it('should reject email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false)
  })

  it('should reject email without domain', () => {
    expect(validateEmail('user@')).toBe(false)
  })

  it('should reject empty email', () => {
    expect(validateEmail('')).toBe(false)
  })

  it('should reject email with spaces', () => {
    expect(validateEmail(' user@example.com')).toBe(false)
    expect(validateEmail('user@example.com ')).toBe(false)
  })

  it('should validate email with subdomain', () => {
    expect(validateEmail('user@mail.example.co.jp')).toBe(true)
  })
})

describe('Study Log Calculations', () => {
  const mockLogs: StudyLog[] = [
    { id: '1', title: '数学', minutes: 60, date: '2026-02-16' },
    { id: '2', title: '英語', minutes: 30, date: '2026-02-16' },
    { id: '3', title: '国語', minutes: 45, date: '2026-02-15' },
    { id: '4', title: '化学', minutes: 90, date: '2026-02-14' }
  ]

  it('should calculate day total correctly', () => {
    const total = calculateDayTotal(mockLogs, '2026-02-16')
    expect(total).toBe(90)
  })

  it('should return 0 for day with no logs', () => {
    const total = calculateDayTotal(mockLogs, '2026-02-13')
    expect(total).toBe(0)
  })

  it('should calculate single day correctly', () => {
    const total = calculateDayTotal(mockLogs, '2026-02-15')
    expect(total).toBe(45)
  })

  it('should handle empty logs array', () => {
    const total = calculateDayTotal([], '2026-02-16')
    expect(total).toBe(0)
  })
})

describe('Weekly Data Generation', () => {
  const mockLogs: StudyLog[] = [
    { id: '1', title: 'Math', minutes: 60, date: '2026-02-16' },
    { id: '2', title: 'English', minutes: 90, date: '2026-02-15' }
  ]

  it('should generate 7 days of weekly data', () => {
    // 2026-02-16は月曜日
    const referenceDate = new Date('2026-02-16')
    const weeklyData = generateWeeklyData(mockLogs, referenceDate)
    expect(weeklyData).toHaveLength(7)
  })

  it('should have correct day names', () => {
    const referenceDate = new Date('2026-02-16')
    const weeklyData = generateWeeklyData(mockLogs, referenceDate)
    const dayNames = weeklyData.map(d => d.day)
    expect(dayNames).toEqual(['日', '月', '火', '水', '木', '金', '土'])
  })

  it('should mark current day as today', () => {
    const referenceDate = new Date('2026-02-16')
    const weeklyData = generateWeeklyData(mockLogs, referenceDate)
    const todayCount = weeklyData.filter(d => d.isToday).length
    expect(todayCount).toBe(1)
  })

  it('should include logged minutes', () => {
    const referenceDate = new Date('2026-02-16')
    const weeklyData = generateWeeklyData(mockLogs, referenceDate)
    const mondayData = weeklyData[1] // 月曜日
    expect(mondayData.minutes).toBe(90)
  })
})

describe('Time Conversion', () => {
  it('should convert minutes to hours and minutes', () => {
    const result = convertMinutesToTimeString(135)
    expect(result.hours).toBe(2)
    expect(result.minutes).toBe(15)
  })

  it('should handle exact hours', () => {
    const result = convertMinutesToTimeString(120)
    expect(result.hours).toBe(2)
    expect(result.minutes).toBe(0)
  })

  it('should handle less than 1 hour', () => {
    const result = convertMinutesToTimeString(45)
    expect(result.hours).toBe(0)
    expect(result.minutes).toBe(45)
  })

  it('should handle 0 minutes', () => {
    const result = convertMinutesToTimeString(0)
    expect(result.hours).toBe(0)
    expect(result.minutes).toBe(0)
  })

  it('should handle large numbers', () => {
    const result = convertMinutesToTimeString(1440) // 24 hours
    expect(result.hours).toBe(24)
    expect(result.minutes).toBe(0)
  })
})

describe('Study Log Validation', () => {
  it('should validate correct log entry', () => {
    const valid = isValidStudyLog('Math Study', '60', '2026-02-16')
    expect(valid).toBe(true)
  })

  it('should reject empty title', () => {
    const valid = isValidStudyLog('', '60', '2026-02-16')
    expect(valid).toBe(false)
  })

  it('should reject non-numeric minutes', () => {
    const valid = isValidStudyLog('Math', 'abc', '2026-02-16')
    expect(valid).toBe(false)
  })

  it('should reject zero minutes', () => {
    const valid = isValidStudyLog('Math', '0', '2026-02-16')
    expect(valid).toBe(false)
  })

  it('should reject negative minutes', () => {
    const valid = isValidStudyLog('Math', '-30', '2026-02-16')
    expect(valid).toBe(false)
  })

  it('should reject empty date', () => {
    const valid = isValidStudyLog('Math', '60', '')
    expect(valid).toBe(false)
  })

  it('should reject invalid date format', () => {
    const valid = isValidStudyLog('Math', '60', '16-02-2026')
    expect(valid).toBe(false)
  })

  it('should accept whitespace-only title trimmed', () => {
    const valid = isValidStudyLog('   ', '60', '2026-02-16')
    expect(valid).toBe(false)
  })
})

describe('Date Range Filtering', () => {
  const mockLogs: StudyLog[] = [
    { id: '1', title: 'Math', minutes: 60, date: '2026-02-10' },
    { id: '2', title: 'English', minutes: 90, date: '2026-02-14' },
    { id: '3', title: 'Science', minutes: 45, date: '2026-02-20' }
  ]

  it('should filter logs within date range', () => {
    const filtered = filterLogsByDateRange(mockLogs, '2026-02-14', '2026-02-20')
    expect(filtered).toHaveLength(2)
  })

  it('should include start and end dates', () => {
    const filtered = filterLogsByDateRange(mockLogs, '2026-02-10', '2026-02-14')
    expect(filtered).toHaveLength(2)
  })

  it('should return empty when no logs match', () => {
    const filtered = filterLogsByDateRange(mockLogs, '2026-02-01', '2026-02-05')
    expect(filtered).toHaveLength(0)
  })

  it('should handle single day range', () => {
    const filtered = filterLogsByDateRange(mockLogs, '2026-02-14', '2026-02-14')
    expect(filtered).toHaveLength(1)
  })
})

describe('Statistics Calculation', () => {
  const mockLogs: StudyLog[] = [
    { id: '1', title: 'Math', minutes: 60, date: '2026-02-16' },
    { id: '2', title: 'English', minutes: 90, date: '2026-02-16' },
    { id: '3', title: 'Science', minutes: 30, date: '2026-02-15' }
  ]

  it('should calculate total minutes', () => {
    const stats = calculateStatistics(mockLogs)
    expect(stats.totalMinutes).toBe(180)
  })

  it('should calculate average minutes', () => {
    const stats = calculateStatistics(mockLogs)
    expect(stats.averageMinutes).toBe(60)
  })

  it('should identify max minutes', () => {
    const stats = calculateStatistics(mockLogs)
    expect(stats.maxMinutes).toBe(90)
  })

  it('should identify min minutes', () => {
    const stats = calculateStatistics(mockLogs)
    expect(stats.minMinutes).toBe(30)
  })

  it('should count total sessions', () => {
    const stats = calculateStatistics(mockLogs)
    expect(stats.totalSessions).toBe(3)
  })

  it('should handle empty logs', () => {
    const stats = calculateStatistics([])
    expect(stats.totalMinutes).toBe(0)
    expect(stats.averageMinutes).toBe(0)
    expect(stats.totalSessions).toBe(0)
  })

  it('should handle single log', () => {
    const stats = calculateStatistics([mockLogs[0]])
    expect(stats.totalMinutes).toBe(60)
    expect(stats.averageMinutes).toBe(60)
    expect(stats.maxMinutes).toBe(60)
    expect(stats.minMinutes).toBe(60)
  })
})

describe('Weekly Total Calculation', () => {
  it('should calculate total from weekly data', () => {
    const weeklyData = [
      { day: '日', date: '2026-02-10', minutes: 60, isToday: false },
      { day: '月', date: '2026-02-11', minutes: 90, isToday: false },
      { day: '火', date: '2026-02-12', minutes: 45, isToday: false },
      { day: '水', date: '2026-02-13', minutes: 0, isToday: false },
      { day: '木', date: '2026-02-14', minutes: 75, isToday: false },
      { day: '金', date: '2026-02-15', minutes: 120, isToday: false },
      { day: '土', date: '2026-02-16', minutes: 30, isToday: true }
    ]
    const total = calculateWeeklyTotal(weeklyData)
    expect(total).toBe(420)
  })

  it('should handle empty weekly data', () => {
    const total = calculateWeeklyTotal([])
    expect(total).toBe(0)
  })

  it('should handle all zero minutes', () => {
    const weeklyData = Array.from({ length: 7 }, (_, i) => ({
      day: ['日', '月', '火', '水', '木', '金', '土'][i],
      date: '2026-02-16',
      minutes: 0,
      isToday: i === 1
    }))
    const total = calculateWeeklyTotal(weeklyData)
    expect(total).toBe(0)
  })
})
