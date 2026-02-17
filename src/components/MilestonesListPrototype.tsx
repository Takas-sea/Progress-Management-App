'use client';

import { useState } from 'react';

interface Milestone {
  type: string;
  label: string;
  achievedAt?: string;
  progress?: number;
  target?: number;
}

const SAMPLE_DATA = {
  achieved: [
    {
      type: 'streak_7',
      label: '7日連続学習',
      achievedAt: '2026-02-17',
    },
    {
      type: 'hours_100',
      label: '100時間達成',
      achievedAt: '2026-02-05',
    },
  ],
  pending: [
    {
      type: 'streak_14',
      label: '14日連続学習',
      progress: 7,
      target: 14,
    },
    {
      type: 'streak_30',
      label: '30日連続学習',
      progress: 7,
      target: 30,
    },
    {
      type: 'hours_200',
      label: '200時間達成',
      progress: 142.5,
      target: 200,
    },
    {
      type: 'hours_300',
      label: '300時間達成',
      progress: 142.5,
      target: 300,
    },
  ],
};

// マイルストーン視覚化コンポーネント
function MilestoneVisualization({
  progress,
  target,
  type,
}: {
  progress: number;
  target: number;
  type: string;
}) {
  const percentage = Math.min(Math.round((progress / target) * 100), 100);
  const milestones = Array.from({ length: target }, (_, i) => i + 1);

  const isStreak = type.includes('streak');
  const label = isStreak
    ? `${progress}/${target}日`
    : `${Math.round(progress * 10) / 10}/${target}時間`;

  return (
    <div className="space-y-3">
      {/* ステップ表示 */}
      <div className="flex justify-between items-center gap-1">
        {milestones.map(step => (
          <div
            key={step}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              transition-all
              ${step <= progress
                ? 'bg-blue-600 text-white shadow-lg scale-110'
                : 'bg-gray-300 text-gray-600'
              }
            `}
          >
            {step <= progress ? '✓' : step <= 9 ? step : '…'}
          </div>
        ))}
      </div>

      {/* プログレスバー */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-blue-600">{label}</span>
          <span className="text-gray-600">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}

// セレブレーションモーダル
function CelebrationDialog({
  milestone,
  onClose,
}: {
  milestone: Milestone;
  onClose: () => void;
}) {
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

export function MilestonesListPrototype() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<Milestone | null>(null);

  const handleAchieve = (milestone: Milestone) => {
    setCelebrationMilestone(milestone);
    setShowCelebration(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700 text-white">
      <div className="flex items-center gap-2 mb-8">
        <h2 className="text-2xl font-bold">マイルストーン</h2>
      </div>

      {/* 達成済みセクション */}
      {SAMPLE_DATA.achieved.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-bold text-green-300">達成済み</h3>
            <span className="text-sm text-gray-300">({SAMPLE_DATA.achieved.length}個)</span>
          </div>

          <div className="space-y-3 ps-8">
            {SAMPLE_DATA.achieved.map(milestone => (
              <div
                key={milestone.type}
                className="p-4 bg-gray-800 border-l-4 border-green-500 rounded-lg"
              >
                <p className="font-semibold text-lg text-white">{milestone.label}</p>
                {milestone.achievedAt && (
                  <p className="text-sm text-gray-300 mt-1">
                    達成日: {new Date(milestone.achievedAt).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 進行中セクション */}
      {SAMPLE_DATA.pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-bold text-blue-300">進行中</h3>
            <span className="text-sm text-gray-300">({SAMPLE_DATA.pending.length}個)</span>
          </div>

          <div className="space-y-4 ps-8">
            {SAMPLE_DATA.pending.map(milestone => (
              <div
                key={milestone.type}
                className="p-5 bg-gray-800 border-l-4 border-blue-500 rounded-lg"
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="font-semibold text-lg text-white">{milestone.label}</p>
                  <button
                    onClick={() => handleAchieve(milestone)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    達成
                  </button>
                </div>
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
      )}

      {/* 統計情報パネル */}
      <div className="mt-10 pt-8 border-t-2">
        <h3 className="text-lg font-bold mb-4">統計情報</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg border border-amber-700">
            <p className="text-sm text-gray-300">現在のストリーク</p>
            <p className="text-3xl font-bold text-amber-400">7日</p>
            <p className="text-xs text-gray-400 mt-1">継続中</p>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-purple-700">
            <p className="text-sm text-gray-300">累計学習時間</p>
            <p className="text-3xl font-bold text-purple-400">142.5時間</p>
            <p className="text-xs text-gray-400 mt-1">1日平均 2.3時間</p>
          </div>
        </div>
      </div>

      {/* セレブレーションダイアログ */}
      {showCelebration && celebrationMilestone && (
        <CelebrationDialog
          milestone={celebrationMilestone}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
}

