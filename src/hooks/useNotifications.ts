import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type ReminderSettings = {
  enabled: boolean;
  time: string;
  type: 'push' | 'email' | 'both';
  days: string[];
  updatedAt?: string | null;
};

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  time: '19:00',
  type: 'both',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

function normalizeTime(value: string) {
  if (!value) {
    return DEFAULT_SETTINGS.time;
  }

  const [hours, minutes] = value.split(':');
  if (!hours || !minutes) {
    return DEFAULT_SETTINGS.time;
  }

  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

export const useNotifications = () => {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reminder-settings', {
        headers: await getAuthHeaders(),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.error || data?.message || data?.details || '設定の取得に失敗しました';
        console.error('Reminder settings API error:', { status: res.status, data });
        throw new Error(`${errorMsg} (${res.status})`);
      }

      setSettings({
        enabled: Boolean(data.enabled),
        time: normalizeTime(String(data.time || '')),
        type: data.type || DEFAULT_SETTINGS.type,
        days: Array.isArray(data.days) && data.days.length > 0 ? data.days : DEFAULT_SETTINGS.days,
        updatedAt: data.updatedAt ?? null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '設定の取得に失敗しました';
      console.error('Load reminder settings error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (nextSettings: ReminderSettings) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/reminder-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify(nextSettings),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || '設定の保存に失敗しました');
      }

      const normalized = {
        enabled: Boolean(data.enabled),
        time: normalizeTime(String(data.time || '')),
        type: data.type || DEFAULT_SETTINGS.type,
        days: Array.isArray(data.days) && data.days.length > 0 ? data.days : DEFAULT_SETTINGS.days,
        updatedAt: data.updatedAt ?? null,
      } satisfies ReminderSettings;

      setSettings(normalized);
      return { success: true, settings: normalized } as const;
    } catch (err) {
      const message = err instanceof Error ? err.message : '設定の保存に失敗しました';
      setError(message);
      return { success: false, error: message } as const;
    } finally {
      setSaving(false);
    }
  }, []);

  const sendTest = useCallback(async () => {
    setTesting(true);
    setError(null);

    try {
      const res = await fetch('/api/reminder-settings/test', {
        method: 'POST',
        headers: await getAuthHeaders(),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'テスト通知に失敗しました');
      }

      return { success: true, data } as const;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'テスト通知に失敗しました';
      setError(message);
      return { success: false, error: message } as const;
    } finally {
      setTesting(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    saving,
    testing,
    error,
    reload: loadSettings,
    updateSettings,
    sendTest,
  };
};
