// ============================================================
// GameContainer.tsx — Top-level game orchestrator component
// ============================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import GameBoard from "./GameBoard";
import Header from "@/components/UI/Header";
import HUD from "@/components/UI/HUD";
import WinModal from "@/components/UI/WinModal";
import LevelSelect from "@/components/UI/LevelSelect";

import { useGame } from "@/hooks/useGame";
import { useSound } from "@/hooks/useSound";

import { PUZZLES } from "@/lib/puzzles";
import { Puzzle } from "@/lib/types";

export default function GameContainer() {
  // ── Puzzle selection ──────────────────────────────────────
  const [puzzle, setPuzzle] = useState<Puzzle>(PUZZLES.easy[0]);
  const [showLevels, setShowLevels] = useState(false);
  const [showWin, setShowWin] = useState(false);

  // ── Game logic ────────────────────────────────────────────
  const {
    state,
    coverage,
    onCellDown,
    onCellEnter,
    onPointerUp,
    onReset,
    onTogglePause,
    getBestScore,
  } = useGame(puzzle);

  // ── Sound ─────────────────────────────────────────────────
  const { enabled: soundEnabled, toggleSound, playMove, playComplete, playSolve, playReset } = useSound();

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

  // ── Puzzle navigation helpers ─────────────────────────────
  const allPuzzles = [
    ...PUZZLES.easy,
    ...PUZZLES.medium,
    ...PUZZLES.hard,
  ];

  const currentIndex = allPuzzles.findIndex((p) => p.id === puzzle.id);
  const hasNext = currentIndex < allPuzzles.length - 1;

  const handleNext = useCallback(() => {
    if (hasNext) {
      setPuzzle(allPuzzles[currentIndex + 1]);
      setShowWin(false);
    }
  }, [allPuzzles, currentIndex, hasNext]);

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
          soundEnabled={soundEnabled}
          onReset={handleReset}
          onTogglePause={onTogglePause}
          onToggleSound={toggleSound}
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
        onReplay={() => {
          handleReset();
          setShowWin(false);
        }}
        onNext={handleNext}
        hasNext={hasNext}
      />
    </div>
  );
}
