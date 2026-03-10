// ============================================================
// WinModal.tsx — Animated victory overlay
// ============================================================

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Puzzle } from "@/lib/types";

interface Props {
  show: boolean;
  puzzle: Puzzle;
  moves: number;
  time: number;
  bestMoves: number | null;
  bestTime: number | null;
  onReplay: () => void;
  onNext: () => void;
  hasNext: boolean;
}

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

const STARS = ["★", "★", "★"];

function starCount(moves: number, size: number): number {
  // 3 stars = near-optimal, 2 = decent, 1 = solved
  const threshold = size * size;
  if (moves <= threshold * 0.6) return 3;
  if (moves <= threshold) return 2;
  return 1;
}

export default function WinModal({
  show,
  puzzle,
  moves,
  time,
  bestMoves,
  bestTime,
  onReplay,
  onNext,
  hasNext,
}: Props) {
  const stars = starCount(moves, puzzle.size);
  const isNewBest =
    bestMoves === null || moves < bestMoves || (moves === bestMoves && time < (bestTime ?? Infinity));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Card */}
          <motion.div
            className="relative glass-card rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            initial={{ scale: 0.7, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.7, y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
          >
            {/* Glow ring */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-cyan-500/30 via-purple-500/20 to-pink-500/30 blur-xl -z-10" />

            {/* Title */}
            <motion.h2
              className="text-4xl font-black text-white mb-1 tracking-tight"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Solved!
            </motion.h2>
            <p className="text-white/60 text-sm mb-4">{puzzle.name}</p>

            {/* Stars */}
            <motion.div
              className="flex justify-center gap-2 mb-5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.15 }}
            >
              {STARS.map((s, i) => (
                <motion.span
                  key={i}
                  className={`text-4xl ${i < stars ? "text-yellow-400" : "text-white/15"}`}
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 + i * 0.08 }}
                >
                  {s}
                </motion.span>
              ))}
            </motion.div>

            {/* New best badge */}
            {isNewBest && (
              <motion.div
                className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.35 }}
              >
                New Best!
              </motion.div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatItem label="Moves" value={moves} best={bestMoves} />
              <StatItem label="Time" value={formatTime(time)} best={bestTime ? formatTime(bestTime) : null} />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={onReplay}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                className="flex-1 py-3 rounded-xl glass-card text-white font-semibold text-sm hover:text-white/90 transition-colors"
              >
                Replay
              </motion.button>
              {hasNext && (
                <motion.button
                  onClick={onNext}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-purple-900/40"
                >
                  Next
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatItem({
  label,
  value,
  best,
}: {
  label: string;
  value: string | number;
  best: string | number | null;
}) {
  return (
    <div className="glass-card rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {best != null && (
        <p className="text-[10px] text-white/30">Best: {best}</p>
      )}
    </div>
  );
}
