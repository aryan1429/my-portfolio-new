"use client";

import { Counter, HudFrame, KineticText, Reveal, ScrambleText, Timecode } from "@/components/motion";
import { profile, skills, stats, videoEdits } from "@/data/portfolio";
import { cn } from "@/lib/cn";
import { useIntroReady } from "@/lib/transition";
import { editCategories, formatClock, timedCount, timedRuntime } from "./utils";

/** The bio paragraph about editing (the source bio has one), if present. */
const editingBio = profile.bio.find((p) => /editing side|video edits|after effects/i.test(p));
const editRole = profile.roles.find((r) => /edit|motion/i.test(r));
/**
 * Title size: the second line ("/ Motion", indented 12vw from md up) must fit the container at every width
 * — ~4.6em wide, so it scales from the viewport minus the paddings instead of a flat 19vw.
 */
const TITLE_SIZE = "text-[clamp(3.25rem,17vw,6rem)] md:text-[clamp(4.25rem,calc(16vw_-_2rem),15rem)]";
const editTracks = skills.filter((g) => g.side === "edits");
const editsStat = stats.find((s) => /edit/i.test(s.label));

interface Readout {
  value: string;
  label: string;
  note?: string;
  /** Timecode-like values decode instead of counting. */
  scramble?: boolean;
}

const readouts: Readout[] = [
  ...(editsStat ? [{ value: editsStat.value, label: `${editsStat.label} cut` }] : []),
  { value: String(videoEdits.length), label: "Clips on this reel" },
  {
    value: String(editCategories.length),
    label: editCategories.length === 1 ? "Category" : "Categories",
    note: editCategories.join(" · "),
  },
  // Only shown once every clip has a known duration — a partial total reads as unfinished data.
  ...(timedCount > 0 && timedCount === videoEdits.length
    ? [{ value: formatClock(timedRuntime), label: "Total runtime", scramble: true }]
    : []),
];

/**
 * /edits hero: kinetic "Cuts / Motion" title inside a REC viewfinder, editing bio, reel counts and the
 * editing skill groups laid out as NLE track headers (V1, V2, …).
 */
export default function EditsHero() {
  const introReady = useIntroReady();

  return (
    <section
      aria-labelledby="edits-title"
      className="relative flex min-h-[100svh] flex-col pt-[calc(var(--nav-height)+2rem)] pb-14 md:pt-[calc(var(--nav-height)+3rem)]"
    >
      {/* Warm light leak that sits over the 3D studio without hiding it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(60%_55%_at_80%_20%,rgb(255_46_77/0.14),transparent_70%),radial-gradient(40%_40%_at_10%_70%,rgb(255_176_32/0.08),transparent_70%)]"
      />

      <div className="container-x relative flex flex-1 flex-col">
        <Reveal y={10} blur={0} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="eyebrow flex items-center gap-3">
            <span className="text-edit">03</span>
            <span aria-hidden="true" className="h-px w-10 bg-linear-to-r from-edit to-transparent" />
            <ScrambleText text="Index / Edits" />
          </p>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
            <span className="hidden sm:inline">Session</span>
            <Timecode className="text-paper/80" label="Session timecode" />
          </p>
        </Reveal>

        {/* Viewfinder with the title. Powers on (CRT-style) once the preloader lifts. */}
        <div
          className={cn(
            "relative mt-8 flex flex-1 items-center py-14 transition-[clip-path,opacity] duration-1000 ease-cut md:mt-10 md:py-20",
            introReady ? "opacity-100 [clip-path:inset(0_0_0_0)]" : "opacity-0 [clip-path:inset(49%_0_49%_0)]",
          )}
        >
          <HudFrame rec recLabel="REC" timecode label="SEQ 01 · CUTS / MOTION" size={22} inset={0} tone="paper" />
          {/* Safe-area guides, like a monitor overlay. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-[9%] hidden border border-dashed border-paper/[0.07] md:block" />
          <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 hidden size-6 -translate-x-1/2 -translate-y-1/2 md:block">
            <span className="absolute top-1/2 left-0 h-px w-full bg-paper/25" />
            <span className="absolute top-0 left-1/2 h-full w-px bg-paper/25" />
          </div>

          <h1 id="edits-title" className="relative w-full px-4 md:px-10">
            <span className="sr-only">Cuts / Motion — video editing and motion graphics by {profile.name}</span>
            <span aria-hidden="true" className="flex flex-col">
              <KineticText
                as="span"
                text="Cuts"
                delay={0.15}
                className={`block font-display ${TITLE_SIZE} leading-[0.82] font-bold tracking-[-0.05em] text-paper uppercase`}
              />
              <span className="flex items-end gap-[0.15em] self-end md:self-auto md:pl-[12vw]">
                <KineticText
                  as="span"
                  text="/"
                  delay={0.35}
                  className={`block font-display ${TITLE_SIZE} leading-[0.82] font-bold text-edit`}
                />
                <KineticText
                  as="span"
                  text="Motion"
                  delay={0.4}
                  className={`block font-display ${TITLE_SIZE} leading-[0.82] font-bold tracking-[-0.05em] text-transparent uppercase [-webkit-text-stroke:1.5px_var(--color-edit-2)]`}
                />
              </span>
            </span>
          </h1>
        </div>

        <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-12 lg:gap-8">
          {editingBio ? (
            <Reveal delay={0.1} className="lg:col-span-5">
              <p className="mb-4">
                <ScrambleText
                  text={editRole ?? "Logline"}
                  className="font-mono text-xs uppercase tracking-[0.2em] text-edit-2"
                />
              </p>
              <p className="legible max-w-xl text-base leading-relaxed text-paper/85 md:text-lg">{editingBio}</p>
            </Reveal>
          ) : null}

          <Reveal delay={0.2} className={cn(editingBio ? "lg:col-span-3" : "lg:col-span-5")}>
            <dl className="legible grid grid-cols-2 gap-x-6 gap-y-6">
              {readouts.map((r) => (
                <div key={r.label} className="hairline pt-3">
                  <dt className="eyebrow">{r.label}</dt>
                  <dd className="mt-2 font-display text-3xl font-bold tabular-nums text-paper md:text-4xl">
                    {r.scramble ? <ScrambleText text={r.value} trigger="inView" /> : <Counter value={r.value} />}
                  </dd>
                  {r.note ? (
                    <dd className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{r.note}</dd>
                  ) : null}
                </div>
              ))}
            </dl>
          </Reveal>

          {editTracks.length > 0 ? (
            <Reveal delay={0.3} className="lg:col-span-4">
              <p className="eyebrow mb-4">Tracks</p>
              <ul className="overflow-hidden rounded-md border border-line bg-ink/80 fine:bg-ink/55 fine:backdrop-blur-sm">
                {editTracks.map((group, i) => {
                  return (
                    <li key={group.title} className="flex border-b border-line last:border-b-0">
                      <div className="flex w-20 shrink-0 flex-col justify-center gap-1 border-r border-line px-3 py-3">
                        <span className={cn("font-mono text-[11px] font-semibold tracking-[0.15em]", i % 2 ? "text-edit-2" : "text-edit")}>
                          V{i + 1}
                        </span>
                        <span className="font-mono text-[9px] uppercase leading-tight tracking-[0.12em] text-mute">
                          {group.title}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 p-2.5">
                        {group.items.map((item) => (
                          <span
                            key={item}
                            className={cn(
                              "rounded-[3px] border-l-2 bg-paper/[0.04] px-2 py-1 text-[12px] leading-tight text-paper/85",
                              i % 2 ? "border-edit-2/70" : "border-edit/70",
                            )}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
