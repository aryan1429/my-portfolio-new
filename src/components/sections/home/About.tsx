import Image from "next/image";
import { Counter, HudFrame, KineticText, Reveal, SectionHeading, TiltCard } from "@/components/motion";
import { profile, stats } from "@/data/portfolio";
import { pad2 } from "./data";

interface SpecRow {
  key: string;
  label: string;
  value: string;
}

/**
 * 01 — Overview: portrait in a viewfinder, bio revealed line by line, counted stats and mono spec rows.
 */
export default function About() {
  const specs: SpecRow[] = [
    profile.education ? { key: "education", label: "Education", value: profile.education } : null,
    profile.location ? { key: "location", label: "Based in", value: profile.location } : null,
    profile.availability ? { key: "availability", label: "Status", value: profile.availability } : null,
  ].filter((row): row is SpecRow => row !== null);

  return (
    <section id="about" aria-labelledby="about-title" className="relative py-24 md:py-36">
      <div className="container-x">
        <SectionHeading id="about-title" index="01" eyebrow="Overview" title={"Two crafts,\none signal"} />

        <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5" y={40}>
            <figure className="mx-auto max-w-md lg:sticky lg:top-28 lg:max-w-none">
              <TiltCard max={6} className="overflow-hidden rounded-2xl border border-line bg-ink-2">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={profile.avatar}
                    alt={`Portrait of ${profile.name}`}
                    fill
                    sizes="(min-width: 1440px) 560px, (min-width: 1024px) 38vw, (min-width: 448px) 28rem, 100vw"
                    className="object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(to_top,rgb(7_7_10/0.7),transparent_45%),linear-gradient(115deg,rgb(91_108_255/0.18),transparent_40%,rgb(255_46_77/0.16))]"
                  />
                  <HudFrame rec recLabel="Live" label={profile.name} timecode fps={24} size={16} inset={14} />
                </div>
              </TiltCard>
              <figcaption className="mt-4 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-mute uppercase">
                <span>Cam A</span>
                <span className="text-dual">{profile.roles.slice(0, 2).join(" / ")}</span>
              </figcaption>
            </figure>
          </Reveal>

          <div className="lg:col-span-7">
            <div className="space-y-6 md:space-y-8">
              {profile.bio.map((paragraph, i) => (
                <KineticText
                  key={paragraph}
                  as="p"
                  mode="lines"
                  trigger="inView"
                  text={paragraph}
                  stagger={0.08}
                  duration={0.9}
                  className={
                    i === 0
                      ? "text-xl leading-snug font-medium text-paper md:text-2xl lg:text-[1.75rem]"
                      : "text-base leading-relaxed text-paper/70 md:text-lg"
                  }
                />
              ))}
            </div>

            {stats.length > 0 && (
              <ul className="mt-14 flex flex-wrap gap-px overflow-hidden rounded-xl border border-line bg-line">
                {stats.map((stat, i) => (
                  <li key={stat.label} className="flex grow basis-[calc(50%-1px)] flex-col gap-3 bg-ink/85 p-5 sm:basis-[calc(33.333%-1px)] md:p-6">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-mute">
                      {pad2(i + 1)}/{pad2(stats.length)}
                    </span>
                    <Counter
                      value={stat.value}
                      delay={i * 0.08}
                      className="font-display text-4xl leading-none font-bold tracking-tight md:text-5xl"
                    />
                    <span className="eyebrow text-paper/70">{stat.label}</span>
                  </li>
                ))}
              </ul>
            )}

            {specs.length > 0 && (
              <dl className="mt-12 border-b border-line">
                {specs.map((row) => (
                  <Reveal
                    key={row.key}
                    y={12}
                    blur={0}
                    className="grid gap-2 border-t border-line py-4 sm:grid-cols-[9rem_1fr] sm:gap-6"
                  >
                    <dt className="font-mono text-[11px] tracking-[0.2em] text-mute uppercase">{row.label}</dt>
                    <dd className="font-mono text-sm leading-relaxed text-paper/85">
                      {row.key === "availability" && (
                        <span
                          aria-hidden="true"
                          className="mr-2 inline-block size-1.5 -translate-y-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153)]"
                        />
                      )}
                      {row.value}
                    </dd>
                  </Reveal>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
