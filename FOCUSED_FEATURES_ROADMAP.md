# フォーカス機能実装ロードマップ

**対象機能**: リマインダー通知設定 + マイルストーン達成表示
**推定工数**: 3-5日
**テスト数見積もり**: +25テスト

---

## 📋 機能概要

### 1. **リマインダー通知設定**

ユーザーが学習リマインダーの時間・曜日・タイプを自由に設定できる機能。

#### UI イメージ:
```
┌─────────────────────────────┐
│ 🔔 リマインダー設定         │
├─────────────────────────────┤
│                             │
│ ☑ 通知を有効にする         │
│                             │
│ 通知タイプ:                 │
│ ● プッシュ通知（推奨） │
│ ○ メール通知               │
│ ○ 両方                     │
│                             │
│ 通知時刻:                   │
│ ┌─────────────┐            │
│ │    19:00    ▼ │          │
│ └─────────────┘            │
│ 時間スライダー: │─●──────│ │
│                 0:00  24:00│
│                             │
│ 通知曜日:                   │
│ ☑ 月 ☑ 火 ☑ 水 ☑ 木      │
│ ☑ 金 □ 土 □ 日            │
│                             │
│ [保存] [リセット]          │
└─────────────────────────────┘
```

#### データフロー:
```
User (設定画面)
    ↓
ReminderSettings.tsx (UI)
    ↓
useNotifications.ts (hooks)
    ↓
POST /api/reminder-settings
    ↓
Supabase (user_settings テーブル)
    ↓
Notification Service (定期実行)
    ↓
Web Notification API / Email
    ↓
User (コンピュータ/メール)
```

---

### 2. **マイルストーン達成表示**

ユーザーが学習目標（ストリーク、学習時間）を達成した際に表示・記録する機能。

#### UI イメージ:
```
┌──────────────────────────────┐
│ 🏆 マイルストーン            │
├──────────────────────────────┤
│                              │
│ 🌟 達成済み                  │
│ ├─ ⭐ 7日連続学習 (2026/2/17) │
│ ├─ ⭐ 100時間達成 (2026/2/5)  │
│ └─ ⭐ 200時間達成 (2026/2/15) │
│                              │
│ ⏳ 進行中                    │
│ ├─ 14日連続学習 (7/14)      │
│ ├─ 30日連続学習 (7/30)      │
│ └─ 300時間達成 (215/300)    │
│                              │
└──────────────────────────────┘
```

#### マイルストーン定義:
```
Streak マイルストーン:
- 7日連続学習
- 14日連続学習
- 30日連続学習
- 100日連続学習

Time マイルストーン:
- 100時間達成
- 200時間達成
- 300時間達成
- 500時間達成
```

#### データフロー:
```
New Study Log Created
    ↓
Calculate Streak & Total Hours
    ↓
Check Milestones (checkMilestones())
    ↓
New Milestone Unlocked?
    ↓
YES: Insert into milestones table
    ↓
Display in MilestonesList.tsx
    ↓
User Notification (Welcome toast)
```

---

## 🗄️ データベーススキーマ

### テーブル 1: `user_settings` (新規カラム追加)

```sql
ALTER TABLE user_settings ADD COLUMN (
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_time TIME DEFAULT '19:00',
  reminder_type TEXT DEFAULT 'push', -- 'push', 'email', 'both'
  reminder_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  updated_at TIMESTAMP DEFAULT now()
);

-- インデックス追加
CREATE INDEX idx_user_settings_reminder 
  ON user_settings(user_id, reminder_enabled);
```

### テーブル 2: `milestones` (新規作成)

```sql
CREATE TABLE milestones (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  -- 'streak_7', 'streak_14', 'streak_30', 'streak_100'
  -- 'hours_100', 'hours_200', 'hours_300', 'hours_500'
  achieved_at TIMESTAMP NOT NULL DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(user_id, milestone_type),
  CHECK (milestone_type IN (
    'streak_7', 'streak_14', 'streak_30', 'streak_100',
    'hours_100', 'hours_200', 'hours_300', 'hours_500'
  ))
);

CREATE INDEX idx_milestones_user 
  ON milestones(user_id);
CREATE INDEX idx_milestones_user_achieved 
  ON milestones(user_id, achieved_at DESC);
```

