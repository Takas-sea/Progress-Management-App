"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
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
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mailSent, setMailSent] = useState(false);

  // 認証監視
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

  // Read
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

  // Create
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

  // Delete
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

  // 今週の学習時間を集計
  const weeklyData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (日曜) から 6 (土曜)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // 今週の日曜日
    startOfWeek.setHours(0, 0, 0, 0);

    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
    const weekData = daysOfWeek.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      
      const totalMinutes = logs
        .filter(log => log.date === dateStr)
        .reduce((sum, log) => sum + log.minutes, 0);
      
      return {
        day,
        date: dateStr,
        minutes: totalMinutes,
        isToday: index === dayOfWeek
      };
    });

    return weekData;
  }, [logs]);

  // 🔐 未ログイン時
  if (!session) {
    const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginEmail) return;
      
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.signInWithOtp({ email: loginEmail });
        
        if (error) {
          if (error.message.includes("rate limit")) {
            alert("メール送信が多すぎます。\n\n5～10分待ってからもう一度試してください。\nそれでも届かない場合は別のメールアドレスをお試しください。");
          } else if (error.message.includes("invalid")) {
            alert("メールアドレスが無効です。\n\n正しいメールアドレスを入力してください。");
          } else {
            alert(`ログインエラー: ${error.message}`);
          }
          return;
        }
        
        setMailSent(true);
        alert("メールを送信しました。受信トレイを確認してください。\n\nメールが見つからない場合は以下を確認してください：\n・迷惑メールフォルダ\n・メールアドレスが正しいか\n・5～10分待つ（メール配信に時間がかかる場合があります）");
        setLoginEmail("");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "ログインに失敗しました";
        alert(`エラーが発生しました: ${msg}`);
      } finally {
        setIsLoading(false);
      }
    };

    const handleGoogleLogin = async () => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`
          }
        });
        
        if (error) {
          alert(`Googleログインエラー: ${error.message}`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Googleログインに失敗しました";
        alert(`エラーが発生しました: ${msg}`);
      }
    };

    return (
      <div className="min-h-screen bg-center bg-fixed flex items-center justify-center p-4" style={{
        backgroundImage: "url('/images/black_00032.jpg')",
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {/* オーバーレイ */}
        <div className="absolute inset-0"></div>
        
        <div className="relative z-10 bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Study Logs</h1>
            <p className="text-gray-300">学習内容を記録して、進捗を管理しましょう</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 transition duration-200 bg-gray-800 text-white placeholder-gray-500 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl cursor-pointer active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? "送信中..." : "メールでログイン"}
            </button>
            {mailSent && (
              <div className="mt-4 p-4 bg-cyan-900 bg-opacity-30 border border-cyan-500 rounded-lg">
                <p className="text-cyan-300 text-sm">メールを送信しました。上記のメールアドレスで再送信できます。</p>
              </div>
            )}
          </form>

          {/* 区切り線 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900 text-gray-400">または</span>
            </div>
          </div>

          {/* Googleログインボタン */}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer active:scale-95 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  // ログイン後UI
  return (
    <div className="min-h-screen bg-center bg-fixed" style={{
      backgroundImage: "url('/images/black_00032.jpg')",
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      {/* オーバーレイ */}
      <div className="absolute inset-0"></div>

      {/* ヘッダー */}
      <div className="relative z-10 bg-gray-900 bg-opacity-80 backdrop-blur-md text-white p-6 shadow-lg border-b border-gray-700">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Study Logs</h1>
            <p className="text-cyan-300 mt-1">学習記録管理アプリ</p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:shadow-lg hover:scale-105 cursor-pointer active:scale-95"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* メインコンテント */}
      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* 今週の学習時間グラフ */}
        <div className="bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">今週の学習時間</h2>
          <div className="space-y-4">
            {weeklyData.map((data) => {
              const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 60);
              const widthPercent = data.minutes > 0 ? (data.minutes / maxMinutes) * 100 : 0;
              
              return (
                <div key={data.date} className="flex items-center gap-4">
                  <div className={`w-12 text-right font-semibold ${data.isToday ? 'text-cyan-400' : 'text-gray-300'}`}>
                    {data.day}
                  </div>
                  <div className="flex-1 relative">
                    <div className="w-full bg-gray-800 rounded-lg h-10 overflow-hidden border border-gray-700">
                      <div 
                        className={`h-full rounded-lg transition-all duration-500 ${
                          data.isToday 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600' 
                            : 'bg-gradient-to-r from-cyan-600 to-blue-700'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {data.minutes > 0 ? `${data.minutes}分` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="w-20 text-left text-gray-400 text-sm">
                    {data.minutes > 0 ? `${Math.floor(data.minutes / 60)}h ${data.minutes % 60}m` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-semibold">今週の合計</span>
              <span className="text-cyan-400 text-2xl font-bold">
                {weeklyData.reduce((sum, d) => sum + d.minutes, 0)}分
              </span>
            </div>
          </div>
        </div>

        {/* フォームセクション */}
        <div className="bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">新しい記録を追加</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  タイトル
                </label>
                <input
                  placeholder="例：数学の復習"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 transition duration-200 bg-gray-800 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  学習時間（分）
                </label>
                <input
                  placeholder="60"
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 transition duration-200 bg-gray-800 text-white placeholder-gray-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                日付
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 transition duration-200 bg-gray-800 text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl cursor-pointer active:scale-95 mt-6"
            >
              記録を追加
            </button>
          </form>
        </div>

        {/* ログリスト */}
        <div className="bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">
            学習記録 ({logs.length}件)
          </h2>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">まだ記録がありません。記録を追加しましょう！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center p-4 bg-gray-800 bg-opacity-50 border-2 border-gray-700 rounded-xl hover:shadow-md transition duration-200 hover:border-cyan-500"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{log.title}</h3>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="bg-cyan-900 bg-opacity-60 text-cyan-300 px-3 py-1 rounded-full font-semibold border border-cyan-700">
                        {log.minutes}分
                      </span>
                      <span className="bg-blue-900 bg-opacity-60 text-blue-300 px-3 py-1 rounded-full font-semibold border border-blue-700">
                        {log.date}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={deletingId === log.id}
                    className={`ml-4 font-semibold py-2 px-4 rounded-lg transition-all duration-300 ${
                      deletingId === log.id
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-500 text-white hover:shadow-lg transform hover:scale-110 active:scale-95 cursor-pointer"
                    }`}
                  >
                    {deletingId === log.id ? "削除中..." : "削除"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
