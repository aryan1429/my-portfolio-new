"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Reveal, SectionHeading } from "@/components/motion";
import { experience } from "@/data/portfolio";
import { pad2 } from "./data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * 04 — Experience as an edit timeline: a vertical track whose playhead line is drawn by the scroll,
 * each entry a marker with its period in mono.
 */
export default function Experience() {
  const rootRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);
  const lineRef = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const list = listRef.current;
        const line = lineRef.current;
        if (!list || !line) return;
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: list, start: "top 75%", end: "bottom 55%", scrub: 0.4 },
          },
        );
        for (const dot of gsap.utils.toArray<HTMLElement>("[data-marker]", list)) {
          gsap.fromTo(
            dot,
            { scale: 0.4, opacity: 0.3 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.6,
              ease: "back.out(2.5)",
              scrollTrigger: { trigger: dot, start: "top 65%", toggleActions: "play none none reverse" },
            },
          );
        }
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  if (experience.length === 0) return null;

  return (
    <section ref={rootRef} id="experience" aria-labelledby="experience-title" className="relative py-24 md:py-36">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              id="experience-title"
              index="04"
              eyebrow="Experience"
              title={"On the\ntimeline"}
              description={`${pad2(experience.length)} ${experience.length === 1 ? "track" : "tracks"} on the timeline.`}
            />
          </div>
        </div>

        <ol ref={listRef} className="relative lg:col-span-7">
          {/* Track rail + scroll-drawn playhead line. */}
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-[7px] w-px bg-line">
            <span
              ref={lineRef}
              className="block h-full w-full origin-top bg-linear-to-b from-tech via-[#9a52e6] to-edit"
            />
          </span>

          {experience.map((item, i) => (
            <li key={`${item.org}-${item.title}-${item.period}`} className="relative pb-14 pl-10 last:pb-0 md:pl-14">
              <span
                aria-hidden="true"
                data-marker=""
                className="absolute top-1.5 left-0 grid size-[15px] place-items-center rounded-full border border-paper/40 bg-ink"
              >
                <span className="size-[5px] rounded-full bg-paper" />
              </span>
              <Reveal y={24} blur={4}>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] tracking-[0.2em] uppercase">
                  <span className="text-paper/90 tabular-nums">{item.period}</span>
                  <span className="text-mute">
                    {pad2(i + 1)}/{pad2(experience.length)}
                  </span>
                </p>
                <h3 className="mt-3 font-display text-2xl leading-tight font-bold tracking-tight md:text-4xl">
                  {item.title}
                </h3>
                <p className="mt-1 font-mono text-xs tracking-[0.12em] text-mute uppercase">{item.org}</p>
                {item.description && (
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-paper/70">{item.description}</p>
                )}
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
