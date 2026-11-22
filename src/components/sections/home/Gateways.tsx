import { ArrowUpRight } from "lucide-react";
import TransitionLink from "@/components/layout/TransitionLink";
import { MagneticButton, Reveal, ScrambleText } from "@/components/motion";
import { techCategories } from "@/data/portfolio";
import { cn } from "@/lib/cn";
import { counts, editCategoryCounts, pad2, skillGroups, topStack } from "./data";

interface GatewaySpec {
  side: "tech" | "edits";
  href: "/tech" | "/edits";
  label: string;
  letter: string;
  word: string;
  subtitle: string;
}

const GATEWAYS: readonly GatewaySpec[] = [
  { side: "tech", href: "/tech", label: "Tech", letter: "A", word: "Tech", subtitle: "Full-Stack & Engineering" },
  { side: "edits", href: "/edits", label: "Edits", letter: "B", word: "Edits", subtitle: "Video Editing & Motion" },
];

const TONE = {
  tech: {
    text: "text-tech",
    soft: "text-tech-2",
    border: "hover:border-tech/60 focus-visible:border-tech/60",
    glow: "bg-[radial-gradient(80%_70%_at_20%_100%,rgb(91_108_255/0.38),rgb(34_211_238/0.08)_55%,transparent_75%)]",
    ring: "border-tech/50 text-tech group-hover/panel:bg-tech group-hover/panel:text-paper",
    rule: "bg-tech",
  },
  edits: {
    text: "text-edit",
    soft: "text-edit-2",
    border: "hover:border-edit/60 focus-visible:border-edit/60",
    glow: "bg-[radial-gradient(80%_70%_at_80%_100%,rgb(255_46_77/0.36),rgb(255_176_32/0.08)_55%,transparent_75%)]",
    ring: "border-edit/50 text-edit group-hover/panel:bg-edit group-hover/panel:text-paper",
    rule: "bg-edit",
  },
} as const;