### RLS ポリシー:

```sql
-- user_settings のポリシー
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- milestones のポリシー
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own milestones"
  ON milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert milestones"
  ON milestones FOR INSERT
  WITH CHECK (true); -- API route で検証
```

---

## 🏗️ コンポーネント・フック設計

### **1. ReminderSettings.tsx**

```typescript
interface ReminderConfig {
  enabled: boolean;
  time: string; // "HH:mm" format
  type: 'push' | 'email' | 'both';
  days: string[]; // ["Mon", "Tue", "Wed", ...]
}

interface ReminderSettingsProps {
  userId: string;
  onSave?: (settings: ReminderConfig) => void;
}

export function ReminderSettings({ userId, onSave }: ReminderSettingsProps) {
  // 実装:
  // 1. 現在の設定を取得 (useEffect + API)
  // 2. 設定フォーム表示
  // 3. 保存ボタンクリック → API POST
  // 4. トースト通知表示
}
```

**使用場所**: 設定ページ、プロフィール画面など

---

### **2. MilestonesList.tsx**

```typescript
interface Milestone {
  type: string; // 'streak_7', 'hours_100' など
  achievedAt?: string; // ISO 8601 timestamp
  progress?: number; // 現在の進捗（0-100%）
  target?: number;
}

interface MilestonesListProps {
  userId: string;
  currentStreak: number;
  totalHours: number;
}

export function MilestonesList({
  userId,
  currentStreak,
  totalHours
}: MilestonesListProps) {
  // 実装:
  // 1. マイルストーン一覧取得 (API)
  // 2. 達成済み / 進行中 に分類
  // 3. UI表示
}
```

**使用場所**: ダッシュボード、進捗画面

---

### **3. useNotifications.ts (カスタムフック)**

```typescript
interface NotificationSettings {
  enabled: boolean;
  time: string;
  type: 'push' | 'email' | 'both';
  days: string[];
}

export function useNotifications(userId: string) {
  // 機能:
  // - getSettings(): ユーザー設定取得
  // - updateSettings(config): 設定更新
  // - requestPermission(): ブラウザ許可要求
  // - sendTestNotification(): テスト通知送信
}
```

**使用例**:
```typescript
const { settings, updateSettings, sendTestNotification } = 
  useNotifications(userId);

// 設定を取得
const config = await settings();

// 設定を更新
await updateSettings({
  enabled: true,
  time: '19:00',
  type: 'push',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
});

// テスト通知送信
await sendTestNotification();
```

---

### **4. useMilestones.ts (カスタムフック)**

```typescript
export function useMilestones(userId: string) {
  // 機能:
  // - getAchieved(): 達成済みマイルストーン取得
  // - getPending(): 進行中マイルストーン取得
  // - checkNewMilestones(streak, hours): 新規達成検出
  // - unlockMilestone(type): マイルストーン記録
}
```

**使用例**:
```typescript
const { getAchieved, getPending, checkNewMilestones } = 
  useMilestones(userId);

// 達成済みを取得
const achieved = await getAchieved();

// 新規達成検出
const newMilestones = await checkNewMilestones(7, 142.5);
if (newMilestones.length > 0) {
  showToast(`🎉 ${newMilestones[0]} を達成しました！`);
}
```

---

## 🔌 API エンドポイント

### **1. GET /api/reminder-settings**

```typescript
// リクエスト (認証ユーザーのみ)
// レスポンス
{
  enabled: true,
  time: "19:00",
  type: "push",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  createdAt: "2026-01-10T12:00:00Z",
  updatedAt: "2026-02-17T08:30:00Z"
}

// ステータスコード
// 200: 成功
// 401: 未認証
// 404: 設定なし
```

### **2. POST/PUT /api/reminder-settings**

```typescript
// リクエスト
{
  enabled: boolean,
  time: string, // "HH:mm" format
  type: 'push' | 'email' | 'both',
  days: string[] // ["Mon", "Tue", ...]
}

// レスポンス
{
  id: "uuid",
  userId: "uuid",
  enabled: true,
  time: "19:00",
  type: "push",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  updatedAt: "2026-02-17T14:30:00Z"
}

// エラーハンドリング
{
  error: "Invalid time format. Use HH:mm",
  code: "INVALID_INPUT"
}
```

