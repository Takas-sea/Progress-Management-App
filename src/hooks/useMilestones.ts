import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type MilestoneItem = {
  type: string;
  label: string;
  achievedAt?: string | null;
  progress?: number;
  target?: number;
  percentage?: number;
  remaining?: number;
  category?: 'streak' | 'hours';
};

export type MilestoneStats = {
  currentStreak: number;
  totalHours: number;
};

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

export const useMilestones = () => {
  const [achieved, setAchieved] = useState<MilestoneItem[]>([]);
  const [pending, setPending] = useState<MilestoneItem[]>([]);
  const [stats, setStats] = useState<MilestoneStats>({ currentStreak: 0, totalHours: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMilestones = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/milestones', {
        headers: await getAuthHeaders(),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.error || data?.message || data?.details || 'マイルストーンの取得に失敗しました';
        console.error('Milestones API error:', { status: res.status, data });
        throw new Error(`${errorMsg} (${res.status})`);
      }

      setAchieved(Array.isArray(data.achieved) ? data.achieved : []);
      setPending(Array.isArray(data.pending) ? data.pending : []);
      setStats({
        currentStreak: Number(data?.stats?.currentStreak ?? 0),
        totalHours: Number(data?.stats?.totalHours ?? 0),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'マイルストーンの取得に失敗しました';
      console.error('Load milestones error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkNewMilestones = useCallback(async (currentStreak: number, totalHours: number) => {
    try {
      const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ currentStreak, totalHours }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'マイルストーンの更新に失敗しました');
      }

      return { success: true, data } as const;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'マイルストーンの更新に失敗しました';
      setError(message);
      return { success: false, error: message } as const;
    }
  }, []);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  return {
    achieved,
    pending,
    stats,
    loading,
    error,
    reload: loadMilestones,
    checkNewMilestones,
  };
};