/** Mono detail rows: what is behind each door, computed from the data. */
function TechDetails() {
  const stack = topStack(6);
  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      <div>
        <dt className="eyebrow">Projects</dt>
        <dd className="mt-2 font-display text-5xl leading-none font-bold tabular-nums">{pad2(counts.tech)}</dd>
        {techCategories.length > 0 && (
          <dd className="mt-3 font-mono text-[11px] leading-relaxed text-paper/60">{techCategories.join(" · ")}</dd>
        )}
      </div>
      {stack.length > 0 && (
        <div>
          <dt className="eyebrow">Top stack</dt>
          <dd>
            <ul className="mt-2 space-y-1 font-mono text-xs text-paper/80">
              {stack.map((item, i) => (
                <li key={item} className="flex gap-2">
                  <span className="text-tech-2/70">{pad2(i + 1)}</span>
                  <span className="truncate">{item}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      )}
    </dl>
  );
}

function EditsDetails() {
  const categories = editCategoryCounts();
  const suite = skillGroups("edits")[0];
  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      <div>
        <dt className="eyebrow">Edits</dt>
        <dd className="mt-2 font-display text-5xl leading-none font-bold tabular-nums">{pad2(counts.edits)}</dd>
        {categories.length > 0 && (
          <dd className="mt-3 font-mono text-[11px] leading-relaxed text-paper/60">
            {categories.map((c) => `${c.category} ×${pad2(c.count)}`).join(" · ")}
          </dd>
        )}
      </div>
      {suite && suite.items.length > 0 && (
        <div>
          <dt className="eyebrow">{suite.title}</dt>
          <dd>
            <ul className="mt-2 space-y-1 font-mono text-xs text-paper/80">
              {suite.items.map((item, i) => (
                <li key={item} className="flex gap-2">
                  <span className="text-edit-2/70">{pad2(i + 1)}</span>
                  <span className="truncate">{item}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      )}
    </dl>
  );
}

function Gateway({ spec, index }: { spec: GatewaySpec; index: number }) {
  const tone = TONE[spec.side];
  return (
    <TransitionLink
      href={spec.href}
      label={spec.label}
      data-cursor="Enter"
      aria-label={`Enter ${spec.word} — ${spec.subtitle}`}
      className={cn(
        "group/panel relative isolate flex min-h-[30rem] flex-col overflow-hidden rounded-2xl border border-line bg-ink/35 p-6 md:p-9",
        "transition-[flex-grow,opacity,border-color,background-color] duration-700 ease-expo",
        "lg:min-h-0 lg:flex-1 lg:hover:grow-[1.6] lg:focus-visible:grow-[1.6]",
        "lg:group-hover/gw:[&:not(:hover)]:opacity-45 lg:group-has-[:focus-visible]/gw:[&:not(:focus-visible)]:opacity-45",
        "hover:bg-ink/20",
        tone.border,
      )}
    >
      {/* Colour wash + hairline grid (decorative). */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 opacity-60 transition-opacity duration-700 group-hover/panel:opacity-100",
          tone.glow,
        )}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_85%)] bg-[linear-gradient(rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-[size:56px_56px]"
      />
      {spec.side === "edits" && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-[repeating-linear-gradient(90deg,transparent_0_10px,rgb(255_255_255/0.1)_10px_22px)] [mask-image:linear-gradient(to_bottom,black_45%,transparent_45%)] opacity-70"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-[repeating-linear-gradient(90deg,transparent_0_10px,rgb(255_255_255/0.1)_10px_22px)] [mask-image:linear-gradient(to_top,black_45%,transparent_45%)] opacity-70"
          />
        </>
      )}

      <span className="flex items-center justify-between gap-4 font-mono text-[11px] tracking-[0.2em] uppercase">
        <span className={tone.text}>
          {spec.letter} — {pad2(index + 1)}/{pad2(GATEWAYS.length)}
        </span>
        <span className="text-paper/50">{spec.href}</span>
      </span>

      <div className="mt-auto pt-14">
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "h-px w-8 origin-left transition-transform duration-700 ease-expo group-hover/panel:scale-x-[2.5]",
              tone.rule,
            )}
          />
          <ScrambleText
            text={spec.subtitle}
            trigger="hover"
            className={cn("font-mono text-xs tracking-[0.16em] uppercase", tone.soft)}
          />
        </span>
        <span className="mt-3 flex items-end justify-between gap-4">
          <span className="block font-display text-[clamp(3.75rem,9vw,9.5rem)] leading-[0.85] font-bold tracking-[-0.045em] uppercase transition-transform duration-700 ease-expo group-hover/panel:translate-x-2">
            {spec.word}
          </span>
          <MagneticButton
            as="span"
            aria-hidden="true"
            strength={0.45}
            wrapperClassName="mb-2 shrink-0"
            className={cn(
              "grid size-14 place-items-center rounded-full border transition-colors duration-500 md:size-16",
              tone.ring,
            )}
          >
            <ArrowUpRight
              strokeWidth={1.5}
              className="size-5 transition-transform duration-700 ease-expo group-hover/panel:rotate-45 md:size-6"
            />
          </MagneticButton>
        </span>
      </div>

      <div className="mt-8 border-t border-line pt-6">
        {spec.side === "tech" ? <TechDetails /> : <EditsDetails />}
      </div>
    </TransitionLink>
  );
}

/**
 * Two doors out of the hub. Hovering (or focusing) a panel grows it and dims the other; the
 * cursor reads "Enter" and the arrow is magnetic. Each door plays the editor-cut page transition.
 */
export default function Gateways() {
  return (
    <section id="gateways" aria-labelledby="gateways-title" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="container-x">
        <Reveal y={16} blur={0} className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
          <h2 id="gateways-title" className="eyebrow">
            <span className="text-paper/80">00</span>
            <span className="mx-2 text-paper/25">/</span>
            Choose a side
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-mute md:text-right">
            Two practices, one portfolio. Step through either door — engineering or the edit bay.
          </p>
        </Reveal>

        <div className="group/gw flex flex-col gap-3 lg:h-[min(80svh,52rem)] lg:min-h-[36rem] lg:flex-row lg:gap-4">
          {GATEWAYS.map((spec, i) => (
            <Gateway key={spec.side} spec={spec} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
