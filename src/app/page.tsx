"use client";

import { useEffect, useState } from "react";

type StudyLog = {
  id: string;
  title: string;
  minutes: number;
  date: string;
};

export default function Home() {
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("");
  const [date, setDate] = useState("");

  // Read
  const fetchLogs = async () => {
    const res = await fetch("/api/study-logs");
    const data = await res.json();
    setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Create
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("/api/study-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        minutes: Number(minutes),
        date,
      }),
    });

    setTitle("");
    setMinutes("");
    setDate("");
    fetchLogs();
  };

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

const handleDelete = async (id: string) => {
  const confirmed = window.confirm("本当に削除しますか？");
  if (!confirmed) return;

  try {
    setDeletingId(id);

    const res = await fetch(`/api/study-logs?id=${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("削除に失敗しました");
    }

    setLogs((prev) => prev.filter((log) => log.id !== id));
  } catch (error) {
    alert("削除に失敗しました");
  } finally {
    setDeletingId(null);
  }
};


  return (
    <div style={{ padding: "2rem" }}>
      <h1>Study Logs</h1>

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
