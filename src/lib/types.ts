// ============================================================
// types.ts — All shared TypeScript types and interfaces
// ============================================================

/** RGB/named color identifier for a flow */
export type FlowColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "purple"
  | "pink"
  | "cyan"
  | "maroon"
  | "white";

/** A position on the grid */
export interface Position {
  row: number;
  col: number;
}

/** A single dot endpoint definition */
export interface Dot {
  color: FlowColor;
  position: Position;
}

/** A puzzle definition */
export interface Puzzle {
  id: string;
  size: number; // grid is size × size
  dots: Dot[];
  difficulty: Difficulty;
  name: string;
}

/** Difficulty levels */
export type Difficulty = "easy" | "medium" | "hard";

/** A completed or in-progress flow path */
export interface Flow {
  color: FlowColor;
  path: Position[]; // ordered list of cells in this flow
  complete: boolean; // both endpoints connected
}

/** Game state */
export interface GameState {
  puzzle: Puzzle;
  flows: Flow[];
  activeColor: FlowColor | null; // color currently being drawn
  moveCount: number;
  solved: boolean;
  startTime: number | null;
  elapsedTime: number; // seconds
  paused: boolean;
}

/** Per-difficulty best score entry in localStorage */
export interface HighScore {
  puzzleId: string;
  moves: number;
  time: number; // seconds
}

export interface GameStats {
  bestMoves: number | null;
  bestTime: number | null;
}
