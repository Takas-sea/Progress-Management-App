# アーキテクチャ図

## システム全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                     ユーザーブラウザ                          │
│  (Chrome, Firefox, Safari, Edge など)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 16.1.5                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Page Router (App Router)                 │  │
│  │                                                       │  │
│  │  ┌─────────────────┬──────────────┬──────────────┐  │  │
│  │  │                 │              │              │  │  │
│  │  ▼                 ▼              ▼              ▼  │  │
│  │ page.tsx    components/    hooks/          lib/  │  │
│  │ (45行)      (分割後)     (カスタム)    (ユーティリティ) │  │
│  │             - LoginForm   - useAuth     - apiUtils  │  │
│  │             - LoginPage   - useStudyLogs- studyUtils│  │
│  │             - Header      - useWeeklyData          │  │
│  │             - etc...                               │  │
│  │                                                    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │         API Routes (route.ts)                │  │  │
│  │  │  GET / POST / DELETE                         │  │  │
│  │  │  - 155 行                                    │  │  │
│  │  │  - 89.61% カバレッジ                        │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────┬──────────────────────────────────┬─────────┘
             │ HTTP/無認証                      │ Supabase SDK
             ▼                                  ▼
    ┌─────────────────┐         ┌──────────────────────────────┐
    │  開発サーバー   │         │    Supabase Platform          │
    │  Port 3000      │         │  ┌────────────────────────┐  │
    │                 │         │  │  Authentication (SSR)  │  │
    │  • HMR          │         │  │  - OTP with Email      │  │
    │  • Fast Refresh │         │  │  - Google OAuth        │  │
    │                 │         │  └────────────────────────┘  │
    └─────────────────┘         │  ┌────────────────────────┐  │
                                │  │  PostgreSQL Database   │  │
                                │  │  - study_logs テーブル │  │
                                │  │  - RLS ポリシー適用    │  │
                                │  └────────────────────────┘  │
                                │  ┌────────────────────────┐  │
                                │  │  Realtime              │  │
                                │  │  (オプション)         │  │
                                │  └────────────────────────┘  │
                                └──────────────────────────────┘
```

## レイヤーアーキテクチャ

```
┌──────────────────────────────────┐
│   Presentation Layer             │
│  (UI Components)                 │
│                                  │
│  • LoginForm                     │
│  • StudyLogForm                  │
│  • WeeklyChart                   │
│  • StudyLogsList                 │
└────────────┬─────────────────────┘
             │
┌────────────▼─────────────────────┐
│   Business Logic Layer           │
│  (Custom Hooks)                  │
│                                  │
│  • useAuth                       │
│  • useStudyLogs (CRUD)           │
│  • useWeeklyData (計算)          │
└────────────┬─────────────────────┘
             │
┌────────────▼─────────────────────┐
│   API Layer                      │
│  (Route Handlers)                │
│                                  │
│  • GET /api/study-logs           │
│  • POST /api/study-logs          │
│  • DELETE /api/study-logs/[id]   │
└────────────┬─────────────────────┘
             │
┌────────────▼─────────────────────┐
│   Data Access Layer              │
│  (Utility Functions)             │
│                                  │
│  • apiUtils.ts (リクエスト)      │
│  • studyUtils.ts (データ加工)    │
│  • supabase-*.ts (認証)          │
└────────────┬─────────────────────┘
             │
┌────────────▼─────────────────────┐
│   Database Layer                 │
│  (Supabase)                      │
│                                  │
│  • PostgreSQL DB                 │
│  • RLS Security                  │
│  • OAuth providers               │
└──────────────────────────────────┘
```

## コンポーネント相互関係

```
Page
  │
  ├── Header (ユーザー情報)
  │   └── useAuth (Hook)
  │
  ├─ LoginPage / Dashboard (条件付きレンダリング)
  │   │
  │   └── if (未認証)
  │       └── LoginPage
  │           ├── LoginForm
  │           │   └── useAuth (Hook)
  │           │       └── supabase.auth
  │           │
  │           └── GoogleLoginButton
  │               └── supabase.auth.signInWithOAuth
  │
  │   └── if (認証済み)
  │       └── Dashboard
  │           ├── WeeklyChart
  │           │   └── useWeeklyData (Hook)
  │           │       └── study-logs API
  │           │
  │           ├── StudyLogForm
  │           │   └── useStudyLogs (Hook)
  │           │       └── POST /api/study-logs
  │           │
  │           └── StudyLogsList
  │               └── useStudyLogs (Hook)
  │                   ├── GET /api/study-logs (取得)
  │                   └── DELETE /api/study-logs/[id] (削除)
  │
  └── 共通機能
      └── useStudyLogs (カスタムHook)
          └── CRUD操作
              ├── GET (全件取得)
              ├── POST (新規作成)
              └── DELETE (削除)
