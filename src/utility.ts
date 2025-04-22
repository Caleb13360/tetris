export { calculateSpeed, RNG, randomSeed };

/**
 * this approximates a speed curve using exponential decay for each level and
 * returns the milliseconds between frames
 * @param level current level the player is on
 * @returns the amount of milliseconds between frames that should be displayed
 */
function calculateSpeed(level: number) {
  // starts at 0.85 seconds between frames
  // dividing the level by 4 returned a very close curve to actual tetris speed
  return 850 / 2 ** (level / 4);
}

// borrowed from week 4 exercise and modified scale to fit my model
abstract class RNG {
  // LCG using GCC's constants
  private static m = 0x80000000; // 2**31
  private static a = 1103515245;
  private static c = 12345;

  /**
   * Call `hash` repeatedly to generate the sequence of hashes.
   * @param seed
   * @returns a hash of the seed
   */
  public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

  /**
   * Takes hash value and scales it to the range [1, 7]
   * @param hash hash value
   * @returns scaled hashed number
   */
  public static scale = (hash: number) => Math.ceil((hash * 7) / (RNG.m - 1));
  /**
   * given a seed returns a scaled hashed number
   * @param seed the seed number
   * @returns randomised number through hash and scale
   */
  public static scaledNumber = (seed: number) => this.scale(this.hash(seed));
}
// Impure randomised game seed to have random initial blocks and game seed
// to avoid have a repeating pattern to the start of the game
const randomSeed: number = Math.ceil(Math.random() * 10000);
