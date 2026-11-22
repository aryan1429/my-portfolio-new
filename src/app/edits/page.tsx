import type { Metadata } from "next";
import { Marquee } from "@/components/motion";
import EditsCta from "@/components/sections/edits/EditsCta";
import EditsHero from "@/components/sections/edits/EditsHero";
import EditsStudio from "@/components/sections/edits/EditsStudio";
import { profile, skills, videoEdits } from "@/data/portfolio";

const editRole = profile.roles.find((r) => /edit|motion/i.test(r)) ?? "Video Editor";
const binCounts = Array.from(new Set(videoEdits.map((e) => e.category)))
  .map((c) => `${videoEdits.filter((e) => e.category === c).length} ${c}`)
  .join(", ");
const description = `Video editing & motion graphics by ${profile.name}, ${editRole} — ${videoEdits.length} clips on the reel (${binCounts}).`;

export const metadata: Metadata = {
  title: "Edits",
  description,
  alternates: { canonical: "/edits" },
  openGraph: {
    type: "website",
    url: "/edits",
    title: `Edits — ${profile.name}`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `Edits — ${profile.name}`,
    description,
  },
};

const craft = skills.filter((g) => g.side === "edits").flatMap((g) => g.items);

export default function EditsPage() {
  return (
    <>
      <EditsHero />
      {craft.length > 0 ? (
        <div aria-hidden="true" className="border-y border-line bg-ink/70 py-5">
          <Marquee
            items={craft}
            speed={70}
            className="font-display text-[clamp(1.75rem,5vw,4rem)] font-bold uppercase tracking-[-0.02em] text-paper/90"
            separator={<span className="mx-6 text-edit md:mx-10">/</span>}
          />
        </div>
      ) : null}
      <EditsStudio />
      <EditsCta />
    </>
  );
}
