// ============================================================
// HUD.tsx — In-game heads-up display
// Shows moves, time, coverage, and game-control buttons.
// ============================================================

"use client";

import { motion } from "framer-motion";

interface Props {
  moves: number;
  elapsedTime: number;
  coverage: number;
  bestMoves: number | null;
  bestTime: number | null;
  paused: boolean;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  hintAvailable: boolean;
  onReset: () => void;
  onTogglePause: () => void;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onHint: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function HUD({
  moves,
  elapsedTime,
  coverage,
  bestMoves,
  bestTime,
  paused,
  sfxEnabled,
  musicEnabled,
  hintAvailable,
  onReset,
  onTogglePause,
  onToggleSfx,
  onToggleMusic,
  onHint,
}: Props) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="Moves"
          value={moves}
          sub={bestMoves ? `Best: ${bestMoves}` : undefined}
        />
        <StatCard
          label="Time"
          value={formatTime(elapsedTime)}
          sub={bestTime ? `Best: ${formatTime(bestTime)}` : undefined}
        />
        <StatCard
          label="Filled"
          value={`${coverage}%`}
          highlight={coverage === 100}
        />
      </div>

      {/* Controls row */}
      <div className="flex gap-2 justify-center flex-wrap">
        {/* Pause / Resume */}
        <HudButton onClick={onTogglePause} title={paused ? "Resume" : "Pause"}>
          {paused ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
            </svg>
          )}
          <span className="text-xs font-semibold">{paused ? "Resume" : "Pause"}</span>
        </HudButton>

        {/* Reset */}
        <HudButton onClick={onReset} title="Reset puzzle">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs font-semibold">Reset</span>
        </HudButton>

        {/* Hint */}
        <HudButton
          onClick={onHint}
          title={hintAvailable ? "Show hint" : "Computing hint…"}
          disabled={!hintAvailable}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-semibold">Hint</span>
        </HudButton>

        {/* Sound FX */}
        <HudButton onClick={onToggleSfx} title="Toggle sound effects">
          {sfxEnabled ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-xs font-semibold">{sfxEnabled ? "SFX" : "SFX Off"}</span>
        </HudButton>

        {/* Music */}
        <HudButton onClick={onToggleMusic} title="Toggle background music">
          {musicEnabled ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-xs font-semibold">{musicEnabled ? "Music" : "Music Off"}</span>
        </HudButton>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      className="glass-card flex flex-col items-center py-2 px-1 rounded-xl"
      animate={highlight ? { scale: [1, 1.06, 1] } : {}}
      transition={{ duration: 0.4 }}
    >
      <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-0.5">
        {label}
      </span>
      <span className={`text-lg font-bold tabular-nums ${highlight ? "text-green-400" : "text-white"}`}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-white/30 mt-0.5">{sub}</span>}
    </motion.div>
  );
}

function HudButton({
  children,
  onClick,
  title,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.93 }}
      whileHover={disabled ? {} : { scale: 1.04 }}
      className={`glass-card flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors
        ${disabled
          ? "text-white/20 cursor-not-allowed"
          : "text-white/80 hover:text-white cursor-pointer"}`}
    >
      {children}
    </motion.button>
  );
}
