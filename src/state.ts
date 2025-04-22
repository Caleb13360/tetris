export {
  Move,
  Drop,
  RotateLeft,
  RotateRight,
  initialState,
  Tick,
  Restart,
  reduceState,
  highestBlock,
};
import {
  State,
  Block,
  Unit,
  MoveFunction,
  Constants,
  Action,
  XY,
} from "./types";
import { calculateSpeed, randomSeed, RNG } from "./utility";
/**
 * generates a function that can move a block
 * @param changeUnits a function that maps the new x,y cordinates of each unit
 * @param changeCenter a function that maps the new center of the block
 * @returns a function that will apply the sub functions to a block
 */
function createMoveFunction(
  changeUnits: (
    x: number,
    y: number,
    cx: number,
    cy: number
  ) => { x: number; y: number },
  changeCenter: (cx: number, cy: number) => { x: number; y: number }
): MoveFunction {
  return (block: Block) =>
    ({
      units: block.units.map(
        (e: Unit) =>
          ({ ...e, ...changeUnits(e.x, e.y, block.x, block.y) } as Unit)
      ),
      ...changeCenter(block.x, block.y),
    } as Block);
}
/**
 * creates a move function that moves block in x axis
 * @param amount amount to move in x axis (can be negative)
 * @returns the block moved in x axis by given amount
 */
const moveX: (amount: number) => MoveFunction = (amount) =>
  createMoveFunction(
    (x, y, cx, cy) => ({ x: x + amount, y: y }),
    (cx, cy) => ({ x: cx + amount, y: cy })
  );
/**
 * creates a move function that moves block in y axis
 * @param amount amount to move in y axis (can be negative)
 * @returns the block moved in y axis by given amount
 */
const moveY: (amount: number) => MoveFunction = (amount) =>
  createMoveFunction(
    (x, y, cx, cy) => ({ x: x, y: y + amount }),
    (cx, cy) => ({ x: cx, y: cy + amount })
  );
/**
 * returns to function to move a block down 1 unit
 */
const moveDown: MoveFunction = moveY(1);
/**
 * returns the function to rotate a block to the right
 */
const rotateRight: MoveFunction = createMoveFunction(
  (x, y, cx, cy) => ({ x: -(y - cy) + cx, y: x - cx + cy }),
  (cx, cy) => ({ x: cx, y: cy })
);
/**
 * returns the function to rotate a block to the left
 */
const rotateLeft: MoveFunction = createMoveFunction(
  (x, y, cx, cy) => ({ x: y - cy + cx, y: -(x - cx) + cy }),
  (cx, cy) => ({ x: cx, y: cy })
);
/**
 * curried unit function to seperate colour from id and coordinates
 * @param colour colour of the block
 * @returns a unit with the given parameters
 */
function createUnit(colour: string) {
  return (id: string, x: number, y: number) => {
    return {
      id: id,
      x: x + Math.floor(Constants.GRID_WIDTH / 2) - 1,
      y: y,
      colour: colour,
    };
  };
}

/**
 * used to condense x,y coordinates into a single object
 * @param x x axis coordinate
 * @param y y axis coordinate
 * @returns XY object with the given coordinates
 */
const xy = (x: number, y: number): XY => ({ x, y });

/**
 * returns the function that will create a given block
 * @param colour colour of the block
 * @param xy coordinates of each unit within the block
 * @param x x axis center of the block
 * @param y y axis center of the block
 * @returns the block which includes an array of units and the center
 */
function blockCreator(
  colour: string,
  xy: ReadonlyArray<XY>,
  x: number,
  y: number
): (id: number) => Block {
  const colouredUnit = createUnit(colour);
  return (id: number) => {
    //uses the index of the current unit to append a letter to the id to ensure
    //that every unit has a unique id
    const units = xy.map((e, index) =>
      colouredUnit(id + String.fromCharCode(97 + index), e.x, e.y)
    );
    return {
      units,
      x: x + Math.floor(Constants.GRID_WIDTH / 2) - 1,
      y,
    };
  };
}
/**
 * array of block creators which when used with an index will return the
 * function the will create that type of block
 */
const blockCreators: Array<(id: number) => Block> = [
  blockCreator("#ffff00", [xy(0, 0), xy(0, 1), xy(1, 0), xy(1, 1)], 0.5, 0.5),
  blockCreator("#00ffff", [xy(-1, 0), xy(0, 0), xy(1, 0), xy(2, 0)], 0.5, 0.5),
  blockCreator("#0000ff", [xy(-1, 0), xy(0, 0), xy(1, 0), xy(1, 1)], 0, 0),
  blockCreator("#ffaa00", [xy(-1, 0), xy(0, 0), xy(1, 0), xy(-1, 1)], 0, 0),
  blockCreator("#00ff00", [xy(0, 1), xy(0, 0), xy(1, 0), xy(-1, 1)], 0, 1),
  blockCreator("#9900ff", [xy(-1, 0), xy(0, 0), xy(1, 0), xy(0, 1)], 0, 0),
  blockCreator("#ff0000", [xy(-1, 0), xy(0, 0), xy(0, 1), xy(1, 1)], 0, 1),
];

