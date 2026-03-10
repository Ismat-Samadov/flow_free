// ============================================================
// useGame.ts — Central game state hook
// ============================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyHint,
  createInitialState,
  endDrag,
  extendPath,
  getCoverage,
  resetPuzzle,
  startDrag,
} from "@/lib/gameLogic";
import { solvePuzzle, Solution } from "@/lib/solver";
import { GameState, Position, Puzzle } from "@/lib/types";
import { LS_KEY } from "@/lib/constants";

export function useGame(puzzle: Puzzle) {
  const [state, setState] = useState<GameState>(() =>
    createInitialState(puzzle)
  );
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const solutionRef = useRef<Solution | null>(null);
  const [hintAvailable, setHintAvailable] = useState(false);

  // ── Timer ─────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.paused || prev.solved) return prev;
        return { ...prev, elapsedTime: prev.elapsedTime + 1 };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Load new puzzle ───────────────────────────────────────
  useEffect(() => {
    stopTimer();
    setState(createInitialState(puzzle));
    solutionRef.current = null;
    setHintAvailable(false);

    // Solve asynchronously to avoid blocking the main thread
    const timerId = setTimeout(() => {
      const sol = solvePuzzle(puzzle);
      solutionRef.current = sol;
      setHintAvailable(sol !== null);
    }, 50);

    return () => clearTimeout(timerId);
  }, [puzzle, stopTimer]);

  // ── Auto-start timer on first move ───────────────────────
  const handleFirstMove = useCallback(() => {
    setState((prev) => {
      if (prev.startTime === null) {
        startTimer();
        return { ...prev, startTime: Date.now() };
      }
      return prev;
    });
  }, [startTimer]);

  // ── Stop timer + save high score when solved ──────────────
  useEffect(() => {
    if (state.solved) {
      stopTimer();
      try {
        const key  = `${LS_KEY}_${puzzle.id}`;
        const prev = (() => { try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; } })();
        const entry = { moves: state.moveCount, time: state.elapsedTime };
        if (!prev || entry.moves < prev.moves || (entry.moves === prev.moves && entry.time < prev.time)) {
          localStorage.setItem(key, JSON.stringify(entry));
        }
      } catch { /* ignore */ }
    }
  }, [state.solved, state.moveCount, state.elapsedTime, puzzle.id, stopTimer]);

  // ── Cleanup ───────────────────────────────────────────────
  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Public API ────────────────────────────────────────────
  const onCellDown = useCallback(
    (pos: Position) => {
      if (state.solved || state.paused) return;
      handleFirstMove();
      setState((prev) => startDrag(prev, pos));
    },
    [state.solved, state.paused, handleFirstMove]
  );

  const onCellEnter = useCallback(
    (pos: Position) => {
      if (state.solved || state.paused) return;
      setState((prev) => extendPath(prev, pos));
    },
    [state.solved, state.paused]
  );

  const onPointerUp = useCallback(() => {
    setState((prev) => endDrag(prev));
  }, []);

  const onReset = useCallback(() => {
    stopTimer();
    setState(resetPuzzle(state));
  }, [state, stopTimer]);

  const onTogglePause = useCallback(() => {
    setState((prev) => {
      const paused = !prev.paused;
      if (paused) {
        stopTimer();
      } else if (prev.startTime !== null && !prev.solved) {
        startTimer();
      }
      return { ...prev, paused };
    });
  }, [startTimer, stopTimer]);

  /** Apply one step from the pre-computed solution */
  const onHint = useCallback(() => {
    if (!solutionRef.current || state.solved || state.paused) return;
    handleFirstMove();
    setState((prev) => applyHint(prev, solutionRef.current!));
  }, [state.solved, state.paused, handleFirstMove]);

  const getBestScore = useCallback((): { moves: number; time: number } | null => {
    try {
      const raw = localStorage.getItem(`${LS_KEY}_${puzzle.id}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, [puzzle.id]);

  const coverage = getCoverage(state);

  return {
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
  };
}
