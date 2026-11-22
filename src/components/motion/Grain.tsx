import { cn } from "@/lib/cn";

/** Fractal-noise tile rendered by the browser's SVG filter — no JS, no per-frame work. */
const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;

const NOISE_URL = `url("data:image/svg+xml;utf8,${NOISE_SVG.replace(/"/g, "'").replace(/</g, "%3C").replace(/>/g, "%3E")}")`;

/**
 * Film-grain overlay. A noise tile jitters in steps (like real grain changing per frame) via a
 * CSS keyframe; static under prefers-reduced-motion. Server component — zero client JS.
 */
export default function Grain({ className, opacity = 0.06 }: { className?: string; opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 z-[110] overflow-hidden", className)}
      style={{ opacity }}
    >
      <div
        className="absolute -inset-[50%] animate-grain will-change-transform motion-reduce:animate-none"
        style={{ backgroundImage: NOISE_URL, backgroundSize: "220px 220px" }}
      />
    </div>
  );
}
