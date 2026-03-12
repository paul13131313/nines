"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NineGrid from "@/components/NineGrid";
import { createClient } from "@/lib/supabase-browser";
import { NineCell, Profile } from "@/types";

interface HistoryItem {
  id: string;
  content_title: string;
  content_type: string;
  thumbnail_url: string | null;
  replaced_at: string;
}

interface Props {
  profile: Profile;
  cells: NineCell[];
  isOwner: boolean;
  isLoggedIn: boolean;
  currentUserId: string | null;
  matchCount: number;
  isFollowing: boolean;
  followingCount: number;
  followerCount: number;
  history: HistoryItem[];
}

interface ContentUser {
  profile: Profile;
  cells: NineCell[];
}

export default function ProfilePageClient({
  profile,
  cells,
  isOwner,
  isLoggedIn,
  currentUserId,
  matchCount,
  isFollowing: initialIsFollowing,
  followingCount,
  followerCount: initialFollowerCount,
  history,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [followLoading, setFollowLoading] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [contentUsers, setContentUsers] = useState<ContentUser[]>([]);
  const [contentUsersLoading, setContentUsersLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // コンテンツをタップ → 同じコンテンツを登録しているユーザーを取得
  const handleContentTap = async (contentTitle: string) => {
    // 同じコンテンツをタップしたら閉じる
    if (expandedContent === contentTitle) {
      setExpandedContent(null);
      setContentUsers([]);
      return;
    }

    setExpandedContent(contentTitle);
    setContentUsersLoading(true);

    // 同じcontent_titleを持つセルを検索（自分を除外）
    const { data: matchingCells } = await supabase
      .from("nine_cells")
      .select("user_id")
      .ilike("content_title", contentTitle)
      .neq("user_id", profile.id);

    if (!matchingCells || matchingCells.length === 0) {
      setContentUsers([]);
      setContentUsersLoading(false);
      return;
    }

    // ユニークなユーザーIDを取得
    const userIds = [...new Set(matchingCells.map((c: { user_id: string }) => c.user_id))];

    // プロフィールとセルを取得
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    const { data: userCells } = await supabase
      .from("nine_cells")
      .select("*")
      .in("user_id", userIds);

    const users: ContentUser[] = (profiles || []).map((p: Profile) => ({
      profile: p,
      cells: (userCells || []).filter((c: NineCell) => c.user_id === p.id),
    }));

    setContentUsers(users);
    setContentUsersLoading(false);
  };

  const shareUrl = `https://nines-seven.vercel.app/${profile.username}`;

  // 9マスのタイトルを最大3つ取得（プレビューテキスト用）
  const previewTitles = cells
    .filter((c) => c.content_title)
    .slice(0, 3)
    .map((c) => c.content_title)
    .join(" / ");

  // シェア（Web Share API → フォールバック: URLコピー）
  const handleShare = async () => {
    const shareText = `${previewTitles}...\n好きなもの9つ並べるだけなのに、意外と自分がわかる。`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.display_name || profile.username} のnines`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // ユーザーがキャンセルした場合は何もしない
      }
    } else {
      // Web Share API非対応 → URLコピー
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) return;
    setFollowLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", profile.id);

      if (!error) {
        setIsFollowing(false);
        setFollowerCount((c) => c - 1);
        // 通知も削除
        await supabase
          .from("notifications")
          .delete()
          .eq("user_id", profile.id)
          .eq("actor_id", currentUserId)
          .eq("type", "follow");
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({
          follower_id: currentUserId,
          following_id: profile.id,
        });

      if (!error) {
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
        // フォロー通知を作成
        await supabase.from("notifications").insert({
          user_id: profile.id,
          actor_id: currentUserId,
          type: "follow",
        });
      }
    }

    setFollowLoading(false);
    router.refresh();
  };

  const loadImageAsBlob = async (url: string): Promise<HTMLImageElement> => {
    // サーバーサイドプロキシ経由で画像取得（CORS完全回避）
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    return new Promise((resolve, reject) => {
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Image load failed"));
      };
      img.src = objectUrl;
    });
  };

  const drawCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number, y: number, size: number
  ) => {
    // object-fit: cover と同じ：中央をトリミングして正方形に収める
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const scale = Math.max(size / imgW, size / imgH);
    const sw = size / scale;
    const sh = size / scale;
    const sx = (imgW - sw) / 2;
    const sy = (imgH - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, size, size);
  };

  const drawEmptyCell = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, size: number, label: string
  ) => {
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 10);
    ctx.fill();
    ctx.fillStyle = "#333";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + size / 2, y + size / 2);
  };

  const handleDownloadImage = async () => {
    const sortedCells = Array.from({ length: 9 }, (_, i) =>
      cells.find((c) => c.position === i) || null
    );

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 900;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 900, 900);

    const gap = 12;
    const size = (900 - gap * 4) / 3;

    for (let i = 0; i < 9; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = gap + col * (size + gap);
      const y = gap + row * (size + gap);

      const cell = sortedCells[i];
      if (cell?.thumbnail_url) {
        try {
          const img = await loadImageAsBlob(cell.thumbnail_url);
          // 角丸クリップ
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x, y, size, size, 10);
          ctx.clip();
          drawCover(ctx, img, x, y, size);
          ctx.restore();
        } catch {
          drawEmptyCell(ctx, x, y, size, String(i + 1));
        }
      } else {
        drawEmptyCell(ctx, x, y, size, String(i + 1));
      }
    }

    const link = document.createElement("a");
    link.download = `${profile.username}-nines.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <main className="max-w-lg mx-auto px-4 pb-20 pt-8">
      {/* プロフィールヘッダー */}
      <div className="flex items-start justify-between mb-4">
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
          {!isOwner && isLoggedIn && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className="btn-pill text-xs py-1.5 px-4 disabled:opacity-50"
              style={{
                background: isFollowing ? "transparent" : "var(--primary)",
                color: isFollowing ? "var(--primary)" : "var(--text-on-primary)",
                border: isFollowing ? "1px solid var(--primary)" : "none",
              }}
            >
              {isFollowing ? "フォロー中" : "フォローする"}
            </button>
          )}
          {!isOwner && isLoggedIn && matchCount > 0 && (
            <div className="match-badge">
              {matchCount} match! ❤
            </div>
          )}
        </div>
      </div>

      {/* フォロー数・フォロワー数 */}
      <div className="flex items-center gap-4 mb-8 pl-17">
        <span className="text-xs" style={{ color: "var(--primary)", opacity: 0.5 }}>
          <strong style={{ opacity: 1 }}>{followingCount}</strong> フォロー
        </span>
        <span className="text-xs" style={{ color: "var(--primary)", opacity: 0.5 }}>
          <strong style={{ opacity: 1 }}>{followerCount}</strong> フォロワー
        </span>
      </div>

      {/* 9マスグリッド */}
      <NineGrid
        cells={cells}
        size="lg"
        onCellClick={(pos) => {
          const cell = cells.find((c) => c.position === pos);
          if (cell) handleContentTap(cell.content_title);
        }}
        selectedPosition={cells.find((c) => c.content_title === expandedContent)?.position ?? null}
      />

      {/* グリッド下の展開エリア */}
      {expandedContent && (
        <div
          className="max-w-[360px] mx-auto mt-3 px-3 py-3 rounded-xl"
          style={{ background: "rgba(255,255,255,0.5)" }}
        >
          <p className="text-xs font-medium mb-2 truncate" style={{ color: "var(--primary)" }}>
            「{expandedContent}」を登録しているユーザー
          </p>
          {contentUsersLoading ? (
            <p className="text-xs py-2" style={{ color: "var(--primary)", opacity: 0.35 }}>
              ...
            </p>
          ) : contentUsers.length === 0 ? (
            <p className="text-xs py-2" style={{ color: "var(--primary)", opacity: 0.35 }}>
              他にこのコンテンツを登録しているユーザーはいません
            </p>
          ) : (
            <div className="space-y-2">
              {contentUsers.map(({ profile: p, cells: userCells }) => (
                <Link
                  key={p.id}
                  href={`/${p.username}`}
                  className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg group"
                  style={{ background: "rgba(255,255,255,0.4)" }}
                >
                  <div className="circle-crop w-7 h-7 flex-shrink-0" style={{ background: "var(--primary)" }}>
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px]" style={{ color: "var(--text-on-primary)" }}>
                        {p.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--primary)" }}>
                      {p.display_name || p.username}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--primary)", opacity: 0.35 }}>
                      {userCells.length}コンテンツ登録中
                    </p>
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--primary)", opacity: 0.3 }}>
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* シェアボタン */}
      {cells.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleShare}
            className="btn-pill btn-accent text-xs py-2.5 px-8"
          >
            {copied ? "URLをコピーしました!" : "Share"}
          </button>
        </div>
      )}

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
                <div key={cell.id}>
                  <button
                    onClick={() => handleContentTap(cell.content_title)}
                    className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-left"
                    style={{
                      background: expandedContent === cell.content_title
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(255,255,255,0.4)",
                    }}
                  >
                    <span className="font-display text-sm" style={{ color: "var(--primary)", opacity: 0.25 }}>
                      #{cell.position + 1}
                    </span>
                    <span className="text-sm truncate" style={{ color: "var(--primary)" }}>
                      {cell.content_title}
                    </span>
                    <span className="text-xs ml-auto flex-shrink-0" style={{ color: "var(--primary)", opacity: 0.3 }}>
                      {cell.content_type}
                    </span>
                    <span
                      className="text-[10px] flex-shrink-0 transition-transform"
                      style={{
                        color: "var(--primary)",
                        opacity: 0.3,
                        transform: expandedContent === cell.content_title ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {/* 同じコンテンツのユーザー展開 */}
                  {expandedContent === cell.content_title && (
                    <div
                      className="ml-3 mt-1 mb-2 pl-3 py-2"
                      style={{ borderLeft: "2px solid var(--border)" }}
                    >
                      {contentUsersLoading ? (
                        <p className="text-xs py-2" style={{ color: "var(--primary)", opacity: 0.35 }}>
                          ...
                        </p>
                      ) : contentUsers.length === 0 ? (
                        <p className="text-xs py-2" style={{ color: "var(--primary)", opacity: 0.35 }}>
                          他にこのコンテンツを登録しているユーザーはいません
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[11px] mb-1" style={{ color: "var(--primary)", opacity: 0.4 }}>
                            {contentUsers.length}人が同じコンテンツを登録
                          </p>
                          {contentUsers.map(({ profile: p, cells: userCells }) => (
                            <Link
                              key={p.id}
                              href={`/${p.username}`}
                              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg group"
                              style={{ background: "rgba(255,255,255,0.3)" }}
                            >
                              <div className="circle-crop w-7 h-7 flex-shrink-0" style={{ background: "var(--primary)" }}>
                                {p.avatar_url ? (
                                  <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px]" style={{ color: "var(--text-on-primary)" }}>
                                    {p.username[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate" style={{ color: "var(--primary)" }}>
                                  {p.display_name || p.username}
                                </p>
                                <p className="text-[10px]" style={{ color: "var(--primary)", opacity: 0.35 }}>
                                  {userCells.length}コンテンツ登録中
                                </p>
                              </div>
                              <span className="text-[10px]" style={{ color: "var(--primary)", opacity: 0.3 }}>
                                →
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 過去のnines */}
      {history.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--primary)", opacity: 0.4 }}>
            Past Nines
          </h3>
          <div className="space-y-1.5">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 py-1.5 px-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                {item.thumbnail_url && (
                  <img
                    src={item.thumbnail_url}
                    alt=""
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                )}
                <span className="text-sm" style={{ color: "var(--primary)", opacity: 0.6 }}>
                  {item.content_title}
                </span>
                <span className="text-xs ml-auto flex-shrink-0" style={{ color: "var(--primary)", opacity: 0.2 }}>
                  {item.content_type}
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