/**
 * returns the block creator at a given index
 * @param type number represnting which type of block is needed
 * @returns the function that will create that block
 */
function createBlock(type: number): (id: number) => Block {
  return blockCreators[type - 1];
}
/**
 * used to filter blocks on the game grid that are in the same coloumn as u
 * @param s the game state
 * @param u the unit to filter based on
 * @returns all the units in the gamegrid which are on the same coloumn
 */
function filterColoumn(s: State, u: Unit) {
  return s.gameGrid.filter((e) => e.x === u.x);
}
/**
 * used to filter blocks on the game grid that are in the same row as u
 * @param s the game state
 * @param u the unit to filter based on
 * @returns all the units in the gamegrid which are on the same row
 */
function filterRow(s: State, u: Unit) {
  return s.gameGrid.filter((e) => e.y === u.y);
}
/**
 * returns the y value of the highest unit in an array of blocks
 * @param blocks array of blocks to check
 * @returns the y value of the highest unit
 */
function highestBlock(blocks: ReadonlyArray<Unit>) {
  return blocks.reduce(
    (acc: number, u: Unit) => (u.y < acc ? u.y : acc),
    Constants.GRID_HEIGHT + 2
  );
}
/**
 * attempts to apply a movement to a block and then kick the block left and
 * right to find a valid position after applying the move
 * @param g game grid
 * @param b block being moved
 * @param f move function
 * @returns a moved block if a wall kick was found
 */
function wallKick(g: ReadonlyArray<Unit>, b: Block, f: MoveFunction) {
  const leftAttempt = validMove(g, moveX(-1)(b), f);
  const rightAttempt = validMove(g, moveX(1)(b), f);
  return leftAttempt ? f(moveX(-1)(b)) : rightAttempt ? f(moveX(1)(b)) : b;
}
/**
 * checks if a given move is valid for a game grid and block to be moved
 * @param g a game grid
 * @param b a block to move
 * @param f the move the block takes
 * @returns boolean value, true if the move is valid, false if collides
 */
function validMove(g: ReadonlyArray<Unit>, b: Block, f: MoveFunction) {
  const movedBlock = f(b);
  //check new block is all within grid boundaries
  const outsideConstraints = movedBlock.units
    .map(
      (e) =>
        e.x < 0 ||
        e.x > Constants.GRID_WIDTH - 1 ||
        e.y > Constants.GRID_HEIGHT + 1
    )
    .reduce((acc: boolean, e: boolean) => acc || e, false);
  //check new block does not contact another block in game grid
  const conflicts = movedBlock.units
    .map((e) => g.filter((a) => a.x === e.x && a.y === e.y).length != 0)
    .reduce((acc: boolean, e: boolean) => acc || e, false);
  return !outsideConstraints && !conflicts;
}

/** action that can be applied to the state to move the current block sideways*/
class Move implements Action {
  constructor(public readonly amount: number) {}
  /**
   * moves the current block sideways by a given amount if it is a valid move
   * @param s previous state
   * @returns moved state
   */
  apply = (s: State) => {
    return {
      ...s,
      currentBlock: validMove(s.gameGrid, s.currentBlock, moveX(this.amount))
        ? moveX(this.amount)(s.currentBlock)
        : s.currentBlock,
      pastState: s,
    } as State;
  };
}
/** action that can be applied to the state to move the current block down as
 * as low as possible
 */
class Drop implements Action {
  /**
   * moves the current block down as much as possible
   * @param s previous state
   * @returns moved
   */
  apply = (s: State) => {
    //an array of maximum drop distances for each unit in the block
    const droppedLevels = s.currentBlock.units.map(
      (u) =>
        highestBlock(filterColoumn(s, u).filter((a) => a.y > u.y)) - u.y - 1
    );
    //filters the array to find the minimum drop distance, the point of where
    // the block stops when being dropped down
    const dropDistance = droppedLevels.reduce(
      (acc, e) => (e < acc ? e : acc),
      Infinity
    );
    return {
      ...s,
      currentBlock: moveY(dropDistance)(s.currentBlock),
      pastState: s,
    } as State;
  };
}
/**
 * allows the game to be restarted
 */
