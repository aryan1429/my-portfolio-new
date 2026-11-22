import type { Metadata } from "next";
import { ScrollProgress } from "@/components/motion";
import TechCta from "@/components/sections/tech/TechCta";
import TechHeader from "@/components/sections/tech/TechHeader";
import TechProjects from "@/components/sections/tech/TechProjects";
import TechStackStrip from "@/components/sections/tech/TechStackStrip";
import { profile, techCategories, techProjects } from "@/data/portfolio";

const title = "Tech";
const description = `Full-stack & engineering work by ${profile.name}: ${techProjects.length} projects across ${techCategories.join(", ")} — ${techProjects
  .slice(0, 3)
  .map((p) => p.title)
  .join(", ")} and more.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tech" },
  openGraph: {
    type: "website",
    url: "/tech",
    siteName: profile.name,
    title: `${title} — ${profile.name}`,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} — ${profile.name}`,
    description,
  },
};

export default function TechPage() {
  return (
    <>
      <ScrollProgress />
      <TechHeader />
      <TechStackStrip />
      <TechProjects />
      <TechCta />
    </>
  );
}
