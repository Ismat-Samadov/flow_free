// ============================================================
// LevelSelect.tsx — Difficulty + puzzle picker
// ============================================================

"use client";

import { motion } from "framer-motion";
import { Difficulty, Puzzle } from "@/lib/types";
import { PUZZLES } from "@/lib/puzzles";

interface Props {
  currentPuzzle: Puzzle;
  onSelect: (puzzle: Puzzle) => void;
}

const DIFF_LABELS: Record<Difficulty, { label: string; color: string; glow: string }> = {
  easy:   { label: "Easy",   color: "from-green-500 to-emerald-600",   glow: "shadow-green-900/40" },
  medium: { label: "Medium", color: "from-yellow-500 to-orange-500",   glow: "shadow-orange-900/40" },
  hard:   { label: "Hard",   color: "from-red-500 to-pink-600",        glow: "shadow-red-900/40" },
};

export default function LevelSelect({ currentPuzzle, onSelect }: Props) {
  return (
    <div className="w-full flex flex-col gap-4">
      {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => {
        const puzzles = PUZZLES[diff];
        const meta = DIFF_LABELS[diff];
        return (
          <div key={diff}>
            {/* Difficulty header */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${meta.color}`}
              >
                {meta.label}
              </span>
              <span className="text-white/30 text-xs">{puzzles[0].size}×{puzzles[0].size} grid</span>
            </div>

            {/* Puzzle buttons */}
            <div className="flex flex-wrap gap-2">
              {puzzles.map((p, idx) => {
                const active = p.id === currentPuzzle.id;
                return (
                  <motion.button
                    key={p.id}
                    onClick={() => onSelect(p)}
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.05 }}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${active
                        ? `bg-gradient-to-r ${meta.color} text-white shadow-lg ${meta.glow}`
                        : "glass-card text-white/60 hover:text-white"}
                    `}
                  >
                    {idx + 1}. {p.name}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
