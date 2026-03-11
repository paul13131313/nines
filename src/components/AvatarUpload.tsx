"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

interface Props {
  userId: string;
  username: string;
  currentAvatarUrl: string | null;
  size?: "sm" | "md" | "lg";
  onUpload: (url: string) => void;
}

export default function AvatarUpload({ userId, username, currentAvatarUrl, size = "md", onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const sizeClass = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-14 h-14" : "w-12 h-12";
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-lg";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("5MB以下の画像を選択してください");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("アップロードに失敗しました: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const urlWithTimestamp = `${data.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlWithTimestamp })
      .eq("id", userId);

    if (updateError) {
      alert("プロフィール更新に失敗しました: " + updateError.message);
      setUploading(false);
      return;
    }

    onUpload(urlWithTimestamp);
    setUploading(false);
  };

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      className={`circle-crop ${sizeClass} relative group`}
      style={{ background: "var(--primary)", cursor: "pointer" }}
    >
      {currentAvatarUrl ? (
        <img src={currentAvatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center ${textSize}`}
          style={{ color: "var(--text-on-primary)" }}
        >
          {username[0].toUpperCase()}
        </div>
      )}

      {/* ホバーオーバーレイ */}
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(0,0,0,0.4)" }}
      >
        <span className="text-white text-[10px]">
          {uploading ? "..." : "変更"}
        </span>
      </div>

      {/* アップロード中のスピナー */}
      {uploading && (
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        style={{ display: "none" }}
      />
    </div>
  );
}
