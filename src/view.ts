export { render };
import { Constants, State, Unit } from "./types";
import { highestBlock } from "./state";

//Constants used for nice viewing dimensions
const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const BlockSize = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
} as const;

/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

// Canvas elements
const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
  HTMLElement;
const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
  HTMLElement;
const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
  HTMLElement;

// Setting attributes of containers
svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);


/**
 * Used to add blocks to the view
 * @param blocks an array of blocks to display
 * @param area area to display in
 * @param opacity block opacity when displaying
 */
function addToDoc(
  blocks: ReadonlyArray<Unit>,
  area: SVGGraphicsElement & HTMLElement,
  opacity: number
) {
  blocks.forEach((block) => {
    const htmlBlock = createSvgElement(area.namespaceURI, "rect", {
      id: `${block.id}`,
      height: `${BlockSize.HEIGHT}`,
      width: `${BlockSize.WIDTH}`,
      // slight coordinate modification to center blocks in containers
      x: `${(block.x + (area == preview ? -1 : 0)) * BlockSize.WIDTH}`,
      y: `${(block.y + (area == preview ? 1 : -2)) * BlockSize.HEIGHT}`,
      style: `fill: ${block.colour}`,
      opacity: `${opacity}`,
    });
    area.appendChild(htmlBlock);
  });
}
/**
 * used to remove blocks from an area
 * @param blocks an array of blocks to remove
 * @param area area to remove from
 */
function removeFromDoc(
  blocks: ReadonlyArray<Unit>,
  area: SVGGraphicsElement & HTMLElement
) {
  blocks.forEach((block) => {
    const blockLookup = document.getElementById(block.id.toString());
    if (blockLookup) area.removeChild(blockLookup);
  });
}
// Text fields
const levelText = document.querySelector("#levelText") as HTMLElement;
const scoreText = document.querySelector("#scoreText") as HTMLElement;
const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

/**
 * Renders the current state to the canvas.
 *
 * In MVC terms, this updates the View using the Model.
 *
 * @param s Current state
 */
const render = (s: State) => {
  //update level, score and highscore values
  scoreText.innerHTML = s.score.toString();
  levelText.innerHTML = Math.floor(s.level).toString();
  highScoreText.innerHTML = s.highscore.toString();
  // Remove previous state render if it exists
  s.pastState !== null
    ? (removeFromDoc(s.pastState.currentBlock.units, svg),
      removeFromDoc(s.pastState.gameGrid, svg),
      removeFromDoc(s.pastState.nextBlock.units, preview))
    : null;
  // Add blocks of current state
  // find blocks which are 'hiddden'
  const hiddenUnits = s.currentBlock.units.filter((block) => block.y < 2);
  // show block before it enters grid if it was above viewport
  if (hiddenUnits.length > 0) {
    addToDoc(
      s.currentBlock.units.map((e) => ({
        ...e,
        y: e.y - highestBlock(hiddenUnits) + 2,
        colour: "grey",
      })),
      svg,
      0.6
    );
  } else {
    addToDoc(s.currentBlock.units, svg, 0.6);
  }
  //add preview and gridview blocks
  addToDoc(s.gameGrid, svg, 1);
  addToDoc(s.nextBlock.units, preview, 1);
  //show gameover if gameover
  s.gameEnd ? show(gameover) : hide(gameover);
};
