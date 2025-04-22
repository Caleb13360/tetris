export { Constants };
export type { State, Unit, Key, Event, Block, MoveFunction, XY, Action };

/** Constants */

const Constants = {
  TICK_RATE_MS: 100,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD" | "KeyQ" | "KeyE" | "KeyR";

type Event = "keypress";

//** Individual Blocks */
type Unit = Readonly<{
  id: string;
  x: number;
  y: number;
  colour: string;
}>;

//** Tetromino, a collection of units and its middle to rotate around */
type Block = Readonly<{
  units: ReadonlyArray<Unit>;
  x: number;
  y: number;
}>;

/**
 * Actions modify state
 */
interface Action {
  apply(s: State): State;
}

/** allows move functions to be used in HOF */
type MoveFunction = (block: Block) => Block;

//** Our game state */
type State = Readonly<{
  level: number;
  score: number;
  highscore: number;
  nextBlock: Block;
  currentBlock: Block;
  gameGrid: ReadonlyArray<Unit>;
  gameEnd: boolean;
  tickSpeed: number;
  pastState: State | null;
}>;

//** used for x and y coordinates */
type XY = { x: number; y: number };
