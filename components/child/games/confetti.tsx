"use client";
import { useEffect, useState } from "react";

const COLORS = ["#facc15", "#f87171", "#60a5fa", "#34d399", "#a78bfa", "#fb923c"];
const SHAPES = ["●", "★", "✦", "♦", "▲"];

interface Piece {
  id: number;
  x: number;
  color: string;
  shape: string;
  delay: number;
  size: number;
}

interface ConfettiProps {
  active: boolean;
  count?: number;
}

export function Confetti({ active, count = 18 }: ConfettiProps) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) { setPieces([]); return; }
    const next: Piece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      delay: Math.random() * 0.3,
      size: 12 + Math.random() * 12,
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 500);
    return () => clearTimeout(t);
  }, [active, count]);

  if (!pieces.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece absolute bottom-1/3"
          style={{
            left: `${p.x}%`,
            color: p.color,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.shape}
        </span>
      ))}
    </div>
  );
}
