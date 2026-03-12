"use client";

import { NineCell } from "@/types";

interface NineGridProps {
  cells: NineCell[];
  onCellClick?: (position: number) => void;
  editable?: boolean;
  size?: "sm" | "md" | "lg";
  selectedPosition?: number | null;
}

export default function NineGrid({ cells, onCellClick, editable = false, size = "lg", selectedPosition = null }: NineGridProps) {
  const cellMap = new Map(cells.map((c) => [c.position, c]));

  const sizeClass = {
    sm: "w-full max-w-[180px]",
    md: "w-full max-w-[280px]",
    lg: "w-full max-w-[360px]",
  }[size];

  const gapClass = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-1.5",
  }[size];

  return (
    <div className={`nine-grid ${gapClass} ${sizeClass} mx-auto`}>
      {Array.from({ length: 9 }, (_, i) => {
        const cell = cellMap.get(i);
        return (
          <button
            key={i}
            className={`nine-cell ${editable ? "cursor-pointer" : ""}`}
            onClick={() => onCellClick?.(i)}
            disabled={!editable && !onCellClick}
            aria-label={cell?.content_title || `Cell ${i + 1}`}
            style={{
              border: editable && !cell
                ? "2px dashed var(--border)"
                : selectedPosition === i
                  ? "2px solid var(--accent)"
                  : "none",
            }}
          >
            {cell?.thumbnail_url ? (
              <img
                src={cell.thumbnail_url}
                alt={cell.content_title}
                loading="lazy"
              />
            ) : cell?.content_title ? (
              <div className="w-full h-full flex items-center justify-center p-2 text-center">
                <span className="text-xs leading-tight" style={{ color: "var(--primary)", opacity: 0.7 }}>
                  {cell.content_title}
                </span>
              </div>
            ) : editable ? (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl" style={{ color: "var(--border)" }}>+</span>
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
