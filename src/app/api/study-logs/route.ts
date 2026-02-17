import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized", details: authError?.message }, { status: 401 });
    }

    // RLS ポリシーをバイパスするため管理者クライアントを使用
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("study_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch logs", details: errorMessage }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // バリデーション追加
    if (!body.title || !body.minutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (typeof body.minutes !== "number" || body.minutes <= 0) {
      return NextResponse.json({ error: "Invalid minutes value" }, { status: 400 });
    }

    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];

    const supabase = await createClient();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized", details: authError?.message }, { status: 401 });
    }

    // RLS ポリシーをバイパスするため管理者クライアントを使用
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("study_logs")
      .insert([
        {
          title: body.title,
          minutes: body.minutes,
          date: localDate,
          user_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
    }

    // マイルストーン達成チェックを自動実行
    try {
      // ユーザーの全学習ログを取得して統計を計算
      const { data: allLogs } = await admin
        .from("study_logs")
        .select("minutes, created_at, date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (allLogs && allLogs.length > 0) {
        // 総学習時間を計算
        const totalHours = allLogs.reduce((sum, log) => {
          const minutes = typeof log.minutes === "number" ? log.minutes : 0;
          return sum + minutes / 60;
        }, 0);

        // 連続学習日数を計算（簡易版：過去7日間のログがある日数）
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentDates = new Set(
          allLogs
            .filter(log => {
              const logDate = new Date(log.date || log.created_at);
              return logDate >= sevenDaysAgo && logDate <= today;
            })
            .map(log => (log.date || log.created_at.split('T')[0]))
        );
        const currentStreak = recentDates.size;

        // マイルストーンチェックAPIを呼び出し
        const checkMilestonesUrl = new URL('/api/milestones', req.url);
        await fetch(checkMilestonesUrl.toString(), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currentStreak, totalHours }),
        });
      }
    } catch (milestoneError) {
      // マイルストーンチェックのエラーはログのみで、学習ログ作成は成功として返す
      console.error("Milestone check error:", milestoneError);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("POST error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create log", details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized", details: authError?.message }, { status: 401 });
    }

    // RLS ポリシーをバイパスするため管理者クライアントを使用
    const admin = createAdminClient();
    const { error, count } = await admin
      .from("study_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    // マイルストーンをリセットして再計算
    try {
      await admin
        .from("milestones")
        .delete()
        .eq("user_id", user.id);

      const { data: allLogs } = await admin
        .from("study_logs")
        .select("minutes, created_at, date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (allLogs && allLogs.length > 0) {
        const totalHours = allLogs.reduce((sum, log) => {
          const minutes = typeof log.minutes === "number" ? log.minutes : 0;
          return sum + minutes / 60;
        }, 0);

        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentDates = new Set(
          allLogs
            .filter(log => {
              const logDate = new Date(log.date || log.created_at);
              return logDate >= sevenDaysAgo && logDate <= today;
            })
            .map(log => (log.date || log.created_at.split('T')[0]))
        );
        const currentStreak = recentDates.size;

        const checkMilestonesUrl = new URL('/api/milestones', req.url);
        await fetch(checkMilestonesUrl.toString(), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currentStreak, totalHours }),
        });
      }
    } catch (milestoneError) {
      console.error("Milestone reset error:", milestoneError);
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to delete log", details: errorMessage }, { status: 500 });
  }
}
