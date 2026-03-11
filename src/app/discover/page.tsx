import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import Header from "@/components/Header";
import NineGrid from "@/components/NineGrid";
import { NineCell, Profile } from "@/types";

interface UserWithMatch {
  profile: Profile;
  cells: NineCell[];
  matchCount: number;
  matchRate: number;
}

async function getUsers(): Promise<{ users: UserWithMatch[]; isLoggedIn: boolean }> {
  const supabase = await createClient();

  // 全プロフィール取得
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (!profiles || profiles.length === 0) return { users: [], isLoggedIn: false };

  // 全セル取得
  const userIds = profiles.map((p: Profile) => p.id);
  const { data: allCells } = await supabase
    .from("nine_cells")
    .select("*")
    .in("user_id", userIds);

  // 現在のユーザー
  const { data: { user } } = await supabase.auth.getUser();

  let myTitles: string[] = [];
  if (user) {
    const { data: myCells } = await supabase
      .from("nine_cells")
      .select("content_title")
      .eq("user_id", user.id);
    myTitles = (myCells || []).map((c: { content_title: string }) => c.content_title.toLowerCase());
  }

  const users: UserWithMatch[] = profiles
    .filter((p: Profile) => !user || p.id !== user.id)
    .map((profile: Profile) => {
      const cells = (allCells || []).filter((c: NineCell) => c.user_id === profile.id);
      const theirTitles = cells.map((c: NineCell) => c.content_title.toLowerCase());
      const matchCount = myTitles.filter((t) => theirTitles.includes(t)).length;
      const matchRate = Math.round((matchCount / 9) * 100);

      return { profile, cells, matchCount, matchRate };
    });

  // マッチ率順（ログイン時）、それ以外は新着順
  if (user && myTitles.length > 0) {
    users.sort((a, b) => b.matchCount - a.matchCount);
  }

  return { users, isLoggedIn: !!user };
}

export default async function DiscoverPage() {
  const { users, isLoggedIn } = await getUsers();

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 pb-20 pt-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl mb-2" style={{ color: "var(--primary)" }}>
            Discover
          </h1>
          <p className="text-xs" style={{ color: "var(--primary)", opacity: 0.4 }}>
            {isLoggedIn ? "マッチ率の高い順に表示" : "みんなのnines"}
          </p>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--primary)", opacity: 0.4 }}>
              まだユーザーがいません
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map(({ profile, cells, matchCount }) => (
              <Link
                key={profile.id}
                href={`/${profile.username}`}
                className="block group"
              >
                <div
                  className="rounded-2xl p-4 transition-all group-hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.5)" }}
                >
                  <div className="flex items-start gap-4">
                    {/* 左: アイコン + 名前 + マッチ率 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="circle-crop w-10 h-10 flex-shrink-0" style={{ background: "var(--primary)" }}>
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: "var(--text-on-primary)" }}>
                              {profile.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-base truncate" style={{ color: "var(--primary)" }}>
                            {profile.display_name || profile.username}
                          </p>
                          <p className="text-xs" style={{ color: "var(--primary)", opacity: 0.35 }}>
                            @{profile.username}
                          </p>
                        </div>
                      </div>

                      {isLoggedIn && matchCount > 0 && (
                        <div className="match-badge">
                          {matchCount} match! ❤
                        </div>
                      )}
                    </div>

                    {/* 右: 9マスプレビュー */}
                    <div className="flex-shrink-0">
                      <NineGrid cells={cells} size="sm" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
