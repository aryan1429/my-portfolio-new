"use client";

import { ArrowUpRight, Mail } from "lucide-react";
import TransitionLink from "@/components/layout/TransitionLink";
import { HudFrame, KineticText, MagneticButton, Reveal } from "@/components/motion";
import { profile } from "@/data/portfolio";

/** Closing slate for the edits page: editing enquiries → /contact (plus a direct email if on file). */
export default function EditsCta() {
  return (
    <section aria-labelledby="edits-cta-title" className="relative pb-24 md:pb-32">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-ink/85 px-6 py-16 fine:bg-ink/60 fine:backdrop-blur-md md:px-14 md:py-24">
          <HudFrame rec recLabel="NEXT IN QUEUE" timecode size={20} inset={14} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-1/4 -bottom-1/2 h-[120%] w-[80%] rounded-full bg-[radial-gradient(closest-side,rgb(255_46_77/0.22),rgb(255_176_32/0.08)_60%,transparent)] blur-2xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="eyebrow mb-6 flex items-center gap-3">
                <span className="text-edit">02</span>
                <span aria-hidden="true" className="h-px w-10 bg-linear-to-r from-edit to-transparent" />
                Editing &amp; motion work
              </p>
              <KineticText
                as="h2"
                id="edits-cta-title"
                mode="words"
                trigger="inView"
                text={"Got footage?\nLet's cut it."}
                className="font-display text-[clamp(2.5rem,7.5vw,6.5rem)] leading-[0.92] font-bold tracking-[-0.03em] text-paper"
              />
              {profile.availability ? (
                <Reveal delay={0.15} className="mt-6 max-w-xl">
                  <p className="text-base leading-relaxed text-mute md:text-lg">{profile.availability}</p>
                </Reveal>
              ) : null}
            </div>

            <Reveal delay={0.25} className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:flex-col lg:items-end">
              <MagneticButton
                as={TransitionLink}
                href="/contact"
                label="Contact"
                data-cursor="Brief me"
                className="gap-3 rounded-full bg-edit px-7 py-4 font-medium text-paper shadow-[0_18px_50px_-18px_var(--color-edit)] transition-colors hover:bg-edit/90"
              >
                Start an edit <ArrowUpRight className="size-4" aria-hidden="true" />
              </MagneticButton>
              {profile.email ? (
                <MagneticButton
                  as="a"
                  href={`mailto:${profile.email}`}
                  className="gap-3 rounded-full border border-line bg-ink/40 px-6 py-4 font-mono text-[12px] tracking-[0.06em] text-paper/85 transition-colors hover:border-paper/40 hover:text-paper"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  <span className="max-w-[16rem] truncate">{profile.email}</span>
                </MagneticButton>
              ) : null}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
