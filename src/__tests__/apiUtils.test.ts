/**
 * API ユーティリティ関数のテスト
 */

import {
  validateStudyLogBody,
  extractTokenFromHeader,
  extractIdFromUrl,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/apiUtils'

describe('Study Log Body Validation', () => {
  it('should validate correct body', () => {
    const body = { title: 'Math Study', minutes: 60, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should reject null body', () => {
    const result = validateStudyLogBody(null)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Request body is required')
  })

  it('should reject undefined body', () => {
    const result = validateStudyLogBody(undefined)
    expect(result.valid).toBe(false)
  })

  it('should reject missing title', () => {
    const body = { minutes: 60, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Title is required')
  })

  it('should reject empty title', () => {
    const body = { title: '', minutes: 60, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Title cannot be empty')
  })

  it('should reject title with only spaces', () => {
    const body = { title: '   ', minutes: 60, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
  })

  it('should reject non-string title', () => {
    const body = { title: 123, minutes: 60, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Title is required and must be a string')
  })

  it('should reject missing minutes', () => {
    const body = { title: 'Math', date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Minutes is required')
  })

  it('should reject null minutes', () => {
    const body = { title: 'Math', minutes: null, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
  })

  it('should reject non-numeric minutes', () => {
    const body = { title: 'Math', minutes: 'sixty', date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Minutes must be a number')
  })

  it('should reject zero minutes', () => {
    const body = { title: 'Math', minutes: 0, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Minutes must be greater than 0')
  })

  it('should reject negative minutes', () => {
    const body = { title: 'Math', minutes: -30, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Minutes must be greater than 0')
  })

  it('should reject minutes greater than 1440', () => {
    const body = { title: 'Math', minutes: 1441, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Minutes cannot exceed 1440')
  })

  it('should accept minutes equal to 1440', () => {
    const body = { title: 'Math', minutes: 1440, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(true)
  })

  it('should reject missing date', () => {
    const body = { title: 'Math', minutes: 60 }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Date is required')
  })

  it('should reject invalid date format', () => {
    const body = { title: 'Math', minutes: 60, date: '16-02-2026' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Date must be in YYYY-MM-DD format')
  })

  it('should reject invalid date value', () => {
    const body = { title: 'Math', minutes: 60, date: '2026-13-45' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid date')
  })

  it('should accept valid dates', () => {
    const validDates = ['2026-02-16', '2026-01-01', '2026-12-31']
    validDates.forEach(date => {
      const body = { title: 'Math', minutes: 60, date }
      const result = validateStudyLogBody(body)
      expect(result.valid).toBe(true)
    })
  })
})

describe('Token Extraction from Authorization Header', () => {
  it('should extract token from valid header', () => {
    const authHeader = 'Bearer abc123xyz'
    const result = extractTokenFromHeader(authHeader)
    expect(result.token).toBe('abc123xyz')
    expect(result.error).toBeUndefined()
  })

  it('should reject null header', () => {
    const result = extractTokenFromHeader(null)
    expect(result.error).toContain('Authorization header is missing')
  })

  it('should reject header without Bearer prefix', () => {
    const authHeader = 'Basic abc123'
    const result = extractTokenFromHeader(authHeader)
    expect(result.error).toContain('Authorization header must start with "Bearer "')
  })

  it('should reject header with only Bearer prefix', () => {
    const authHeader = 'Bearer '
    const result = extractTokenFromHeader(authHeader)
    expect(result.error).toContain('Token is empty')
  })

  it('should handle case sensitive Bearer prefix', () => {
    const authHeader = 'bearer abc123'
    const result = extractTokenFromHeader(authHeader)
    expect(result.error).toContain('Authorization header must start with "Bearer "')
  })

  it('should extract token with special characters', () => {
    const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    const result = extractTokenFromHeader(authHeader)
    expect(result.token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
  })
})

describe('ID Extraction from URL', () => {
  it('should extract id from valid URL', () => {
    const url = 'http://localhost:3000/api/study-logs?id=abc123'
    const result = extractIdFromUrl(url)
    expect(result.id).toBe('abc123')
    expect(result.error).toBeUndefined()
  })

  it('should reject URL without id parameter', () => {
    const url = 'http://localhost:3000/api/study-logs'
    const result = extractIdFromUrl(url)
    expect(result.error).toContain('ID is required')
  })

  it('should reject empty id parameter', () => {
    const url = 'http://localhost:3000/api/study-logs?id='
    const result = extractIdFromUrl(url)
    expect(result.error).toContain('ID is required')
  })

  it('should reject empty URL string', () => {
    const result = extractIdFromUrl('')
    expect(result.error).toContain('URL is required')
  })

  it('should reject invalid URL', () => {
    const url = 'not a valid url at all'
    const result = extractIdFromUrl(url)
    expect(result.error).toContain('Invalid URL')
  })

  it('should handle id with special characters', () => {
    const url = 'http://localhost:3000/api/study-logs?id=uuid-1234-5678'
    const result = extractIdFromUrl(url)
    expect(result.id).toBe('uuid-1234-5678')
  })

  it('should handle multiple query parameters', () => {
    const url = 'http://localhost:3000/api/study-logs?id=abc123&other=value'
    const result = extractIdFromUrl(url)
    expect(result.id).toBe('abc123')
  })
})

describe('API Response Creation', () => {
  it('should create error response with default status', () => {
    const response = createErrorResponse('Invalid input')
    expect(response.error).toBe('Invalid input')
    expect(response.status).toBe(400)
    expect(response.details).toBeUndefined()
  })

  it('should create error response with details', () => {
    const response = createErrorResponse('Database error', 'Connection timeout', 500)
    expect(response.error).toBe('Database error')
    expect(response.details).toBe('Connection timeout')
    expect(response.status).toBe(500)
  })

  it('should create error response with custom status', () => {
    const response = createErrorResponse('Not found', undefined, 404)
    expect(response.status).toBe(404)
  })

  it('should create success response', () => {
    const data = { id: '123', title: 'Math' }
    const response = createSuccessResponse(data, 201)
    expect(response.data).toEqual(data)
    expect(response.status).toBe(201)
  })

  it('should create success response with default status', () => {
    const data = [{ id: '1' }, { id: '2' }]
    const response = createSuccessResponse(data)
    expect(response.status).toBe(200)
  })

  it('should handle null data in success response', () => {
    const response = createSuccessResponse(null)
    expect(response.data).toBeNull()
  })

  it('should handle empty array in success response', () => {
    const response = createSuccessResponse([])
    expect(response.data).toEqual([])
  })
})

describe('Authorization Header Edge Cases', () => {
  it('should handle header with leading/trailing whitespace', () => {
    const authHeader = '  Bearer abc123  '
    const result = extractTokenFromHeader(authHeader)
    // trim()を実装していないため、エラーが発生する
    expect(result.error).toBeDefined()
  })

  it('should handle multiple Bearer prefixes', () => {
    const authHeader = 'Bearer Bearer abc123'
    const result = extractTokenFromHeader(authHeader)
    expect(result.token).toBe('Bearer abc123')
  })

  it('should extract long JWT tokens', () => {
    const longToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const authHeader = `Bearer ${longToken}`
    const result = extractTokenFromHeader(authHeader)
    expect(result.token).toBe(longToken)
  })
})

describe('Request Body Validation Edge Cases', () => {
  it('should accept minutes as decimal', () => {
    const body = { title: 'Math', minutes: 60.5, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(true)
  })

  it('should handle very long title', () => {
    const longTitle = 'A'.repeat(1000)
    const body = { title: longTitle, minutes: 60, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(true)
  })

  it('should handle title with special characters', () => {
    const body = { title: 'Math & Science 📚', minutes: 60, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(true)
  })

  it('should handle scientific notation for minutes', () => {
    const body = { title: 'Math', minutes: 1e2, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(true)
  })

  it('should have error field in invalid response', () => {
    const body = { title: 'Math', minutes: -10, date: '2026-02-16' }
    const result = validateStudyLogBody(body)
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
  })
})
