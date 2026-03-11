import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import ProfilePageClient from "./ProfilePageClient";
import { NineCell, Profile } from "@/types";

interface Props {
  params: Promise<{ username: string }>;
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

  if (user) {
    isOwner = user.id === profile.id;

    if (!isOwner) {
      // マッチ率計算用に自分のセルを取得
      const { data: myCells } = await supabase
        .from("nine_cells")
        .select("content_title")
        .eq("user_id", user.id);

      myTitles = (myCells || []).map((c: { content_title: string }) => c.content_title.toLowerCase());
    }
  }

  // マッチ率計算
  const theirTitles = (cells || []).map((c: NineCell) => c.content_title.toLowerCase());
  const matchCount = myTitles.filter((t) => theirTitles.includes(t)).length;

  return (
    <>
      <Header />
      <ProfilePageClient
        profile={profile as Profile}
        cells={(cells || []) as NineCell[]}
        isOwner={isOwner}
        isLoggedIn={!!user}
        matchCount={matchCount}
      />
    </>
  );
}
