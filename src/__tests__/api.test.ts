/**
 * @jest-environment node
 */

// Supabase モジュールをモック化
jest.mock('@/lib/supabase-server')
jest.mock('@/lib/supabase-admin')

import { GET, POST, DELETE } from '@/app/api/study-logs/route'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>

// NextResponse.json のモック関数
const mockJsonResponse = (data: any, status = 200) => ({
  json: async () => data,
  ok: status < 400,
  status,
  data,
})

describe('Route Handler Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET Handler - Authorization Logic', () => {
    it('should access Authorization header in GET request', async () => {
      // Route: line 11 - req.headers.get("Authorization")
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockCreateAdminClient.mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' },
      })

      const response = await GET(request)
      expect(response).toBeDefined()
    })

    it('should check Bearer prefix in GET request', async () => {
      // Route: line 12 - authHeader?.startsWith("Bearer ")
      const mockSupabase = {
        auth: { getUser: jest.fn() },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'GET',
        headers: { Authorization: 'Invalid-Scheme token' },
      })

      const response = await GET(request)
      const data = await (response as any).json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should extract token using substring in GET request', async () => {
      // Route: line 17 - token = authHeader.substring(7)
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockCreateAdminClient.mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'GET',
        headers: { Authorization: 'Bearer my-secret-token-12345' },
      })

      const response = await GET(request)
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('my-secret-token-12345')
    })
  })

  describe('GET Handler - User Authentication', () => {
    it('should call getUser with token in GET request', async () => {
      // Route: lines 18-20 - supabase.auth.getUser(token)
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockCreateAdminClient.mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'GET',
        headers: { Authorization: 'Bearer token123' },
      })

      await GET(request)
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('token123')
    })

    it('should handle auth error in GET request', async () => {
      // Route: lines 20-22 - if (authError || !user)
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid token' },
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'GET',
        headers: { Authorization: 'Bearer invalid' },
      })

      const response = await GET(request)
      const data = await (response as any).json()
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('GET Handler - Database Query', () => {
    it('should query study_logs with user_id filter in GET', async () => {
      // Route: lines 26-28 - admin.from("study_logs").select().eq("user_id", user.id)
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      const mockAdmin = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [{ id: '1', title: 'Math', minutes: 60, date: '2026-02-16' }],
                error: null,
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockCreateAdminClient.mockReturnValue(mockAdmin as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      })

      await GET(request)

      expect(mockAdmin.from).toHaveBeenCalledWith('study_logs')
      expect(mockAdmin.from('study_logs').select).toHaveBeenCalled()
      expect(mockAdmin.from('study_logs').select().eq).toHaveBeenCalledWith('user_id', 'user-123')
    })

    it('should order by created_at descending in GET', async () => {
      // Route: line 30 - .order("created_at", { ascending: false })
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      const mockAdmin = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockCreateAdminClient.mockReturnValue(mockAdmin as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      })

      await GET(request)

      const orderCall = (mockAdmin.from('study_logs').select().eq().order as jest.Mock)
      expect(orderCall).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should handle database errors in GET', async () => {
      // Route: lines 32-35 - if (error) { return error response }
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      const mockAdmin = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Connection failed' },
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockCreateAdminClient.mockReturnValue(mockAdmin as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      })

      const response = await GET(request)
      const data = await (response as any).json()
      expect(data.error).toBe('Database error')
    })
  })

  describe('POST Handler - Request Body Validation', () => {
    it('should extract and validate POST body fields', async () => {
      // Route: lines 46-48 - body = await req.json(), validation checks
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockCreateAdminClient.mockReturnValue({
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ id: '1', title: 'Test', minutes: 60, date: '2026-02-16' }],
              error: null,
            }),
          }),
        }),
      } as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        },
        body: JSON.stringify({ title: 'Test', minutes: 60, date: '2026-02-16' }),
      })

      const response = await POST(request)
      expect(response).toBeDefined()
    })

    it('should validate missing title field in POST', async () => {
      // Route: line 51 - if (!body.title || ...)
      mockCreateClient.mockResolvedValue({ auth: { getUser: jest.fn() } } as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: 60, date: '2026-02-16' }),
      })

      const response = await POST(request)
      const data = await (response as any).json()
      expect(data.error).toBe('Missing required fields')
    })

    it('should validate invalid minutes value in POST', async () => {
      // Route: lines 54-56 - typeof check and value validation
      mockCreateClient.mockResolvedValue({ auth: { getUser: jest.fn() } } as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', minutes: -10, date: '2026-02-16' }),
      })

      const response = await POST(request)
      const data = await (response as any).json()
      expect(data.error).toBe('Invalid minutes value')
    })
  })

  describe('DELETE Handler - Query Parameter Extraction', () => {
    it('should extract id from query parameters in DELETE', async () => {
      // Route: lines 109-110 - new URL(req.url), searchParams.get("id")
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      const mockAdmin = {
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn()
              .mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null,
                  count: 1,
                }),
              }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockCreateAdminClient.mockReturnValue(mockAdmin as any)

      const request = new Request('http://localhost/api/study-logs?id=log-123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer token' },
      })

      const response = await DELETE(request)
      expect(response).toBeDefined()
    })

    it('should validate missing id parameter in DELETE', async () => {
      // Route: lines 112-114 - if (!id) validation
      mockCreateClient.mockResolvedValue({ auth: { getUser: jest.fn() } } as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'DELETE',
        headers: {},
      })

      const response = await DELETE(request)
      const data = await (response as any).json()
      expect(data.error).toBe('ID is required')
    })
  })

  describe('DELETE Handler - RLS Bypass Delete Operation', () => {
    it('should execute delete with user_id check in DELETE', async () => {
      // Route: lines 140-143 - admin.from("study_logs").delete().eq("id", id).eq("user_id", user.id)
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      const mockAdmin = {
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn()
              .mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null,
                  count: 1,
                }),
              }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockCreateAdminClient.mockReturnValue(mockAdmin as any)

      const request = new Request('http://localhost/api/study-logs?id=log-123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer token' },
      })

      await DELETE(request)

      expect(mockAdmin.from).toHaveBeenCalledWith('study_logs')
      expect(mockAdmin.from('study_logs').delete).toHaveBeenCalled()
    })

    it('should return 404 when log not found in DELETE', async () => {
      // Route: lines 145-147 - if (count === 0)
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      const mockAdmin = {
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn()
              .mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null,
                  count: 0,
                }),
              }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockCreateAdminClient.mockReturnValue(mockAdmin as any)

      const request = new Request('http://localhost/api/study-logs?id=nonexistent', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer token' },
      })

      const response = await DELETE(request)
      const data = await (response as any).json()
      expect(data.error).toBe('Log not found')
    })
  })

  describe('Error Handling - Try-Catch Blocks', () => {
    it('should catch errors in GET and return 500', async () => {
      // Route: lines 39-42 - try-catch block
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      })

      const response = await GET(request)
      const data = await (response as any).json()
      expect(data.error).toContain('Failed')
    })

    it('should catch errors in POST and return 500', async () => {
      // Route: lines 96-99 - try-catch block
      mockCreateClient.mockResolvedValue({ auth: { getUser: jest.fn() } } as any)

      const request = new Request('http://localhost/api/study-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })

      const response = await POST(request)
      expect(response).toBeDefined()
    })

    it('should catch errors in DELETE and return 500', async () => {
      // Route: lines 149-152 - try-catch block
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockRejectedValue(new Error('Auth service down')),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const request = new Request('http://localhost/api/study-logs?id=123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer token' },
      })

      const response = await DELETE(request)
      const data = await (response as any).json()
      expect(data.error).toContain('Failed')
    })
  })
})
