"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

type StudyLog = {
  id: string;
  title: string;
  minutes: number;
  date: string;
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("");
  const [date, setDate] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 🔐 認証監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 📖 Read
  const fetchLogs = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch("/api/study-logs", {
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`,
        } : {},
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        const errorMsg = responseData.details || responseData.error || "データ取得に失敗しました";
        console.error("Fetch logs error:", responseData);
        throw new Error(errorMsg);
      }
      
      if (Array.isArray(responseData)) {
        setLogs(responseData);
      } else {
        console.error("Unexpected response format:", responseData);
        setLogs([]);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchLogs();
    }
  }, [session, fetchLogs]);

  // ➕ Create
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch("/api/study-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify({
          title,
          minutes: Number(minutes),
          date,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        const errorMsg = responseData.details || responseData.error || "追加に失敗しました";
        console.error("Create log error:", responseData);
        throw new Error(errorMsg);
      }

      setTitle("");
      setMinutes("");
      setDate("");
      await fetchLogs();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "エラーが発生しました";
      console.error("Submit error:", error);
      alert(msg);
    }
  };

  // ❌ Delete
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("本当に削除しますか？");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`/api/study-logs?id=${id}`, {
        method: "DELETE",
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`,
        } : {},
      });

      const responseData = await res.json();

      if (!res.ok) {
        const errorMsg = responseData.details || responseData.error || "削除に失敗しました";
        console.error("Delete log error:", responseData);
        throw new Error(errorMsg);
      }

      setLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "削除に失敗しました";
      console.error("Delete error:", error);
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // 🔐 未ログイン時
  if (!session) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>ログイン</h2>
        <button
          onClick={async () => {
            const email = prompt("メールアドレスを入力");
            if (!email) return;
            await supabase.auth.signInWithOtp({ email });
            alert("メールを確認してください");
          }}
        >
          メールでログイン
        </button>
      </div>
    );
  }

  // ✅ ログイン後UI
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Study Logs</h1>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
        }}
        style={{ marginBottom: "1rem" }}
      >
        ログアウト
      </button>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          placeholder="分数"
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <button type="submit">追加</button>
      </form>

      <ul style={{ marginTop: "2rem", listStyle: "none", padding: 0 }}>
        {logs.map((log) => (
          <li
            key={log.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.8rem",
              marginBottom: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <div>
              <strong>{log.title}</strong>
              <div>
                {log.minutes}分 / {log.date}
              </div>
            </div>

            <button
              onClick={() => handleDelete(log.id)}
              disabled={deletingId === log.id}
              style={{
                background: deletingId === log.id ? "gray" : "red",
                color: "white",
                border: "none",
                padding: "0.5rem 0.8rem",
                borderRadius: "6px",
                cursor: "pointer",
                opacity: deletingId === log.id ? 0.6 : 1,
              }}
            >
              {deletingId === log.id ? "削除中..." : "🗑 削除"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
