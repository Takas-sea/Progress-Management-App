import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabase
    .from("study_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}


export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("study_logs")
    .insert([
      {
        title: body.title,
        minutes: body.minutes,
        date: body.date,
      },
    ]);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response(
      JSON.stringify({ error: "ID is required" }),
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("study_logs")
    .delete()
    .eq("id", id);

  if (error) {
    return new Response(
      JSON.stringify({ error }),
      { status: 500 }
    );
  }

  return new Response(
    JSON.stringify({ message: "Deleted successfully" }),
    { status: 200 }
  );
}
