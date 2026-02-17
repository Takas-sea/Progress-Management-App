/**
 * 学習ログの計算とユーティリティ関数
 */

export type StudyLog = {
  id: string;
  title: string;
  minutes: number;
  date: string;
}

export type WeeklyData = {
  day: string;
  date: string;
  minutes: number;
  isToday: boolean;
}

/**
 * メールアドレスの検証
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const trimmedEmail = email.trim();
  if (trimmedEmail !== email) return false; // 前後の空白がないかチェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmedEmail);
}

/**
 * 特定の日付のトータル学習時間を計算
 */
export const calculateDayTotal = (logs: StudyLog[], dateStr: string): number => {
  return logs
    .filter(log => log.date === dateStr)
    .reduce((sum, log) => sum + log.minutes, 0);
}

/**
 * 週間データを生成（日曜日から始まる）
 */
export const generateWeeklyData = (logs: StudyLog[], referenceDate: Date = new Date()): WeeklyData[] => {
  const today = new Date(referenceDate);
  const dayOfWeek = today.getDay(); // 0 (日曜) から 6 (土曜)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
  return daysOfWeek.map((day, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    const dateStr = date.toISOString().split('T')[0];
    
    const totalMinutes = calculateDayTotal(logs, dateStr);
    
    return {
      day,
      date: dateStr,
      minutes: totalMinutes,
      isToday: index === dayOfWeek
    };
  });
}

/**
 * 週間の合計学習時間を計算
 */
export const calculateWeeklyTotal = (weeklyData: WeeklyData[]): number => {
  return weeklyData.reduce((sum, day) => sum + day.minutes, 0);
}

/**
 * 分を時間と分に変換
 */
export const convertMinutesToTimeString = (totalMinutes: number): { hours: number; minutes: number } => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

/**
 * 学習ログが有効か検証
 */
export const isValidStudyLog = (title: string, minutes: string, date: string): boolean => {
  if (!title || !title.trim()) return false;
  if (!minutes || isNaN(Number(minutes))) return false;
  if (Number(minutes) <= 0) return false;
  if (!date) return false;
  
  // ISO 8601形式の日付かチェック
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  return true;
}

/**
 * 日付範囲内のログをフィルタリング
 */
export const filterLogsByDateRange = (
  logs: StudyLog[],
  startDate: string,
  endDate: string
): StudyLog[] => {
  return logs.filter(log => log.date >= startDate && log.date <= endDate);
}

/**
 * ログの統計情報を計算
 */
export const calculateStatistics = (logs: StudyLog[]) => {
  if (logs.length === 0) {
    return {
      totalMinutes: 0,
      averageMinutes: 0,
      maxMinutes: 0,
      minMinutes: 0,
      totalSessions: 0
    };
  }

  const totalMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);
  const averageMinutes = Math.round(totalMinutes / logs.length);
  const minutes = logs.map(log => log.minutes);
  
  return {
    totalMinutes,
    averageMinutes,
    maxMinutes: Math.max(...minutes),
    minMinutes: Math.min(...minutes),
    totalSessions: logs.length
  };
}
