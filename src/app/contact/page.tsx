import type { Metadata } from "next";
import { ScrollProgress } from "@/components/motion";
import ContactComposer from "@/components/sections/contact/ContactComposer";
import ContactHero from "@/components/sections/contact/ContactHero";
import ContactIntents from "@/components/sections/contact/ContactIntents";
import ContactMeta from "@/components/sections/contact/ContactMeta";
import ContactSocials from "@/components/sections/contact/ContactSocials";
import { profile } from "@/data/portfolio";

const title = "Contact";
const description = `Work with ${profile.name} — full-stack development or video editing & motion graphics. ${
  profile.availability ?? profile.tagline
}`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: "/contact",
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

export default function ContactPage() {
  return (
    <>
      <ScrollProgress />
      <ContactHero />
      <ContactIntents />
      <ContactComposer />
      <ContactSocials />
      <ContactMeta />
    </>
  );
}
