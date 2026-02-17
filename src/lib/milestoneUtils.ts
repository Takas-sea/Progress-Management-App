/**
 * Milestone utility functions
 */

export const MILESTONE_CONFIG = {
  streak_7: { label: '7日連続学習', target: 7, category: 'streak' as const },
  streak_14: { label: '14日連続学習', target: 14, category: 'streak' as const },
  streak_30: { label: '30日連続学習', target: 30, category: 'streak' as const },
  streak_100: { label: '100日連続学習', target: 100, category: 'streak' as const },
  hours_100: { label: '100時間達成', target: 100, category: 'hours' as const },
  hours_200: { label: '200時間達成', target: 200, category: 'hours' as const },
  hours_300: { label: '300時間達成', target: 300, category: 'hours' as const },
  hours_500: { label: '500時間達成', target: 500, category: 'hours' as const },
} as const;

/**
 * Check which milestones have been newly achieved
 */
export function checkMilestones(
  currentStreak: number,
  totalHours: number,
  achievedMilestones: string[]
): string[] {
  const newMilestones: string[] = [];

  // Streak checks
  if (currentStreak >= 7 && !achievedMilestones.includes('streak_7')) {
    newMilestones.push('streak_7');
  }
  if (currentStreak >= 14 && !achievedMilestones.includes('streak_14')) {
    newMilestones.push('streak_14');
  }
  if (currentStreak >= 30 && !achievedMilestones.includes('streak_30')) {
    newMilestones.push('streak_30');
  }
  if (currentStreak >= 100 && !achievedMilestones.includes('streak_100')) {
    newMilestones.push('streak_100');
  }

  // Hours checks
  if (totalHours >= 100 && !achievedMilestones.includes('hours_100')) {
    newMilestones.push('hours_100');
  }
  if (totalHours >= 200 && !achievedMilestones.includes('hours_200')) {
    newMilestones.push('hours_200');
  }
  if (totalHours >= 300 && !achievedMilestones.includes('hours_300')) {
    newMilestones.push('hours_300');
  }
  if (totalHours >= 500 && !achievedMilestones.includes('hours_500')) {
    newMilestones.push('hours_500');
  }

  return newMilestones;
}

/**
 * Get formatted label for a milestone
 */
export function formatMilestoneLabel(type: string): string {
  return (
    MILESTONE_CONFIG[type as keyof typeof MILESTONE_CONFIG]?.label || type
  );
}

/**
 * Calculate progress towards a milestone
 */
export function calculateProgress(
  current: number,
  target: number
): { percentage: number; remaining: number } {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const remaining = Math.max(target - current, 0);
  return { percentage, remaining };
}

/**
 * Get all pending milestones with progress
 */
export function getPendingMilestones(
  currentStreak: number,
  totalHours: number,
  achievedMilestones: string[]
) {
  const pending = [];

  for (const [type, config] of Object.entries(MILESTONE_CONFIG)) {
    if (!achievedMilestones.includes(type)) {
      const current = config.category === 'streak' ? currentStreak : totalHours;
      const progress = calculateProgress(current, config.target);

      pending.push({
        type,
        label: config.label,
        category: config.category,
        current,
        target: config.target,
        ...progress,
      });
    }
  }

  return pending.sort((a, b) => a.percentage - b.percentage);
}

/**
 * Check if streak is still valid (not broken)
 */
export function isStreakValid(
  lastLogDate: Date | null,
  checkDate: Date = new Date()
): boolean {
  if (!lastLogDate) return false;

  const lastDate = new Date(lastLogDate);
  const currentDate = new Date(checkDate);

  // Reset time to midnight
  lastDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);

  // Calculate difference in days
  const diffTime = currentDate.getTime() - lastDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  // Streak is valid if last log was today or yesterday
  return diffDays <= 1;
}
