"use client";

import { useState, type SyntheticEvent } from "react";
import Image from "next/image";
import { HudFrame, TiltCard } from "@/components/motion";
import type { TechProject } from "@/data/types";
import { cn } from "@/lib/cn";
import { pad2, projectImages } from "./utils";

const MAX_CHIPS = 5;

type Orientation = "pending" | "landscape" | "portrait";

function readOrientation(e: SyntheticEvent<HTMLImageElement>): Orientation {
  const img = e.currentTarget;
  return img.naturalHeight > img.naturalWidth ? "portrait" : "landscape";
}

/**
 * Card media. Landscape screenshots fill the frame (cover + hover zoom); portrait app screens are
 * detected on load and laid out as a row of device screens (cover in the middle, up to two gallery
 * shots either side) over a blurred backdrop of the cover.
 */
function CardMedia({ project, featured }: { project: TechProject; featured: boolean }) {
  const [orientation, setOrientation] = useState<Orientation>("pending");
  const portrait = orientation === "portrait";
  const side = projectImages(project)
    .filter((src) => src !== project.image)
    .slice(0, 2);

  return (
    <>
      {portrait ? (
        <Image
          src={project.image}
          alt=""
          aria-hidden="true"
          fill
          sizes="20vw"
          className="scale-125 object-cover opacity-40 blur-2xl"
        />
      ) : null}

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-[4%] transition-transform duration-700 ease-expo group-hover:scale-[1.06] motion-reduce:transition-none",
          portrait && "py-[6%]",
        )}
      >
        {portrait && side[0] ? <SideScreen src={side[0]} /> : null}
        <div
          className={cn(
            "relative",
            portrait
              ? "aspect-[9/19] h-full overflow-hidden rounded-[0.9rem] border border-white/10 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)]"
              : "size-full",
          )}
        >
          <Image
            src={project.image}
            alt={`${project.title} — screenshot`}
            fill
            sizes={
              portrait
                ? "(min-width: 1024px) 14vw, (min-width: 768px) 22vw, 40vw"
                : featured
                  ? "(min-width: 1024px) 66vw, 100vw"
                  : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            }
            onLoad={(e) => setOrientation(readOrientation(e))}
            className={cn(
              "object-cover object-top transition-opacity duration-700",
              orientation === "pending" ? "opacity-0" : "opacity-100",
            )}
          />
        </div>
        {portrait && side[1] ? <SideScreen src={side[1]} /> : null}
      </div>
    </>
  );
}

function SideScreen({ src }: { src: string }) {
  return (
    <div className="relative hidden aspect-[9/19] h-[84%] overflow-hidden rounded-[0.8rem] border border-white/10 opacity-70 sm:block">
      <Image src={src} alt="" aria-hidden="true" fill sizes="(min-width: 1024px) 12vw, 20vw" className="object-cover object-top" />
    </div>
  );
}

export interface ProjectCardProps {
  project: TechProject;
  /** 1-based position in the full project list. */
  index: number;
  total: number;
  onOpen: (slug: string, trigger: HTMLElement) => void;
  /** Registers the card's open button (focus restore target). */
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

/**
 * Grid card: media with scan-lines + sweep on hover, HUD brackets, "01/07" index, category tags,
 * title, summary and up to five stack chips. The title button's ::after stretches over the whole card,
 * so the entire card is one accessible "open project" target.
 */
export default function ProjectCard({ project, index, total, onOpen, buttonRef }: ProjectCardProps) {
  const featured = Boolean(project.featured);
  const chips = project.stack.slice(0, MAX_CHIPS);
  const more = project.stack.length - chips.length;

  return (
    <TiltCard max={featured ? 3.5 : 5} glareOpacity={0.14} hoverScale={1.01} className="h-full rounded-2xl">
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-ink-2/80 transition-colors duration-500 hover:border-tech/45 has-[:focus-visible]:border-tech-2/70">
        {/* Media */}
        <div
          className={cn(
            "relative aspect-[16/10] overflow-hidden border-b border-line bg-ink",
            featured
              ? "lg:aspect-auto lg:h-[clamp(16rem,24vw,23rem)]"
              : "lg:aspect-auto lg:h-[clamp(14rem,19vw,18rem)]",
          )}
        >
          <CardMedia project={project} featured={featured} />

          {/* Scan-lines + one sweep per hover */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgb(255_255_255/0.07)_0px,rgb(255_255_255/0.07)_1px,transparent_1px,transparent_4px)] opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-100"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1/3 -translate-y-full bg-linear-to-b from-transparent via-tech-2/25 to-transparent opacity-0 transition-[transform,opacity] duration-[1100ms] ease-cut group-hover:translate-y-[300%] group-hover:opacity-100 motion-reduce:hidden" />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink/80 via-transparent to-transparent" />

          <HudFrame
            size={12}
            inset={10}
            label={project.year ? `${pad2(index)} · ${project.year}` : `PRJ_${pad2(index)}`}
            className="opacity-60 transition-opacity duration-500 group-hover:opacity-100"
          />

          {featured ? (
            <span className="absolute right-3 top-3 z-10 rounded-full border border-tech-2/40 bg-ink/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-tech-2">
              Featured
            </span>
          ) : null}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-[11px] tabular-nums tracking-[0.14em] text-mute">
              <span className="text-tech-2">{pad2(index)}</span>/{pad2(total)}
            </p>
            <ul className="flex flex-wrap justify-end gap-1.5" aria-label="Categories">
              {project.categories.map((c) => (
                <li
                  key={c}
                  className="flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/70"
                >
                  <span aria-hidden="true" className="size-1 rounded-full bg-tech" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <h3 className={cn("font-display font-bold leading-[1.02] tracking-[-0.02em]", featured ? "text-[clamp(1.6rem,3vw,2.5rem)]" : "text-[clamp(1.45rem,2.2vw,1.9rem)]")}>
            <button
              type="button"
              ref={buttonRef}
              data-cursor="Open"
              aria-haspopup="dialog"
              onClick={(e) => onOpen(project.slug, e.currentTarget)}
              className="text-balance text-left transition-colors duration-300 after:absolute after:inset-0 after:z-20 after:rounded-2xl after:content-[''] group-hover:text-tech-2 focus-visible:outline-none"
            >
              {project.title}
              <span className="sr-only"> — open project details</span>
            </button>
          </h3>

          <p className="max-w-prose text-sm leading-relaxed text-mute md:text-[15px]">{project.summary}</p>

          <ul className="mt-auto flex flex-wrap gap-1.5 pt-2" aria-label="Stack">
            {chips.map((s) => (
              <li key={s} className="rounded-md border border-line bg-ink/50 px-2 py-1 font-mono text-[10.5px] text-paper/75">
                {s}
              </li>
            ))}
            {more > 0 ? (
              <li className="rounded-md border border-tech/40 px-2 py-1 font-mono text-[10.5px] text-tech-2">
                +{more}
                <span className="sr-only"> more</span>
              </li>
            ) : null}
          </ul>
        </div>
      </article>
    </TiltCard>
  );
}
