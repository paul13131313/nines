"use client";

import { useState, useEffect, useRef } from "react";
import { ContentType, SearchResult } from "@/types";

const GENRES: { key: ContentType; label: string }[] = [
  { key: "movie", label: "映画" },
  { key: "drama", label: "ドラマ" },
  { key: "manga", label: "マンガ" },
  { key: "book", label: "本" },
  { key: "game", label: "ゲーム" },
  { key: "other", label: "その他" },
];

interface SearchModalProps {
  position: number;
  onSelect: (position: number, title: string, type: ContentType, thumbnailUrl: string) => void;
  onClose: () => void;
  initialTitle?: string;
  initialType?: ContentType;
}

export default function SearchModal({ position, onSelect, onClose, initialTitle, initialType }: SearchModalProps) {
  const [genre, setGenre] = useState<ContentType>(initialType || "movie");
  const [query, setQuery] = useState(initialTitle || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!query.trim() || genre === "other") {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${genre}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, genre]);

  const handleSelectResult = (result: SearchResult) => {
    onSelect(position, result.title, genre, result.thumbnail_url);
  };

  const handleManualSubmit = () => {
    if (!manualTitle.trim()) return;
    onSelect(position, manualTitle.trim(), genre, "");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl" style={{ color: "var(--primary)" }}>
            #{position + 1}
          </h2>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "var(--primary)", opacity: 0.4 }}>
            ×
          </button>
        </div>

        {/* ジャンルタブ */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {GENRES.map((g) => (
            <button
              key={g.key}
              onClick={() => { setGenre(g.key); setResults([]); setManualMode(g.key === "other"); }}
              className="btn-pill whitespace-nowrap text-xs"
              style={{
                background: genre === g.key ? "var(--primary)" : "transparent",
                color: genre === g.key ? "var(--text-on-primary)" : "var(--primary)",
                border: genre === g.key ? "none" : "1px solid var(--border)",
              }}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* 検索 or 手動入力 */}
        {!manualMode && genre !== "other" ? (
          <>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトルを検索..."
              autoFocus
              className="w-full px-4 py-3 rounded-full text-sm outline-none mb-4"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--primary)",
              }}
            />

            {/* 検索結果 */}
            {loading ? (
              <div className="text-center py-8" style={{ color: "var(--primary)", opacity: 0.4 }}>
                検索中...
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectResult(r)}
                    className="text-left group"
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden mb-1.5 bg-black/5">
                      {r.thumbnail_url ? (
                        <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs" style={{ opacity: 0.3 }}>
                          No Image
                        </div>
                      )}
                    </div>
                    <p className="text-xs leading-tight line-clamp-2" style={{ color: "var(--primary)" }}>
                      {r.title}
                    </p>
                    {r.year && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--primary)", opacity: 0.4 }}>
                        {r.year}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : query.trim() && !loading ? (
              <div className="text-center py-6" style={{ color: "var(--primary)", opacity: 0.4 }}>
                <p className="text-sm mb-3">見つかりませんでした</p>
              </div>
            ) : null}

            <button
              onClick={() => { setManualMode(true); setManualTitle(query); }}
              className="w-full text-center text-xs underline underline-offset-4 py-2"
              style={{ color: "var(--primary)", opacity: 0.5 }}
            >
              手動で入力する
            </button>
          </>
        ) : (
          /* 手動入力モード */
          <div>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="タイトルを入力..."
              autoFocus
              className="w-full px-4 py-3 rounded-full text-sm outline-none mb-4"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--primary)",
              }}
            />
            <button
              onClick={handleManualSubmit}
              className="btn-pill btn-primary w-full"
            >
              決定
            </button>
            {genre !== "other" && (
              <button
                onClick={() => setManualMode(false)}
                className="w-full text-center text-xs underline underline-offset-4 py-2 mt-2"
                style={{ color: "var(--primary)", opacity: 0.5 }}
              >
                検索に戻る
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