### **3. POST /api/reminder-settings/test**

```typescript
// 目的: テスト通知を送信
// リクエスト （空）
// レスポンス
{
  success: true,
  message: "Test notification sent to browser"
}
```

### **4. GET /api/milestones**

```typescript
// レスポンス
{
  achieved: [
    {
      type: "streak_7",
      label: "7日連続学習",
      achievedAt: "2026-02-17T10:30:00Z",
      icon: "⭐"
    },
    {
      type: "hours_100",
      label: "100時間達成",
      achievedAt: "2026-02-05T15:20:00Z",
      icon: "⭐"
    }
  ],
  pending: [
    {
      type: "streak_14",
      label: "14日連続学習",
      progress: 7,
      target: 14,
      percentage: 50,
      icon: "⏳"
    },
    {
      type: "hours_200",
      label: "200時間達成",
      progress: 142.5,
      target: 200,
      percentage: 71,
      icon: "⏳"
    }
  ]
}
```

### **5. POST /api/milestones/check** (内部用)

```typescript
// サーバーサイドのみ（API route で自動呼び出し）
// リクエスト
{
  userId: "uuid",
  currentStreak: number,
  totalHours: number
}

// レスポンス
{
  newMilestones: ["streak_7"],
  message: "New milestone unlocked: streak_7"
}
```

---

## 📝 実装手順（3-5日）

### **Day 1: DB + API**

```
[ ] Supabase マイグレーション
    [ ] user_settings テーブル拡張
    [ ] milestones テーブル作成
    [ ] RLS ポリシー設定

[ ] API ルート実装 (src/app/api/reminder-settings/route.ts)
    [ ] GET /api/reminder-settings
    [ ] POST /api/reminder-settings
    [ ] POST /api/reminder-settings/test

[ ] API ルート実装 (src/app/api/milestones/route.ts)
    [ ] GET /api/milestones
    [ ] POST /api/milestones/check (内部用)

[ ] ユーティリティ関数実装
    [ ] src/lib/milestoneUtils.ts
        - checkMilestones()
        - formatMilestoneLabel()
    [ ] src/lib/notificationUtils.ts
        - requestNotificationPermission()
        - sendNotification()

[ ] API テスト (8+ テスト)
    [ ] reminder-settings GET/POST/test
    [ ] milestones GET/check
```

### **Day 2-3: フロントエンド UI + Hooks**

```
[ ] カスタムフック実装
    [ ] src/hooks/useNotifications.ts
    [ ] src/hooks/useMilestones.ts

[ ] UI コンポーネント実装
    [ ] src/components/ReminderSettings.tsx (150行)
        - フォーム入力
        - 時間ピッカー
        - 曜日チェックボックス
        - 保存・リセットボタン
        - トースト通知
    
    [ ] src/components/MilestonesList.tsx (120行)
        - 達成済みセクション
        - 進行中セクション
        - プログレスバー
        - アイコン表示

[ ] コンポーネントテスト (10+ テスト)
    [ ] ReminderSettings 形式検証
    [ ] MilestonesList 表示確認
```

### **Day 3-4: 統合 + 通知処理**

```
[ ] 通知メカニズム実装
    [ ] Web Notification API 統合
    [ ] Service Worker 設定 (background sync)
    [ ] リマインダー定期実行
        - Cloud Functions (Supabase)
        - または Vercel Cron (Next.js)

[ ] ダッシュボードに統合
    [ ] page.tsx に MilestonesList 追加
    [ ] page.tsx に ReminderSettings へのリンク追加

[ ] 統合テスト (5+ テスト)
    [ ] 設定保存 → 取得
    [ ] マイルストーン達成検出
    [ ] 通知送信ロジック
```

### **Day 4-5: E2E + デプロイ**

