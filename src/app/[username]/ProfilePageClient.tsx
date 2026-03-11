"use client";

import Link from "next/link";
import NineGrid from "@/components/NineGrid";
import { NineCell, Profile } from "@/types";

interface Props {
  profile: Profile;
  cells: NineCell[];
  isOwner: boolean;
  isLoggedIn: boolean;
  matchCount: number;
}

export default function ProfilePageClient({ profile, cells, isOwner, isLoggedIn, matchCount }: Props) {
  return (
    <main className="max-w-lg mx-auto px-4 pb-20 pt-8">
      {/* プロフィールヘッダー */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="circle-crop w-14 h-14" style={{ background: "var(--primary)" }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl" style={{ color: "var(--text-on-primary)" }}>
                {profile.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-display text-xl" style={{ color: "var(--primary)" }}>
              {profile.display_name || profile.username}
            </h1>
            <p className="text-xs" style={{ color: "var(--primary)", opacity: 0.4 }}>
              @{profile.username}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {isOwner && (
            <Link href="/edit" className="btn-pill btn-outline text-xs py-1.5 px-4">
              Edit
            </Link>
          )}
          {!isOwner && isLoggedIn && matchCount > 0 && (
            <div className="match-badge">
              {matchCount} match! ❤
            </div>
          )}
        </div>
      </div>

      {/* 9マスグリッド */}
      <NineGrid cells={cells} size="lg" />

      {/* セル一覧 */}
      {cells.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--primary)", opacity: 0.4 }}>
            Contents
          </h3>
          <div className="space-y-1.5">
            {cells
              .sort((a, b) => a.position - b.position)
              .map((cell) => (
                <div
                  key={cell.id}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.4)" }}
                >
                  <span className="font-display text-sm" style={{ color: "var(--primary)", opacity: 0.25 }}>
                    #{cell.position + 1}
                  </span>
                  <span className="text-sm" style={{ color: "var(--primary)" }}>
                    {cell.content_title}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: "var(--primary)", opacity: 0.3 }}>
                    {cell.content_type}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {cells.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: "var(--primary)", opacity: 0.4 }}>
            まだコンテンツが登録されていません
          </p>
          {isOwner && (
            <Link href="/edit" className="btn-pill btn-primary mt-4 inline-flex">
              9マスを埋める
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
