# テスト戦略

## テスト戦略の概要

```
┌─────────────────────────────────────────────────────────┐
│              テストピラミッド                            │
│                                                         │
│                      ▲                                  │
│                     /|\  E2E Tests (🎯) 重要度: 高     │
│                    / | \  - 120 テスト                 │
│                   /  |  \ - 実ユーザーシナリオ        │
│                  /   |   \                             │
│                 /────┼────\                            │
│                /     |     \  Integration Tests        │
│               /      |      \ - API Tests (33)         │
│              /       |       \                         │
│             /────────┼────────\                        │
│            /         |         \ Unit Tests (85) 重要度: 中  │
│           /          |          \                      │
│          /───────────┼───────────\                     │
│         /            |            \                    │
│        /             |             \ Unit Tests        │
│       /    Jest      |              \ - ユーティリティ   │
│      /   (Static)    |               \ - Hooks        │
│     /                |                \               │
│    /─────────────────┼─────────────────\              │
│   /                  |                  \              │
│  /   Lint & Type    |     Static Tests   \             │
│ /   Check (30s)     |     Performance,    \            │
│/                    |     Accessibility    \           │
└───────────────────┴──────────────────────┴──┘          │
                                                         │
        実行時間    自動化度    バグ検出率    保守性      │
        高  👈─────────────────────────────➜  低         │
       短  👈─────────────────────────────➜  長          │
```

## テストレベル別戦略

### 1️⃣ Unit Tests (単体テスト)

**目的**: 個別関数の動作確認

**担当ファイル**:
```
src/__tests__/
├── studyUtils.test.ts    (100% カバレッジ, 33 テスト)
├── apiUtils.test.ts      (86.8% カバレッジ, 36 テスト)  
├── login.test.ts         (13 テスト)
├── studyLog.test.ts      (16 テスト)
└── sample.test.ts        (3 テスト)
```

**実装例: studyUtils.test.ts**
```typescript
// 日付スタンプから今週の合計を計算
test('calculateWeekTotal: 今週データから合計を精確に計算', () => {
  const thisWeek = {
    'Mon': 120, 'Tue': 150, 'Wed': 0,
    'Thu': 180, 'Fri': 200, 'Sat': 90, 'Sun': 0
  };
  expect(calculateWeekTotal(thisWeek)).toBe(740);
});

// 無効なデータを処理
test('calculateWeekTotal: 無効なデータを0で返す', () => {
  expect(calculateWeekTotal(null)).toBe(0);
  expect(calculateWeekTotal({})).toBe(0);
});
```

**メトリクス**:
- **実行時間**: 〜5秒
- **カバレッジ**: avg 90%
- **トランザクション**: なし (純粋関数テスト)
- **モック**: 最小限

### 2️⃣ Integration Tests (統合テスト)

**目的**: API エンドポイント全体の動作確認

**テストファイル**: `src/__tests__/api.test.ts` (174 テスト)

**カバレッジ**: route.ts 89.61%

**実装例**:
```typescript
// GET /api/study-logs の統合テスト
test('GET: 正常なリクエストでログを返す', async () => {
  // セットアップ: Supabase モック
  jest.spyOn(supabaseClient, 'rpc').mockResolvedValue({
    data: [{id: 1, user_id: 'user1', minutes: 120, ...}]
  });

  // 実行: API リクエスト
  const req = new Request('http://localhost/api/study-logs', {
    headers: { 'Authorization': 'Bearer valid_token' }
  });
  const res = await GET(req);

  // 検証
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data).toHaveLength(1);
});

// GET: 認可エラーチェック
test('GET: トークン無しで401を返す', async () => {
  const req = new Request('http://localhost/api/study-logs');
  const res = await GET(req);
  
  expect(res.status).toBe(401);
});
```

**モック戦略**:
```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    rpc: jest.fn(),
    from: jest.fn()
  }
}));

// 各テストで返却値を設定
const mockUser = { id: 'user123', email: 'test@example.com' };
jest.spyOn(supabase.auth, 'getUser')
  .mockResolvedValue({ data: { user: mockUser } });
```

