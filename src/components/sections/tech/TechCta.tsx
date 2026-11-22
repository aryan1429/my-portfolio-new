"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import TransitionLink from "@/components/layout/TransitionLink";
import { HudFrame, KineticText, MagneticButton, Reveal } from "@/components/motion";
import { portfolio, socials } from "@/data/portfolio";

const GITHUB = socials.find((s) => s.id === "github");
/** "github.com/<user>" from the social handle, else from the URL's last path segment. */
const HANDLE = GITHUB?.handle ?? portfolio.githubUrl.replace(/\/+$/, "").split("/").pop() ?? "";

/** Closing call to action for /tech: "More on GitHub" → githubUrl, plus a cut over to the edits side. */
export default function TechCta() {
  return (
    <section aria-labelledby="tech-cta-title" className="container-x relative pb-28 pt-8 md:pb-40">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-linear-to-br from-tech/[0.14] via-ink-2/60 to-tech-2/[0.06] px-6 py-14 md:px-14 md:py-20">
        <HudFrame size={16} inset={14} tone="accent" label="EOF · /tech" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />

        <div className="relative flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5">
            <Reveal y={10} blur={0}>
              <p className="eyebrow flex items-center gap-3">
                <span className="text-tech-2 tabular-nums">02</span>
                <span aria-hidden="true" className="h-px w-10 bg-linear-to-r from-tech to-transparent" />
                <span>Source</span>
              </p>
            </Reveal>
            <KineticText
              as="h2"
              id="tech-cta-title"
              text={"More on\nGitHub"}
              mode="words"
              trigger="inView"
              className="font-display text-[clamp(2.75rem,9vw,8rem)] font-bold uppercase leading-[0.88] tracking-[-0.045em]"
            />
            <Reveal delay={0.15} blur={0}>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-mute">
                github.com/<span className="text-paper/85">{HANDLE}</span>
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="flex flex-wrap items-center gap-4">
            <MagneticButton
              as="a"
              href={portfolio.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-full bg-paper px-7 py-4 text-sm font-semibold text-ink"
            >
              Open GitHub
              <ArrowUpRight className="size-4" aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </MagneticButton>
            <MagneticButton
              as={TransitionLink}
              href="/edits"
              label="Edits"
              className="flex items-center gap-2.5 rounded-full border border-line px-6 py-4 text-sm font-medium text-paper/85 transition-colors hover:border-edit/60 hover:text-paper"
            >
              Switch to edits
              <ArrowRight className="size-4 text-edit" aria-hidden="true" />
            </MagneticButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
