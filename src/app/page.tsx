import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import Header from "@/components/Header";
import NineGrid from "@/components/NineGrid";
import HomeLoggedIn from "@/app/HomeLoggedIn";
import { NineCell, Profile } from "@/types";

async function getRecentUsers(): Promise<{ profile: Profile; cells: NineCell[] }[]> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);

  if (!profiles || profiles.length === 0) return [];

  const userIds = profiles.map((p: Profile) => p.id);
  const { data: cells } = await supabase
    .from("nine_cells")
    .select("*")
    .in("user_id", userIds);

  return profiles.map((profile: Profile) => ({
    profile,
    cells: (cells || []).filter((c: NineCell) => c.user_id === profile.id),
  }));
}

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ログイン済み → ホーム画面
  if (user) {
    // 自分のプロフィール + セル
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: myCells } = await supabase
      .from("nine_cells")
      .select("*")
      .eq("user_id", user.id);

    const myTitles = (myCells || []).map((c: NineCell) => c.content_title.toLowerCase());

    // フォロー中ユーザー取得
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = (follows || []).map((f: { following_id: string }) => f.following_id);

    let followingUsers: { profile: Profile; cells: NineCell[]; matchCount: number }[] = [];

    if (followingIds.length > 0) {
      const { data: fProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", followingIds);

      const { data: fCells } = await supabase
        .from("nine_cells")
        .select("*")
        .in("user_id", followingIds);

      followingUsers = (fProfiles || []).map((profile: Profile) => {
        const cells = (fCells || []).filter((c: NineCell) => c.user_id === profile.id);
        const theirTitles = cells.map((c: NineCell) => c.content_title.toLowerCase());
        const matchCount = myTitles.filter((t) => theirTitles.includes(t)).length;
        return { profile, cells, matchCount };
      });
      followingUsers.sort((a, b) => b.matchCount - a.matchCount);
    }

    // みんなのnines（自分とフォロー中を除外）
    const excludeIds = [user.id, ...followingIds];
    const { data: everyoneProfiles } = await supabase
      .from("profiles")
      .select("*")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(50);

    let everyoneUsers: { profile: Profile; cells: NineCell[]; matchCount: number }[] = [];

    if (everyoneProfiles && everyoneProfiles.length > 0) {
      const everyoneIds = everyoneProfiles.map((p: Profile) => p.id);
      const { data: eCells } = await supabase
        .from("nine_cells")
        .select("*")
        .in("user_id", everyoneIds);

      everyoneUsers = everyoneProfiles.map((profile: Profile) => {
        const cells = (eCells || []).filter((c: NineCell) => c.user_id === profile.id);
        const theirTitles = cells.map((c: NineCell) => c.content_title.toLowerCase());
        const matchCount = myTitles.filter((t) => theirTitles.includes(t)).length;
        return { profile, cells, matchCount };
      });
    }

    return (
      <HomeLoggedIn
        myProfile={myProfile}
        myCells={myCells || []}
        followingUsers={followingUsers}
        everyoneUsers={everyoneUsers}
      />
    );
  }

  // 未ログイン → ランディングページ
  const recentUsers = await getRecentUsers();

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 pb-20">
        {/* Hero */}
        <section className="text-center pt-16 pb-12">
          <h1 className="font-display text-6xl sm:text-7xl tracking-tight leading-none mb-4"
            style={{ color: "var(--primary)" }}>
            nines
          </h1>
          <p className="text-sm leading-relaxed mb-1" style={{ color: "var(--primary)", opacity: 0.6 }}>
            映画、ドラマ、音楽、ゲーム、マンガ、小説。
          </p>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--primary)", opacity: 0.6 }}>
            好きなコンテンツを、9マスに。
          </p>

          {/* デモ9マスグリッド */}
          <div className="mb-8">
            <div className="nine-grid gap-1.5 w-full max-w-[240px] mx-auto">
              {Array.from({ length: 9 }, (_, i) => (
                <div
                  key={i}
                  className="nine-cell"
                  style={{
                    background: "rgba(38, 38, 38, 0.06)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-lg" style={{ color: "var(--primary)", opacity: 0.15 }}>
                      {i + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link href="/auth" className="btn-pill btn-primary">
              はじめる
            </Link>
            <Link href="/auth" className="btn-pill btn-outline">
              みんなのninesを見る
            </Link>
          </div>
        </section>

        {/* みんなのnines プレビュー */}
        {recentUsers.length > 0 && (
          <section className="pt-8">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display text-2xl" style={{ color: "var(--primary)" }}>
                Recent
              </h2>
              <Link
                href="/auth"
                className="text-xs tracking-widest uppercase"
                style={{ color: "var(--primary)", opacity: 0.4 }}
              >
                Log In →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {recentUsers.map(({ profile, cells }) => (
                <Link
                  key={profile.id}
                  href={`/${profile.username}`}
                  className="block group"
                >
                  <div className="rounded-2xl p-3 transition-all group-hover:shadow-md"
                    style={{ background: "rgba(255,255,255,0.5)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="circle-crop w-6 h-6 flex-shrink-0" style={{ background: "var(--primary)" }}>
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--text-on-primary)" }}>
                            {profile.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium truncate" style={{ color: "var(--primary)" }}>
                        {profile.display_name || profile.username}
                      </span>
                    </div>
                    <NineGrid cells={cells} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
