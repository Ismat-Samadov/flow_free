// ============================================================
// Header.tsx — Top bar with title and panel toggle
// ============================================================

"use client";

import { motion } from "framer-motion";
import { Difficulty, Puzzle } from "@/lib/types";

interface Props {
  puzzle: Puzzle;
  showLevels: boolean;
  onToggleLevels: () => void;
}

const DIFF_COLORS: Record<Difficulty, string> = {
  easy:   "text-green-400",
  medium: "text-yellow-400",
  hard:   "text-red-400",
};

export default function Header({ puzzle, showLevels, onToggleLevels }: Props) {
  return (
    <header className="flex items-center justify-between w-full">
      {/* Logo / Title */}
      <div className="flex items-center gap-3">
        {/* Animated color dots */}
        <div className="flex gap-1">
          {["bg-red-500", "bg-blue-500", "bg-green-400", "bg-yellow-400"].map(
            (c, i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 rounded-full ${c}`}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
                style={{ boxShadow: "0 0 8px currentColor" }}
              />
            )
          )}
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight leading-none">
            Flow Free
          </h1>
          <p className="text-[10px] text-white/40 leading-none mt-0.5 tracking-widest uppercase">
            Connect the dots
          </p>
        </div>
      </div>

      {/* Right: current puzzle info + levels toggle */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-white leading-none">{puzzle.name}</p>
          <p className={`text-xs leading-none mt-0.5 capitalize ${DIFF_COLORS[puzzle.difficulty]}`}>
            {puzzle.difficulty}
          </p>
        </div>
        <motion.button
          onClick={onToggleLevels}
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.05 }}
          className={`glass-card px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            showLevels ? "text-cyan-400" : "text-white/70 hover:text-white"
          }`}
        >
          {showLevels ? "Hide Levels" : "Levels"}
        </motion.button>
      </div>
    </header>
  );
}
