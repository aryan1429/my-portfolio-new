"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import TransitionLink from "@/components/layout/TransitionLink";
import { HudFrame, Reveal, SectionHeading } from "@/components/motion";
import type { TechProject, VideoEdit } from "@/data/types";
import { cn } from "@/lib/cn";
import { formatTimecode } from "@/lib/motion";
import { durationSeconds, featuredEdits, featuredTech, pad2 } from "./data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Horizontal scrub only where it makes sense: wide screens, motion allowed. Must match the `lg:motion-safe:` classes. */
const SCRUB_QUERY = "(min-width: 64rem) and (prefers-reduced-motion: no-preference)";

/** Horizontal mode = `lg:motion-safe:` prefix. */
type Aspect = NonNullable<VideoEdit["aspect"]>;
const FRAME: Record<Aspect | "default", { aspect: string; width: string }> = {
  "9:16": { aspect: "aspect-[9/16]", width: "lg:motion-safe:w-[calc(42svh*0.5625)]" },
  "1:1": { aspect: "aspect-square", width: "lg:motion-safe:w-[42svh]" },
  "4:5": { aspect: "aspect-[4/5]", width: "lg:motion-safe:w-[calc(42svh*0.8)]" },
  "16:9": { aspect: "aspect-video", width: "lg:motion-safe:w-[calc(42svh*1.7778)]" },
  default: { aspect: "aspect-[4/5]", width: "lg:motion-safe:w-[calc(42svh*0.8)]" },
};

const TECH = featuredTech();
const EDITS = featuredEdits();
const TOTAL = TECH.length + EDITS.length;

function TechCard({ project, index }: { project: TechProject; index: number }) {
  const meta = [project.categories.join(" / "), project.year].filter(Boolean).join(" · ");
  return (
    <li data-card className="min-w-0 shrink-0 lg:motion-safe:w-[calc(36svh*1.6)]">
      <TransitionLink
        href={`/tech#${project.slug}`}
        label="Tech"
        data-cursor="View"
        className="group block"
        aria-label={`${project.title} — view on the Tech page`}
      >
        <article>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-ink-2 transition-colors duration-500 group-hover:border-tech/60">
            <div data-parallax className="absolute inset-0 lg:motion-safe:-inset-x-[7%]">
              <Image
                src={project.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 58svh, (min-width: 768px) 46vw, 100vw"
                className="object-cover object-top transition-transform duration-1000 ease-expo group-hover:scale-[1.04]"
              />
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(to_top,rgb(7_7_10/0.65),transparent_50%)] transition-opacity duration-500 group-hover:opacity-60"
            />
            <HudFrame label={`T—${pad2(index + 1)}`} resolution={project.liveLabel} size={14} inset={12} />
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.2em] uppercase">
            <span className="text-tech">
              {pad2(index + 1)}/{pad2(TOTAL)}
            </span>
            {meta && <span className="truncate text-mute">{meta}</span>}
          </div>
          <h4 className="mt-3 flex items-start justify-between gap-4 font-display text-2xl leading-tight font-bold tracking-tight md:text-3xl">
            <span>{project.title}</span>
            <ArrowUpRight
              aria-hidden="true"
              className="mt-1 size-6 shrink-0 text-tech transition-transform duration-500 ease-expo group-hover:rotate-45"
            />
          </h4>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper/70 md:text-base">{project.summary}</p>
          {project.stack.length > 0 && (
            <ul
              className="mt-4 flex flex-wrap gap-1.5 lg:motion-safe:[@media(max-height:46rem)]:hidden"
              aria-label="Stack"
            >
              {project.stack.slice(0, 5).map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-tech/25 px-2.5 py-1 font-mono text-[10px] text-paper/75"
                >
                  {item}
                </li>
              ))}
              {project.stack.length > 5 && (
                <li className="px-1 py-1 font-mono text-[10px] text-mute">+{project.stack.length - 5}</li>
              )}
            </ul>
          )}
        </article>
      </TransitionLink>
    </li>
  );
}

