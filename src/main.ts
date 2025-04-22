import "./style.css";
import { Observable, fromEvent, interval, merge } from "rxjs";
import { map, filter, scan } from "rxjs/operators";
import { render } from "./view";
import { State, Key, Event, Constants, Action } from "./types";
import {
  Move,
  Drop,
  RotateLeft,
  RotateRight,
  initialState,
  Tick,
  Restart,
  reduceState,
} from "./state";
import { RNG } from "./utility";

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Observables
  /** Ticks every tick rate and zips a randomised number that can be used for
   * block generation, not all ticks may be actioned upon, but more will be
   * used as game speed increases*/
  const rngTick$ = interval(Constants.TICK_RATE_MS).pipe(
    scan(
      (acc, newElapsed) => ({
        seed: RNG.hash(acc.seed),
        elapsed: newElapsed,
      }),
      { seed: Math.floor(Math.random() * 10000), elapsed: 0 }
    ),
    map(({ seed, elapsed }) => new Tick(elapsed, RNG.scale(seed)))
  );
  /** User input */
  const key$ = (e: Event, k: Key) =>
    fromEvent<KeyboardEvent>(document, e).pipe(
      filter(({ code }) => code === k),
      filter(({ repeat }) => !repeat)
    );
  const restart$ = key$("keypress", "KeyR").pipe(map((_) => new Restart()));
  const left$ = key$("keypress", "KeyA").pipe(map((_) => new Move(-1)));
  const right$ = key$("keypress", "KeyD").pipe(map((_) => new Move(1)));
  const down$ = key$("keypress", "KeyS").pipe(map((_) => new Drop()));
  const rotateRight$ = key$("keypress", "KeyE").pipe(
    map((_) => new RotateRight())
  );
  const rotateLeft$ = key$("keypress", "KeyQ").pipe(
    map((_) => new RotateLeft())
  );
  const source$: Observable<Action> = merge(
    rngTick$,
    right$,
    left$,
    down$,
    rotateLeft$,
    rotateRight$,
    restart$
  );
  //transforms state through reduceState function using a given action
  const state$: Observable<State> = source$.pipe(
    scan(reduceState, initialState)
  );
  const sub$ = state$.subscribe((s: State) => render(s));
}

// The following simply runs your main function on window load.  Make sure to
// leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
