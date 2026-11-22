"use client";

import { useEffect, useRef } from "react";
import { Clock, GraduationCap, MapPin } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/motion";
import { profile } from "@/data/portfolio";

const TIME_ZONE = "Asia/Kolkata";
/** IST is UTC+05:30 all year (no daylight saving). */
const IST_OFFSET_MIN = 330;

function relativeToVisitor(): string {
  const visitor = -new Date().getTimezoneOffset();
  const diff = IST_OFFSET_MIN - visitor;
  if (diff === 0) return "Same time zone as you";
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const span = [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ");
  return `${span} ${diff > 0 ? "ahead of" : "behind"} you`;
}

/** Live IST clock — every DOM write goes through refs on a 1 s interval (no per-tick React renders). */
function LocalClock() {
  const hmRef = useRef<HTMLSpanElement>(null);
  const secRef = useRef<HTMLSpanElement>(null);
  const dateRef = useRef<HTMLSpanElement>(null);
  const relRef = useRef<HTMLSpanElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const dateFmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      weekday: "short",
      day: "2-digit",
      month: "short",
    });

    let lastDate = "";
    let lastRel = "";
    const tick = () => {
      const now = new Date();
      const p = parts.formatToParts(now);
      const get = (type: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === type)?.value ?? "00";
      // Some engines report midnight as "24" with hour12: false.
      const hh = get("hour") === "24" ? "00" : get("hour");
      const mm = get("minute");
      const ss = get("second");
      if (hmRef.current) hmRef.current.textContent = `${hh}:${mm}`;
      if (secRef.current) secRef.current.textContent = ss;
      if (headRef.current) {
        const dayFraction = (Number(hh) * 3600 + Number(mm) * 60 + Number(ss)) / 86400;
        headRef.current.style.transform = `translateX(${(dayFraction * 100).toFixed(3)}%)`;
      }
      const d = dateFmt.format(now);
      if (d !== lastDate && dateRef.current) {
        lastDate = d;
        dateRef.current.textContent = d;
      }
      const rel = relativeToVisitor();
      if (rel !== lastRel && relRef.current) {
        lastRel = rel;
        relRef.current.textContent = rel;
      }
    };

    tick();
    let interval = 0;
    // Align ticks to the wall-clock second so the seconds digit doesn't lag up to 1 s behind.
    const align = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 1000);
    }, 1000 - (Date.now() % 1000));

    return () => {
      window.clearTimeout(align);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-baseline font-display font-bold leading-none tracking-[-0.04em]">
        <span ref={hmRef} className="text-[clamp(3rem,7vw,5.5rem)] tabular-nums">
          --:--
        </span>
        <span ref={secRef} className="ml-2 font-mono text-base font-normal tabular-nums tracking-normal text-edit-2 md:text-lg">
          --
        </span>
        <span className="ml-3 font-mono text-[11px] font-normal uppercase tracking-[0.2em] text-mute">IST</span>
      </p>

      {/* 24 h timeline: the playhead marks how far through the day it is in IST. */}
      <div aria-hidden="true" className="flex flex-col gap-2">
        <div className="relative h-3">
          <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
          <div className="absolute inset-0 flex justify-between">
            {Array.from({ length: 25 }, (_, h) => (
              <span key={h} className={h % 6 === 0 ? "h-3 w-px bg-paper/30" : "mt-1 h-1 w-px bg-paper/15"} />
            ))}
          </div>
          <span ref={headRef} className="absolute inset-y-[-3px] left-0 w-full will-change-transform">
            <span className="absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-edit-2 shadow-[0_0_10px_var(--color-edit-2)]" />
          </span>
        </div>
        <div className="flex justify-between font-mono text-[9px] tracking-[0.16em] text-mute">
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>24</span>
        </div>
      </div>

      <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
        <span ref={dateRef}>&nbsp;</span>
        <span className="text-paper/25">·</span>
        <span>UTC+05:30</span>
        <span className="text-paper/25">·</span>
        <span ref={relRef} className="text-paper/70">
          &nbsp;
        </span>
      </p>
    </div>
  );
}

/**
 * Coordinates slate: location, live local time in Asia/Kolkata and education — a hairline grid of mono cells.
 * Each cell only renders when the profile states it.
 */
export default function ContactMeta() {
  const { location, education } = profile;
  const showClock = Boolean(location && /india|\bIST\b/i.test(location));
  if (!location && !education) return null;

  const city = location?.split(",")[0]?.trim();

  return (
    <section aria-labelledby="contact-meta-title" className="relative pb-28 pt-12 md:pb-40 md:pt-20">
      <div className="container-x">
        <SectionHeading
          id="contact-meta-title"
          index="04"
          eyebrow="Coordinates"
          title={city ? `Based in\n${city}.` : "Coordinates."}
        />

        <dl className="mt-14 grid overflow-hidden rounded-[1.75rem] border border-line bg-ink/80 fine:bg-ink/50 fine:backdrop-blur-sm md:mt-20 lg:grid-cols-12">
          {location && (
            <Reveal blur={0} className="flex flex-col gap-4 border-b border-line p-7 sm:p-9 lg:col-span-3 lg:border-b-0 lg:border-r">
              <dt className="eyebrow flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-3.5 text-tech-2" />
                Location
              </dt>
              <dd className="font-display text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{location}</dd>
            </Reveal>
          )}

          {showClock && (
            <Reveal
              delay={0.08}
              blur={0}
              className="flex flex-col gap-4 border-b border-line p-7 sm:p-9 lg:col-span-5 lg:border-b-0 lg:border-r"
            >
              <dt className="eyebrow flex items-center gap-2">
                <Clock aria-hidden="true" className="size-3.5 text-edit-2" />
                Local time
              </dt>
              <dd>
                <LocalClock />
              </dd>
            </Reveal>
          )}

          {education && (
            <Reveal
              delay={0.16}
              blur={0}
              className="flex flex-col gap-4 p-7 sm:p-9 lg:col-span-4"
            >
              <dt className="eyebrow flex items-center gap-2">
                <GraduationCap aria-hidden="true" className="size-3.5 text-tech" />
                Education
              </dt>
              <dd className="flex flex-col gap-3">
                {education.split(" · ").map((part, i) => (
                  <span
                    key={part}
                    className={
                      i === 0
                        ? "font-display text-xl font-semibold leading-snug tracking-tight md:text-2xl"
                        : "font-mono text-[11px] uppercase tracking-[0.16em] text-mute"
                    }
                  >
                    {part}
                  </span>
                ))}
              </dd>
            </Reveal>
          )}
        </dl>
      </div>
    </section>
  );
}
