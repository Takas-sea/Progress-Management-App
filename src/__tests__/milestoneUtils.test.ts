/**
 * Reminder settings API and utility tests
 */

import { checkMilestones, calculateProgress, getPendingMilestones } from '@/lib/milestoneUtils';

describe('checkMilestones', () => {
  it('should detect 7-day streak milestone', () => {
    const result = checkMilestones(7, 0, []);
    expect(result).toContain('streak_7');
  });

  it('should detect 14-day streak milestone', () => {
    const result = checkMilestones(14, 0, []);
    expect(result).toContain('streak_14');
  });

  it('should detect 30-day streak milestone', () => {
    const result = checkMilestones(30, 0, []);
    expect(result).toContain('streak_30');
  });

  it('should detect 100-day streak milestone', () => {
    const result = checkMilestones(100, 0, []);
    expect(result).toContain('streak_100');
  });

  it('should detect 100-hour milestone', () => {
    const result = checkMilestones(0, 100, []);
    expect(result).toContain('hours_100');
  });

  it('should detect 200-hour milestone', () => {
    const result = checkMilestones(0, 200, []);
    expect(result).toContain('hours_200');
  });

  it('should detect 300-hour milestone', () => {
    const result = checkMilestones(0, 300, []);
    expect(result).toContain('hours_300');
  });

  it('should detect 500-hour milestone', () => {
    const result = checkMilestones(0, 500, []);
    expect(result).toContain('hours_500');
  });

  it('should detect multiple milestones at once', () => {
    const result = checkMilestones(30, 200, []);
    expect(result).toContain('streak_7');
    expect(result).toContain('streak_14');
    expect(result).toContain('streak_30');
    expect(result).toContain('hours_100');
    expect(result).toContain('hours_200');
  });

  it('should not re-detect already achieved milestones', () => {
    const result = checkMilestones(7, 0, ['streak_7']);
    expect(result).not.toContain('streak_7');
  });

  it('should return empty array when no new milestones', () => {
    const result = checkMilestones(5, 50, ['streak_7', 'hours_100']);
    expect(result).toEqual([]);
  });

  it('should detect milestone at exact threshold', () => {
    const result = checkMilestones(7, 0, []);
    expect(result).toContain('streak_7');
  });

  it('should detect milestone above threshold', () => {
    const result = checkMilestones(8, 0, []);
    expect(result).toContain('streak_7');
  });
});

describe('calculateProgress', () => {
  it('should calculate 0% progress', () => {
    const result = calculateProgress(0, 14);
    expect(result.percentage).toBe(0);
    expect(result.remaining).toBe(14);
  });

  it('should calculate 50% progress', () => {
    const result = calculateProgress(7, 14);
    expect(result.percentage).toBe(50);
    expect(result.remaining).toBe(7);
  });

  it('should calculate 100% progress', () => {
    const result = calculateProgress(14, 14);
    expect(result.percentage).toBe(100);
    expect(result.remaining).toBe(0);
  });

  it('should cap at 100% when exceeded', () => {
    const result = calculateProgress(15, 14);
    expect(result.percentage).toBe(100);
    expect(result.remaining).toBe(0);
  });

  it('should handle decimal progress', () => {
    const result = calculateProgress(142.5, 200);
    expect(result.percentage).toBe(71);
    expect(result.remaining).toBe(57.5);
  });

  it('should handle float targets', () => {
    const result = calculateProgress(50, 100.5);
    expect(result.percentage).toBeLessThanOrEqual(50);
  });
});

describe('getPendingMilestones', () => {
  it('should return all pending milestones', () => {
    const result = getPendingMilestones(0, 0, []);
    expect(result.length).toBe(8); // Total milestones
  });

  it('should exclude achieved milestones', () => {
    const result = getPendingMilestones(0, 0, ['streak_7', 'hours_100']);
    expect(result.length).toBe(6);
    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'streak_7' }),
        expect.objectContaining({ type: 'hours_100' }),
      ])
    );
  });

  it('should sort by progress percentage', () => {
    const result = getPendingMilestones(5, 150, []);
    // First milestone should have lower percentage than last
    expect(result[0].percentage).toBeLessThanOrEqual(result[result.length - 1].percentage);
  });

  it('should calculate correct progress for streak milestones', () => {
    const result = getPendingMilestones(10, 0, []);
    const streak7 = result.find(m => m.type === 'streak_7');
    expect(streak7?.current).toBe(10);
    expect(streak7?.target).toBe(7);
    expect(streak7?.percentage).toBe(100);
  });

  it('should calculate correct progress for hours milestones', () => {
    const result = getPendingMilestones(0, 150, []);
    const hours200 = result.find(m => m.type === 'hours_200');
    expect(hours200?.current).toBe(150);
    expect(hours200?.target).toBe(200);
    expect(hours200?.percentage).toBe(75);
  });
});
