"use client";

import { ArrowUpRight } from "lucide-react";
import TransitionLink from "@/components/layout/TransitionLink";
import { HudFrame, KineticText, MagneticButton, Reveal } from "@/components/motion";
import { profile } from "@/data/portfolio";

/**
 * 05 — Closing slate: big kinetic line and a magnetic call to /contact.
 * (Client component because it hands `TransitionLink` to MagneticButton as its `as` component.)
 */
export default function ClosingCta() {
  return (
    <section id="next" aria-labelledby="cta-title" className="relative py-24 md:py-36">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-ink/40 px-5 py-20 md:px-14 md:py-28">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(60%_60%_at_15%_100%,rgb(91_108_255/0.22),transparent_70%),radial-gradient(60%_60%_at_85%_0%,rgb(255_46_77/0.2),transparent_70%)]"
          />
          <HudFrame rec recLabel="Next scene" timecode fps={24} size={20} inset={16} />

          <div className="relative flex flex-col items-start gap-10 md:gap-14">
            <p className="eyebrow">
              <span className="text-paper/80">05</span>
              <span className="mx-2 text-paper/25">/</span>
              Next scene
            </p>

            <h2
              id="cta-title"
              className="font-display text-[clamp(2.75rem,10vw,9.5rem)] leading-[0.88] font-bold tracking-[-0.04em] uppercase"
            >
              <KineticText as="span" text="Let's make" trigger="inView" className="block" />{" "}
              <KineticText
                as="span"
                text="something"
                trigger="inView"
                delay={0.18}
                className="block md:pl-[10vw]"
                unitClassName="text-dual"
              />
            </h2>

            <div className="flex w-full flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <Reveal delay={0.2} className="max-w-md">
                <p className="text-base leading-relaxed text-paper/75 md:text-lg">{profile.tagline}</p>
                {profile.availability && (
                  <p className="mt-4 flex items-start gap-2 font-mono text-xs leading-relaxed text-paper/60">
                    <span
                      aria-hidden="true"
                      className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153)]"
                    />
                    {profile.availability}
                  </p>
                )}
              </Reveal>

              <Reveal delay={0.3} blur={0}>
                <MagneticButton
                  as={TransitionLink}
                  href="/contact"
                  label="Contact"
                  data-cursor="Say hi"
                  strength={0.4}
                  className="group inline-flex items-center gap-3 rounded-full bg-paper px-8 py-5 font-medium text-ink transition-colors duration-500 hover:bg-accent hover:text-accent-contrast md:px-10 md:py-6 md:text-lg"
                >
                  Start a conversation
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-5 transition-transform duration-500 ease-expo group-hover:rotate-45"
                  />
                </MagneticButton>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
