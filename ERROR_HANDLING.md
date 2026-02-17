# エラーハンドリング方針

## エラーハンドリング全体像

```
┌─────────────────────────────────────────────────────────┐
│           エラーの全ライフサイクル                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. エラー検出 ────▶ 2. 分類 ────▶ 3. ハンドリング     │
│                                                         │
│  ┌──────────┐    ┌──────────┐   ┌──────────┐         │
│  │ Client   │    │ User     │   │ Recover  │         │
│  │ Server   │    │ System   │   │ Graceful │         │
│  │ Network  │    │ Network  │   │ Retry    │         │
│  │ DB       │    │ Auth     │   │ Fallback │         │
│  └──────────┘    │ Validation   └──────────┘         │
│                  │ Rate Limit                         │
│                  │ Timeout                            │
│                  │ Conflict                           │
│                  └──────────┘                         │
│                                                         │
│  4. ログ記録 ───▶ 5. 監視 ────▶ 6. 復旧 ────▶ 7. 通知 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## エラー分類と対応策

### レベル 1: User-Facing Errors (ユーザーに見える)

#### 1.1 入力バリデーションエラー

```typescript
// 例: Email 形式が無効

// ブラウザ側 (フロント)
const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// ユーザーフィードバック
if (!validateEmail(email)) {
  showError('メールアドレスの形式が正しくありません');
  return;
}

// サーバー側 (バックエンド)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.email || !validateEmail(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    // ... 処理
  } catch (error) {
    // ...
  }
}
```

**対応方法**:
- ✅ ユーザーに明確なメッセージ表示
- ✅ 修正方法提示
- ✅ 再入力フォーカス

**ユーザーメッセージ**:
```
❌ メールアドレスが無効です
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 確認ポイント:                   ┃
┃ • @ 記号を含める               ┃
┃ • スペースを入れない           ┃
┃ • ドメインを含める             ┃
┃                               ┃
┃ 例: user@example.com           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

#### 1.2 認可エラー

```typescript
// 例: ユーザーが権限なしリソースにアクセス

export async function GET(req: Request) {
  const token = extractToken(req);
  
  if (!token) {
    return NextResponse.json(
      { error: 'ログインしてください' },
      { status: 401 }
    );
  }
  
  const user = await getUser(token);
  if (!user) {
    return NextResponse.json(
      { error: 'セッションが期限切れです。再度ログインしてください' },
      { status: 401 }
    );
  }
  
  // ... RLS ポリシーチェック
}
```

**対応方法**:
- ✅ ログインページへリダイレクト
- ✅ セッション更新機能
- ✅ 権限説明

#### 1.3 リソース不足エラー

```typescript
// 例: 指定 ID のログが見つからない

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  const { data, error } = await supabase
    .from('study_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: 'ログが見つかりません' },
      { status: 404 }
    );
  }
}
```

**対応方法**:
- ✅ 404 ページまたはモーダル
- ✅ 前のページへ戻る
- ✅ リスト再読み込み

### レベル 2: System Errors (システムレベル)

#### 2.1 なりすまし攻撃からの保護

```typescript
// JWT トークン検証

function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded as User;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('Token expired:', error);
      // 自動更新試行
      return refreshToken(token);
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid token:', error);
      // ログを記録して拒否
      return null;
    }
    
    throw error; // 予期しないエラー
  }
}
```

#### 2.2 データベース接続エラー

```typescript
// 例: Supabase が一時的に使用不可

export async function GET(req: Request) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('study_logs')
        .select('*')
        .eq('user_id', userId);
      
      if (!error) return NextResponse.json(data);
      
      lastError = error;
      
      // エクスポーネンシャルバックオフ
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    } catch (e) {
      lastError = e;
    }
  }
  
  // 最大リトライ後も失敗
  console.error('Failed to fetch logs after 3 attempts:', lastError);
  
  return NextResponse.json(
    { error: 'データベースが一時的に利用不可です。後でもう一度お試しください' },
    { status: 503 }
  );
}
```

**リトライ戦略**:
```
Attempt 1: 即座
  ❌ Fail
  
Attempt 2: 2秒待機後
  ❌ Fail
  
Attempt 3: 4秒待機後
  ❌ Fail
  
Give up: ユーザーに通知
```

#### 2.3 ネットワークエラー

```typescript
// クライアント側

const fetchWithRetry = async (url: string, options: RequestInit) => {
  let lastError;
  
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10秒タイムアウト
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // バックオフ後に再試行
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  
  // ユーザー向けエラー表示
  if ((lastError as Error).name === 'AbortError') {
    showToast('接続タイムアウト。インターネット接続を確認してください');
  } else {
    showToast('通信エラーが発生しました');
  }
  
  throw lastError;
};
```

