"use client";

import { useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Notification } from "@/types";

interface NotificationsClientProps {
  notifications: Notification[];
  unreadIds: string[];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 30) return `${diffDay}日前`;
  return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

export default function NotificationsClient({
  notifications,
  unreadIds,
}: NotificationsClientProps) {
  const supabase = createClient();

  // ページ表示時に未読を既読化
  useEffect(() => {
    if (unreadIds.length === 0) return;

    const markAsRead = async () => {
      await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);
    };
    markAsRead();
  }, []);

  return (
    <main className="max-w-lg mx-auto px-4 pb-20 pt-6">
      <h1 className="font-display text-2xl mb-6" style={{ color: "var(--primary)" }}>
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: "var(--primary)", opacity: 0.35 }}>
            通知はありません
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.actor ? `/${n.actor.username}` : "#"}
              className="block group"
            >
              <div
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all group-hover:shadow-sm"
                style={{
                  background: !n.read ? "rgba(255,255,255,0.6)" : "transparent",
                }}
              >
                {/* アバター */}
                <div className="circle-crop w-9 h-9 flex-shrink-0" style={{ background: "var(--primary)" }}>
                  {n.actor?.avatar_url ? (
                    <img src={n.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--text-on-primary)" }}>
                      {n.actor?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                {/* テキスト */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--primary)" }}>
                    <span className="font-medium">
                      {n.actor?.display_name || n.actor?.username || "Unknown"}
                    </span>
                    <span style={{ opacity: 0.6 }}>
                      {n.type === "follow" ? " がフォローしました" : ""}
                    </span>
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--primary)", opacity: 0.3 }}>
                    {timeAgo(n.created_at)}
                  </p>
                </div>

                {/* 未読ドット */}
                {!n.read && (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
