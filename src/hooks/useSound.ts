// ============================================================
// useSound.ts — Procedurally-generated sound effects + music
// No audio files needed — everything is synthesised via the
// Web Audio API at runtime.
// ============================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

/** Play a short synthesised tone */
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

// ── Ambient background music ────────────────────────────────
// A gentle neon-ambient loop: low drone + arpeggiated pad notes.

const ARP_NOTES  = [220, 261, 330, 392, 440, 523, 659, 523, 440, 392]; // A minor-ish
const ARP_BPM    = 100; // beats per minute → ~600 ms per step

interface MusicNodes {
  drone: OscillatorNode;
  lfo: OscillatorNode;
  masterGain: GainNode;
  intervalId: ReturnType<typeof setInterval>;
}

function startAmbientMusic(ctx: AudioContext): MusicNodes {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2); // fade-in
  masterGain.connect(ctx.destination);

  // Low drone — A1 (55 Hz)
  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0.25, ctx.currentTime);
  droneGain.connect(masterGain);

  const drone = ctx.createOscillator();
  drone.type = "sine";
  drone.frequency.setValueAtTime(55, ctx.currentTime);
  drone.connect(droneGain);
  drone.start();

  // Very slow LFO for subtle tremolo on the drone
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(0.06, ctx.currentTime);
  lfoGain.connect(droneGain.gain);

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
  lfo.connect(lfoGain);
  lfo.start();

  // Arpeggiated pad notes
  let noteIdx = 0;
  const stepMs = Math.round((60 / ARP_BPM) * 1000);

  const intervalId = setInterval(() => {
    const freq = ARP_NOTES[noteIdx % ARP_NOTES.length];
    noteIdx++;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.05);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + stepMs / 1000 * 1.4);
    osc.connect(env);
    env.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + stepMs / 1000 * 1.5);
  }, stepMs);

  return { drone, lfo, masterGain, intervalId };
}

function stopAmbientMusic(ctx: AudioContext, nodes: MusicNodes) {
  clearInterval(nodes.intervalId);
  nodes.masterGain.gain.setValueAtTime(nodes.masterGain.gain.value, ctx.currentTime);
  nodes.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
  setTimeout(() => {
    try { nodes.drone.stop(); } catch { /* already stopped */ }
    try { nodes.lfo.stop(); }   catch { /* already stopped */ }
  }, 1600);
}

// ── Hook ────────────────────────────────────────────────────

export function useSound() {
  const ctxRef    = useRef<AudioContext | null>(null);
  const musicRef  = useRef<MusicNodes | null>(null);

  const [sfxEnabled,   setSfxEnabled]   = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);

  // Lazy AudioContext initialiser (must be triggered by user gesture)
  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = createAudioContext();
    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // Load persisted preferences
  useEffect(() => {
    try {
      const sfx   = localStorage.getItem("flowfree_sfx");
      const music = localStorage.getItem("flowfree_music");
      if (sfx   !== null) setSfxEnabled(JSON.parse(sfx));
      if (music !== null) setMusicEnabled(JSON.parse(music));
    } catch { /* ignore */ }
  }, []);

  // Sync background music with musicEnabled state
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!musicEnabled) {
      if (ctx && musicRef.current) {
        stopAmbientMusic(ctx, musicRef.current);
        musicRef.current = null;
      }
      return;
    }
    // Music is enabled — start it if not running
    if (!musicRef.current && ctx) {
      musicRef.current = startAmbientMusic(ctx);
    }
  }, [musicEnabled]);

  // Stop music on unmount
  useEffect(() => {
    return () => {
      const ctx = ctxRef.current;
      if (ctx && musicRef.current) {
        stopAmbientMusic(ctx, musicRef.current);
        musicRef.current = null;
      }
    };
  }, []);

  const toggleSfx = useCallback(() => {
    setSfxEnabled((prev) => {
      try { localStorage.setItem("flowfree_sfx", JSON.stringify(!prev)); } catch { /* ignore */ }
      return !prev;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    // Ensure AudioContext is created on first user interaction
    const ctx = ensureCtx();
    setMusicEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem("flowfree_music", JSON.stringify(next)); } catch { /* ignore */ }
      // Start immediately on enable (ctx might be freshly created)
      if (next && ctx && !musicRef.current) {
        musicRef.current = startAmbientMusic(ctx);
      } else if (!next && ctx && musicRef.current) {
        stopAmbientMusic(ctx, musicRef.current);
        musicRef.current = null;
      }
      return next;
    });
  }, [ensureCtx]);

  // ── Sound effects ──────────────────────────────────────────

  const playMove = useCallback(() => {
    if (!sfxEnabled) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    playTone(ctx, 440, 0.06, "sine", 0.1);
  }, [sfxEnabled, ensureCtx]);

  const playComplete = useCallback(() => {
    if (!sfxEnabled) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    playTone(ctx, 523, 0.12, "sine", 0.15);
    playTone(ctx, 659, 0.12, "sine", 0.12);
  }, [sfxEnabled, ensureCtx]);

  const playSolve = useCallback(() => {
    if (!sfxEnabled) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    [261, 330, 392, 523, 659].forEach((f, i) => {
      setTimeout(() => playTone(ctx, f, 0.18, "triangle", 0.18), i * 80);
    });
  }, [sfxEnabled, ensureCtx]);

  const playReset = useCallback(() => {
    if (!sfxEnabled) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    playTone(ctx, 300, 0.1, "sawtooth", 0.08);
  }, [sfxEnabled, ensureCtx]);

  const playHint = useCallback(() => {
    if (!sfxEnabled) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    // Gentle double-ping
    playTone(ctx, 880, 0.08, "sine", 0.12);
    setTimeout(() => playTone(ctx, 1100, 0.08, "sine", 0.1), 100);
  }, [sfxEnabled, ensureCtx]);

  return {
    sfxEnabled,
    musicEnabled,
    toggleSfx,
    toggleMusic,
    playMove,
    playComplete,
    playSolve,
    playReset,
    playHint,
    // Legacy alias so existing call-sites don't break
    enabled: sfxEnabled,
    toggleSound: toggleSfx,
  };
}
