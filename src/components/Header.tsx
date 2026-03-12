"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Profile } from "@/types";

export default function Header() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);

      // 未読通知数を取得
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);

      setLoading(false);
    };
    init();
  }, []);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 px-4 py-3" style={{ background: "rgba(219, 214, 205, 0.9)", backdropFilter: "blur(10px)" }}>
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-tight" style={{ color: "var(--primary)" }}>
          nines
        </Link>

        <nav className="flex items-center gap-3">
          {loading ? null : profile ? (
            <>
              {/* 通知ベル */}
              <Link href="/notifications" className="relative">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--primary)", opacity: 0.5 }}
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </Link>

              {/* アバターメニュー */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center"
                >
                  <div className="circle-crop w-7 h-7" style={{ background: "var(--primary)" }}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--text-on-primary)" }}>
                        {profile.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 rounded-xl py-1 min-w-[140px] shadow-lg"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <Link
                      href={`/${profile.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs tracking-wide"
                      style={{ color: "var(--primary)" }}
                    >
                      My Page
                    </Link>
                    <Link
                      href="/edit"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs tracking-wide"
                      style={{ color: "var(--primary)" }}
                    >
                      Edit Nines
                    </Link>
                    <div style={{ borderTop: "1px solid var(--border)" }} />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-xs tracking-wide"
                      style={{ color: "var(--primary)", opacity: 0.5 }}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/auth" className="btn-pill btn-primary text-xs py-1.5 px-4">
              Log In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
