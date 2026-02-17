import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// POST /api/reminder-settings/test - Send test notification
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
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
    const { data: settings, error } = await admin
      .from('user_settings')
      .select('reminder_enabled, reminder_type')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found; treat as default enabled
        return NextResponse.json({
          success: true,
          message: 'Test notification sent to browser',
          type: 'both',
        });
      }
      console.error('Test notification settings error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings', details: error.message },
        { status: 500 }
      );
    }

    if (!settings?.reminder_enabled) {
      return NextResponse.json(
        { error: 'Notifications are disabled' },
        { status: 400 }
      );
    }

    // In production, this would send actual notifications via:
    // - Web Push API for push notifications
    // - Email service (SendGrid, Resend, etc.) for email notifications
    return NextResponse.json({
      success: true,
      message: 'Test notification sent to browser',
      type: settings.reminder_type || 'push',
    });
  } catch (error) {
    console.error('POST /api/reminder-settings/test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
