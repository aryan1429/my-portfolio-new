import type { ComponentType, SVGProps } from "react";
import { ArrowUpRight, Clapperboard, CodeXml } from "lucide-react";
import { MagneticButton, Reveal, SectionHeading } from "@/components/motion";
import { profile, skills, techCategories } from "@/data/portfolio";
import type { Side } from "@/data/types";
import { cn } from "@/lib/cn";
import { buildMailto, INTENT_TEMPLATES } from "./mail";

interface Lane {
  side: Side;
  key: keyof typeof INTENT_TEMPLATES;
  index: string;
  kicker: string;
  title: string;
  /** Scope chips, straight from portfolio data. */
  chips: string[];
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const editCraft = skills.find((g) => g.side === "edits" && g.title === "Craft")?.items ?? [];

const LANES: readonly Lane[] = [
  {
    side: "tech",
    key: "development",
    index: "A",
    kicker: "Let's build",
    title: "Full-stack /\ndevelopment work",
    chips: techCategories,
    Icon: CodeXml,
  },
  {
    side: "edits",
    key: "video",
    index: "B",
    kicker: "Let's cut",
    title: "Video editing /\nmotion work",
    chips: editCraft,
    Icon: Clapperboard,
  },
];

const TONE = {
  tech: {
    text: "text-tech",
    soft: "text-tech-2",
    border: "group-hover:border-tech/60 group-focus-visible:border-tech/60",
    bracket: "border-tech",
    glow: "bg-[radial-gradient(60%_70%_at_20%_0%,rgb(91_108_255/0.32),transparent_70%)]",
    sweep: "from-tech to-tech-2",
    chip: "border-tech/25 text-paper/75",
    disc: "group-hover:bg-tech group-hover:border-tech",
  },
  edits: {
    text: "text-edit",
    soft: "text-edit-2",
    border: "group-hover:border-edit/60 group-focus-visible:border-edit/60",
    bracket: "border-edit",
    glow: "bg-[radial-gradient(60%_70%_at_80%_0%,rgb(255_46_77/0.3),transparent_70%)]",
    sweep: "from-edit to-edit-2",
    chip: "border-edit/25 text-paper/75",
    disc: "group-hover:bg-edit group-hover:border-edit",
  },
} as const;

const BRACKETS = [
  "left-3 top-3 border-l border-t",
  "right-3 top-3 border-r border-t",
  "bottom-3 left-3 border-b border-l",
  "bottom-3 right-3 border-b border-r",
] as const;

/**
 * Two intent cards — development (indigo) and video/motion (crimson). Each is a magnetic mailto link that opens
 * the visitor's mail app with a subject + brief template for that kind of work.
 */
export default function ContactIntents() {
  const email = profile.email;
  if (!email) return null;

  return (
    <section id="contact-lanes" aria-labelledby="contact-lanes-title" className="relative scroll-mt-24 py-24 md:py-36">
      <div className="container-x">
        <SectionHeading
          id="contact-lanes-title"
          index="01"
          eyebrow="Pick a lane"
          title={"Two crafts.\nOne inbox."}
          description={
            <p className="max-w-md text-paper/70">
              Each card opens your mail app with a short brief already laid out — fill in the blanks and hit send.
            </p>
          }
        />

        <ul className="mt-14 grid gap-5 md:mt-20 md:grid-cols-2 md:gap-6">
          {LANES.map((lane, i) => {
            const tone = TONE[lane.side];
            const template = INTENT_TEMPLATES[lane.key];
            const href = buildMailto(email, template.subject, template.body);
            const plainTitle = lane.title.replace("\n", " ");
            return (
              <Reveal key={lane.key} as="li" delay={i * 0.12} blur={0} className="flex">
                <MagneticButton
                  as="a"
                  href={href}
                  strength={0.06}
                  labelCounter={0.6}
                  data-cursor="Write"
                  aria-label={`Email about ${plainTitle} — opens your mail app with a brief template`}
                  wrapperClassName="flex w-full"
                  className={cn(
                    "group relative flex w-full overflow-hidden rounded-[1.75rem] border border-line bg-ink/80 fine:bg-ink/55 fine:backdrop-blur-sm transition-colors duration-500",
                    tone.border,
                  )}
                  labelClassName="flex min-h-[22rem] w-full flex-col items-stretch justify-between gap-10 p-7 text-left sm:p-9 md:min-h-[27rem] md:p-10"
                >
                  {/* Hover light + sweep line (decorative, behind the label content). */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus-visible:opacity-100",
                      tone.glow,
                    )}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-linear-to-r transition-transform duration-700 ease-expo group-hover:scale-x-100 group-focus-visible:scale-x-100",
                      tone.sweep,
                    )}
                  />
                  {BRACKETS.map((pos) => (
                    <span
                      key={pos}
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute size-4 opacity-40 transition-all duration-500 group-hover:opacity-100",
                        pos,
                        tone.bracket,
                      )}
                    />
                  ))}

                  <span className="relative flex items-start justify-between gap-6">
                    <span className="flex flex-col gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
                        <span className={tone.text}>{lane.index}</span>
                        <span className="mx-1.5 text-paper/25">/</span>
                        {String(LANES.length).padStart(2, "0")}
                        <span className="mx-3 text-paper/25">—</span>
                        <span className={tone.soft}>{lane.kicker}</span>
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">mailto:</span>
                    </span>
                    <lane.Icon aria-hidden="true" strokeWidth={1.25} className={cn("size-8 shrink-0", tone.text)} />
                  </span>

                  <span className="relative flex flex-col gap-6">
                    <span className="whitespace-pre-line font-display text-[clamp(1.9rem,3.9vw,3.25rem)] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-paper">
                      {lane.title}
                    </span>
                    {lane.chips.length > 0 && (
                      <span className="flex flex-wrap gap-2">
                        {lane.chips.map((chip) => (
                          <span
                            key={chip}
                            className={cn(
                              "rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
                              tone.chip,
                            )}
                          >
                            {chip}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>

                  <span className="relative flex items-center justify-between gap-4 border-t border-line pt-5">
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute transition-colors duration-300 group-hover:text-paper">
                      Open brief in mail
                    </span>
                    <span
                      className={cn(
                        "relative inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line transition-colors duration-500",
                        tone.disc,
                      )}
                    >
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-5 transition-transform duration-500 ease-expo group-hover:-translate-y-[160%] group-hover:translate-x-[160%]"
                      />
                      <ArrowUpRight
                        aria-hidden="true"
                        className="absolute size-5 -translate-x-[160%] translate-y-[160%] transition-transform duration-500 ease-expo group-hover:translate-x-0 group-hover:translate-y-0"
                      />
                    </span>
                  </span>
                </MagneticButton>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
