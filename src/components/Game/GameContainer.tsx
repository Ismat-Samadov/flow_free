// ============================================================
// GameContainer.tsx — Top-level game orchestrator component
// Wires together: puzzle selection, game logic, sounds,
// hint system, keyboard navigation, and all UI panels.
// ============================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import GameBoard from "./GameBoard";
import Header    from "@/components/UI/Header";
import HUD       from "@/components/UI/HUD";
import WinModal  from "@/components/UI/WinModal";
import LevelSelect from "@/components/UI/LevelSelect";

import { useGame }  from "@/hooks/useGame";
import { useSound } from "@/hooks/useSound";

import { PUZZLES }  from "@/lib/puzzles";
import { Puzzle }   from "@/lib/types";

export default function GameContainer() {
  // ── Puzzle selection ──────────────────────────────────────
  const [puzzle,     setPuzzle]     = useState<Puzzle>(PUZZLES.easy[0]);
  const [showLevels, setShowLevels] = useState(false);
  const [showWin,    setShowWin]    = useState(false);

  // ── Game logic ────────────────────────────────────────────
  const {
    state,
    coverage,
    hintAvailable,
    onCellDown,
    onCellEnter,
    onPointerUp,
    onReset,
    onTogglePause,
    onHint,
    getBestScore,
  } = useGame(puzzle);

  // ── Sound ─────────────────────────────────────────────────
  const {
    sfxEnabled,
    musicEnabled,
    toggleSfx,
    toggleMusic,
    playMove,
    playComplete,
    playSolve,
    playReset,
    playHint,
  } = useSound();

  // ── Show win modal ────────────────────────────────────────
  useEffect(() => {
    if (state.solved) {
      playSolve();
      const t = setTimeout(() => setShowWin(true), 400);
      return () => clearTimeout(t);
    } else {
      setShowWin(false);
    }
  }, [state.solved, playSolve]);

  // ── Flat puzzle list for prev/next navigation ─────────────
  const allPuzzles  = [...PUZZLES.easy, ...PUZZLES.medium, ...PUZZLES.hard];
  const currentIdx  = allPuzzles.findIndex((p) => p.id === puzzle.id);
  const hasNext     = currentIdx < allPuzzles.length - 1;
  const hasPrev     = currentIdx > 0;

  const handleNext = useCallback(() => {
    if (hasNext) { setPuzzle(allPuzzles[currentIdx + 1]); setShowWin(false); }
  }, [allPuzzles, currentIdx, hasNext]);

  const handlePrev = useCallback(() => {
    if (hasPrev) { setPuzzle(allPuzzles[currentIdx - 1]); setShowWin(false); }
  }, [allPuzzles, currentIdx, hasPrev]);

  const handleSelect = useCallback((p: Puzzle) => {
    setPuzzle(p);
    setShowWin(false);
    setShowLevels(false);
  }, []);

  const handleReset = useCallback(() => {
    onReset();
    playReset();
    setShowWin(false);
  }, [onReset, playReset]);

  const handleHint = useCallback(() => {
    onHint();
    playHint();
  }, [onHint, playHint]);

  // ── Keyboard controls ─────────────────────────────────────
  // R = reset, P = pause, H = hint, ← / → = prev/next puzzle,
  // Escape = close levels / win modal
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignore if typing in an input
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      switch (e.key) {
        case "r": case "R": handleReset(); break;
        case "p": case "P": onTogglePause(); break;
        case "h": case "H": handleHint(); break;
        case "ArrowRight": handleNext(); break;
        case "ArrowLeft":  handlePrev(); break;
        case "Escape":
          setShowLevels(false);
          setShowWin(false);
          break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleReset, onTogglePause, handleHint, handleNext, handlePrev]);

  const best = getBestScore();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-neutral-950 p-4 pb-8">
      {/* Animated background glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/20 blur-[120px]" />
        <div className="absolute top-[30%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-pink-900/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-lg flex flex-col gap-4">
        {/* Header */}
        <Header
          puzzle={puzzle}
          showLevels={showLevels}
          onToggleLevels={() => setShowLevels((v) => !v)}
        />

        {/* Keyboard shortcut hints (desktop only) */}
        <div className="hidden sm:flex gap-3 justify-end text-[10px] text-white/20 tracking-widest uppercase select-none">
          <span>[R] Reset</span>
          <span>[P] Pause</span>
          <span>[H] Hint</span>
          <span>[←/→] Levels</span>
        </div>

        {/* Level selector (collapsible) */}
        <AnimatePresence>
          {showLevels && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="glass-card rounded-2xl p-4">
                <LevelSelect currentPuzzle={puzzle} onSelect={handleSelect} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game board */}
        <GameBoard
          gameState={state}
          onCellDown={onCellDown}
          onCellEnter={onCellEnter}
          onPointerUp={onPointerUp}
          soundOnMove={playMove}
          soundOnComplete={playComplete}
        />

        {/* HUD */}
        <HUD
          moves={state.moveCount}
          elapsedTime={state.elapsedTime}
          coverage={coverage}
          bestMoves={best?.moves ?? null}
          bestTime={best?.time ?? null}
          paused={state.paused}
          sfxEnabled={sfxEnabled}
          musicEnabled={musicEnabled}
          hintAvailable={hintAvailable}
          onReset={handleReset}
          onTogglePause={onTogglePause}
          onToggleSfx={toggleSfx}
          onToggleMusic={toggleMusic}
          onHint={handleHint}
        />
      </div>

      {/* Win modal */}
      <WinModal
        show={showWin}
        puzzle={puzzle}
        moves={state.moveCount}
        time={state.elapsedTime}
        bestMoves={best?.moves ?? null}
        bestTime={best?.time ?? null}
        onReplay={() => { handleReset(); setShowWin(false); }}
        onNext={handleNext}
        hasNext={hasNext}
      />
    </div>
  );
}