function EditFrame({ edit, index }: { edit: VideoEdit; index: number }) {
  const frame = FRAME[edit.aspect ?? "default"];
  const seconds = durationSeconds(edit.duration);
  const number = TECH.length + index + 1;
  return (
    <li data-card className={cn("shrink-0", frame.width)}>
      <TransitionLink
        href={`/edits#${edit.slug}`}
        label="Edits"
        data-cursor="Play"
        className="group block"
        aria-label={`${edit.title} — watch on the Edits page`}
      >
        <article>
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border border-line bg-ink-2 transition-colors duration-500 group-hover:border-edit/60",
              frame.aspect,
            )}
          >
            <div data-parallax className="absolute inset-0 lg:motion-safe:-inset-x-[7%]">
              <Image
                src={edit.thumbnail}
                alt=""
                fill
                sizes="(min-width: 1024px) 42svh, (min-width: 640px) 33vw, 50vw"
                className="object-cover saturate-[0.9] transition-[transform,filter] duration-1000 ease-expo group-hover:scale-[1.05] group-hover:saturate-[1.15]"
                style={edit.thumbnailPosition ? { objectPosition: edit.thumbnailPosition } : undefined}
              />
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(to_top,rgb(7_7_10/0.7),transparent_45%),linear-gradient(to_bottom,rgb(7_7_10/0.45),transparent_30%)]"
            />
            <HudFrame
              label={edit.aspect}
              resolution={seconds !== null ? formatTimecode(seconds, 24) : undefined}
              size={12}
              inset={10}
              className="opacity-80 transition-opacity duration-500 group-hover:opacity-100"
            />
            {/* Playhead sweep on hover (transform only). */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full opacity-0 transition-[transform,opacity] duration-[1200ms] ease-cut group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:hidden"
            >
              <span className="absolute inset-y-0 right-0 w-px bg-edit-2 shadow-[0_0_12px_var(--color-edit-2)]" />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.2em] uppercase">
            <span className="text-edit">
              {pad2(number)}/{pad2(TOTAL)}
            </span>
            <span className="truncate text-mute">{edit.category}</span>
          </div>
          <h4 className="mt-2 text-sm leading-snug font-semibold text-paper/90 transition-colors group-hover:text-paper md:text-base">
            {edit.title}
          </h4>
        </article>
      </TransitionLink>
    </li>
  );
}

/** Group marker: a slate card in the horizontal track, a sub-heading in the vertical list. */
function Slate({ side, count, title }: { side: "tech" | "edits"; count: number; title: string }) {
  const tech = side === "tech";
  return (
    <div className="flex shrink-0 items-end justify-between gap-4 border-b border-line pb-4 lg:motion-safe:h-[42svh] lg:motion-safe:w-56 lg:motion-safe:flex-col lg:motion-safe:items-start lg:motion-safe:justify-end lg:motion-safe:border-b-0 lg:motion-safe:border-l lg:motion-safe:pb-0 lg:motion-safe:pl-6">
      <span className={cn("font-mono text-[11px] tracking-[0.2em] uppercase", tech ? "text-tech" : "text-edit")}>
        {tech ? "A" : "B"} — {pad2(count)} {count === 1 ? "piece" : "pieces"}
      </span>
      <h3 className="font-display text-3xl leading-none font-bold tracking-tight uppercase md:text-4xl">{title}</h3>
    </div>
  );
}

/**
 * 03 — Selected work. Desktop: the section pins and the reel scrubs sideways with the scroll
 * (thumbnails parallax inside their frames). Mobile / reduced motion: plain vertical lists.
 */
