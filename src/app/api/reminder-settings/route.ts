import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

interface ReminderConfig {
  enabled: boolean;
  time: string;
  type: 'push' | 'email' | 'both';
  days: string[];
}

// GET /api/reminder-settings - Get user's reminder settings
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient();

    // Get user settings
    const { data, error } = await admin
      .from('user_settings')
      .select('reminder_enabled, reminder_time, reminder_type, reminder_days, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        return NextResponse.json({
          enabled: true,
          time: '19:00',
          type: 'both',
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        });
      }
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      enabled: data.reminder_enabled,
      time: data.reminder_time,
      type: data.reminder_type,
      days: data.reminder_days?.split(',') || [],
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('GET /api/reminder-settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reminder-settings - Update user's reminder settings
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

    // Parse request body
    const body: ReminderConfig = await request.json();

    // Validate input
    if (!body.hasOwnProperty('enabled') || 
        !body.time || 
        !body.type || 
        !Array.isArray(body.days)) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    // Validate time format (HH:mm)
    if (!/^\d{2}:\d{2}$/.test(body.time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:mm' },
        { status: 400 }
      );
    }

    // Validate reminder type
    if (!['push', 'email', 'both'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid reminder type' },
        { status: 400 }
      );
    }

    // Validate days
    const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (!body.days.every(d => validDays.includes(d))) {
      return NextResponse.json(
        { error: 'Invalid day values' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient();

    // Update or insert settings
    const { data, error } = await admin
      .from('user_settings')
      .upsert({
        user_id: user.id,
        reminder_enabled: body.enabled,
        reminder_time: body.time,
        reminder_type: body.type,
        reminder_days: body.days.join(','),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.user_id,
      userId: data.user_id,
      enabled: data.reminder_enabled,
      time: data.reminder_time,
      type: data.reminder_type,
      days: data.reminder_days?.split(',') || [],
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('POST /api/reminder-settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
