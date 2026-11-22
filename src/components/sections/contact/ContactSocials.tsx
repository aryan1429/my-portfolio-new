import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/motion";
import { socials } from "@/data/portfolio";
import type { SocialLink } from "@/data/types";
import { cn } from "@/lib/cn";

/** Hover tint per network — cool for the build side, warm for the edit side. Unknown ids stay neutral. */
const TINT: Record<string, { fill: string; text: string }> = {
  github: { fill: "bg-tech", text: "group-hover:text-tech-2" },
  linkedin: { fill: "bg-tech-2", text: "group-hover:text-tech-2" },
  instagram: { fill: "bg-edit", text: "group-hover:text-edit-2" },
  youtube: { fill: "bg-edit-2", text: "group-hover:text-edit-2" },
};
const NEUTRAL = { fill: "bg-paper", text: "group-hover:text-paper" };

/** Mono readout for a row: the stated handle, else the link itself without protocol noise. */
function readout(s: SocialLink): string {
  if (s.handle) return s.handle;
  if (s.id === "resume") return s.href.split("/").pop() ?? s.href;
  try {
    const url = new URL(s.href);
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return s.href;
  }
}

/**
 * Large hover-reveal rows for every social link except email (which has its own section): a tinted
 * fill wipes up behind the row, the label slides, the mono handle sharpens and the arrow swaps out.
 */
export default function ContactSocials() {
  const rows = socials.filter((s) => s.id !== "email");
  if (rows.length === 0) return null;
  const total = String(rows.length).padStart(2, "0");

  return (
    <section aria-labelledby="contact-socials-title" className="relative py-24 md:py-36">
      <div className="container-x">
        <SectionHeading id="contact-socials-title" index="03" eyebrow="Elsewhere" title={"Find me\nonline."} />

        <ul className="mt-14 border-t border-line md:mt-20">
          {rows.map((s, i) => {
            const isResume = s.id === "resume";
            const external = /^https?:\/\//.test(s.href);
            const tint = TINT[s.id] ?? NEUTRAL;
            const handle = readout(s);
            const Arrow = isResume ? ArrowDown : ArrowUpRight;
            return (
              <Reveal key={s.id} as="li" delay={i * 0.06} y={20} blur={0} className="border-b border-line">
                <a
                  href={s.href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  {...(isResume ? { download: "" } : {})}
                  data-cursor={isResume ? "Download" : "Open"}
                  aria-label={
                    isResume
                      ? `${s.label} — download PDF`
                      : `${s.label}${s.handle ? ` — ${s.handle}` : ""} (opens in a new tab)`
                  }
                  className="group relative flex items-center gap-4 overflow-hidden py-6 outline-offset-[-2px] sm:gap-8 md:py-9"
                >
                  {/* Tinted wipe from the bottom edge. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-0 origin-bottom scale-y-0 opacity-[0.12] transition-transform duration-700 ease-expo group-hover:scale-y-100 group-focus-visible:scale-y-100 motion-reduce:transition-none",
                      tint.fill,
                    )}
                  />

                  <span
                    aria-hidden="true"
                    className="relative w-10 shrink-0 font-mono text-[11px] tabular-nums tracking-[0.18em] text-mute md:w-16"
                  >
                    {String(i + 1).padStart(2, "0")}
                    <span className="hidden text-paper/25 md:inline">/{total}</span>
                  </span>

                  <span className="relative flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
                    <span
                      className={cn(
                        "font-display text-[clamp(1.75rem,8vw,6.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.04em] text-paper transition-[transform,color] duration-700 ease-expo group-hover:translate-x-3 md:group-hover:translate-x-6 motion-reduce:transition-none",
                        tint.text,
                      )}
                    >
                      {s.label}
                    </span>
                    <span
                      className="min-w-0 truncate font-mono text-[11px] tracking-[0.08em] text-paper/65 transition-all duration-500 ease-expo md:text-xs fine:md:translate-y-1 md:group-hover:translate-y-0 md:group-hover:text-paper md:group-focus-visible:translate-y-0 md:group-focus-visible:text-paper"
                    >
                      {isResume ? `${handle} · PDF` : handle}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="relative inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line transition-colors duration-500 group-hover:border-paper group-hover:bg-paper group-hover:text-ink md:size-16"
                  >
                    <Arrow
                      strokeWidth={1.5}
                      className={cn(
                        "size-5 transition-transform duration-500 ease-expo md:size-6",
                        isResume
                          ? "group-hover:translate-y-[170%]"
                          : "group-hover:-translate-y-[170%] group-hover:translate-x-[170%]",
                      )}
                    />
                    <Arrow
                      strokeWidth={1.5}
                      className={cn(
                        "absolute size-5 transition-transform duration-500 ease-expo md:size-6",
                        isResume
                          ? "-translate-y-[170%] group-hover:translate-y-0"
                          : "-translate-x-[170%] translate-y-[170%] group-hover:translate-x-0 group-hover:translate-y-0",
                      )}
                    />
                  </span>
                </a>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
