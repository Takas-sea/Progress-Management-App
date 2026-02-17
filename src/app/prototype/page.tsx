'use client';

import { useState } from 'react';
import { ReminderSettingsPrototype } from '@/components/ReminderSettingsPrototype';
import { MilestonesListPrototype } from '@/components/MilestonesListPrototype';

export default function PrototypePage() {
  const [activeTab, setActiveTab] = useState<'reminder' | 'milestones'>('reminder');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">UI プロトタイプ v2</h1>
          <p className="text-gray-600">改良版 - 以下の改善を実装しました</p>
          <div className="mt-4 text-sm text-gray-700">
            <p>- スライダー時間選択 + デジタル表示</p>
            <p>- 平日/毎日プリセット</p>
            <p>- ステップ表示で視覚的マイルストーン化</p>
            <p>- トースト通知を右上に固定</p>
            <p>- ツールチップで情報提供</p>
            <p>- セレブレーション表現を追加</p>
          </div>
        </div>

        {/* タブ */}
        <div className="flex gap-3 mb-8 px-4">
          <button
            onClick={() => setActiveTab('reminder')}
            className={`
              flex-1 py-3 px-4 rounded-lg font-semibold transition-all text-lg
              ${activeTab === 'reminder'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            リマインダー設定
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`
              flex-1 py-3 px-4 rounded-lg font-semibold transition-all text-lg
              ${activeTab === 'milestones'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            マイルストーン
          </button>
        </div>

        {/* コンテンツ */}
        <div className="mb-8">
          {activeTab === 'reminder' && <ReminderSettingsPrototype />}
          {activeTab === 'milestones' && <MilestonesListPrototype />}
        </div>

        {/* 改善点説明パネル */}
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6">実装した改善点</h2>

          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="font-semibold mb-2">1️⃣ スライダー時間選択</p>
              <p className="text-sm text-gray-700">
                デジタル時計表示 + スライダーで直感的に時間を選択できるようにしました。より視覚的で使いやすくなりました。
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <p className="font-semibold mb-2">2️⃣ 平日/毎日プリセット</p>
              <p className="text-sm text-gray-700">
                よく使う「平日のみ」「毎日」をプリセットボタンで素早く設定できるように。カスタム選択も可能です。
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <p className="font-semibold mb-2">3️⃣ ステップ表示マイルストーン</p>
              <p className="text-sm text-gray-700">
                進捗を数字で表示し、達成したステップは ✓ で表示。視覚的に進捗が分かりやすくなりました。
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
              <p className="font-semibold mb-2">4️⃣ トースト通知を右上に固定</p>
              <p className="text-sm text-gray-700">
                保存・テスト送信確認が画面右上に浮かぶようになり、標準 UI パターンに統一しました。
              </p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
              <p className="font-semibold mb-2">5️⃣ ツールチップ・ヘルプアイコン</p>
              <p className="text-sm text-gray-700">
                各設定項目の横に ❓ アイコンを追加。ホバーすると説明が表示されます。
              </p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
              <p className="font-semibold mb-2">6️⃣ マイルストーン達成セレブレーション</p>
              <p className="text-sm text-gray-700">
                マイルストーン達成時に達成モーダルを表示。ユーザーの達成感を高めます。
              </p>
            </div>
          </div>
        </div>

        {/* テスト用 */}
        <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-900 text-gray-100 rounded-lg">
          <h3 className="text-lg font-bold mb-3">試してみてください</h3>
          <div className="text-sm space-y-2">
            <p>• リマインダータブで時間スライダーを動かしてみてください</p>
            <p>• 「平日のみ」「毎日」ボタンをクリックしてみてください</p>
            <p>• ❓ アイコンにホバーしてツールチップを確認してください</p>
            <p>• マイルストーンタブの「達成」ボタンをクリックしてください</p>
            <p>• 「保存」「テスト送信」で右上のトースト通知を確認してください</p>
          </div>
        </div>

        {/* フィードバック */}
        <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-lg font-bold mb-3">改善版を試して、フィードバックください</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>- これらの改善で使いやすくなりましたか？</p>
            <p>- さらに改善すべき点がありますか？</p>
            <p>- デザインは好みですか？</p>
            <p>- 次は実装フェーズに進んで問題ないですか？</p>
          </div>
        </div>
      </div>
    </div>
  );
}
