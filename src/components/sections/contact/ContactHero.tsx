"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { HudFrame, KineticText, Marquee, ScrambleText } from "@/components/motion";
import { profile } from "@/data/portfolio";
import { ease, usePrefersReducedMotion } from "@/lib/motion";
import { useIntroReady } from "@/lib/transition";

/**
 * Contact hero over the calm hub scene: a two-line kinetic headline that splits the dual identity
 * ("Let's build." in indigo, "Let's cut." in crimson) around an edit-point marker, the availability line,
 * and a roles ticker. The middle of the viewport stays open so the hub core reads behind the type.
 */
export default function ContactHero() {
  const ready = useIntroReady();
  const reduced = usePrefersReducedMotion();
  const rise = reduced ? 0 : 18;
  const [buildRole, cutRole] = profile.roles;

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: rise },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: rise },
    transition: { duration: reduced ? 0.2 : 0.9, delay: reduced ? 0 : delay, ease: ease.out },
  });

  return (
    <section aria-labelledby="contact-title" className="relative flex min-h-[100svh] flex-col overflow-hidden">
      {/* Viewfinder: sits below the fixed nav. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-20 top-[var(--nav-height)] hidden md:block">
        <HudFrame rec recLabel="Open channel" label="CH.04 — Contact" timecode fps={24} inset={20} size={22} />
      </div>

      <div className="container-x relative flex flex-1 flex-col pb-10 pt-[calc(var(--nav-height)+2.5rem)] md:pb-16 md:pt-[calc(var(--nav-height)+4rem)]">
        {/* Slate row */}
        <motion.div {...fadeUp(0.1)} className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 md:px-8">
          <p className="eyebrow">
            <span className="text-paper">04</span>
            <span className="mx-2 text-paper/30">/</span>04
            <span className="mx-3 inline-block h-px w-8 translate-y-[-0.3em] bg-line" aria-hidden="true" />
            <ScrambleText text="Contact" delay={0.2} />
          </p>
          {(buildRole || cutRole) && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mute sm:text-[11px]">
              {buildRole && (
                <>
                  <dt>Build</dt>
                  <dd className="text-tech-2">{buildRole}</dd>
                </>
              )}
              {cutRole && (
                <>
                  <dt>Cut</dt>
                  <dd className="text-edit-2">{cutRole}</dd>
                </>
              )}
            </dl>
          )}
        </motion.div>

        <div className="flex-1" />

        {/* Headline */}
        <h1
          id="contact-title"
          className="font-display text-[clamp(2.25rem,10.5vw,10rem)] font-bold [text-shadow:0_0_28px_rgb(7_7_10/0.95),0_0_8px_rgb(7_7_10/0.9)] uppercase leading-[0.86] tracking-[-0.045em] md:px-8"
        >
          <KineticText as="span" text="Let's build." className="block text-tech" delay={0.15} />
          <span aria-hidden="true" className="relative my-[0.06em] flex items-center gap-3 md:gap-5">
            <motion.span
              className="h-px flex-1 origin-left bg-linear-to-r from-tech via-paper/40 to-edit"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: ready ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 1.4, delay: reduced ? 0 : 0.5, ease: ease.inOut }}
            />
            <motion.span
              {...fadeUp(1.1)}
              className="shrink-0 font-mono text-[10px] font-normal normal-case tracking-[0.2em] text-mute md:text-[11px]"
            >
              ✂ CUT · 00:00:04:12
            </motion.span>
          </span>
          <KineticText as="span" text="Let's cut." className="block text-edit sm:pl-[1.1em]" delay={0.4} />
        </h1>

        {/* Availability + cue */}
        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end md:px-8">
          {profile.availability && (
            <motion.p
              {...fadeUp(0.9)}
              className="flex max-w-xl items-start gap-3 text-base leading-relaxed text-paper/80 md:col-span-7 md:text-lg"
            >
              <span className="relative mt-[0.55em] flex size-2 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <span>{profile.availability}</span>
            </motion.p>
          )}
          <motion.a
            {...fadeUp(1.05)}
            href="#contact-lanes"
            className="group inline-flex w-fit items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mute transition-colors hover:text-paper md:col-span-5 md:justify-self-end"
          >
            Choose a lane
            <span className="relative inline-flex size-9 items-center justify-center overflow-hidden rounded-full border border-line transition-colors group-hover:border-paper/50">
              <ArrowDown
                aria-hidden="true"
                className="size-4 transition-transform duration-500 ease-expo group-hover:translate-y-[150%]"
              />
              <ArrowDown
                aria-hidden="true"
                className="absolute size-4 -translate-y-[150%] transition-transform duration-500 ease-expo group-hover:translate-y-0"
              />
            </span>
          </motion.a>
        </div>
      </div>

      {profile.roles.length > 0 && (
        <motion.div {...fadeUp(1.2)} className="relative border-y border-line bg-ink/60 fine:bg-ink/30 fine:backdrop-blur-[2px]">
          <Marquee
            items={profile.roles}
            speed={45}
            className="py-4 font-display text-xl uppercase tracking-tight text-paper/70 md:py-5 md:text-3xl"
          />
        </motion.div>
      )}
    </section>
  );
}