### レベル 3: Developer Errors (開発者向け)

#### 3.1 Unhandled Promise Rejection

```typescript
// グローバルハンドラー

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    
    // Sentry などに送信
    captureException(event.reason, {
      level: 'error',
      contexts: {
        promise: {
          message: event.reason?.message,
          stack: event.reason?.stack,
        }
      }
    });
    
    // ユーザーに通知せず、ログのみ
    event.preventDefault();
  });
}
```

#### 3.2 Type Errors

```typescript
// TypeScript がコンパイル時に検出

// ❌ エラー: number ではなく string が必要
const minutes: number = '120';  // Type 'string' is not assignable to type 'number'

// ✅ 正しい
const minutes: number = 120;

// ✅ 型ガード
function updateLog(log: unknown) {
  if (typeof log !== 'object' || log === null) {
    throw new Error('Invalid log object');
  }
  
  const typedLog = log as StudyLog;
  // 以降は安全に使用可能
}
```

## グローバルエラーハンドリング

### React Error Boundary

```typescript
// components/ErrorBoundary.tsx

'use client';

import { ReactNode } from 'react';
import { useEffect, useState } from 'react';

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setError(event.error);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (error) {
    return (
      <div className="error-container">
        <h1>エラーが発生しました</h1>
        <p>{error.message}</p>
        <button onClick={() => {
          setError(null);
          window.location.reload();
        }}>
          ページを再読み込み
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
}
```

### API Error Response Format

```typescript
// 統一されたエラーレスポンス

interface ErrorResponse {
  error: string;                    // ユーザーメッセージ
  code: string;                     // エラーコード
  details?: Record<string, any>;    // 詳細情報
  requestId?: string;               // トレースID
}

// 例
{
  "error": "Invalid request format",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "reason": "must be valid email"
  },
  "requestId": "req_123abc"
}
```

## ログとモニタリング

### ログレベル

```typescript
console.debug('[DEBUG] Detailed information for debugging');
console.info('[INFO] General information');
console.warn('[WARN] Warning - something unexpected');
console.error('[ERROR] Error - something went wrong');

// または
import { logger } from '@/lib/logger';

logger.debug('User logged in', { userId });
logger.info('API request', { method, path, duration: '45ms' });
logger.warn('Slow query', { query, duration: '5000ms' });
logger.error('Database error', { error, context: 'fetchLogs' });
```

### Error Tracking (Sentry)

```typescript
// sentry.server.config.ts

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  
  beforeSend(event, hint) {
    // 機密情報をフィルタリング
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  }
});
```

## エラーの可視化

```
ユーザー画面:

┌────────────────────────────────┐
│         エラーモーダル          │
├────────────────────────────────┤
│                                │
│  ⚠️ エラーが発生しました       │
│                                │
│  メールアドレスが見つかり      │
│  ません。入力を確認して        │
│  ください。                    │
│                                │
│  ┌──────────────────────────┐ │
│  │ 戻る      | 再試行        │ │
│  └──────────────────────────┘ │
│                                │
└────────────────────────────────┘

トースト通知:

  ⚠️ セッションの有効期限が切れました
  [確認]

開発者コンソール:

  🔴 ERROR [2026-02-16 15:30:45]
     Auth error: Invalid token
     Stack: at verifyToken (route.ts:21:15)
            at GET (route.ts:18:7)
     Context: { userId: 'user123', action: 'fetch_logs' }
     Request ID: req_abc123def456
```

## チェックリスト: エラーハンドリング実装

```
□ エラーメッセージがユーザーフレンドリーか
□ エラーをログに記録しているか
□ エラー復旧機能があるか (リトライ, フォールバック)
□ 機密情報がいないか
□ ネットワークエラーを処理しているか
□ タイムアウトが設定されているか
□ エラー状態をテストしているか
□ Error Boundary がアプリを守っているか
□ Sentry/ モニタリングツール設定済みか
□ エラー文字列は標準化されているか
```

## まとめ

| レベル | エラー種別 | 対応 | サンプルコード |
|--------|-----------|------|--------------|
| **1** | 入力エラー | UI反応 | show toast |
| **1** | 認可エラー | リダイレクト | 401 状態コード |
| **2** | DB接続 | リトライ | 指数バックオフ |
| **2** | ネットワーク | リトライ | AbortSignal |
| **3** | Promise | ログのみ | unhandledrejection |
| **3** | Type | コンパイル時検出 | TypeScript |

**エラーハンドリング品質**: ⭐⭐⭐⭐⭐
