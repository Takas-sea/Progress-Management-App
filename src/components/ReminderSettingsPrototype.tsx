'use client';

import { useState } from 'react';

export function ReminderSettingsPrototype() {
  const [config, setConfig] = useState({
    enabled: true,
    time: '19:00',
    type: 'both' as const,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  });
  const [saved, setSaved] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestNotification = () => {
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const toggleDay = (day: string) => {
    setConfig(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  // プリセット選択
  const setPreset = (preset: string) => {
    if (preset === 'weekdays') {
      setConfig(prev => ({ ...prev, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }));
    } else if (preset === 'everyday') {
      setConfig(prev => ({ ...prev, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }));
    }
  };

  // 時間をスライダー値に変換
  const timeToSlider = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h;
  };

  const sliderToTime = (hour: number) => {
    return `${String(hour).padStart(2, '0')}:00`;
  };

  const daysFullName: { [key: string]: string } = {
    Mon: '月',
    Tue: '火',
    Wed: '水',
    Thu: '木',
    Fri: '金',
    Sat: '土',
    Sun: '日',
  };

  const tooltips: { [key: string]: string } = {
    time: '毎日この時間に学習リマインダーが届きます。ブラウザを開いていなくても、デバイスが起動していれば通知を受け取れます。',
    days: '選択した曜日のみ通知を受け取ります。平日のみまたは毎日から選択するか、カスタマイズも可能です。',
  };

  return (
    <div className="max-w-lg mx-auto p-8 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-8">
        <h2 className="text-2xl font-bold">リマインダー設定</h2>
      </div>

      {/* 有効/無効トグル */}
      <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-300">
        <label className="flex items-center cursor-pointer gap-3">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-5 h-5 cursor-pointer accent-blue-600"
          />
          <span className="text-lg font-semibold">通知を有効にする</span>
        </label>
      </div>

      {config.enabled && (
        <>
          {/* 時間設定（スライダー） */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <p className="font-semibold text-lg">通知時刻:</p>
              <button
                onMouseEnter={() => setShowTooltip('time')}
                onMouseLeave={() => setShowTooltip(null)}
                className="text-gray-400 hover:text-gray-600 relative"
              >
                i
                {showTooltip === 'time' && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                    {tooltips.time}
                  </div>
                )}
              </button>
            </div>
            <div className="ps-4 space-y-4">
              {/* デジタル時計表示 */}
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 font-mono tracking-widest">
                  {config.time}
                </div>
              </div>
              {/* スライダー */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={timeToSlider(config.time)}
                  onChange={(e) => setConfig({ ...config, time: sliderToTime(Number(e.target.value)) })}
                  className="w-full h-3 bg-gradient-to-r from-blue-300 to-blue-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-600 px-1">
                  <span>00:00</span>
                  <span>12:00</span>
                  <span>23:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* 曜日設定 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <p className="font-semibold text-lg">通知曜日:</p>
              <button
                onMouseEnter={() => setShowTooltip('days')}
                onMouseLeave={() => setShowTooltip(null)}
                className="text-gray-400 hover:text-gray-600 relative"
              >
                i
                {showTooltip === 'days' && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                    {tooltips.days}
                  </div>
                )}
              </button>
            </div>

            {/* プリセット */}
            <div className="ps-4 mb-4 flex gap-2">
              <button
                onClick={() => setPreset('weekdays')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  JSON.stringify(config.days) === JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                平日のみ
              </button>
              <button
                onClick={() => setPreset('everyday')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  config.days.length === 7
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                毎日
              </button>
            </div>

            {/* 個別選択 */}
            <div className="ps-4">
              <p className="text-xs text-gray-600 mb-2">カスタム:</p>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`
                      w-12 h-12 rounded-lg font-semibold text-sm transition-all
                      ${config.days.includes(day)
                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }
                    `}
                    title={daysFullName[day]}
                  >
                    {daysFullName[day]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-md hover:shadow-lg"
            >
              保存
            </button>
            <button
              onClick={handleTestNotification}
              className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 font-semibold transition-all shadow-md hover:shadow-lg"
            >
              テスト送信
            </button>
          </div>

          {/* トースト通知（右上に固定） */}
          {saved && (
            <div className="fixed top-4 right-4 p-4 bg-green-100 text-green-800 rounded-lg border-l-4 border-green-600 shadow-lg animate-pulse z-50">
              設定を保存しました
            </div>
          )}
          {testNotificationSent && (
            <div className="fixed top-4 right-4 p-4 bg-blue-100 text-blue-800 rounded-lg border-l-4 border-blue-600 shadow-lg animate-pulse z-50">
              テスト通知を送信しました
            </div>
          )}
        </>
      )}

      {!config.enabled && (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg text-center border-l-4 border-yellow-600">
          通知は現在無効です
        </div>
      )}
    </div>
  );
}
