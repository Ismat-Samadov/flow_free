// ============================================================
// constants.ts — Visual / game constants
// ============================================================

import { FlowColor } from "./types";

/** Neon color palette — tailwind bg class + hex for canvas rendering */
export const COLOR_MAP: Record<
  FlowColor,
  { tailwind: string; hex: string; glow: string }
> = {
  red:    { tailwind: "bg-red-500",    hex: "#ef4444", glow: "#ff000088" },
  blue:   { tailwind: "bg-blue-500",   hex: "#3b82f6", glow: "#0088ff88" },
  green:  { tailwind: "bg-green-400",  hex: "#4ade80", glow: "#00ff6688" },
  yellow: { tailwind: "bg-yellow-400", hex: "#facc15", glow: "#ffff0088" },
  orange: { tailwind: "bg-orange-500", hex: "#f97316", glow: "#ff880088" },
  purple: { tailwind: "bg-purple-500", hex: "#a855f7", glow: "#aa00ff88" },
  pink:   { tailwind: "bg-pink-500",   hex: "#ec4899", glow: "#ff00aa88" },
  cyan:   { tailwind: "bg-cyan-400",   hex: "#22d3ee", glow: "#00ffff88" },
  maroon: { tailwind: "bg-rose-800",   hex: "#9f1239", glow: "#cc003388" },
  white:  { tailwind: "bg-gray-100",   hex: "#f1f5f9", glow: "#ffffff88" },
};

/** Fraction of cell size used for path thickness */
export const PATH_WIDTH_RATIO = 0.35;

/** Fraction of cell size used for dot radius */
export const DOT_RADIUS_RATIO = 0.38;

/** Local-storage key prefix */
export const LS_KEY = "flowfree_scores";
