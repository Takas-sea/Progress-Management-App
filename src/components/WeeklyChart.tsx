'use client'

import type { WeeklyData } from '@/hooks/useWeeklyData'

interface WeeklyChartProps {
  data: WeeklyData[]
}

export const WeeklyChart = ({ data }: WeeklyChartProps) => {
  const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0)

  return (
    <div className="bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">今週の学習時間</h2>
      <div className="space-y-4">
        {data.map((item) => {
          const maxMinutes = Math.max(...data.map(d => d.minutes), 60)
          const widthPercent = item.minutes > 0 ? (item.minutes / maxMinutes) * 100 : 0

          return (
            <div key={item.date} className="flex items-center gap-4">
              <div className={`w-12 text-right font-semibold ${item.isToday ? 'text-cyan-400' : 'text-gray-300'}`}>
                {item.day}
              </div>
              <div className="flex-1 relative">
                <div className="w-full bg-gray-800 rounded-lg h-10 overflow-hidden border border-gray-700">
                  <div
                    className={`h-full rounded-lg transition-all duration-500 ${
                      item.isToday
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-700'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  ></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {item.minutes > 0 ? `${item.minutes}分` : ''}
                  </span>
                </div>
              </div>
              <div className="w-20 text-left text-gray-400 text-sm">
                {item.minutes > 0 ? `${Math.floor(item.minutes / 60)}h ${item.minutes % 60}m` : '-'}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-300 font-semibold">今週の合計</span>
          <span className="text-cyan-400 text-2xl font-bold">{totalMinutes}分</span>
        </div>
      </div>
    </div>
  )
}
