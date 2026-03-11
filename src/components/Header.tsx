"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Profile } from "@/types";

export default function Header() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    };
    getProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 px-4 py-3" style={{ background: "rgba(219, 214, 205, 0.9)", backdropFilter: "blur(10px)" }}>
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-tight" style={{ color: "var(--primary)" }}>
          nines
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/discover"
            className="text-xs tracking-widest uppercase"
            style={{ color: "var(--primary)", opacity: 0.6 }}
          >
            Discover
          </Link>

          {loading ? null : profile ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/${profile.username}`}
                className="flex items-center gap-1.5"
              >
                <div className="circle-crop w-7 h-7" style={{ background: "var(--primary)" }}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--text-on-primary)" }}>
                      {profile.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-xs"
                style={{ color: "var(--primary)", opacity: 0.4 }}
              >
                Out
              </button>
            </div>
          ) : (
            <Link href="/auth" className="btn-pill btn-primary text-xs py-1.5 px-4">
              Log In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
