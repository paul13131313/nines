"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import NineGrid from "@/components/NineGrid";
import { NineCell, Profile } from "@/types";

interface HomeLoggedInProps {
  myProfile: Profile | null;
  myCells: NineCell[];
  followingUsers: { profile: Profile; cells: NineCell[]; matchCount: number }[];
  everyoneUsers: { profile: Profile; cells: NineCell[]; matchCount: number }[];
}

export default function HomeLoggedIn({
  myProfile,
  myCells,
  followingUsers,
  everyoneUsers,
}: HomeLoggedInProps) {
  const [activeTab, setActiveTab] = useState<"following" | "everyone">(
    followingUsers.length > 0 ? "following" : "everyone"
  );

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 pb-20 pt-6">
        {/* 自分のnines（コンパクト版） */}
        {myProfile && (
          <section className="mb-6">
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.5)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="circle-crop w-10 h-10 flex-shrink-0" style={{ background: "var(--primary)" }}>
                    {myProfile.avatar_url ? (
                      <img src={myProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: "var(--text-on-primary)" }}>
                        {myProfile.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-display text-base" style={{ color: "var(--primary)" }}>
                      {myProfile.display_name || myProfile.username}
                    </p>
                    <p className="text-xs" style={{ color: "var(--primary)", opacity: 0.35 }}>
                      @{myProfile.username}
                    </p>
                  </div>
                </div>
                <Link
                  href="/edit"
                  className="text-xs tracking-widest uppercase"
                  style={{ color: "var(--primary)", opacity: 0.5 }}
                >
                  Edit →
                </Link>
              </div>

              {myCells.length > 0 ? (
                <Link href={`/${myProfile.username}`}>
                  <NineGrid cells={myCells} size="md" />
                </Link>
              ) : (
                <Link href="/edit" className="block">
                  <div className="nine-grid gap-1.5 w-full">
                    {Array.from({ length: 9 }, (_, i) => (
                      <div
                        key={i}
                        className="nine-cell"
                        style={{
                          background: "rgba(38, 38, 38, 0.04)",
                          border: "1px dashed var(--border)",
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-lg" style={{ color: "var(--primary)", opacity: 0.1 }}>+</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs mt-3" style={{ color: "var(--primary)", opacity: 0.4 }}>
                    タップして好きなコンテンツを追加
                  </p>
                </Link>
              )}
            </div>
          </section>
        )}

        {/* タブ */}
        <div className="flex gap-1 mb-5">
          <button
            onClick={() => setActiveTab("following")}
            className="flex-1 py-2.5 rounded-full text-xs font-medium tracking-wide text-center transition-all"
            style={{
              background: activeTab === "following" ? "rgba(38, 38, 38, 0.12)" : "transparent",
              color: "var(--primary)",
              opacity: activeTab === "following" ? 1 : 0.35,
            }}
          >
            Following ({followingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("everyone")}
            className="flex-1 py-2.5 rounded-full text-xs font-medium tracking-wide text-center transition-all"
            style={{
              background: activeTab === "everyone" ? "rgba(38, 38, 38, 0.12)" : "transparent",
              color: "var(--primary)",
              opacity: activeTab === "everyone" ? 1 : 0.35,
            }}
          >
            Everyone ({everyoneUsers.length})
          </button>
        </div>

        {/* Following タブ */}
        {activeTab === "following" && (
          followingUsers.length > 0 ? (
            <div className="space-y-3">
              {followingUsers.map(({ profile, cells, matchCount }) => (
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="circle-crop w-8 h-8 flex-shrink-0" style={{ background: "var(--primary)" }}>
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--text-on-primary)" }}>
                                {profile.username[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-display text-sm truncate" style={{ color: "var(--primary)" }}>
                              {profile.display_name || profile.username}
                            </p>
                            <p className="text-[11px]" style={{ color: "var(--primary)", opacity: 0.35 }}>
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
                      <div className="flex-shrink-0">
                        <NineGrid cells={cells} size="sm" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm mb-1" style={{ color: "var(--primary)", opacity: 0.35 }}>
                まだフォローしているユーザーがいません
              </p>
              <p className="text-xs" style={{ color: "var(--primary)", opacity: 0.25 }}>
                Everyoneタブからユーザーを見つけよう
              </p>
            </div>
          )
        )}

        {/* Everyone タブ */}
        {activeTab === "everyone" && (
          everyoneUsers.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {everyoneUsers.map(({ profile, cells, matchCount }) => (
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
                    {matchCount > 0 && (
                      <div className="mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(215, 60, 60, 0.1)", color: "var(--accent)" }}>
                          {matchCount} match ❤
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--primary)", opacity: 0.35 }}>
                まだ他のユーザーがいません
              </p>
            </div>
          )
        )}
      </main>
    </>
  );
}