**メトリクス**:
- **実行時間**: 〜10秒
- **カバレッジ**: route.ts 89.61%
- **トランザクション**: あり (DB モック)
- **モック**: 中程度

### 3️⃣ E2E Tests (エンドツーエンドテスト)

**目的**: 実際のユーザーシナリオをテスト

**テストファイル**:
```
e2e/
├── auth-flow.spec.ts      (15 テスト × 3 ブラウザ = 45)
├── api-integration.spec.ts (11 テスト × 3 ブラウザ = 33)
└── ui-components.spec.ts  (14 テスト × 3 ブラウザ = 42)
```

**ブラウザカバレッジ**: 120 テスト, 100% 合格

**実装例: auth-flow.spec.ts**
```typescript
test('should load login page with email input', async ({ page }) => {
  // ユーザー訪問
  await page.goto('/');
  
  // UI の可視性確認
  await expect(page.locator('text=メールアドレス')).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'メールでログイン' }))
    .toBeVisible();
});

test('should handle email submission correctly', async ({ page }) => {
  await page.goto('/');
  
  // ユーザーアクション: メール入力
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill('test@example.com');
  
  // ボタンクリック
  const submitButton = page.getByRole('button', { name: 'メールでログイン' });
  await submitButton.click();
  
  // ダイアログ確認
  page.once('dialog', dialog => dialog.accept());
  
  // 副作用: 入力欄がリセットされる
  await expect(emailInput).toHaveValue('');
});
```

**テスト環境**:
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  }
});
```

**メトリクス**:
- **実行時間**: 〜50秒
- **カバレッジ**: 全ユーザージャーニー
- **トランザクション**: リアル (本当のサーバー)
- **モック**: なし (実テスト環境)

### 4️⃣ Lint & Type Check (静的解析)

**実行**:
```bash
npm run lint           # ESLint のみ
tsc --noEmit         # TypeScript 型チェック
```

**チェック項目**:
```
ESLint:
- Unused variables
- Style issues
- Security concerns
- Best practices

TypeScript:
- Type mismatches
- Missing imports
- Incorrect function calls
```

## テスト実行フロー

```
┌─────────────────────────────────────────┐
│  開発者がコミット                       │
│  git commit -m "新機能: ..."            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  1. Pre-commit Hook (husky)             │
│  - Lint Check (ESLint)                  │
│  - Type Check (tsc)                     │
│  - Prettier Format                      │
└────────────┬────────────────────────────┘
             │ ✅ Pass
             │
             ▼
┌─────────────────────────────────────────┐
│  2. Local Jest Tests                    │
│  - Unit Tests (〜5秒)                   │
│  - Integration (〜10秒)                 │
│  - Coverage Report                      │
└────────────┬────────────────────────────┘
             │ ✅ Pass / ❌ Fail
             │
  ┌──────────┴──────────┐
  │                     │
  ▼ Fail                ▼ Pass
  (修正)         git push origin
  修正 ──────┐
  │          │
  └──────┬───┘
         │
┌────────▼──────────────────────────────┐
│  3. GitHub Actions CI (自動)          │
│  ├─ Lint & Type (2分)                │
│  ├─ Jest Unit Test (5分)              │
│  ├─ Jest Integration (10分)           │
│  ├─ Playwright E2E (50分)             │
│  ├─ Build Test (3分)                  │
│  └─ Security Scan (optional)          │
└────────┬───────────────────────────────┘
         │ ✅ All Pass
         │
         ▼
┌────────────────────────────────────────┐
│  4. Pull Request Ready                 │
│  - コードレビュー待機                  │
│  - マージ前チェック完了                │
└────────┬───────────────────────────────┘
         │ Approved
         │
         ▼
┌────────────────────────────────────────┐
│  5. Deploy to Production               │
│  - Staging 検証                        │
│  - 本番デプロイ                        │
│  - Monitoring                          │
└────────────────────────────────────────┘
```

## テストデータ管理

### パターン 1: Mock Data (単体 & 統合テスト)

```typescript
// fixtures/api-responses.ts
export const mockStudyLog = {
  id: '123',
  user_id: 'user-abc',
  minutes: 120,
  date: '2026-02-16',
  category: 'JavaScript'
};

