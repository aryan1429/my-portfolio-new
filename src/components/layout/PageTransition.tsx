"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import { cn } from "@/lib/cn";
import { formatTimecode, gsapEase, prefersReducedMotion } from "@/lib/motion";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { getRouteSide, navItems, normalizePath } from "@/lib/site";
import { registerTransitionDriver, setTransitionPhase, useTransitionState } from "@/lib/transition";

const PANEL_DURATION = 0.38;
const PANEL_STAGGER = 0.07;
/** Reveal anyway if the destination never commits (network error, 404 boundary...). */
const REVEAL_TIMEOUT_MS = 6000;

/**
 * Full-screen "editor's cut" wipe. Two staggered panels sweep right → left with an indigo and a
 * crimson leading edge, hold on a slate (route label + ticking timecode) while the next route is
 * pushed, then continue off-screen once the new pathname has rendered. ~0.9 s end to end.
 */
export default function PageTransition() {
  const { phase, label, href, id } = useTransitionState();
  const pathname = usePathname();
  const router = useRouter();

  const panelA = useRef<HTMLDivElement>(null);
  const panelB = useRef<HTMLDivElement>(null);
  const slate = useRef<HTMLDivElement>(null);
  const timecode = useRef<HTMLSpanElement>(null);
  const targetPath = useRef<string | null>(null);

  useEffect(() => registerTransitionDriver(), []);

  // Park both panels off-screen right.
  useLayoutEffect(() => {
    gsap.set([panelA.current, panelB.current], { xPercent: 100, autoAlpha: 1 });
    gsap.set(slate.current, { autoAlpha: 0 });
  }, []);

  // Ticking timecode while the wipe is on screen (DOM writes only, no React state).
  useEffect(() => {
    if (phase === "idle") return;
    let raf = 0;
    const loop = () => {
      if (timecode.current) timecode.current.textContent = formatTimecode(performance.now() / 1000, 24);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // COVER
  useEffect(() => {
    if (phase !== "covering") return;
    lockScroll("transition");
    const a = panelA.current;
    const b = panelB.current;
    const s = slate.current;
    if (!a || !b || !s) return;
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline({ onComplete: () => setTransitionPhase("covered") });

    if (reduced) {
      gsap.set(a, { xPercent: 0, autoAlpha: 0 });
      gsap.set(b, { xPercent: 0, autoAlpha: 0 });
      tl.to(b, { autoAlpha: 1, duration: 0.18, ease: "none" }).set(s, { autoAlpha: 1 });
    } else {
      gsap.set([a, b], { xPercent: 100, autoAlpha: 1 });
      gsap.set(s, { autoAlpha: 0 });
      const words = s.querySelectorAll<HTMLElement>("[data-slate-rise]");
      tl.to(a, { xPercent: 0, duration: PANEL_DURATION, ease: gsapEase.inOut })
        .to(b, { xPercent: 0, duration: PANEL_DURATION, ease: gsapEase.inOut }, PANEL_STAGGER)
        .set(s, { autoAlpha: 1 }, PANEL_STAGGER + PANEL_DURATION * 0.45)
        .fromTo(
          words,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.32, ease: gsapEase.out, stagger: 0.03 },
          PANEL_STAGGER + PANEL_DURATION * 0.45,
        );
    }
    return () => {
      tl.kill();
    };
  }, [phase, id]);

  // COVERED → push the route, wait for it to render.
  useEffect(() => {
    if (phase !== "covered" || !href) return;
    const destination = normalizePath(href);
    targetPath.current = destination;
    router.push(href, { scroll: false });
    const timeout = window.setTimeout(() => setTransitionPhase("revealing"), REVEAL_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [phase, href, router]);

  useEffect(() => {
    if (phase !== "covered" || targetPath.current === null) return;
    if (normalizePath(pathname) !== targetPath.current) return;
    // Give the new route two frames to paint (and ScrollReset to jump to top) before revealing.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setTransitionPhase("revealing"));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [phase, pathname]);

  // REVEAL
  useEffect(() => {
    if (phase !== "revealing") return;
    const a = panelA.current;
    const b = panelB.current;
    const s = slate.current;
    const finish = () => {
      targetPath.current = null;
      if (a && b) gsap.set([a, b], { xPercent: 100, autoAlpha: 1 });
      if (s) gsap.set(s, { autoAlpha: 0 });
      unlockScroll("transition");
      setTransitionPhase("idle");
    };
    if (!a || !b || !s) {
      finish();
      return;
    }
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline({ onComplete: finish });
    if (reduced) {
      tl.set(s, { autoAlpha: 0 }).to(b, { autoAlpha: 0, duration: 0.18, ease: "none" });
    } else {
      tl.to(s, { autoAlpha: 0, duration: 0.12, ease: "none" }, 0)
        .to(b, { xPercent: -100, duration: PANEL_DURATION, ease: gsapEase.inOut }, 0)
        .to(a, { xPercent: -100, duration: PANEL_DURATION, ease: gsapEase.inOut }, PANEL_STAGGER);
    }
    return () => {
      tl.kill();
    };
  }, [phase]);

  // Release the lock if the driver unmounts mid-transition.
  useEffect(() => () => unlockScroll("transition"), []);

  const destination = href ? normalizePath(href) : null;
  const navIndex = destination ? navItems.findIndex((n) => n.href === destination) : -1;
  const cut = navIndex >= 0 ? navItems[navIndex].index : "--";
  const side = destination ? getRouteSide(destination) : "home";
  const active = phase !== "idle";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-[90] overflow-hidden",
        active ? "visible pointer-events-auto" : "invisible pointer-events-none",
      )}
    >
      {/* Panel A — indigo slab (its edges are the indigo leading/trailing cut). */}
      <div ref={panelA} className="absolute inset-0 bg-tech" />

      {/* Panel B — dark slab with crimson edges, carries the slate. */}
      <div ref={panelB} className="absolute inset-0 bg-ink-2">
        <span className="absolute inset-y-0 left-0 w-[3px] bg-edit shadow-[0_0_24px_4px_rgb(255_46_77/0.55)]" />
        <span className="absolute inset-y-0 right-0 w-[3px] bg-edit shadow-[0_0_24px_4px_rgb(255_46_77/0.55)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px)] [background-size:calc(100%/12)_100%]"
        />

        <div ref={slate} className="absolute inset-0 flex flex-col justify-between p-5 md:p-10">
          <div className="flex items-start justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
            <span className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-edit animate-blink" />
              <span className="overflow-hidden">
                <span data-slate-rise className="inline-block">
                  Cut {cut} / {String(navItems.length).padStart(2, "0")}
                </span>
              </span>
            </span>
            <span className="overflow-hidden">
              <span data-slate-rise className="inline-block">
                {side === "tech" ? "Source · Code" : side === "edits" ? "Source · Timeline" : "Source · Reel"}
              </span>
            </span>
          </div>

          <div className="flex flex-col items-start gap-4">
            <span className="overflow-hidden">
              <span data-slate-rise className="eyebrow inline-block">
                Next scene
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <span
                data-slate-rise
                className={cn(
                  "inline-block font-display text-[clamp(3.5rem,14vw,13rem)] font-bold uppercase leading-[0.85] tracking-[-0.04em]",
                  side === "tech" && "text-tech",
                  side === "edits" && "text-edit",
                  (side === "home" || side === "contact") && "text-dual",
                )}
              >
                {label || " "}
              </span>
            </span>
          </div>

          <div className="flex items-end justify-between gap-6 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
            <span className="overflow-hidden">
              <span data-slate-rise className="inline-block text-paper">
                <span ref={timecode}>00:00:00:00</span>
              </span>
            </span>
            <span className="hidden h-px flex-1 bg-linear-to-r from-tech via-paper/20 to-edit md:block" />
            <span className="overflow-hidden">
              <span data-slate-rise className="inline-block">
                {destination ?? "/"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
