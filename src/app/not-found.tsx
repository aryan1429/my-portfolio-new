import type { Metadata } from "next";
import TransitionLink from "@/components/layout/TransitionLink";
import { navItems } from "@/lib/site";

export const metadata: Metadata = {
  title: "Frame not found",
  description: "This page was cut from the final edit.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const links = navItems.filter((item) => item.href !== "/");

  return (
    <section className="container-x relative flex min-h-svh flex-col justify-center pb-24 pt-[calc(var(--nav-height)+3rem)]">
      {/* HUD corners */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 bottom-10 top-[calc(var(--nav-height)+1rem)] md:inset-x-10">
        <span className="absolute left-0 top-0 size-6 border-l border-t border-paper/25" />
        <span className="absolute right-0 top-0 size-6 border-r border-t border-paper/25" />
        <span className="absolute bottom-0 left-0 size-6 border-b border-l border-paper/25" />
        <span className="absolute bottom-0 right-0 size-6 border-b border-r border-paper/25" />
      </div>

      <div className="relative flex flex-col gap-8 md:px-10">
        <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
          <span className="inline-block size-2 rounded-full bg-edit animate-blink" />
          Media offline
          <span className="text-paper/25">/</span>
          <span className="tabular-nums text-paper/70">00:00:04:04</span>
        </p>

        <h1 className="relative w-fit select-none font-display text-[clamp(7rem,32vw,26rem)] font-bold leading-[0.8] tracking-[-0.06em]">
          <span aria-hidden="true" className="absolute inset-0 translate-x-[0.03em] text-edit/70 mix-blend-screen">
            404
          </span>
          <span aria-hidden="true" className="absolute inset-0 -translate-x-[0.03em] text-tech/80 mix-blend-screen">
            404
          </span>
          <span className="relative text-paper">404</span>
          <span className="sr-only"> — page not found</span>
        </h1>

        <div className="legible flex max-w-xl flex-col gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-4xl">This frame was cut.</h2>
          <p className="text-base leading-relaxed text-paper/70">
            The page you&apos;re looking for didn&apos;t make the final edit — it may have moved, or the link is
            out of sync. Jump back to the timeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TransitionLink
            href="/"
            label="Home"
            data-magnetic
            className="group inline-flex h-12 items-center gap-3 rounded-full bg-paper px-6 font-mono text-xs uppercase tracking-[0.2em] text-ink transition-colors hover:bg-accent hover:text-accent-contrast"
          >
            Back to start
            <span aria-hidden="true" className="transition-transform duration-500 ease-expo group-hover:-translate-x-1">
              ←
            </span>
          </TransitionLink>
          {links.map((item) => (
            <TransitionLink
              key={item.href}
              href={item.href}
              label={item.label}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-paper/20 px-5 font-mono text-xs uppercase tracking-[0.2em] text-paper/80 transition-colors hover:border-accent hover:text-accent"
            >
              <span className="text-mute">{item.index}</span>
              {item.label}
            </TransitionLink>
          ))}
        </div>
      </div>
    </section>
  );
}
