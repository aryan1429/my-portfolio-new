"use client";

import type { ReactNode } from "react";
import type { Side } from "@/data/types";
import { cn } from "@/lib/cn";
import KineticText from "./KineticText";
import Reveal from "./Reveal";

export interface SectionHeadingProps {
  /** Two-digit section index, e.g. "01". */
  index: string;
  /** Small mono label above the title. */
  eyebrow: string;
  title: string;
  /** Colours the index/rule: "tech" → indigo, "edits" → crimson, omitted → route accent. */
  side?: Side;
  className?: string;
  /** Heading level for the title. Default "h2". */
  as?: "h1" | "h2" | "h3";
  /** Optional supporting paragraph / node under the title. */
  description?: ReactNode;
  /** Title animation unit. Default "words". */
  mode?: "chars" | "words" | "lines";
  align?: "left" | "center";
  id?: string;
}

const SIDE_TEXT: Record<Side | "accent", string> = {
  tech: "text-tech",
  edits: "text-edit",
  accent: "text-accent",
};

const SIDE_BG: Record<Side | "accent", string> = {
  tech: "from-tech",
  edits: "from-edit",
  accent: "from-accent",
};

/**
 * Editorial section header: "01 ── EYEBROW" row with a drawn rule, then a kinetic display title.
 */
export default function SectionHeading({
  index,
  eyebrow,
  title,
  side,
  className,
  as = "h2",
  description,
  mode = "words",
  align = "left",
  id,
}: SectionHeadingProps) {
  const tone = side ?? "accent";
  const centered = align === "center";

  return (
    <header className={cn("flex flex-col gap-5 md:gap-7", centered && "items-center text-center", className)}>
      <Reveal y={10} blur={0} duration={0.7} className={cn("flex w-full items-center gap-4", centered && "justify-center")}>
        <span className={cn("font-mono text-[11px] tracking-[0.2em] tabular-nums", SIDE_TEXT[tone])}>{index}</span>
        <span
          aria-hidden="true"
          className={cn(
            "h-px bg-linear-to-r to-transparent",
            centered ? "w-12" : "w-12 md:w-20",
            SIDE_BG[tone],
          )}
        />
        <span className="eyebrow">{eyebrow}</span>
      </Reveal>
      <KineticText
        as={as}
        id={id}
        text={title}
        mode={mode}
        trigger="inView"
        className="font-display text-[clamp(2.25rem,6.2vw,5.75rem)] leading-[0.95] font-bold tracking-[-0.02em] text-balance text-paper"
      />
      {description ? (
        <Reveal delay={0.15} className={cn("max-w-xl text-base leading-relaxed text-mute md:text-lg", centered && "mx-auto")}>
          {description}
        </Reveal>
      ) : null}
    </header>
  );
}
