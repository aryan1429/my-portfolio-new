/**
 * Mutable pointer snapshot: `x`/`y` in CSS px, `nx`/`ny` normalised to -1..1
 * (`ny` is +1 at the top of the viewport, matching WebGL's y-up convention).
 * Updated by a single passive window `pointermove` listener; read it inside rAF / useFrame.
 */
export const pointerState = { x: 0, y: 0, nx: 0, ny: 0 };

let consumers = 0;

function onPointerMove(e: PointerEvent): void {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  pointerState.x = e.clientX;
  pointerState.y = e.clientY;
  pointerState.nx = (e.clientX / w) * 2 - 1;
  pointerState.ny = -((e.clientY / h) * 2 - 1);
}

/**
 * Install the shared listener (reference counted — safe to call from several components).
 * Returns a cleanup that removes it once the last consumer unmounts.
 */
export function installPointerListener(): () => void {
  if (typeof window === "undefined") return () => {};
  if (consumers === 0) {
    if (pointerState.x === 0 && pointerState.y === 0) {
      pointerState.x = window.innerWidth / 2;
      pointerState.y = window.innerHeight / 2;
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
  }
  consumers += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    consumers -= 1;
    if (consumers === 0) window.removeEventListener("pointermove", onPointerMove);
  };
}
