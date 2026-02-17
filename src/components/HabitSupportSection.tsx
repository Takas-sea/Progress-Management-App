'use client';

import { useState } from 'react';
import { ReminderSettings } from '@/components/ReminderSettings';
import { MilestonesList } from '@/components/MilestonesList';

export const HabitSupportSection = () => {
  const [activeTab, setActiveTab] = useState<'reminder' | 'milestones'>('reminder');

  return (
    <div className="bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">習慣サポート</h2>
          <p className="text-sm text-gray-300">リマインダーとマイルストーンで学習を継続しやすくします</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('reminder')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all text-base ${
            activeTab === 'reminder'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
          }`}
        >
          リマインダー設定
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all text-base ${
            activeTab === 'milestones'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
          }`}
        >
          マイルストーン
        </button>
      </div>

      <div className="bg-gray-900 bg-opacity-70 rounded-lg p-4 border border-gray-700">
        {activeTab === 'reminder' ? <ReminderSettings /> : <MilestonesList />}
      </div>
    </div>
  );
};
