"use client";

import { motion } from "framer-motion";
import { HudFrame, KineticText, Reveal, ScrambleText, Timecode } from "@/components/motion";
import { profile, techCategories, techProjects } from "@/data/portfolio";
import { ease, usePrefersReducedMotion } from "@/lib/motion";
import { useIntroReady } from "@/lib/transition";
import { pad2, stackFrequency, uniqueStack } from "./utils";

const FREQUENCY = stackFrequency(techProjects).slice(0, 6);
const MAX_COUNT = Math.max(1, FREQUENCY[0]?.count ?? 1);

const COUNTS = [
  { label: "Projects", value: pad2(techProjects.length) },
  { label: "Categories", value: pad2(techCategories.length) },
  { label: "Stack", value: pad2(uniqueStack(techProjects).length) },
];

/** The engineering paragraph of the bio (falls back to the first one). */
const INTRO = profile.bio.find((p) => /engineering/i.test(p)) ?? profile.bio[0];

/**
 * /tech hero: route index, two-line kinetic title, live counts, an intro from the bio and a HUD
 * "stack frequency" readout computed from the projects. Transparent so the TechGridScene shows through.
 */
export default function TechHeader() {
  const ready = useIntroReady();
  const reduced = usePrefersReducedMotion();
  const show = ready || reduced;

  return (
    <header className="container-x relative flex min-h-[92svh] flex-col justify-end pb-14 pt-[calc(var(--nav-height)+3.5rem)] md:pb-20">
      {/* Top metadata row */}
      <Reveal y={10} blur={0} duration={0.7} className="flex items-center justify-between gap-4">
        <p className="eyebrow flex items-center gap-3">
          <span className="text-tech-2 tabular-nums">02</span>
          <span aria-hidden="true" className="h-px w-10 bg-linear-to-r from-tech to-transparent md:w-16" />
          <span>Index / Tech</span>
        </p>
        <p className="hidden items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mute sm:flex">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-tech-2 shadow-[0_0_10px_var(--color-tech-2)]" />
          <span>Session</span>
          <Timecode className="text-paper/70" fps={30} />
        </p>
      </Reveal>

      {/* Title */}
      <h1 className="mt-8 font-display text-[clamp(2.25rem,9.6vw,9rem)] font-bold uppercase leading-[0.86] tracking-[-0.045em] md:mt-12">
        <KineticText as="span" text="Engineering" className="block" delay={0.05} />
        <span className="flex items-baseline gap-[0.22em]">
          <KineticText as="span" text="/" className="block text-tech-2" delay={0.3} />
          <KineticText
            as="span"
            text="Systems"
            className="block"
            unitClassName="bg-linear-to-r from-tech via-[#7f8cff] to-tech-2 bg-clip-text text-transparent"
            delay={0.36}
          />
        </span>
      </h1>

      <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:gap-8">
        {/* Intro */}
        <div className="flex flex-col gap-6 md:col-span-7 lg:col-span-6">
          {profile.roles[0] ? (
            <ScrambleText text={profile.roles[0]} className="font-mono text-xs uppercase tracking-[0.2em] text-tech-2" delay={0.5} />
          ) : null}
          {INTRO ? (
            <Reveal delay={0.2} blur={0}>
              <p className="legible max-w-xl text-base leading-relaxed text-paper/85 md:text-lg">{INTRO}</p>
            </Reveal>
          ) : null}
          {profile.location || profile.education ? (
            <Reveal delay={0.3} blur={0}>
              <dl className="legible grid max-w-xl gap-3 border-t border-line pt-5 font-mono text-[11px] uppercase tracking-[0.16em]">
                {profile.location ? (
                  <div className="grid grid-cols-[6.5rem_1fr] gap-3">
                    <dt className="text-mute">Base</dt>
                    <dd className="text-paper/80">{profile.location}</dd>
                  </div>
                ) : null}
                {profile.education ? (
                  <div className="grid grid-cols-[6.5rem_1fr] gap-3">
                    <dt className="text-mute">Education</dt>
                    <dd className="leading-relaxed text-paper/80">{profile.education}</dd>
                  </div>
                ) : null}
              </dl>
            </Reveal>
          ) : null}
        </div>

        {/* HUD readout */}
        <motion.aside
          aria-label="Project index summary"
          className="relative overflow-hidden rounded-2xl border border-line bg-ink-2/80 p-5 fine:bg-ink-2/55 fine:backdrop-blur-md md:col-span-5 md:col-start-8 lg:col-span-5 lg:col-start-8 md:p-6"
          initial={reduced ? false : { opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          transition={{ duration: 1, ease: ease.out, delay: 0.45 }}
        >
          <HudFrame size={12} inset={8} tone="accent" />
          <dl className="grid grid-cols-3 gap-3">
            {COUNTS.map((c, i) => (
              <div key={c.label} className="flex flex-col gap-1.5">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">{c.label}</dt>
                <dd className="font-display text-[clamp(2rem,6vw,3.25rem)] font-bold leading-none tabular-nums">
                  <ScrambleText text={c.value} delay={0.6 + i * 0.12} duration={0.9} glyphs="0123456789" />
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
              <span>Stack frequency</span>
              <span className="tabular-nums">n = {pad2(techProjects.length)}</span>
            </div>
            <ul className="mt-4 flex flex-col gap-2.5" aria-label="Most used technologies across projects">
              {FREQUENCY.map((s, i) => (
                <li key={s.name} className="grid grid-cols-[minmax(0,7.5rem)_1fr_2.5rem] items-center gap-3 font-mono text-[11px]">
                  <span className="truncate text-paper/80">{s.name}</span>
                  <span aria-hidden="true" className="relative h-[3px] overflow-hidden rounded-full bg-line">
                    <motion.span
                      className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-linear-to-r from-tech to-tech-2"
                      initial={reduced ? false : { scaleX: 0 }}
                      animate={show ? { scaleX: s.count / MAX_COUNT } : undefined}
                      transition={{ duration: 1.2, ease: ease.out, delay: 0.8 + i * 0.08 }}
                    />
                  </span>
                  <span className="text-right tabular-nums text-mute">
                    <span className="sr-only">used in </span>
                    {pad2(s.count)}
                    <span className="sr-only"> projects</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </motion.aside>
      </div>

      {/* Scroll cue */}
      <div aria-hidden="true" className="mt-12 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-mute md:mt-16">
        <span className="relative h-8 w-px overflow-hidden bg-line">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-tech-2"
            initial={false}
            animate={reduced ? undefined : { y: ["-100%", "200%"] }}
            transition={{ duration: 1.8, ease: ease.inOut, repeat: Infinity, repeatDelay: 0.2 }}
          />
        </span>
        <span>Scroll · 01 Projects</span>
      </div>
    </header>
  );
}
