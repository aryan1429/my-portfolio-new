"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDown } from "lucide-react";
import { HudFrame, KineticText, Reveal, ScrambleText } from "@/components/motion";
import { profile } from "@/data/portfolio";
import { cn } from "@/lib/cn";
import { pointerState } from "@/lib/pointer";
import { scrollTo } from "@/lib/scroll";
import { useIntroReady } from "@/lib/transition";
import { pad2 } from "./data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ROLE_TONE = [
  { text: "text-tech", rule: "border-tech/50", tag: "text-tech-2", label: "Tech" },
  { text: "text-edit", rule: "border-edit/50", tag: "text-edit-2", label: "Edits" },
] as const;

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const FINE_POINTER = "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)";

/**
 * Full-viewport title card over the HubScene core: kinetic name, scramble-decoded roles, tagline and a
 * camera HUD. Type layers drift with the pointer (GSAP ticker → quickSetter, no React state) and the
 * whole block recedes as the hero scrolls away.
 */
export default function HomeHero() {
  const rootRef = useRef<HTMLElement | null>(null);
  const exitRef = useRef<HTMLDivElement | null>(null);
  const cueRef = useRef<HTMLSpanElement | null>(null);
  const intro = useIntroReady();
  const roles = profile.roles.slice(0, 2);

  useGSAP(
    () => {
      const root = rootRef.current;
      const exit = exitRef.current;
      if (!root || !exit) return;
      const mm = gsap.matchMedia();

      // Pointer parallax: each [data-depth] layer drifts opposite to the pointer by `depth` px.
      mm.add(FINE_POINTER, () => {
        const layers = gsap.utils.toArray<HTMLElement>("[data-depth]", root).map((el) => ({
          depth: Number(el.dataset.depth) || 0,
          setX: gsap.quickSetter(el, "x", "px"),
          setY: gsap.quickSetter(el, "y", "px"),
        }));
        let cx = 0;
        let cy = 0;
        let visible = true;
        const io = new IntersectionObserver(([entry]) => {
          visible = entry?.isIntersecting ?? true;
        });
        io.observe(root);

        const tick = (_time: number, deltaMs: number) => {
          if (!visible) return;
          const k = 1 - Math.pow(1 - 0.075, Math.min(deltaMs, 64) / 16.667);
          cx += (pointerState.nx - cx) * k;
          cy += (pointerState.ny - cy) * k;
          for (const layer of layers) {
            layer.setX(-cx * layer.depth);
            layer.setY(cy * layer.depth);
          }
        };
        gsap.ticker.add(tick);
        return () => {
          gsap.ticker.remove(tick);
          io.disconnect();
        };
      });

      mm.add(MOTION_OK, () => {
        // Depth exit: the title card recedes and fades as the gateways rise over the core.
        gsap.to(exit, {
          yPercent: -14,
          scale: 0.94,
          opacity: 0,
          ease: "none",
          transformOrigin: "50% 100%",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });

        const cue = cueRef.current;
        if (cue) {
          gsap.fromTo(
            cue,
            { yPercent: -100 },
            { yPercent: 100, duration: 1.6, ease: "power3.inOut", repeat: -1, repeatDelay: 0.25 },
          );
        }
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="intro"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col overflow-hidden"
    >
      {/* Soft vignette so the type reads over the bright core without hiding the canvas. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_100%,rgb(7_7_10/0.75),transparent_60%)]"
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-x-3 top-[calc(var(--nav-height)+0.25rem)] bottom-3 transition-opacity duration-1000 ease-expo md:inset-x-5 md:bottom-5",
          intro ? "opacity-100" : "opacity-0",
        )}
      >
        <HudFrame rec timecode fps={24} label={profile.location} size={22} inset={0} />
      </div>

      <div
        ref={exitRef}
        className="container-x relative flex flex-1 flex-col justify-end pt-[calc(var(--nav-height)+4.5rem)] pb-[clamp(6.5rem,15svh,9.5rem)] will-change-transform"
      >
        <div data-depth="10" className="mb-6 flex items-center justify-between gap-4 md:mb-8">
          <p className="eyebrow">
            <span className="text-paper/80">00</span>
            <span className="mx-2 text-paper/25">/</span>
            Title card
          </p>
          <p className="eyebrow hidden sm:block">
            <span className="text-tech">Tech</span>
            <span className="mx-2 text-paper/40">×</span>
            <span className="text-edit">Edits</span>
          </p>
        </div>

        <h1
          id="hero-title"
          data-depth="22"
          className="font-display text-[clamp(3.4rem,15.5vw,14.5rem)] leading-[0.82] font-bold tracking-[-0.045em] uppercase [text-shadow:0_0_24px_rgb(7_7_10/0.75)]"
        >
          <KineticText as="span" text={profile.firstName} className="block" delay={0.1} stagger={0.045} />{" "}
          <KineticText
            as="span"
            text={profile.lastName}
            className="block md:pl-[12vw]"
            unitClassName="text-transparent [-webkit-text-stroke:1px_rgb(244_244_246/0.92)] md:[-webkit-text-stroke-width:2px]"
            delay={0.32}
            stagger={0.045}
          />
        </h1>

        <div data-depth="12" className="mt-8 grid gap-6 md:mt-12 md:grid-cols-12 md:items-end md:gap-10">
          <ul className="grid gap-4 sm:grid-cols-2 md:col-span-7 md:gap-6" aria-label="Roles">
            {roles.map((role, i) => {
              const tone = ROLE_TONE[i] ?? ROLE_TONE[0];
              return (
                <li key={role} className={cn("border-t pt-3", tone.rule)}>
                  <span className={cn("block font-mono text-[10px] tracking-[0.22em] uppercase", tone.tag)}>
                    {pad2(i + 1)} — {tone.label}
                  </span>
                  <ScrambleText
                    as="span"
                    text={role}
                    delay={0.95 + i * 0.25}
                    duration={1.3}
                    className={cn(
                      "mt-2 font-mono text-[13px] leading-snug font-medium tracking-[0.04em] uppercase md:text-sm",
                      tone.text,
                    )}
                  />
                </li>
              );
            })}
          </ul>

          <Reveal delay={1.35} className="md:col-span-5 md:justify-self-end">
            <p className="max-w-md text-base leading-relaxed text-paper/80 md:text-right md:text-lg">
              {profile.tagline}
            </p>
          </Reveal>
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollTo("#gateways", { duration: 1.4 })}
        className={cn(
          "group absolute bottom-[clamp(1.75rem,4svh,2.75rem)] left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-paper/70 uppercase transition-[color,opacity] duration-700 hover:text-paper",
          intro ? "opacity-100" : "opacity-0",
        )}
      >
        <span>Scroll</span>
        <span aria-hidden="true" className="relative block h-10 w-px overflow-hidden bg-paper/15">
          <span ref={cueRef} className="absolute inset-0 block bg-paper" />
        </span>
        <ArrowDown
          aria-hidden="true"
          className="size-3.5 transition-transform duration-500 ease-expo group-hover:translate-y-1"
        />
        <span className="sr-only">to the gateways</span>
      </button>
    </section>
  );
}
