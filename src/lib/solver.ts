// ============================================================
// solver.ts — Backtracking Flow Free solver
// Uses Most-Constrained Variable (MCV) heuristic + manhattan
// distance ordering to find a valid solution efficiently.
// ============================================================

import { FlowColor, Position, Puzzle } from "./types";
import { samePos } from "./gameLogic";

type Grid = (FlowColor | null)[][];

/** A solved mapping: color → ordered path (both endpoints included) */
export type Solution = Partial<Record<FlowColor, Position[]>>;

/** Return the 4 orthogonal neighbours of pos that are within bounds */
function getNeighbors(pos: Position, size: number): Position[] {
  const result: Position[] = [];
  if (pos.row > 0)        result.push({ row: pos.row - 1, col: pos.col });
  if (pos.row < size - 1) result.push({ row: pos.row + 1, col: pos.col });
  if (pos.col > 0)        result.push({ row: pos.row,     col: pos.col - 1 });
  if (pos.col < size - 1) result.push({ row: pos.row,     col: pos.col + 1 });
  return result;
}

/**
 * Attempt to solve the puzzle with a depth-first backtracking search.
 *
 * Strategy:
 *  1. Build a mutable grid with all dot-endpoints pre-filled.
 *  2. At every step pick the *most-constrained* incomplete flow
 *     (the one whose head has fewest valid extension cells).
 *  3. Sort candidate moves by manhattan distance to the target (greedy).
 *  4. Recurse; backtrack on failure.
 *  5. Accept a solution only when every cell is covered.
 *
 * Returns null if no solution is found within the time limit.
 */
export function solvePuzzle(puzzle: Puzzle): Solution | null {
  const { size, dots } = puzzle;
  const colors = [...new Set(dots.map((d) => d.color))] as FlowColor[];

  // Map color → [startPos, endPos]
  const starts: Record<string, Position> = {};
  const ends:   Record<string, Position> = {};

  // Grid: null = empty, FlowColor = occupied
  const grid: Grid = Array.from({ length: size }, () =>
    Array<FlowColor | null>(size).fill(null)
  );

  for (const color of colors) {
    const cd = dots.filter((d) => d.color === color);
    starts[color] = cd[0].position;
    ends[color]   = cd[1].position;
    // Pre-fill both endpoints
    grid[cd[0].position.row][cd[0].position.col] = color;
    grid[cd[1].position.row][cd[1].position.col] = color;
  }

  // Paths being built (mutable during search)
  const paths: Record<string, Position[]> = {};
  for (const color of colors) {
    paths[color] = [starts[color]];
  }

  const completed = new Set<string>();
  const deadline  = Date.now() + 4000; // 4 s max

  /** Count valid extension moves for an incomplete color's head */
  function countMoves(color: string): number {
    const head   = paths[color][paths[color].length - 1];
    const target = ends[color];
    return getNeighbors(head, size).filter((n) => {
      const cell = grid[n.row][n.col];
      return cell === null || samePos(n, target);
    }).length;
  }

  function backtrack(): boolean {
    if (Date.now() > deadline) return false;

    const incomplete = colors.filter((c) => !completed.has(c));

    // All flows complete → check full coverage
    if (incomplete.length === 0) {
      return grid.flat().every((c) => c !== null);
    }

    // If any incomplete flow's head is already at its target, mark it done
    for (const color of incomplete) {
      const head = paths[color][paths[color].length - 1];
      if (samePos(head, ends[color])) {
        completed.add(color);
        const ok = backtrack();
        completed.delete(color);
        return ok;
      }
    }

    // MCV: pick the color with fewest valid moves
    let bestColor = incomplete[0];
    let bestCount = countMoves(incomplete[0]);

    for (let i = 1; i < incomplete.length; i++) {
      const cnt = countMoves(incomplete[i]);
      if (cnt < bestCount) {
        bestCount = cnt;
        bestColor = incomplete[i];
      }
    }

    // Dead end: no moves for a non-complete flow
    if (bestCount === 0) return false;

    const color  = bestColor;
    const path   = paths[color];
    const head   = path[path.length - 1];
    const target = ends[color];

    // Valid moves, sorted by distance to target (greedy ordering)
    const moves = getNeighbors(head, size).filter((n) => {
      const cell = grid[n.row][n.col];
      return cell === null || samePos(n, target);
    });

    moves.sort((a, b) => {
      const da = Math.abs(a.row - target.row) + Math.abs(a.col - target.col);
      const db = Math.abs(b.row - target.row) + Math.abs(b.col - target.col);
      return da - db;
    });

    for (const next of moves) {
      const isTarget = samePos(next, target);
      const wasNull  = grid[next.row][next.col] === null;

      if (wasNull) grid[next.row][next.col] = color as FlowColor;
      path.push(next);
      if (isTarget) completed.add(color);

      if (backtrack()) return true;

      // Undo
      path.pop();
      if (wasNull) grid[next.row][next.col] = null;
      if (isTarget) completed.delete(color);
    }

    return false;
  }

  if (!backtrack()) return null;

  const solution: Solution = {};
  for (const color of colors) {
    solution[color] = [...paths[color]];
  }
  return solution;
}
