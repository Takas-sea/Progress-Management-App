# CI/CD フロー図

## 現在の開発フロー

```
┌─────────────────────────────────────────────────────────────┐
│              開発者がコミット                                │
│            git push origin feature-branch                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
        ┌────────────────────────────┐
        │  GitHub / GitLab リポジトリ │
        └────────────┬───────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    Local Dev              Remote CI/CD
    (手動テスト)           (自動テスト)
        │                       │
        │    ┌─────────────────┬┤
        │    │                 │
        ▼    ▼                 ▼
    Dev   Pre-commit    GitHub Actions
    環境   フック          (推奨設定)
    env   (husky)
         │                   │
         │    ┌──────────────┤
         │    │              │
         ▼    ▼              ▼
    npm     Lint      Build & Test
    test    Check     Pipeline
         │    │              │
         │    └──────────────┤
         │                   │
         ▼                   ▼
    ✅全テスト ────────▶ ✅全テスト
    合格                合格
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Pull Request パス   │
        │ (レビュー待機)      │
        └────────┬────────────┘
                 │
    ┌────────────┴─────────────────┐
    │ コードレビュー完了           │
    │ Approve                      │
    └────────────┬─────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ main ブランチにマージ │
        └────────┬────────────┘
                 │
                 ▼
        ┌──────────────────────────────┐
        │ 本番ビルド & デプロイ        │
        │ (CD パイプライン)            │
        └────────┬─────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
Build       Test       Deploy
├─ npm     ├─ Jest    ├─ Vercel
│ run build│ (Unit)   ├─ Supabase
│          ├─ E2E     └─ Domain DNS
├─ Next.js │ (Play)   
│ build    │          
└─ Output  └─ Lint
   .next
```

## GitHub Actions 推奨パイプライン

```yaml
# .github/workflows/ci-cd.yml

triggers:
  - push to main
  - push to develop/*
  - pull_request

jobs:
  ├─ Lint & Format Check
  │  ├─ ESLint
  │  ├─ Prettier
  │  └─ Type Check (tsc)
  │
  ├─ Unit Tests (Jest)
  │  ├─ api.test.ts
  │  ├─ studyUtils.test.ts
  │  ├─ apiUtils.test.ts
  │  ├─ weeklyGraph.test.ts
  │  ├─ login.test.ts
  │  ├─ studyLog.test.ts
  │  ├─ page.test.ts
  │  └─ Coverage Report
  │
  ├─ E2E Tests (Playwright)
  │  ├─ Chromium
  │  ├─ Firefox
  │  └─ WebKit
  │
  ├─ Build
  │  ├─ next build
  │  ├─ Build Success
  │  └─ Bundle Size Analysis
  │
  ├─ Security Scan (on main only)
  │  ├─ Snyk
  │  ├─ Dependency Check
  │  └─ Secret Scan
  │
  └─ Deploy (on main only)
     ├─ Build Docker Image (optional)
     ├─ Deploy to Vercel
     ├─ Update Staging
     └─ Notify Slack
```

## ステージング → 本番フロー

```
┌─────────────────────────────────────┐
│        Staging Environment          │
│                                     │
│  vercel.app/staging/                │
│  ├─ 本番と同じ環境                  │
│  ├─ Supabase Staging DB              │
│  └─ テストデータ                    │
└────────┬────────────────────────────┘
         │ Manual Testing
         │ Approval
         │ smoke test
         │
         ▼
┌─────────────────────────────────────┐
│      本番環境 (Production)          │
│                                     │
│  study-progress.example.com          │
│  ├─ CDN キャッシュ                  │
│  ├─ Supabase Production DB           │
│  └─ 本当のユーザーデータ            │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Monitoring & Alerting             │
│                                     │
│  ├─ Uptime Monitor (24/7)           │
│  ├─ Error Tracking (Sentry)         │
│  ├─ Performance Metrics             │
│  └─ Cloud Function Logs             │
└─────────────────────────────────────┘
```

## リリースプロセス

