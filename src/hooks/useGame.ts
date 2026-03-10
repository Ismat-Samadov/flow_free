// ============================================================
// useGame.ts — Central game state hook
// ============================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createInitialState,
  endDrag,
  extendPath,
  getCoverage,
  resetPuzzle,
  startDrag,
} from "@/lib/gameLogic";
import { GameState, Position, Puzzle } from "@/lib/types";
import { LS_KEY } from "@/lib/constants";

export function useGame(puzzle: Puzzle) {
  const [state, setState] = useState<GameState>(() =>
    createInitialState(puzzle)
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start/stop timer ──────────────────────────────────────
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

  // ── Stop timer when solved ────────────────────────────────
  useEffect(() => {
    if (state.solved) {
      stopTimer();
      // Persist high score
      try {
        const key = `${LS_KEY}_${puzzle.id}`;
        const existing = localStorage.getItem(key);
        const prev = existing ? JSON.parse(existing) : null;
        const entry = {
          moves: state.moveCount,
          time: state.elapsedTime,
        };
        if (
          !prev ||
          entry.moves < prev.moves ||
          (entry.moves === prev.moves && entry.time < prev.time)
        ) {
          localStorage.setItem(key, JSON.stringify(entry));
        }
      } catch (_) {
        // ignore localStorage errors in SSR/private mode
      }
    }
  }, [state.solved, state.moveCount, state.elapsedTime, puzzle.id, stopTimer]);

  // ── Cleanup on unmount ────────────────────────────────────
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

  const getBestScore = useCallback((): {
    moves: number;
    time: number;
  } | null => {
    try {
      const key = `${LS_KEY}_${puzzle.id}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }, [puzzle.id]);

  const coverage = getCoverage(state);

  return {
    state,
    coverage,
    onCellDown,
    onCellEnter,
    onPointerUp,
    onReset,
    onTogglePause,
    getBestScore,
  };
}
