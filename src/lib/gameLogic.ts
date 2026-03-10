// ============================================================
// gameLogic.ts — Pure functions for game state management
// ============================================================

import { Flow, FlowColor, GameState, Position, Puzzle } from "./types";

/** Create the initial game state for a puzzle */
export function createInitialState(puzzle: Puzzle): GameState {
  const flows: Flow[] = [];
  // Build one Flow per unique color
  const colors = [...new Set(puzzle.dots.map((d) => d.color))];
  for (const color of colors) {
    flows.push({ color, path: [], complete: false });
  }
  return {
    puzzle,
    flows,
    activeColor: null,
    moveCount: 0,
    solved: false,
    startTime: null,
    elapsedTime: 0,
    paused: false,
  };
}

/** Check if two positions are the same cell */
export function samePos(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

/** Check if two positions are adjacent (not diagonal) */
export function isAdjacent(a: Position, b: Position): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/** Get the dot color at a given position, or null */
export function getDotAt(puzzle: Puzzle, pos: Position): FlowColor | null {
  const dot = puzzle.dots.find((d) => samePos(d.position, pos));
  return dot?.color ?? null;
}

/** Get the flow that owns a cell (any cell in its path) */
export function getFlowAtCell(
  flows: Flow[],
  pos: Position
): Flow | undefined {
  return flows.find((f) => f.path.some((p) => samePos(p, pos)));
}

/** Deep-clone flows array */
function cloneFlows(flows: Flow[]): Flow[] {
  return flows.map((f) => ({ ...f, path: [...f.path] }));
}

/**
 * Start a new drag from a cell.
 * - If the cell is a dot endpoint → start fresh path from that dot
 * - If the cell is in an existing path → truncate the path to that cell
 *   and resume drawing from there
 * Returns updated state.
 */
export function startDrag(state: GameState, pos: Position): GameState {
  const { puzzle } = state;
  const dotColor = getDotAt(puzzle, pos);
  const flows = cloneFlows(state.flows);

  // ── Case 1: clicking an endpoint dot ──────────────────────
  if (dotColor) {
    // Clear any existing path for this color
    const flowIdx = flows.findIndex((f) => f.color === dotColor);
    if (flowIdx !== -1) {
      // If the path has another color occupying a cell, clear that color
      // (path erasure handled separately below for occupied cells)
      flows[flowIdx] = { color: dotColor, path: [pos], complete: false };
      // Remove this dot's cell from any OTHER flow that might have been there
      for (let i = 0; i < flows.length; i++) {
        if (i !== flowIdx) {
          flows[i].path = flows[i].path.filter((p) => !samePos(p, pos));
          flows[i].complete = false;
        }
      }
    }
    return { ...state, flows, activeColor: dotColor, solved: false };
  }

  // ── Case 2: clicking a cell already in a flow path ────────
  const existingFlow = flows.find((f) => f.path.some((p) => samePos(p, pos)));
  if (existingFlow) {
    const idx = existingFlow.path.findIndex((p) => samePos(p, pos));
    // Check if it's an endpoint dot — if so restart from there
    const isDot = puzzle.dots.some((d) => samePos(d.position, pos));
    if (isDot) {
      existingFlow.path = [pos];
    } else {
      // Truncate path up to and including this cell
      existingFlow.path = existingFlow.path.slice(0, idx + 1);
    }
    existingFlow.complete = false;
    return { ...state, flows, activeColor: existingFlow.color, solved: false };
  }

  return state;
}

/**
 * Extend the active flow to a new cell.
 * Handles backtracking, collisions, and completion detection.
 */
export function extendPath(state: GameState, pos: Position): GameState {
  const { activeColor, puzzle } = state;
  if (!activeColor) return state;

  const flows = cloneFlows(state.flows);
  const flowIdx = flows.findIndex((f) => f.color === activeColor);
  if (flowIdx === -1) return state;

  const flow = flows[flowIdx];
  const path = flow.path;
  if (path.length === 0) return state;

  const head = path[path.length - 1];

  // Must be adjacent
  if (!isAdjacent(head, pos)) return state;

  // ── Backtrack: step back to the previous cell ───────────
  if (path.length >= 2 && samePos(path[path.length - 2], pos)) {
    // Remove the head only if it's not a dot (can't remove endpoints)
    const headIsDot = puzzle.dots.some((d) => samePos(d.position, head));
    if (!headIsDot) {
      flow.path = path.slice(0, -1);
      flow.complete = false;
      return { ...state, flows, solved: false };
    }
    return state;
  }

  // ── Already in THIS path (not backtracking) ──────────────
  if (path.some((p) => samePos(p, pos))) return state;

  // ── Occupied by another flow ─────────────────────────────
  const occupantIdx = flows.findIndex(
    (f, i) => i !== flowIdx && f.path.some((p) => samePos(p, pos))
  );
  if (occupantIdx !== -1) {
    const occupant = flows[occupantIdx];
    const isEndpoint = puzzle.dots.some((d) => samePos(d.position, pos));

    // Allow overwriting IF the target is NOT a different color's endpoint
    const occupantColor = getDotAt(puzzle, pos);
    if (occupantColor && occupantColor !== activeColor) {
      // Can't overwrite another color's dot endpoint
      return state;
    }

    // Truncate occupant's path
    const occIdx = occupant.path.findIndex((p) => samePos(p, pos));
    if (occIdx === 0) {
      // Would erase the start-dot — not allowed
      return state;
    }
    occupant.path = occupant.path.slice(0, occIdx);
    occupant.complete = false;
  }

  // ── Append cell ──────────────────────────────────────────
  flow.path = [...path, pos];

  // ── Check completion ─────────────────────────────────────
  const endpoints = puzzle.dots.filter((d) => d.color === activeColor);
  if (endpoints.length === 2) {
    const newHead = flow.path[flow.path.length - 1];
    const isAtOtherEndpoint = endpoints.some(
      (e) => !samePos(e.position, flow.path[0]) && samePos(e.position, newHead)
    );
    if (isAtOtherEndpoint) {
      flow.complete = true;
    }
  }

  // ── Check global solve ───────────────────────────────────
  const allComplete = flows.every((f) => f.complete);
  const totalCells = puzzle.size * puzzle.size;
  const coveredCells = new Set<string>();
  flows.forEach((f) => f.path.forEach((p) => coveredCells.add(`${p.row},${p.col}`)));
  const allFilled = coveredCells.size === totalCells;
  const solved = allComplete && allFilled;

  return {
    ...state,
    flows,
    moveCount: state.moveCount + 1,
    solved,
  };
}

/** End the active drag */
export function endDrag(state: GameState): GameState {
  return { ...state, activeColor: null };
}

/** Reset the puzzle to initial state keeping puzzle reference */
export function resetPuzzle(state: GameState): GameState {
  return { ...createInitialState(state.puzzle), elapsedTime: 0 };
}

/** Get percentage of cells covered */
export function getCoverage(state: GameState): number {
  const total = state.puzzle.size * state.puzzle.size;
  const covered = new Set<string>();
  state.flows.forEach((f) =>
    f.path.forEach((p) => covered.add(`${p.row},${p.col}`))
  );
  return Math.round((covered.size / total) * 100);
}

/**
 * Apply one hint step from a pre-computed solution.
 * Finds the first incomplete flow, checks whether the user's current path
 * is a prefix of the solution path, then extends by one cell.
 * If the paths diverge the color is reset to its start before the first step.
 */
export function applyHint(
  state: GameState,
  solution: import("./solver").Solution
): GameState {
  if (state.solved || state.paused) return state;

  // First incomplete flow
  const incompleteFlow = state.flows.find((f) => !f.complete);
  if (!incompleteFlow) return state;

  const { color } = incompleteFlow;
  const solutionPath = solution[color];
  if (!solutionPath || solutionPath.length < 2) return state;

  const currentPath = incompleteFlow.path;

  // Check whether currentPath is a valid prefix of the solution path
  let matchLen = 0;
  for (let i = 0; i < currentPath.length; i++) {
    if (i < solutionPath.length && samePos(currentPath[i], solutionPath[i])) {
      matchLen = i + 1;
    } else {
      break;
    }
  }

  if (matchLen === currentPath.length && matchLen < solutionPath.length) {
    // Path matches so far — extend by one step
    const nextPos = solutionPath[matchLen];
    const withActive = { ...state, activeColor: color };
    return endDrag(extendPath(withActive, nextPos));
  }

  // Paths diverged — reset this color to its start dot and apply first step
  const startDot = state.puzzle.dots.find((d) => d.color === color)!;
  let newState = startDrag(state, startDot.position);
  newState = extendPath(newState, solutionPath[1]);
  return endDrag(newState);
}
