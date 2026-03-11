"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import Header from "@/components/Header";
import NineGrid from "@/components/NineGrid";
import SearchModal from "@/components/SearchModal";
import AvatarUpload from "@/components/AvatarUpload";
import { NineCell, ContentType, Profile } from "@/types";

export default function EditPage() {
  const [cells, setCells] = useState<NineCell[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editingPosition, setEditingPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        router.push("/auth");
        return;
      }

      setProfile(profileData);

      const { data: cellsData } = await supabase
        .from("nine_cells")
        .select("*")
        .eq("user_id", user.id);

      setCells(cellsData || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleSelect = async (position: number, title: string, type: ContentType, thumbnailUrl: string) => {
    if (!profile) return;
    setSaving(true);

    const existing = cells.find((c) => c.position === position);

    if (existing) {
      const { error } = await supabase
        .from("nine_cells")
        .update({
          content_title: title,
          content_type: type,
          thumbnail_url: thumbnailUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (!error) {
        setCells((prev) =>
          prev.map((c) =>
            c.id === existing.id
              ? { ...c, content_title: title, content_type: type, thumbnail_url: thumbnailUrl || null }
              : c
          )
        );
      }
    } else {
      const { data, error } = await supabase
        .from("nine_cells")
        .insert({
          user_id: profile.id,
          position,
          content_title: title,
          content_type: type,
          thumbnail_url: thumbnailUrl || null,
        })
        .select()
        .single();

      if (!error && data) {
        setCells((prev) => [...prev, data]);
      }
    }

    setSaving(false);
    setEditingPosition(null);
  };

  const handleDeleteCell = async (position: number) => {
    const cell = cells.find((c) => c.position === position);
    if (!cell) return;

    const { error } = await supabase.from("nine_cells").delete().eq("id", cell.id);
    if (!error) {
      setCells((prev) => prev.filter((c) => c.id !== cell.id));
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-[60dvh]">
          <p style={{ color: "var(--primary)", opacity: 0.4 }}>読み込み中...</p>
        </div>
      </>
    );
  }

  const currentCell = editingPosition !== null
    ? cells.find((c) => c.position === editingPosition)
    : null;

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 pb-20 pt-8">
        {/* プロフィール表示 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {profile && (
              <AvatarUpload
                userId={profile.id}
                username={profile.username}
                currentAvatarUrl={profile.avatar_url}
                size="md"
                onUpload={(url) => setProfile({ ...profile, avatar_url: url })}
              />
            )}
            <div>
              <p className="font-display text-lg" style={{ color: "var(--primary)" }}>
                {profile?.display_name || profile?.username}
              </p>
              <p className="text-xs" style={{ color: "var(--primary)", opacity: 0.4 }}>
                @{profile?.username}
              </p>
            </div>
          </div>

          {profile && (
            <button
              onClick={() => router.push(`/${profile.username}`)}
              className="btn-pill btn-outline text-xs"
            >
              プロフィールへ
            </button>
          )}
        </div>

        {/* 9マスタイトル */}
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl" style={{ color: "var(--primary)" }}>
            My Nines
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--primary)", opacity: 0.4 }}>
            タップしてコンテンツを追加
          </p>
        </div>

        {/* 9マスグリッド */}
        <NineGrid
          cells={cells}
          editable
          onCellClick={(pos) => setEditingPosition(pos)}
          size="lg"
        />

        {saving && (
          <p className="text-center text-xs mt-4" style={{ color: "var(--primary)", opacity: 0.4 }}>
            保存中...
          </p>
        )}

        {/* セル一覧（削除用） */}
        {cells.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--primary)", opacity: 0.4 }}>
              登録済み
            </h3>
            <div className="space-y-2">
              {cells
                .sort((a, b) => a.position - b.position)
                .map((cell) => (
                  <div
                    key={cell.id}
                    className="flex items-center justify-between py-2 px-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.5)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm" style={{ color: "var(--primary)", opacity: 0.3 }}>
                        #{cell.position + 1}
                      </span>
                      <span className="text-sm" style={{ color: "var(--primary)" }}>
                        {cell.content_title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg)", color: "var(--primary)", opacity: 0.5 }}>
                        {cell.content_type}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteCell(cell.position)}
                      className="text-xs"
                      style={{ color: "var(--accent)" }}
                    >
                      削除
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* 検索モーダル */}
      {editingPosition !== null && (
        <SearchModal
          position={editingPosition}
          onSelect={handleSelect}
          onClose={() => setEditingPosition(null)}
          initialTitle={currentCell?.content_title}
          initialType={currentCell?.content_type}
        />
      )}
    </>
  );
}