export default function SelectedWork() {
  const rootRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(SCRUB_QUERY, () => {
        const pin = pinRef.current;
        const track = trackRef.current;
        const bar = barRef.current;
        if (!pin || !track) return;

        const distance = () => Math.max(0, track.scrollWidth - pin.clientWidth);

        const scrub = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
            },
          },
        });

        for (const el of gsap.utils.toArray<HTMLElement>("[data-parallax]", track)) {
          gsap.fromTo(
            el,
            { xPercent: 5 },
            {
              xPercent: -5,
              ease: "none",
              scrollTrigger: {
                trigger: el.closest("[data-card]") ?? el,
                containerAnimation: scrub,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            },
          );
        }

        return () => {
          if (bar) bar.style.transform = "";
        };
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  if (TOTAL === 0) return null;

  return (
    <section ref={rootRef} id="work" aria-labelledby="work-title" className="relative py-24 lg:motion-safe:py-0">
      <div
        ref={pinRef}
        className="relative flex flex-col lg:motion-safe:h-svh lg:motion-safe:overflow-hidden lg:motion-safe:pt-[calc(var(--nav-height)+2.5rem)] lg:motion-safe:pb-10"
      >
        <div className="container-x flex flex-col gap-8 lg:motion-safe:flex-row lg:motion-safe:items-end lg:motion-safe:justify-between">
          <SectionHeading id="work-title" index="03" eyebrow="Selected work" title="Shipped & cut" />
          <Reveal y={10} blur={0} className="hidden w-72 shrink-0 lg:motion-safe:block">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-mute uppercase">
              <span>Scrub</span>
              <span>
                {pad2(TOTAL)} {TOTAL === 1 ? "clip" : "clips"}
              </span>
            </div>
            <span aria-hidden="true" className="mt-3 block h-px w-full bg-line">
              <span
                ref={barRef}
                className="block h-full w-full origin-left scale-x-0 bg-linear-to-r from-tech via-[#9a52e6] to-edit"
              />
            </span>
          </Reveal>
        </div>

        <div
          ref={trackRef}
          className="container-x mt-14 flex flex-col gap-16 will-change-transform lg:motion-safe:mt-auto lg:motion-safe:w-max lg:motion-safe:max-w-none lg:motion-safe:flex-row lg:motion-safe:items-end lg:motion-safe:gap-14"
        >
          {TECH.length > 0 && (
            <div className="flex flex-col gap-8 lg:motion-safe:flex-row lg:motion-safe:items-end lg:motion-safe:gap-10">
              <Slate side="tech" count={TECH.length} title="Tech" />
              <ul className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:motion-safe:flex lg:motion-safe:items-end lg:motion-safe:gap-10">
                {TECH.map((project, i) => (
                  <TechCard key={project.slug} project={project} index={i} />
                ))}
              </ul>
            </div>
          )}

          {EDITS.length > 0 && (
            <div className="flex flex-col gap-8 lg:motion-safe:flex-row lg:motion-safe:items-end lg:motion-safe:gap-10">
              <Slate side="edits" count={EDITS.length} title="Edits" />
              <ul className="grid grid-cols-2 items-start gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:motion-safe:flex lg:motion-safe:items-end lg:motion-safe:gap-8">
                {EDITS.map((edit, i) => (
                  <EditFrame key={edit.slug} edit={edit} index={i} />
                ))}
              </ul>
            </div>
          )}

          <div className="flex shrink-0 flex-col gap-3 border-t border-line pt-8 sm:flex-row lg:motion-safe:h-[42svh] lg:motion-safe:w-72 lg:motion-safe:flex-col lg:motion-safe:justify-end lg:motion-safe:border-t-0 lg:motion-safe:border-l lg:motion-safe:pt-0 lg:motion-safe:pl-6 lg:motion-safe:pr-[max(1.25rem,4vw)]">
            <span className="eyebrow mb-2">End of reel</span>
            <TransitionLink
              href="/tech"
              label="Tech"
              className="group inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight uppercase transition-colors hover:text-tech"
            >
              All projects
              <ArrowUpRight aria-hidden="true" className="size-5 transition-transform duration-500 group-hover:rotate-45" />
            </TransitionLink>
            <TransitionLink
              href="/edits"
              label="Edits"
              className="group inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight uppercase transition-colors hover:text-edit"
            >
              All edits
              <ArrowUpRight aria-hidden="true" className="size-5 transition-transform duration-500 group-hover:rotate-45" />
            </TransitionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