class Restart implements Action {
  /**
   * restarts the current game while keeping high scores
   * @param s previous state
   * @returns restarted state
   */
  apply = (s: State) => {
    return s.gameEnd === true
      ? ({
          ...s,
          gameEnd: false,
          score: 0,
          level: 0,
          highscore: s.score > s.highscore ? s.score : s.highscore,
          gameGrid: [],
        } as State)
      : s;
  };
}
// action to rotate the block to the left
class RotateLeft implements Action {
  /**
   * tried to rotate the block and if that fails will attempt to rotate with
   * a wall kick. If both failed, will return an unmoved block.
   * @param s previous state
   * @returns rotated state
   */
  apply = (s: State) =>
    ({
      ...s,
      currentBlock: validMove(s.gameGrid, s.currentBlock, rotateLeft)
        ? rotateLeft(s.currentBlock)
        : wallKick(s.gameGrid, s.currentBlock, rotateLeft),
      pastState: s,
    } as State);
}
//action to rotate the block to the right
class RotateRight implements Action {
  /**
   * tried to rotate the block and if that fails will attempt to rotate with
   * a wall kick. If both failed, will return an unmoved block.
   * @param s previous state
   * @returns rotated state
   */
  apply = (s: State) =>
    ({
      ...s,
      currentBlock: validMove(s.gameGrid, s.currentBlock, rotateRight)
        ? rotateRight(s.currentBlock)
        : wallKick(s.gameGrid, s.currentBlock, rotateRight),
      pastState: s,
    } as State);
}
//action that allows the game to process a tick when the gamespeed allows
class Tick implements Action {
  constructor(
    public readonly elapsed: number,
    public readonly randomBlock: number
  ) {}
  /**
   * calculates which y values on the game grid are full
   * @param s game state
   * @returns array of y values for each full row
   */
  fullYValues(s: State) {
    return s.gameGrid
      .filter((e) => filterRow(s, e).length == Constants.GRID_WIDTH)
      .map((e) => e.y)
      .reduce(
        (acc: ReadonlyArray<number>, e: number) =>
          acc.filter((a) => a == e).length != 0 ? acc : acc.concat([e]),
        []
      );
  }
  /**
   * clears the grid of any full rows
   * @param s old state
   * @returns cleared game grid
   */
  clearedGrid(s: State) {
    const fullRowsYValue: ReadonlyArray<number> = this.fullYValues(s);
    const removedFullRows: ReadonlyArray<Unit> = s.gameGrid.filter(
      (e) => this.fullYValues(s).filter((a) => a == e.y).length == 0
    );
    const removedSpaces: ReadonlyArray<Unit> = removedFullRows.map(
      (e: Unit) =>
        ({
          ...e,
          y: e.y + fullRowsYValue.filter((a) => a > e.y).length,
        } as Unit)
    );
    return removedSpaces as ReadonlyArray<Unit>;
  }
  /**
   * runs a tick within the game, will skip processing the state if the tick
   * does not fall on a game speed equivalent tick. This allows the gamespeed
   * to dictate how often ticks are processed and henve can speed up or
   * slowdown the game
   * @param s old state
   * @returns ticked state
   */
  apply(s: State): State {
    //checks if the tick will cause a contact
    const contact = !validMove(s.gameGrid, s.currentBlock, moveDown);
    //only returns a processed state if elapsed is a factor of tickspeed
    return this.elapsed % s.tickSpeed === 0
      ? {
          ...s,
          level: s.level + this.fullYValues(s).length / 2,
          score: s.score + 25 * this.fullYValues(s).length,
          nextBlock: contact
            ? createBlock(this.randomBlock)(s.tickSpeed)
            : s.nextBlock,
          gameGrid: this.clearedGrid(s).concat(
            contact ? s.currentBlock.units : []
          ),
          currentBlock: contact ? s.nextBlock : moveDown(s.currentBlock),
          tickSpeed: Math.ceil(calculateSpeed(s.level) / 100),
          gameEnd: contact && highestBlock(s.currentBlock.units) < 2,
          pastState: s,
        }
      : { ...s, pastState: s };
  }
}
//creates the starting state, uses the randomseed to initialise the starting
//blocks
const initialState: State = {
  level: 0,
  score: 0,
  highscore: 0,
  nextBlock: createBlock(RNG.scaledNumber(randomSeed + 1))(-1),
  currentBlock: moveY(-1)(createBlock(RNG.scaledNumber(randomSeed + 2))(-2)),
  gameGrid: [],
  gameEnd: false,
  tickSpeed: 1000,
  pastState: null,
} as const;

/**
 * state transducer
 * @param s input State
 * @param action type of action to apply to the State
 * @returns a new State
 */
const reduceState = (s: State, action: Action) => {
  //will only apply an action if the game has not ended or the resulting state
  //is not ended (therefore a restart must have occured)
  if (s.gameEnd === false || action.apply(s).gameEnd === false) {
    return action.apply(s);
  }
  //will skip any actions while the game has ended and is not being restarted
  return { ...s, pastState: s } as State;
};
