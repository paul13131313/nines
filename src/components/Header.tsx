"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Profile } from "@/types";

export default function Header() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [highMatchCount, setHighMatchCount] = useState(0);
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

      // マッチ通知バッジ: 5マッチ以上のユーザーがいるかチェック
      const { data: myCells } = await supabase
        .from("nine_cells")
        .select("content_title")
        .eq("user_id", user.id);

      if (myCells && myCells.length > 0) {
        const myTitles = myCells.map((c: { content_title: string }) => c.content_title.toLowerCase());

        // 他ユーザーの全セルを取得
        const { data: allCells } = await supabase
          .from("nine_cells")
          .select("user_id, content_title")
          .neq("user_id", user.id);

        if (allCells) {
          // ユーザーごとにグループ化してマッチ数を計算
          const userCellsMap = new Map<string, string[]>();
          for (const cell of allCells) {
            const existing = userCellsMap.get(cell.user_id) || [];
            existing.push(cell.content_title.toLowerCase());
            userCellsMap.set(cell.user_id, existing);
          }

          let count = 0;
          for (const titles of userCellsMap.values()) {
            const matchCount = myTitles.filter((t: string) => titles.includes(t)).length;
            if (matchCount >= 5) count++;
          }
          setHighMatchCount(count);
        }
      }

      setLoading(false);
    };
    init();
  }, []);

  const handleSignOut = async () => {
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
          {profile && (
            <Link
              href="/timeline"
              className="text-xs tracking-widest uppercase relative"
              style={{ color: "var(--primary)", opacity: 0.6 }}
            >
              Timeline
            </Link>
          )}

          <Link
            href="/discover"
            className="text-xs tracking-widest uppercase relative"
            style={{ color: "var(--primary)", opacity: 0.6 }}
          >
            Discover
            {highMatchCount > 0 && (
              <span
                className="absolute -top-1.5 -right-3 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {highMatchCount}
              </span>
            )}
          </Link>

          {loading ? null : profile ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/${profile.username}`}
                className="flex items-center gap-1.5"
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
              </Link>
              <button
                onClick={handleSignOut}
                className="text-xs"
                style={{ color: "var(--primary)", opacity: 0.4 }}
              >
                Out
              </button>
            </div>
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