```
[ ] E2E テスト (10+ テスト)
    [ ] リマインダー設定 UI 操作
    [ ] マイルストーン表示確認
    [ ] テスト通知送信

[ ] ブラウザ互換性テスト
    [ ] Chrome
    [ ] Firefox
    [ ] Safari

[ ] CI/CD パイプライン更新
    [ ] .github/workflows 更新
    [ ] テストカバレッジ確認 (90%+)

[ ] 本番デプロイ
    [ ] Supabase マイグレーション実行
    [ ] Vercel デプロイ
    [ ] 動作確認
```

---

## 🧪 テスト設計 (25+ テスト)

### **ユニットテスト (10 テスト)**
```
[ ] checkMilestones() - ストリーク7達成
[ ] checkMilestones() - ストリーク14達成
[ ] checkMilestones() - 100時間達成
[ ] checkMilestones() - 複数同時達成
[ ] validateReminderConfig() - 有効な時刻
[ ] validateReminderConfig() - 無効な時刻
[ ] validateReminderConfig() - 無効な曜日
[ ] formatMilestoneLabel() - ストリーク型
[ ] formatMilestoneLabel() - 時間型
[ ] calculateProgress() - 進捗率計算
```

### **統合テスト (8 テスト)**
```
[ ] POST /api/reminder-settings - 保存成功
[ ] GET /api/reminder-settings - 取得成功
[ ] POST /api/reminder-settings/test - 通知送信
[ ] GET /api/milestones - 達成済み取得
[ ] POST /api/milestones/check - 新規達成検出
[ ] useMilestones hook - マイルストーン一覧
[ ] useNotifications hook - 設定更新
[ ] Web Notification API mock テスト
```

### **E2E テスト (7 テスト)**
```
[ ] リマインダー設定ページ開く
[ ] 時間を 19:00 に設定
[ ] 曜日を月-金に設定
[ ] タイプをメールに変更
[ ] 保存ボタンクリック
[ ] マイルストーン一覧表示
[ ] テスト通知ボタンクリック
```

---

## 🔧 実装コード例

### **src/lib/milestoneUtils.ts**

```typescript
const MILESTONE_CONFIG = {
  streak_7: { label: '7日連続学習', target: 7, category: 'streak' },
  streak_14: { label: '14日連続学習', target: 14, category: 'streak' },
  streak_30: { label: '30日連続学習', target: 30, category: 'streak' },
  streak_100: { label: '100日連続学習', target: 100, category: 'streak' },
  hours_100: { label: '100時間達成', target: 100, category: 'hours' },
  hours_200: { label: '200時間達成', target: 200, category: 'hours' },
  hours_300: { label: '300時間達成', target: 300, category: 'hours' },
  hours_500: { label: '500時間達成', target: 500, category: 'hours' },
};

export function checkMilestones(
  currentStreak: number,
  totalHours: number,
  achievedMilestones: string[]
): string[] {
  const newMilestones: string[] = [];

  // Streak チェック
  if (currentStreak === 7 && !achievedMilestones.includes('streak_7')) {
    newMilestones.push('streak_7');
  }
  if (currentStreak === 14 && !achievedMilestones.includes('streak_14')) {
    newMilestones.push('streak_14');
  }
  if (currentStreak === 30 && !achievedMilestones.includes('streak_30')) {
    newMilestones.push('streak_30');
  }
  if (currentStreak === 100 && !achievedMilestones.includes('streak_100')) {
    newMilestones.push('streak_100');
  }

  // Hours チェック
  if (totalHours >= 100 && !achievedMilestones.includes('hours_100')) {
    newMilestones.push('hours_100');
  }
  if (totalHours >= 200 && !achievedMilestones.includes('hours_200')) {
    newMilestones.push('hours_200');
  }
  if (totalHours >= 300 && !achievedMilestones.includes('hours_300')) {
    newMilestones.push('hours_300');
  }
  if (totalHours >= 500 && !achievedMilestones.includes('hours_500')) {
    newMilestones.push('hours_500');
  }

  return newMilestones;
}

export function formatMilestoneLabel(type: string): string {
  return MILESTONE_CONFIG[type as keyof typeof MILESTONE_CONFIG]?.label || type;
}

export function calculateProgress(
  current: number,
  target: number
): { percentage: number; remaining: number } {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const remaining = Math.max(target - current, 0);
  return { percentage, remaining };
}
```

### **src/hooks/useNotifications.ts**

