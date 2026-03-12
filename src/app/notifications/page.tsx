import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import Header from "@/components/Header";
import NotificationsClient from "./NotificationsClient";
import { Notification, Profile } from "@/types";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // 通知一覧を取得（新しい順）
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // actor（通知を起こした人）のプロフィールを取得
  const actorIds = [...new Set((notifications || []).map((n: Notification) => n.actor_id))];
  let actors: Profile[] = [];

  if (actorIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("id", actorIds);
    actors = data || [];
  }

  // 通知にactorプロフィールを結合
  const notificationsWithActors = (notifications || []).map((n: Notification) => ({
    ...n,
    actor: actors.find((a: Profile) => a.id === n.actor_id),
  }));

  // 未読IDリスト
  const unreadIds = (notifications || [])
    .filter((n: Notification) => !n.read)
    .map((n: Notification) => n.id);

  return (
    <>
      <Header />
      <NotificationsClient
        notifications={notificationsWithActors}
        unreadIds={unreadIds}
      />
    </>
  );
}