```

## データフロー

```
ユーザーアクション
   │
   ▼
React Component
   │
   ▼
Custom Hook (useState, useCallback, useMemo)
   │
   ▼
API Route Handler (/api/...)
   │
   ├─ Authorization Check (JWTトークン検証)
   │
   ├─ Request Validation (スキーマチェック)
   │
   ├─ Supabase Client Call
   │   │
   │   ├─ RLS Policy Check (Row Level Security)
   │   │
   │   └─ Database Query
   │
   ▼
Response
   │
   ▼
Component State Update (Hook)
   │
   ▼
UI Re-render
   │
   ▼
User Sees Results
```

## 認証フロー

```
┌──────────────┐
│ ユーザー訪問 │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ セッション確認 (Server Side)         │
│ supabase.auth.getSession()           │
└────────────┬───────────────────────┬─┘
             │ セッション有         │ セッション無
             │                      │
             ▼                      ▼
    ┌─────────────────┐  ┌─────────────────────┐
    │  ダッシュボード  │  │  ログインページ      │
    │  表示           │  │  表示               │
    └─────────────────┘  └────────┬────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
        ┌──────────────────┐ ┌────────────┐ ┌──────────────┐
        │ Email OTP Login  │ │ Google 認証 │ │ その他 OAuth │
        │ (今回実装)       │ │ (実装済み)  │ │ (拡張可能)   │
        └────────┬─────────┘ └────┬───────┘ └──────────────┘
                 │                 │
                 │ Email送信        │ リダイレクト
                 │                 │
                 ▼                 ▼
        ┌──────────────────┐ ┌────────────────────┐
        │ トークン取得      │ │ コールバック処理   │
        │ setSession()     │ │ OAuth確認         │
        └────────┬─────────┘ └────────┬───────────┘
                 │                   │
                 └─────────┬─────────┘
                           │
                           ▼
                    ┌─────────────────┐
                    │ セッション保存  │
                    │ (Cookie/Storage)│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  ダッシュボード │
                    │   へリダイレクト│
                    └─────────────────┘
```

## スケーリングアーキテクチャ（将来）

```
現在:
Single Instance
├── Next.js
├── Supabase (Managed)
└── Database

将来スケーリング:
┌────────────────────────────────────────┐
│        CDN (Cloudflare, Vercel, etc)   │
└────────────────────────────────────────┘
                    ▼
┌────────────────────────────────────────┐
│    Load Balancer / API Gateway         │
└────────┬──────────────────────────────┘
         │
    ┌────┴─────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│Vercel  ││Docker  ││Vercel  ││Docker  │
│Edge    ││(自社)  ││Edge    ││(自社)  │
└────────┘└────────┘└────────┘└────────┘
    ▼          ▼          ▼          ▼
┌──────────────────────────────────────┐
│     Supabase Cluster (複数ノード)     │
│  ├─ Primary DB                       │
│  ├─ Replica DB                       │
│  └─ Cache (Redis)                    │
└──────────────────────────────────────┘
    ▼
┌──────────────────────────────────────┐
│     Monitoring & Analytics           │
│  ├─ Datadog / New Relic              │
│  ├─ Sentry (エラー追跡)              │
│  └─ Grafana (メトリクス)             │
└──────────────────────────────────────┘
```

## 信頼性とセキュリティ

```
トランスポート層
├─ HTTPS (TLS 1.3)
├─ HSTS
└─ CORS (指定ドメインのみ)
        ▼
認証層
├─ JWT トークン検証
├─ Session Cookie (Secure, HttpOnly)
└─ CSRF トークン
        ▼
認可層
├─ Row Level Security (RLS)
├─ ポリシーベースアクセス制御
└─ ユーザーID チェック
        ▼
アプリケーション層
├─ Input Validation
├─ SQL Injection 対策 (Parameterized Queries)
└─ XSS 対策 (HTML Escape)
        ▼
データ層
├─ 暗号化 at rest
├─ 暗号化 in transit
└─ バックアップ & リカバリ
```