```typescript
import { useState, useEffect } from 'react';

interface ReminderConfig {
  enabled: boolean;
  time: string;
  type: 'push' | 'email' | 'both';
  days: string[];
}

export function useNotifications(userId: string) {
  const [settings, setSettings] = useState<ReminderConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 設定取得
  const getSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reminder-settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 設定更新
  const updateSettings = async (newConfig: ReminderConfig) => {
    try {
      setLoading(true);
      const res = await fetch('/api/reminder-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      const data = await res.json();
      setSettings(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ブラウザ許可要求
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setError('This browser does not support notifications');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // テスト通知
  const sendTestNotification = async () => {
    try {
      const res = await fetch('/api/reminder-settings/test', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to send test notification');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  // マウント時に設定取得
  useEffect(() => {
    getSettings();
  }, [userId]);

  return {
    settings,
    loading,
    error,
    getSettings,
    updateSettings,
    requestPermission,
    sendTestNotification,
  };
}
```

### **src/components/ReminderSettings.tsx**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';

export function ReminderSettings() {
  const { user } = useAuth();
  const { settings, updateSettings, sendTestNotification } = 
    useNotifications(user?.id || '');
  
  const [config, setConfig] = useState({
    enabled: true,
    time: '19:00',
    type: 'push' as const,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  });
  const [saved, setSaved] = useState(false);

  // 設定を画面に反映
  useEffect(() => {
    if (settings) {
      setConfig(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings', error);
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  const toggleDay = (day: string) => {
    setConfig(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">🔔 リマインダー設定</h2>

      {/* 有効/無効トグル */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="mr-3"
          />
          <span>通知を有効にする</span>
        </label>
      </div>

      {config.enabled && (
        <>
          {/* 通知タイプ */}
          <div className="mb-6">
            <p className="font-semibold mb-2">通知タイプ:</p>
            <div className="space-y-2">
              {(['push', 'email', 'both'] as const).map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={config.type === type}
                    onChange={(e) => setConfig({ ...config, type: e.target.value as any })}
                    className="mr-3"
                  />
                  <span>{type === 'push' ? 'プッシュ通知（推奨）' : type === 'email' ? 'メール通知' : '両方'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 時間設定 */}
          <div className="mb-6">
            <p className="font-semibold mb-2">通知時刻:</p>
            <input
              type="time"
              value={config.time}
              onChange={(e) => setConfig({ ...config, time: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* 曜日設定 */}
          <div className="mb-6">
            <p className="font-semibold mb-2">通知曜日:</p>
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <label key={day} className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={config.days.includes(day)}
                    onChange={() => toggleDay(day)}
                    className="mr-1"
                  />
                  <span className="text-sm">{day[0]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              保存
            </button>
            <button
              onClick={handleTestNotification}
              className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
            >
              テスト
            </button>
          </div>

          {saved && (
            <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
              ✓ 設定を保存しました
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

## 📊 成功指標

| 指標 | ターゲット | 測定方法 |
|------|-----------|--------|
| **設定ユーザー率** | 60%+ | 設定テーブルレコード数 |
| **通知開封率** | 40%+ | アナリティクス |
| **マイルストーン達成率** | 70%+ | milestones テーブル |
| **テストカバレッジ** | 90%+ | Jest coverage |
| **E2E テスト成功率** | 100% | Playwright |

---

## 📅 タイムライン概算

| 日程 | タスク | 日数 |
|------|--------|------|
| **Day 1** | DB スキーマ + API 実装 | 1日 |
| **Day 2-3** | UI コンポーネント + Hooks | 2日 |
| **Day 4** | 統合 + 通知処理 | 1日 |
| **Day 5** | E2E テスト + デプロイ | 1日 |
| **合計** | | **3-5日** |

---

## 🚀 実装開始前チェックリスト

- [ ] Supabase プロジェクト確認
- [ ] current_stripe, total_hours の計算ロジック確認
- [ ] Web Notification API ブラウザ互換性確認
- [ ] Service Worker 実装確認
- [ ] Jest テスト環境確認
- [ ] Playwright E2E テスト環境確認
- [ ] CI/CD 準備完了

---

**次のステップ:** Phase 1（DB + API）の実装を開始しますか？
