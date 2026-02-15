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
    if (!body.title || !body.minutes || !body.date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (typeof body.minutes !== "number" || body.minutes <= 0) {
      return NextResponse.json({ error: "Invalid minutes value" }, { status: 400 });
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
    const { data, error } = await admin
      .from("study_logs")
      .insert([
        {
          title: body.title,
          minutes: body.minutes,
          date: body.date,
          user_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
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

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to delete log", details: errorMessage }, { status: 500 });
  }
}
