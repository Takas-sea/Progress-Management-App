import '@testing-library/jest-dom'

// Set up environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-123'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-123'

// Add global Request/Response for API tests if not available
if (typeof globalThis !== 'undefined' && !globalThis.Request) {
  // @ts-ignore
  globalThis.Request = class Request {
    url: string
    method: string
    headers: Map<string, string>
    private _body?: string

    constructor(url: string, options?: { method?: string; headers?: Record<string, string>; body?: string }) {
      this.url = url
      this.method = options?.method || 'GET'
      this.headers = new Map(Object.entries(options?.headers || {}))
      this._body = options?.body
    }

    get(name: string) {
      return this.headers.get(name) || null
    }

    async json() {
      try {
        return this._body ? JSON.parse(this._body) : {}
      } catch {
        return {}
      }
    }

    async text() {
      return this._body || ''
    }
  }
}

if (typeof globalThis !== 'undefined' && !globalThis.Response) {
  // @ts-ignore
  globalThis.Response = class Response {
    constructor(public body?: any, public options?: { status?: number; headers?: Record<string, string> }) {}
  }
}