export const mockUser = {
  id: 'user-abc',
  email: 'test@example.com',
  aud: 'authenticated'
};
```

### パターン 2: Test Database (E2E テスト)

```typescript
// e2e/fixtures/setup.ts
import { test as base } from '@playwright/test';

type TestFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // テストデータベースにログイン
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // 認証状態を共有
    await use(page);
    
    // クリーンアップ
    await page.goto('/logout');
  }
});
```

## カバレッジ目標

| ファイル | 目標 | 現在 | 学習 |
|---------|------|------|------|
| route.ts (API) | 80% | 89.61% ✅ | 9.61pt 超過 |
| page.tsx | 40% | 26.66% | 13.34pt 不足 (SSR複雑性) |
| Hooks | 60% | 各フック平均 | カスタムロジック |
| Utils | 80% | studyUtils 100% ✅ | 完全カバレッジ達成 |
| **全体** | **70%** | **44.8%** | **継続改善** |

## デバッグ & トラブルシューティング

### Jest テストがコケた場合

```bash
# 単一ファイルのみ実行
npm test -- api.test.ts

# ウォッチモードで実行
npm test -- --watch

# デバッグ情報付き
npm test -- --verbose

# カバレッジレポート確認
npm run test:coverage
# ブラウザで開く:
open coverage/lcov-report/index.html
```

### E2E テストがコケた場合

```bash
# 1 つのテストのみ実行
npx playwright test -g "should load login page"

# UI モード (ステップバイステップ)
npx playwright test --ui

# デバッグモード
npx playwright test --debug

# 失敗時のスクリーンショット確認
npx playwright show-report
```

## ベストプラクティス

### 1. Arrange-Act-Assert パターン

```typescript
test('should update study log correctly', () => {
  // Arrange: データ準備
  const input = { minutes: 120, category: 'React' };
  
  // Act: アクション実行
  const result = updateStudyLog(input);
  
  // Assert: 検証
  expect(result).toEqual({ ...input, updated_at: expect.any(Date) });
});
```

### 2. DRY (Don't Repeat Yourself)

```typescript
// ❌ 悪い例
test('parse date 1', () => {
  expect(parseDate('2026-02-16')).toEqual(...);
});
test('parse date 2', () => {
  expect(parseDate('2025-01-01')).toEqual(...);
});

// ✅ 良い例
describe('parseDate', () => {
  test.each([
    ['2026-02-16', new Date(2026, 1, 16)],
    ['2025-01-01', new Date(2025, 0, 1)],
  ])('parses %s correctly', (input, expected) => {
    expect(parseDate(input)).toEqual(expected);
  });
});
```

### 3. 高速で独立したテスト

```typescript
// ✅ 良い例: 独立、モック化
test('fetch logs for user', async () => {
  const mockFetch = jest.fn()
    .mockResolvedValue({ json: () => ({ logs: [] }) });
  
  global.fetch = mockFetch;
  
  const result = await getLogs('user123');
  expect(mockFetch).toHaveBeenCalledWith('/api/logs?user=user123');
});
```

## テスト報告書例

```
Test Session Results
====================
Date: 2026-02-16T15:30:00Z
Duration: 65.3 seconds

Lint & Type Check: ✅ PASS (2s)
- ESLint: 0 errors
- TypeScript: 0 errors

Unit Tests: ✅ PASS (5s)
- Tests: 85 passed
- Coverage: 85% avg

Integration Tests: ✅ PASS (10s)
- Tests: 89 passed  
- route.ts: 89.61% coverage

E2E Tests: ✅ PASS (48.3s)
- Chromium: 40 passed
- Firefox: 40 passed
- WebKit: 40 passed
- Total: 120 passed

Build: ✅ PASS (3s)
- Output size: 45 MB
- No warnings

Overall: ✅ ALL PASS
Ready for deployment ✅
```
