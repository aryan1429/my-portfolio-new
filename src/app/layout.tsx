import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, JetBrains_Mono, Syne } from "next/font/google";
import SceneCanvas from "@/components/three/SceneCanvas";
import SmoothScroll from "@/components/providers/SmoothScroll";
import RouteSide from "@/components/providers/RouteSide";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";
import Preloader from "@/components/layout/Preloader";
import Cursor from "@/components/motion/Cursor";
import Grain from "@/components/motion/Grain";
import { profile } from "@/data/portfolio";
import { bootScript, siteUrl } from "@/lib/site";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const primaryRoles = profile.roles.slice(0, 2).join(" & ");
const defaultTitle = `${profile.name} — ${primaryRoles}`;
const description = `${profile.name} — ${primaryRoles} building full-stack web & mobile products and cutting cinematic edits and motion graphics. ${profile.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s — Aryan Aligeti",
  },
  description,
  applicationName: `${profile.name} — Portfolio`,
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  keywords: [
    profile.name,
    "portfolio",
    "full-stack developer",
    "video editor",
    "motion graphics",
    "Next.js",
    "React",
    "After Effects",
    ...profile.roles,
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: profile.name,
    title: defaultTitle,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
  category: "portfolio",
};

export const viewport: Viewport = {
  themeColor: "#07070A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline boot script sets data-side / data-preloaded on <html>
    // before hydration (prevents a flash of the wrong accent / a replayed preloader).
    <html
      lang="en"
      data-side="home"
      suppressHydrationWarning
      className={`${syne.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <noscript dangerouslySetInnerHTML={{ __html: "<style>[data-preloader]{display:none!important}</style>" }} />
      </head>
      <body className="bg-ink font-sans text-paper antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll>
          <SceneCanvas />
          <Grain />
          <Cursor />
          <Nav />
          <main id="main" className="relative z-10">
            {children}
          </main>
          <Footer />
          <Suspense fallback={null}>
            <PageTransition />
          </Suspense>
          <Preloader />
          <Suspense fallback={null}>
            <RouteSide />
          </Suspense>
        </SmoothScroll>
      </body>
    </html>
  );
}