```
Version: X.Y.Z (Semantic Versioning)

X = Major (Breaking Changes)
Y = Minor (新機能)
Z = Patch (バグ修正)

┌─────────────────────────────────────┐
│          Feature Branch             │
│   feature/new-study-log-export      │
└────────┬────────────────────────────┘
         │ Development
         ▼
┌─────────────────────────────────────┐
│       Pull Request to main          │
│       Feature Review                │
└────────┬────────────────────────────┘
         │ 2+ Approvals
         ▼
┌─────────────────────────────────────┐
│      Merge to main branch           │
│   Run CI Pipeline                   │
└────────┬────────────────────────────┘
         │ All Tests Pass
         ▼
┌─────────────────────────────────────┐
│   Update CHANGELOG.md               │
│   Update version in package.json    │
│   Tag: v1.2.3                       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Deploy to Staging                 │
│   Smoke Tests                       │
│   Manual QA Sign-off                │
└────────┬────────────────────────────┘
         │ Approved
         ▼
┌─────────────────────────────────────┐
│   Deploy to Production              │
│   - Blue-Green Deployment (推奨)    │
│   - Canary Release (段階的)         │
│   - Monitor Metrics                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Release Notes Posted              │
│   - GitHub Releases                 │
│   - Changelog                       │
│   - User Notification               │
└─────────────────────────────────────┘
```

## ブランチ戦略 (Git Flow)

```
                     Release / Hotfix
                          │
        ┌─────────────────┴────────────────────┐
        │                                      │
    ┌───▼────┐                             ┌──▼───┐
    │ main   │ (Production Ready)          │ tag  │
    │(stable)│                             │v1.x  │
    └───┬────┘                             └──────┘
        │
    ────┘
        │
    ┌───▼────────────────────┐
    │ develop                │
    │ (Integration Branch)   │
    └───┬────────────────────┘
        │
    ────┼────────────────────────────────┐
    │   │                              │
┌───▼──────┐  ┌───────────────┐  ┌───────▼──────┐
│feature/* │  │ bugfix/*      │  │hotfix/*      │
│          │  │               │  │              │
│- New     │  │- Bug Fix      │  │- Critical    │
│  Feature │  │- Patch        │  │  Issues      │
│- Epic    │  │  PR to main   │  │- Emergency   │
│          │  │               │  │  Release     │
└──────────┘  └───────────────┘  └──────────────┘
```

## デプロイメント戦略

### Blue-Green Deployment (推奨)

```
現在 (Blue):                   新リリース (Green):
Production Environment         Staging Environment
├─ Next.js サーバー           ├─ Next.js サーバー新
├─ DB: v1                      ├─ DB: v1 (同じ)
└─ Users → Blue               └─ 検証中

検証 & テスト
├─ ヘルスチェック
├─ Smoke Test
├─ Performance Check
└─ E2E Test

✅合格の場合:
┌─────────────────────────────────┐
│  Router / Load Balancer          │
│  Blue → Green に切り替え         │
│  (ダウンタイムなし)             │
└─────────────────────────────────┘
    ▼
Users → Green
(新リリース)

❌失敗の場合:
┌─────────────────────────────────┐
│  Router は Blue のまま            │
│  Green は廃棄                    │
│  無影響                         │
└─────────────────────────────────┘
```

### Canary Release

```
本番 100%
│
└─▶ v1.0からv1.1へ段階的切り替え
    │
    ├─ 1st Wave (5%, 100 users)
    │  ├─ Monitor for errors
    │  └─ Duration: 30 min
    │
    ├─ 2nd Wave (25%, 500 users)
    │  ├─ Monitor for errors
    │  └─ Duration: 1-2 hours
    │
    ├─ 3rd Wave (50%, あらゆるユーザー)
    │  ├─ Monitor for errors
    │  └─ Duration: 2-4 hours
    │
    └─ Final Wave (100%, すべてのユーザー)
       └─ Completion
```

## ロールバック手順

```
問題検出 → Alert
    │
    ▼
┌─────────────────────────────────┐
│  Incident Response Team 召集    │
│  - Engineer                     │
│  - DevOps                       │
│  - Product Manager              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  根本原因分析 (RCA)             │
│  - Logs確認                     │
│  - Metrics確認                  │
│  - Error Stack                  │
└────────┬────────────────────────┘
         │
    ┌────┴————────────┐
    │                 │
    ▼                 ▼
Hotfix            Rollback
├─ Hot Patch     ├─ git revert
├─ Deploy ASAP   ├─ Previous Tag
├─ Tag v1.0.1    ├─ Re-deploy
└─ Notify Users  └─ Verify
```

## まとめ

| 段階 | ツール | 時間 |
|------|--------|------|
| Lint | ESLint | 2分 |
| ユニットテスト | Jest | 5分 |
| E2E テスト | Playwright | 50分 |
| ビルド | Next.js | 3分 |
| デプロイ | Vercel/Supabase | 5分 |
| **合計** | | **65分** |

**自動化度**: 95% (手動レビュー除く)
**信頼性**: 99.9% (全テスト合格時のみデプロイ)
