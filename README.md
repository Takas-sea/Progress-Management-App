# Progress Management App

A study log management app built with Next.js and Supabase.

## Features

- Email OTP authentication (Supabase)
- Server-side protected API routes
- CRUD operations for study logs
- Delete confirmation UI
- Weekly progress visualization
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16.1.5, React 19.2.3, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth)
- **Testing**: Jest 30.x (unit/integration), Playwright 1.58.2 (E2E)

## Test Coverage

- ✅ **Unit Tests**: 174 tests, 100% pass rate (89.61% route.ts coverage)
- ✅ **E2E Tests**: 120 tests across 3 browsers (Chromium, Firefox, WebKit), 100% pass rate
- **Total**: 294 tests all passing

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests  
npm run e2e

# E2E tests with UI
npm run e2e:ui

# Test coverage
npm run test:coverage
```

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Setup

```bash
npm install
npm run dev
```

## Documentation

### Architecture & Design
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design, layering, and component structure
- [TECHNOLOGY_SELECTION.md](TECHNOLOGY_SELECTION.md) - Technology stack rationale and alternatives

### Testing & Quality
- [TEST_STRATEGY.md](TEST_STRATEGY.md) - Testing pyramid, coverage targets, and methodology
- [ERROR_HANDLING.md](ERROR_HANDLING.md) - Error management and handling strategy

### Deployment
- [CI_CD_FLOW.md](CI_CD_FLOW.md) - CI/CD pipeline and deployment workflow

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Main page (45 lines - pure composition)
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       └── study-log/
│           └── route.ts         # API endpoints (89.61% coverage)
├── components/
│   ├── LoginPage.tsx
│   ├── LoginForm.tsx
│   ├── GoogleLoginButton.tsx
│   ├── Header.tsx
│   ├── StudyLogForm.tsx
│   ├── StudyLogsList.tsx
│   └── WeeklyChart.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useStudyLogs.ts
│   └── useWeeklyData.ts
├── lib/
│   ├── apiUtils.ts
│   ├── studyUtils.ts
│   └── supabase-*.ts
└── __tests__/
    ├── api.test.ts              # Route handler tests
    ├── page.test.ts             # Component tests
    ├── studyUtils.test.ts       # Utility tests
    ├── apiUtils.test.ts         # API helper tests
    ├── weeklyGraph.test.ts      # Chart calculation tests
    ├── login.test.ts            # Auth flow tests
    ├── studyLog.test.ts         # CRUD operation tests
    └── sample.test.ts           # Sanity check tests

e2e/
├── auth-flow.spec.ts            # Login and form submission tests
├── api-integration.spec.ts      # API request and network handling tests
└── ui-components.spec.ts        # Component rendering and interaction tests
```