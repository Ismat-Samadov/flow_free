// ============================================================
// useSound.ts — Procedurally-generated sound effects (no files)
// ============================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Tiny Web Audio helper to create sounds programmatically */
function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  } catch {
    return null;
  }
}

/** Play a short beep at a given frequency */
function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.15
) {
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  vol.gain.setValueAtTime(gain, ctx.currentTime);
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(true);

  // Initialise AudioContext lazily on first interaction
  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext();
    }
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Load persisted preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("flowfree_sound");
      if (stored !== null) setEnabled(JSON.parse(stored));
    } catch (_) {}
  }, []);

  const toggleSound = useCallback(() => {
    setEnabled((prev) => {
      try {
        localStorage.setItem("flowfree_sound", JSON.stringify(!prev));
      } catch (_) {}
      return !prev;
    });
  }, []);

  const playMove = useCallback(() => {
    if (!enabled) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    playTone(ctx, 440, 0.06, "sine", 0.1);
  }, [enabled, ensureCtx]);

  const playComplete = useCallback(() => {
    if (!enabled) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    // Ascending two-note chord
    playTone(ctx, 523, 0.12, "sine", 0.15);
    playTone(ctx, 659, 0.12, "sine", 0.12);
  }, [enabled, ensureCtx]);

  const playSolve = useCallback(() => {
    if (!enabled) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    // Fanfare arpeggio
    const notes = [261, 330, 392, 523, 659];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(ctx, f, 0.18, "triangle", 0.18), i * 80);
    });
  }, [enabled, ensureCtx]);

  const playReset = useCallback(() => {
    if (!enabled) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    playTone(ctx, 300, 0.1, "sawtooth", 0.08);
  }, [enabled, ensureCtx]);

  return { enabled, toggleSound, playMove, playComplete, playSolve, playReset };
}
