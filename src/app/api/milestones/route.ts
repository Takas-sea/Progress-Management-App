import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

interface MilestoneData {
  type: string;
  label: string;
  achievedAt?: string;
  progress?: number;
  target?: number;
}

const MILESTONE_CONFIG: Record<string, { label: string; target: number; category: string }> = {
  streak_7: { label: '7日連続学習', target: 7, category: 'streak' },
  streak_14: { label: '14日連続学習', target: 14, category: 'streak' },
  streak_30: { label: '30日連続学習', target: 30, category: 'streak' },
  streak_100: { label: '100日連続学習', target: 100, category: 'streak' },
  hours_100: { label: '100時間達成', target: 100, category: 'hours' },
  hours_200: { label: '200時間達成', target: 200, category: 'hours' },
  hours_300: { label: '300時間達成', target: 300, category: 'hours' },
  hours_500: { label: '500時間達成', target: 500, category: 'hours' },
};

// GET /api/milestones - Get user's milestones
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Milestones API - Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient();

    // Get achieved milestones
    const { data: achievedData, error: achievedError } = await admin
      .from('milestones')
      .select('milestone_type, achieved_at')
      .eq('user_id', user.id);

    if (achievedError) {
      console.error('Milestones API - DB error:', achievedError);
      return NextResponse.json(
        { error: 'Failed to fetch milestones', details: achievedError.message },
        { status: 500 }
      );
    }

    // Get user's study logs to calculate progress
    const { data: logsData, error: logsError } = await admin
      .from('study_logs')
      .select('minutes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Milestones API - Logs error:', logsError);
      return NextResponse.json(
        { error: 'Failed to fetch progress data', details: logsError.message },
        { status: 500 }
      );
    }

    // Calculate current streak and total hours (simplified)
    let currentStreak = 0;
    let totalHours = 0;

    if (logsData && logsData.length > 0) {
      // Calculate total hours
      totalHours = logsData.reduce((sum, log) => {
        const minutes = typeof log.minutes === 'number' ? log.minutes : 0;
        return sum + (minutes / 60);
      }, 0);

      // Calculate current streak (simplified - just count recent logs)
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      for (const log of logsData) {
        const logDate = new Date(log.created_at);
        if (logDate.toDateString() === today.toDateString() ||
            logDate.toDateString() === yesterday.toDateString()) {
          currentStreak++;
        }
      }
    }

    // Build response
    const achievedMilestones: MilestoneData[] = (achievedData || []).map(m => ({
      type: m.milestone_type,
      label: MILESTONE_CONFIG[m.milestone_type]?.label || m.milestone_type,
      achievedAt: m.achieved_at,
    }));

    const pendingMilestones: MilestoneData[] = [];
    for (const [type, config] of Object.entries(MILESTONE_CONFIG)) {
      if (!achievedMilestones.some(m => m.type === type)) {
        const progress = config.category === 'streak' ? currentStreak : totalHours;
        pendingMilestones.push({
          type,
          label: config.label,
          progress,
          target: config.target,
        });
      }
    }

    return NextResponse.json({
      achieved: achievedMilestones,
      pending: pendingMilestones,
      stats: {
        currentStreak,
        totalHours: Math.round(totalHours * 100) / 100,
      },
    });
  } catch (error) {
    console.error('GET /api/milestones error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/milestones/check - Check and unlock new milestones (internal use)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentStreak, totalHours } = body;

    if (typeof currentStreak !== 'number' || typeof totalHours !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient();

    // Get already achieved milestones
    const { data: achieved } = await admin
      .from('milestones')
      .select('milestone_type')
      .eq('user_id', user.id);

    const achievedTypes = (achieved || []).map(m => m.milestone_type);

    // Check new milestones
    const newMilestones: string[] = [];

    // Streak milestones
    if (currentStreak >= 7 && !achievedTypes.includes('streak_7')) {
      newMilestones.push('streak_7');
    }
    if (currentStreak >= 14 && !achievedTypes.includes('streak_14')) {
      newMilestones.push('streak_14');
    }
    if (currentStreak >= 30 && !achievedTypes.includes('streak_30')) {
      newMilestones.push('streak_30');
    }
    if (currentStreak >= 100 && !achievedTypes.includes('streak_100')) {
      newMilestones.push('streak_100');
    }

    // Hours milestones
    if (totalHours >= 100 && !achievedTypes.includes('hours_100')) {
      newMilestones.push('hours_100');
    }
    if (totalHours >= 200 && !achievedTypes.includes('hours_200')) {
      newMilestones.push('hours_200');
    }
    if (totalHours >= 300 && !achievedTypes.includes('hours_300')) {
      newMilestones.push('hours_300');
    }
    if (totalHours >= 500 && !achievedTypes.includes('hours_500')) {
      newMilestones.push('hours_500');
    }

    // Insert new milestones
    if (newMilestones.length > 0) {
      const { error } = await admin
        .from('milestones')
        .insert(
          newMilestones.map(type => ({
            user_id: user.id,
            milestone_type: type,
            achieved_at: new Date().toISOString(),
          }))
        );

      if (error) {
        console.error('Insert milestone error:', error);
        return NextResponse.json(
          { error: 'Failed to save milestones' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      newMilestones,
      count: newMilestones.length,
      message: newMilestones.length > 0 
        ? `${newMilestones.length} new milestone(s) unlocked!`
        : 'No new milestones',
    });
  } catch (error) {
    console.error('POST /api/milestones/check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
