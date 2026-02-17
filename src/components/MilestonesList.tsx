'use client';

import { useMemo, useState } from 'react';
import { useMilestones, type MilestoneItem } from '@/hooks/useMilestones';

function formatAchievedDate(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ja-JP');
}

function MilestoneVisualization({ progress, target, type }: { progress: number; target: number; type: string }) {
  const isStreak = type.includes('streak');
  const percentage = Math.min(Math.round((progress / target) * 100), 100);

  if (!isStreak) {
    return (
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-blue-600">
            {Math.round(progress * 10) / 10}/{target}時間
          </span>
          <span className="text-gray-600">{percentage}%</span>
        </div>
      </div>
    );
  }

  const stepCount = Math.min(target, 14);
  const stepSize = target / stepCount;
  const steps = Array.from({ length: stepCount }, (_, index) => (index + 1) * stepSize);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center gap-1">
        {steps.map((step, index) => (
          <div
            key={`${type}-${index}`}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              transition-all
              ${progress >= step
                ? 'bg-blue-600 text-white shadow-lg scale-110'
                : 'bg-gray-300 text-gray-600'
              }
            `}
          >
            {progress >= step ? '✓' : index + 1}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-blue-600">
            {Math.round(progress)}/{target}日
          </span>
          <span className="text-gray-600">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}

function CelebrationDialog({ milestone, onClose }: { milestone: MilestoneItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-2xl p-8 text-center max-w-md animate-bounce">
        <h2 className="text-2xl font-bold mb-2 text-blue-600">達成おめでとうございます</h2>
        <p className="text-xl font-semibold mb-6">{milestone.label}</p>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          確認
        </button>
      </div>
    </div>
  );
}

export const MilestonesList = () => {
  const { achieved, pending, stats, loading, error, reload, checkNewMilestones } = useMilestones();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<MilestoneItem | null>(null);
  const [checking, setChecking] = useState(false);

  const averageHours = useMemo(() => {
    if (stats.currentStreak <= 0) {
      return 0;
    }
    return Math.round((stats.totalHours / stats.currentStreak) * 10) / 10;
  }, [stats]);

  const handleCheck = async () => {
    setChecking(true);
    const result = await checkNewMilestones(stats.currentStreak, stats.totalHours);
    if (result.success && Array.isArray(result.data?.newMilestones) && result.data.newMilestones.length > 0) {
      const first = result.data.newMilestones[0];
      const label = pending.find((item) => item.type === first)?.label || first;
      setCelebrationMilestone({ type: first, label });
      setShowCelebration(true);
    }
    await reload();
    setChecking(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700 text-white">
        <p className="text-gray-300">マイルストーンを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg text-white">
      <div className="flex items-center justify-between gap-2 mb-8">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">マイルストーン</h2>
        </div>
        <button
          onClick={handleCheck}
          disabled={checking}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {checking ? '更新中...' : '達成チェック'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {achieved.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-bold text-green-300">達成済み</h3>
            <span className="text-sm text-gray-300">({achieved.length}個)</span>
          </div>

          <div className="space-y-3 ps-8">
            {achieved.map((milestone) => (
              <div
                key={milestone.type}
                className="p-4 bg-gray-800 border-l-4 border-green-500 rounded-lg"
              >
                <p className="font-semibold text-lg text-white">{milestone.label}</p>
                {milestone.achievedAt && (
                  <p className="text-sm text-gray-300 mt-1">達成日: {formatAchievedDate(milestone.achievedAt)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-bold text-blue-300">進行中</h3>
            <span className="text-sm text-gray-300">({pending.length}個)</span>
          </div>

          <div className="space-y-4 ps-8">
            {pending.map((milestone) => (
              <div
                key={milestone.type}
                className="p-5 bg-gray-800 border-l-4 border-blue-500 rounded-lg"
              >
                <p className="font-semibold text-lg mb-3 text-white">{milestone.label}</p>
                {milestone.progress !== undefined && milestone.target !== undefined && (
                  <MilestoneVisualization
                    progress={milestone.progress}
                    target={milestone.target}
                    type={milestone.type}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-800 text-blue-200 rounded-lg border border-blue-700">
          進行中のマイルストーンはありません。
        </div>
      )}

      <div className="mt-10 pt-8 border-t-2">
        <h3 className="text-lg font-bold mb-4">統計情報</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg border border-amber-700">
            <p className="text-sm text-gray-300">現在のストリーク</p>
            <p className="text-3xl font-bold text-amber-400">{stats.currentStreak}日</p>
            <p className="text-xs text-gray-400 mt-1">継続中</p>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-purple-700">
            <p className="text-sm text-gray-300">累計学習時間</p>
            <p className="text-3xl font-bold text-purple-400">{stats.totalHours}時間</p>
            <p className="text-xs text-gray-400 mt-1">1日平均 {averageHours}時間</p>
          </div>
        </div>
      </div>

      {showCelebration && celebrationMilestone && (
        <CelebrationDialog
          milestone={celebrationMilestone}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
};
