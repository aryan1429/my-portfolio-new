import type { Metadata } from "next";
import { ScrollProgress } from "@/components/motion";
import About from "@/components/sections/home/About";
import ClosingCta from "@/components/sections/home/ClosingCta";
import Experience from "@/components/sections/home/Experience";
import Gateways from "@/components/sections/home/Gateways";
import HomeHero from "@/components/sections/home/HomeHero";
import SelectedWork from "@/components/sections/home/SelectedWork";
import Skills from "@/components/sections/home/Skills";
import SkillsMarquee from "@/components/sections/home/SkillsMarquee";
import { profile } from "@/data/portfolio";

const roles = profile.roles.slice(0, 2).join(" & ");
const title = `${profile.name} — ${roles}`;
const description = `${profile.tagline} Portfolio of ${profile.name}: ${roles}. Full-stack web & mobile projects, cinematic edits and motion graphics.`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

/** Home hub: title card over the 3D core, the two gateways, then the overview reel. */
export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <HomeHero />
      <Gateways />
      <SkillsMarquee side="tech" />
      <About />
      <Skills />
      <SkillsMarquee side="edits" />
      <SelectedWork />
      <Experience />
      <ClosingCta />
    </>
  );
}
