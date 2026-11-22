"use client";

import { useSyncExternalStore } from "react";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import TransitionLink from "@/components/layout/TransitionLink";
import { profile, socials } from "@/data/portfolio";
import { scrollTo } from "@/lib/scroll";
import { navItems } from "@/lib/site";

const noopSubscribe = () => () => {};
const readYear = () => new Date().getFullYear();
const serverYear = () => null;

/** Current year, read on the client only (no `new Date()` in the prerendered shell). */
function useYear(): number | null {
  return useSyncExternalStore(noopSubscribe, readYear, serverYear);
}

/**
 * Closing slate: giant "Let's work" call to /contact, socials, sitemap, © year and back-to-top.
 */
export default function Footer() {
  const year = useYear();
  const external = socials.filter((s) => s.id !== "email");
  const email = profile.email;

  return (
    <footer className="relative z-10 overflow-hidden border-t border-line bg-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1/2 left-1/2 h-[80%] w-[120%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(91_108_255/0.16),rgb(255_46_77/0.08)_55%,transparent)] blur-2xl"
      />

      <div className="container-x relative pb-8 pt-20 md:pt-28">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow">(End credits)</p>
          {profile.availability && (
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/70">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Available for work
            </p>
          )}
        </div>

        <TransitionLink
          href="/contact"
          label="Contact"
          data-cursor="Say hi"
          className="group mt-8 block w-fit max-w-full md:mt-10"
        >
          <span className="flex items-end gap-[0.12em] font-display text-[clamp(3.5rem,15.5vw,15rem)] font-bold uppercase leading-[0.82] tracking-[-0.05em]">
            <span className="relative block">
              <span className="block transition-opacity duration-500 group-hover:opacity-0">Let&apos;s work</span>
              <span
                aria-hidden="true"
                className="text-dual absolute inset-0 block opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              >
                Let&apos;s work
              </span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              strokeWidth={1.25}
              className="mb-[0.08em] size-[0.6em] shrink-0 text-accent transition-transform duration-700 ease-expo group-hover:rotate-45"
            />
          </span>
        </TransitionLink>

        {email && (
          <a
            href={`mailto:${email}`}
            className="mt-6 inline-block break-all font-mono text-sm text-paper/70 underline decoration-line underline-offset-8 transition-colors hover:text-accent hover:decoration-accent md:text-base"
          >
            {email}
          </a>
        )}

        <div className="mt-16 grid gap-10 border-t border-line pt-10 sm:grid-cols-2 md:mt-24 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-4">Profile</p>
            <p className="max-w-sm text-sm leading-relaxed text-paper/70">{profile.tagline}</p>
            {profile.location && <p className="mt-4 font-mono text-xs text-mute">{profile.location}</p>}
          </div>

          <nav aria-label="Footer" className="lg:col-span-3">
            <p className="eyebrow mb-4">Index</p>
            <ul className="flex flex-col gap-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <TransitionLink
                    href={item.href}
                    label={item.label}
                    className="group inline-flex items-baseline gap-3 text-sm text-paper/80 transition-colors hover:text-accent"
                  >
                    <span className="font-mono text-[10px] text-mute">{item.index}</span>
                    {item.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <p className="eyebrow mb-4">Elsewhere</p>
            <ul className="flex flex-col gap-2">
              {external.map((s) => {
                const isHttp = /^https?:\/\//.test(s.href);
                return (
                  <li key={s.id}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel={isHttp ? "noopener noreferrer" : undefined}
                      className="group inline-flex items-center gap-2 text-sm text-paper/80 transition-colors hover:text-accent"
                    >
                      <span>{s.label}</span>
                      {s.handle && <span className="font-mono text-[11px] text-mute">{s.handle}</span>}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col-reverse gap-4 border-t border-line pt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-mute sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year ?? ""} {profile.name}
            <span className="mx-2 text-paper/20">/</span>
            {profile.roles.slice(0, 2).join(" & ")}
          </p>
          <button
            type="button"
            onClick={() => scrollTo(0, { duration: 1.6 })}
            className="group inline-flex w-fit items-center gap-2 text-paper/80 transition-colors hover:text-accent"
          >
            Back to top
            <span className="grid size-7 place-items-center rounded-full border border-paper/20 transition-colors group-hover:border-accent">
              <ArrowUp aria-hidden="true" className="size-3.5 transition-transform duration-500 ease-expo group-hover:-translate-y-0.5" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
