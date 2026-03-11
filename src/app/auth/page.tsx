"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // ログイン済みなら / にリダイレクト
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace("/");
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignUp) {
      if (!username.trim()) {
        setError("ユーザーネームを入力してください");
        setLoading(false);
        return;
      }

      // サーバーサイドAPIでサインアップ（RLSバイパス）
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username: username.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // 作成したユーザーでログイン
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(`/${result.username}`);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // プロフィールからユーザーネームを取得してリダイレクト
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (profile) {
          router.push(`/${profile.username}`);
        } else {
          router.push("/");
        }
      }
    }

    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "#DBD6CD" }}>
        <p className="text-sm" style={{ color: "#262626", opacity: 0.4 }}>...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4"
      style={{ background: "#DBD6CD" }}>
      <div className="w-full max-w-sm">
        {/* 方眼紙テクスチャ風の装飾線 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl tracking-tight mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#262626" }}>
            nines
          </h1>
          <p className="text-sm tracking-widest uppercase"
            style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#262626", opacity: 0.6 }}>
            {isSignUp ? "Create Account" : "Log In"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs tracking-widest uppercase mb-1.5"
                style={{ color: "#262626", opacity: 0.6 }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-full text-sm outline-none"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #262626",
                  color: "#262626",
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
                placeholder="your_name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs tracking-widest uppercase mb-1.5"
              style={{ color: "#262626", opacity: 0.6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-full text-sm outline-none"
              style={{
                background: "#FFFFFF",
                border: "1px solid #262626",
                color: "#262626",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase mb-1.5"
              style={{ color: "#262626", opacity: 0.6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-full text-sm outline-none"
              style={{
                background: "#FFFFFF",
                border: "1px solid #262626",
                color: "#262626",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#D73C3C" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full text-sm font-medium tracking-widest uppercase transition-opacity disabled:opacity-50"
            style={{
              background: "#262626",
              color: "#FFFFFF",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            {loading ? "..." : isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="text-sm underline underline-offset-4"
            style={{ color: "#262626", opacity: 0.6 }}
          >
            {isSignUp ? "アカウントをお持ちの方はこちら" : "新規登録はこちら"}
          </button>
        </div>
      </div>
    </div>
  );
}
