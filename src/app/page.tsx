import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import Header from "@/components/Header";
import NineGrid from "@/components/NineGrid";
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
            映画、ドラマ、ゲーム、マンガ、小説。
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
            <Link href="/discover" className="btn-pill btn-outline">
              みんなのnines
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
                href="/discover"
                className="text-xs tracking-widest uppercase"
                style={{ color: "var(--primary)", opacity: 0.4 }}
              >
                View All →
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
