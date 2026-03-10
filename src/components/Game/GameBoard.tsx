// ============================================================
// GameBoard.tsx — Canvas-based grid renderer
// Uses HTML5 Canvas for performance; overlays React for UI.
// ============================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { COLOR_MAP, DOT_RADIUS_RATIO, PATH_WIDTH_RATIO } from "@/lib/constants";
import { samePos } from "@/lib/gameLogic";
import { FlowColor, GameState, Position } from "@/lib/types";

interface Props {
  gameState: GameState;
  onCellDown: (pos: Position) => void;
  onCellEnter: (pos: Position) => void;
  onPointerUp: () => void;
  soundOnMove?: () => void;
  soundOnComplete?: () => void;
}

/** Convert canvas pixel coordinate to grid position */
function pixelToCell(
  x: number,
  y: number,
  cellSize: number,
  size: number
): Position | null {
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  if (row >= 0 && row < size && col >= 0 && col < size) return { row, col };
  return null;
}

/** Draw a rounded rectangle */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw the entire board on canvas */
function drawBoard(
  canvas: HTMLCanvasElement,
  gameState: GameState,
  cellSize: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { puzzle, flows, activeColor } = gameState;
  const { size } = puzzle;

  // ── Clear ─────────────────────────────────────────────────
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ── Grid cells ────────────────────────────────────────────
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = c * cellSize;
      const y = r * cellSize;
      const pad = 2;
      roundRect(ctx, x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, 6);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // ── Flow paths ────────────────────────────────────────────
  const pathWidth = cellSize * PATH_WIDTH_RATIO;

  for (const flow of flows) {
    if (flow.path.length < 1) continue;
    const colorInfo = COLOR_MAP[flow.color];

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = pathWidth;

    // Glow effect
    ctx.shadowColor = colorInfo.glow;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = colorInfo.hex;

    ctx.beginPath();
    const start = flow.path[0];
    ctx.moveTo(
      start.col * cellSize + cellSize / 2,
      start.row * cellSize + cellSize / 2
    );
    for (let i = 1; i < flow.path.length; i++) {
      const p = flow.path[i];
      ctx.lineTo(
        p.col * cellSize + cellSize / 2,
        p.row * cellSize + cellSize / 2
      );
    }
    ctx.stroke();

    // Bright inner line for neon look
    ctx.shadowBlur = 0;
    ctx.lineWidth = pathWidth * 0.45;
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.stroke();
  }

  // ── Dot endpoints ─────────────────────────────────────────
  ctx.shadowBlur = 0;
  for (const dot of puzzle.dots) {
    const colorInfo = COLOR_MAP[dot.color];
    const cx = dot.position.col * cellSize + cellSize / 2;
    const cy = dot.position.row * cellSize + cellSize / 2;
    const r = cellSize * DOT_RADIUS_RATIO;

    // Glow ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = colorInfo.glow;
    ctx.shadowColor = colorInfo.glow;
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Solid dot
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = colorInfo.hex;
    ctx.fill();

    // White highlight
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fill();
  }
}

export default function GameBoard({
  gameState,
  onCellDown,
  onCellEnter,
  onPointerUp,
  soundOnMove,
  soundOnComplete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastCell = useRef<Position | null>(null);
  const lastCompleted = useRef<Set<FlowColor>>(new Set());
  const cellSizeRef = useRef(0);

  const { puzzle, flows, solved } = gameState;

  // ── Detect newly completed flows for sound ────────────────
  useEffect(() => {
    for (const f of flows) {
      if (f.complete && !lastCompleted.current.has(f.color)) {
        lastCompleted.current.add(f.color);
        soundOnComplete?.();
      } else if (!f.complete && lastCompleted.current.has(f.color)) {
        lastCompleted.current.delete(f.color);
      }
    }
  }, [flows, soundOnComplete]);

  // ── Resize & redraw ───────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const observer = new ResizeObserver(() => {
      const size = Math.min(container.clientWidth, container.clientHeight);
      canvas.width = size;
      canvas.height = size;
      cellSizeRef.current = size / puzzle.size;
      drawBoard(canvas, gameState, cellSizeRef.current);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [gameState, puzzle.size]);

  // ── Redraw on state change ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cellSizeRef.current === 0) return;
    drawBoard(canvas, gameState, cellSizeRef.current);
  }, [gameState]);

  // ── Pointer events ────────────────────────────────────────
  const getCell = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return pixelToCell(
      e.clientX - rect.left,
      e.clientY - rect.top,
      cellSizeRef.current,
      puzzle.size
    );
  }, [puzzle.size]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const cell = getCell(e);
      if (!cell) return;
      isDragging.current = true;
      lastCell.current = cell;
      onCellDown(cell);
      soundOnMove?.();
    },
    [getCell, onCellDown, soundOnMove]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging.current) return;
      const cell = getCell(e);
      if (!cell) return;
      if (
        lastCell.current &&
        (lastCell.current.row !== cell.row || lastCell.current.col !== cell.col)
      ) {
        lastCell.current = cell;
        onCellEnter(cell);
        soundOnMove?.();
      }
    },
    [getCell, onCellEnter, soundOnMove]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    lastCell.current = null;
    onPointerUp();
  }, [onPointerUp]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square max-w-[min(90vw,90vh,520px)] mx-auto select-none"
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-2xl cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: "none" }}
      />

      {/* Solved overlay */}
      {solved && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-black/30 backdrop-blur-sm" />
        </div>
      )}

      {/* Pause overlay */}
      {gameState.paused && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-md">
          <p className="text-4xl font-bold text-white tracking-widest">
            PAUSED
          </p>
        </div>
      )}
    </div>
  );
}
