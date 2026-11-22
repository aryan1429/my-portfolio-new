/**
 * Portfolio data contract.
 * Every value in src/data/portfolio.ts is mapped from
 * https://github.com/aryan1429/My-Portfolio (no invented filler).
 */

export type Side = "tech" | "edits";

export interface SocialLink {
  id: "github" | "linkedin" | "instagram" | "youtube" | "email" | "resume" | (string & {});
  label: string;
  href: string;
  handle?: string;
}

export interface Profile {
  name: string;
  firstName: string;
  lastName: string;
  roles: string[]; // e.g. ["Full-Stack Developer", "Video Editor & Motion Graphics Artist"]
  tagline: string;
  bio: string[]; // paragraphs
  location?: string;
  education?: string;
  email?: string;
  avatar: string; // /public path
  resume?: string; // /public path
  availability?: string;
}

export interface Stat {
  label: string;
  value: string;
}

export interface SkillGroup {
  side: Side;
  title: string;
  items: string[];
}

export type TechCategory = "Full-Stack" | "Frontend" | "Backend / Systems" | "AI / ML" | "Mobile";

export interface TechProject {
  slug: string;
  title: string;
  summary: string; // one line for cards
  description: string; // full text for modal
  categories: TechCategory[];
  stack: string[];
  highlights: string[];
  role?: string;
  year?: string;
  image: string; // /public path
  gallery?: string[];
  liveUrl?: string;
  liveLabel?: string; // e.g. "Live demo", "Download APK"
  repoUrl?: string;
  featured?: boolean;
}

export interface EditBreakdown {
  pacing?: string;
  transitions?: string;
  motion?: string;
  color?: string;
  sound?: string;
}

export interface VideoEdit {
  slug: string;
  title: string;
  category: string; // as in source repo (e.g. "Video Editing", "Motion Graphics" ...)
  description?: string;
  thumbnail: string; // /public path
  thumbnailPosition?: string; // CSS object-position, e.g. "center top"
  videoUrl: string; // CDN url from source repo
  aspect?: "16:9" | "9:16" | "1:1" | "4:5";
  duration?: string; // "00:15" timecode style if known
  tools?: string[];
  breakdown?: EditBreakdown;
  featured?: boolean;
}

export interface Experience {
  title: string;
  org: string;
  period: string;
  description?: string;
}

export interface Portfolio {
  profile: Profile;
  stats: Stat[];
  skills: SkillGroup[];
  techProjects: TechProject[];
  videoEdits: VideoEdit[];
  experience: Experience[];
  socials: SocialLink[];
  githubUrl: string;
}
