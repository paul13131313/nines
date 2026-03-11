import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import ProfilePageClient from "./ProfilePageClient";
import { NineCell, Profile } from "@/types";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const ogImageUrl = `https://nines-seven.vercel.app/api/og/${username}`;

  return {
    title: `${username}のnines`,
    description: "好きなコンテンツ9選",
    openGraph: {
      title: `${username}のnines`,
      description: "好きなコンテンツ9選",
      images: [ogImageUrl],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImageUrl],
    },
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  // プロフィール取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) return notFound();

  // セル取得
  const { data: cells } = await supabase
    .from("nine_cells")
    .select("*")
    .eq("user_id", profile.id);

  // 現在のユーザーを取得
  const { data: { user } } = await supabase.auth.getUser();

  let isOwner = false;
  let myTitles: string[] = [];
  let isFollowing = false;

  if (user) {
    isOwner = user.id === profile.id;

    if (!isOwner) {
      // マッチ率計算用に自分のセルを取得
      const { data: myCells } = await supabase
        .from("nine_cells")
        .select("content_title")
        .eq("user_id", user.id);

      myTitles = (myCells || []).map((c: { content_title: string }) => c.content_title.toLowerCase());

      // フォロー状態チェック
      const { data: followData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .single();

      isFollowing = !!followData;
    }
  }

  // マッチ率計算
  const theirTitles = (cells || []).map((c: NineCell) => c.content_title.toLowerCase());
  const matchCount = myTitles.filter((t) => theirTitles.includes(t)).length;

  // フォロー数・フォロワー数
  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  // コンテンツ履歴取得
  const { data: historyData } = await supabase
    .from("nine_cells_history")
    .select("*")
    .eq("user_id", profile.id)
    .order("replaced_at", { ascending: false })
    .limit(30);

  // 重複除去（同じタイトルは最新1件のみ）
  const uniqueHistory = (historyData || []).filter(
    (item: { content_title: string }, index: number, self: { content_title: string }[]) =>
      index === self.findIndex((t) => t.content_title === item.content_title)
  );

  // 現在の9マスと重複するものは非表示
  const currentTitles = (cells || []).map((c: NineCell) => c.content_title);
  const filteredHistory = uniqueHistory.filter(
    (h: { content_title: string }) => !currentTitles.includes(h.content_title)
  );

  return (
    <>
      <Header />
      <ProfilePageClient
        profile={profile as Profile}
        cells={(cells || []) as NineCell[]}
        isOwner={isOwner}
        isLoggedIn={!!user}
        currentUserId={user?.id || null}
        matchCount={matchCount}
        isFollowing={isFollowing}
        followingCount={followingCount || 0}
        followerCount={followerCount || 0}
        history={filteredHistory}
      />
    </>
  );
}
