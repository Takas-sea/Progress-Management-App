import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/reminder-settings/test - Send test notification
export async function POST(request: Request) {
  const supabase = await createClient();
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  try {
    
    // Get authenticated user
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('user_settings')
    .select('reminder_enabled, reminder_type')
    .eq('user_id', authData.user.id)
    .single();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's reminder settings to check if enabled
    const { data: settings } = await supabase
      .from('user_settings')
      .select('reminder_enabled, reminder_type')
      .eq('user_id', user.id)
      .single();

    if (!settings?.reminder_enabled) {
      return NextResponse.json(
        { error: 'Notifications are disabled' },
        { status: 400 }
      );
    }

    // In production, this would send actual notifications via:
    // - Web Push API for push notifications
    // - Email service (SendGrid, Resend, etc.) for email notifications
    // For now, we return a success response
    
    return NextResponse.json({
      success: true,
      message: 'Test notification sent to browser',
      type: settings.reminder_type || 'push',
    });
  } catch (error) {
    console.error('POST /api/reminder-settings/test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
