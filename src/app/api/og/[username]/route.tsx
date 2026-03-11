import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    return new Response("Not found", { status: 404 });
  }

  const { data: cells } = await supabase
    .from("nine_cells")
    .select("*")
    .eq("user_id", profile.id)
    .order("position");

  const thumbnails = Array.from({ length: 9 }, (_, i) =>
    cells?.find((c: { position: number; thumbnail_url: string | null }) => c.position === i)?.thumbnail_url || null
  );

  const displayName = String(profile.display_name || profile.username);
  const initial = String(displayName[0]?.toUpperCase() || "?");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "#0a0a0a",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
        }}
      >
        {/* 左：プロフィール */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "200px",
            marginRight: "24px",
          }}
        >
          {/* アバター */}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url.split("?")[0]}
              width={80}
              height={80}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: "12px",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "#333",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                color: "#fff",
                marginBottom: "12px",
              }}
            >
              {initial}
            </div>
          )}
          {/* 表示名 */}
          <div
            style={{
              display: "flex",
              color: "#fff",
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            {displayName}
          </div>
          {/* ユーザー名 */}
          <div
            style={{
              display: "flex",
              color: "#888",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            {`@${username}`}
          </div>
          {/* ロゴ */}
          <div
            style={{
              display: "flex",
              color: "#888",
              fontSize: "13px",
            }}
          >
            {"nines"}
          </div>
        </div>

        {/* 右：9マスグリッド */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: "450px",
            gap: "8px",
          }}
        >
          {thumbnails.map((url, i) =>
            url ? (
              <img
                key={i}
                src={url}
                width={138}
                height={138}
                style={{
                  borderRadius: "10px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: "138px",
                  height: "138px",
                  borderRadius: "10px",
                  background: "#1a1a1a",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#333",
                  fontSize: "24px",
                }}
              >
                {String(i + 1)}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
