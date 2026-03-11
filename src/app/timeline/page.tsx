import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import Header from "@/components/Header";
import NineGrid from "@/components/NineGrid";
import { NineCell, Profile } from "@/types";

interface TimelineUser {
  profile: Profile;
  cells: NineCell[];
  matchCount: number;
}

export default async function TimelinePage() {
  const supabase = await createClient();

  // ログインチェック
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // 自分のセルを取得（マッチ率計算用）
  const { data: myCells } = await supabase
    .from("nine_cells")
    .select("content_title")
    .eq("user_id", user.id);

  const myTitles = (myCells || []).map((c: { content_title: string }) => c.content_title.toLowerCase());

  // フォロー中ユーザーのIDリストを取得
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (follows || []).map((f: { following_id: string }) => f.following_id);

  let timelineUsers: TimelineUser[] = [];

  if (followingIds.length > 0) {
    // フォロー中ユーザーのプロフィールを取得
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", followingIds);

    // そのユーザーたちのセルを取得
    const { data: allCells } = await supabase
      .from("nine_cells")
      .select("*")
      .in("user_id", followingIds);

    timelineUsers = (profiles || []).map((profile: Profile) => {
      const cells = (allCells || []).filter((c: NineCell) => c.user_id === profile.id);
      const theirTitles = cells.map((c: NineCell) => c.content_title.toLowerCase());
      const matchCount = myTitles.filter((t) => theirTitles.includes(t)).length;
      return { profile, cells, matchCount };
    });

    // マッチ率順にソート
    timelineUsers.sort((a, b) => b.matchCount - a.matchCount);
  }

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 pb-20 pt-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl mb-2" style={{ color: "var(--primary)" }}>
            Timeline
          </h1>
          <p className="text-xs" style={{ color: "var(--primary)", opacity: 0.4 }}>
            フォロー中のnines
          </p>
        </div>

        {timelineUsers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm mb-4" style={{ color: "var(--primary)", opacity: 0.4 }}>
              フォロー中のユーザーがいません
            </p>
            <Link href="/discover" className="btn-pill btn-primary text-xs py-2 px-5">
              ユーザーを探す
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineUsers.map(({ profile, cells, matchCount }) => (
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

                      {matchCount > 0 && (
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
