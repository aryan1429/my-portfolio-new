import type { TechCategory, TechProject } from "@/data/types";

/** Active grid filter: every project or one category. */
export type TechFilter = "All" | TechCategory;

/** Two-digit index: 3 → "03". */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Every image of a project for the gallery: the gallery when present (cover included once), else the cover. */
export function projectImages(project: TechProject): string[] {
  const gallery = project.gallery?.filter(Boolean) ?? [];
  if (gallery.length === 0) return [project.image];
  return gallery.includes(project.image) ? gallery : [project.image, ...gallery];
}

/** Unique stack entries across projects, in first-seen order. */
export function uniqueStack(projects: readonly TechProject[]): string[] {
  const seen = new Set<string>();
  for (const p of projects) for (const s of p.stack) seen.add(s);
  return Array.from(seen);
}

export interface StackCount {
  name: string;
  count: number;
}

/** How many projects use each stack entry, most used first (ties keep first-seen order). */
export function stackFrequency(projects: readonly TechProject[]): StackCount[] {
  const counts = new Map<string, number>();
  for (const p of projects) {
    for (const s of new Set(p.stack)) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function matchesFilter(project: TechProject, filter: TechFilter): boolean {
  return filter === "All" || project.categories.includes(filter);
}

export function isHttpUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
