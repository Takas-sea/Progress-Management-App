'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNotifications, type ReminderSettings } from '@/hooks/useNotifications';
import {
  areNotificationsSupported,
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from '@/lib/notificationUtils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const DAYS_FULL_NAME: Record<string, string> = {
  Mon: '月',
  Tue: '火',
  Wed: '水',
  Thu: '木',
  Fri: '金',
  Sat: '土',
  Sun: '日',
};

const TOOLTIP_TEXT: Record<string, string> = {
  time: '毎日この時間に学習リマインダーが届きます。',
  days: '選択した曜日のみ通知を受け取ります。平日のみや毎日なども素早く選択できます。',
};

function timeToSlider(time: string) {
  const [hours] = time.split(':').map(Number);
  return Number.isFinite(hours) ? hours : 0;
}

function sliderToTime(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export const ReminderSettings = () => {
  const { settings, loading, saving, testing, error, updateSettings, sendTest } = useNotifications();
  const [draft, setDraft] = useState<ReminderSettings>(settings);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const isSupported = useMemo(() => areNotificationsSupported(), []);
  const permissionStatus = useMemo(() => getNotificationPermissionStatus(), []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    const result = await updateSettings(draft);
    if (result.success) {
      showToast('success', '設定を保存しました');
    } else {
      showToast('error', result.error || '設定の保存に失敗しました');
    }
  };

  const handleTest = async () => {
    if (!isSupported) {
      showToast('error', 'このブラウザは通知に対応していません');
      return;
    }

    const permission = await requestNotificationPermission();
    if (!permission) {
      showToast('error', '通知の許可が必要です');
      return;
    }

    const result = await sendTest();
    if (result.success) {
      showToast('success', 'テスト通知を送信しました');
    } else {
      showToast('error', result.error || 'テスト通知に失敗しました');
    }
  };

  const toggleDay = (day: string) => {
    setDraft((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((item) => item !== day)
        : [...prev.days, day],
    }));
  };

  const setPreset = (preset: 'weekdays' | 'everyday') => {
    if (preset === 'weekdays') {
      setDraft((prev) => ({ ...prev, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }));
    } else {
      setDraft((prev) => ({ ...prev, days: [...DAYS] }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto p-8 bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700 text-white">
        <p className="text-gray-300">設定を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-8 bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg text-white">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold">リマインダー設定</h2>
      </div>

      {!isSupported && (
        <div className="mb-6 p-3 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300">
          現在のブラウザは通知に対応していません
        </div>
      )}

      {permissionStatus !== 'granted' && isSupported && (
        <div className="mb-6 p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
          通知を受け取るにはブラウザの許可が必要です。
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <label className="flex items-center cursor-pointer gap-3">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
            className="w-5 h-5 cursor-pointer accent-blue-600"
          />
          <span className="text-lg font-semibold text-white">通知を有効にする</span>
        </label>
      </div>

      {draft.enabled ? (
        <>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <p className="font-semibold text-lg">通知時刻</p>
              <button
                onMouseEnter={() => setShowTooltip('time')}
                onMouseLeave={() => setShowTooltip(null)}
                className="text-gray-400 hover:text-gray-200 relative"
              >
                i
                {showTooltip === 'time' && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black text-white text-xs rounded shadow-lg z-10">
                    {TOOLTIP_TEXT.time}
                  </div>
                )}
              </button>
            </div>
            <div className="ps-4 space-y-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-400 font-mono tracking-widest">
                  {draft.time}
                </div>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={timeToSlider(draft.time)}
                  onChange={(e) => setDraft({ ...draft, time: sliderToTime(Number(e.target.value)) })}
                  className="w-full h-3 bg-gradient-to-r from-blue-300 to-blue-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 px-1">
                  <span>00:00</span>
                  <span>12:00</span>
                  <span>23:00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <p className="font-semibold text-lg">通知曜日</p>
              <button
                onMouseEnter={() => setShowTooltip('days')}
                onMouseLeave={() => setShowTooltip(null)}
                className="text-gray-400 hover:text-gray-200 relative"
              >
                i
                {showTooltip === 'days' && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black text-white text-xs rounded shadow-lg z-10">
                    {TOOLTIP_TEXT.days}
                  </div>
                )}
              </button>
            </div>

            <div className="ps-4 mb-4 flex gap-2">
              <button
                onClick={() => setPreset('weekdays')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  JSON.stringify(draft.days) === JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                }`}
              >
                平日のみ
              </button>
              <button
                onClick={() => setPreset('everyday')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  draft.days.length === 7
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                }`}
              >
                毎日
              </button>
            </div>

            <div className="ps-4">
              <p className="text-xs text-gray-400 mb-2">カスタム:</p>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`
                      w-12 h-12 rounded-lg font-semibold text-sm transition-all
                      ${draft.days.includes(day)
                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }
                    `}
                    title={DAYS_FULL_NAME[day]}
                  >
                    {DAYS_FULL_NAME[day]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {testing ? '送信中...' : 'テスト送信'}
            </button>
          </div>
        </>
      ) : (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg text-center border-l-4 border-yellow-600">
          通知は現在無効です
        </div>
      )}

      {toast && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg border-l-4 shadow-lg animate-pulse z-50 ${
            toast.type === 'success'
              ? 'bg-green-100 text-green-800 border-green-600'
              : 'bg-red-100 text-red-800 border-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};
