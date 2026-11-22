import { Marquee } from "@/components/motion";
import type { Side } from "@/data/types";
import { cn } from "@/lib/cn";
import { skillItems } from "./data";

const SEPARATOR = {
  tech: (
    <span aria-hidden="true" className="mx-[0.45em] inline-block font-mono text-[0.4em] text-tech">
      {"//"}
    </span>
  ),
  edits: (
    <span aria-hidden="true" className="mx-[0.45em] inline-block translate-y-[-0.08em] text-[0.45em] text-edit">
      ●
    </span>
  ),
} as const;

/**
 * Velocity-reactive band of every skill on one side; sits between sections as a kinetic divider.
 * Tech runs left in solid type, edits run right in outline type.
 */
export default function SkillsMarquee({ side, className }: { side: Side; className?: string }) {
  const items = skillItems(side);
  if (items.length === 0) return null;
  const tech = side === "tech";

  return (
    <div className={cn("relative border-y border-line bg-ink/40 py-5 md:py-7", className)}>
      <Marquee
        items={items}
        speed={tech ? 55 : 45}
        direction={tech ? "left" : "right"}
        separator={SEPARATOR[side]}
        className="font-display text-[clamp(2.25rem,6vw,5.5rem)] leading-none font-bold tracking-[-0.03em] uppercase"
        itemClassName={
          tech
            ? "text-paper/90"
            : "text-transparent [-webkit-text-stroke:1px_rgb(244_244_246/0.75)] md:[-webkit-text-stroke-width:1.5px]"
        }
      />
    </div>
  );
}
