/**
 * Pure, server-safe derivations of portfolio data for the home page.
 * Nothing here adds facts — it only counts, ranks and filters what `portfolio.ts` already contains.
 */

import { experience, skills, techProjects, videoEdits } from "@/data/portfolio";
import type { Side, TechProject, VideoEdit } from "@/data/types";

export const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

/** "01/07" style index used for mono metadata. */
export function indexLabel(index: number, total: number): string {
  return `${pad2(index + 1)}/${pad2(total)}`;
}

/** Stack items ranked by how many projects use them (ties keep first-appearance order). */
export function topStack(limit: number): string[] {
  const counts = new Map<string, number>();
  for (const project of techProjects) {
    for (const item of project.stack) counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count], order) => ({ name, count, order }))
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, limit)
    .map((entry) => entry.name);
}

export interface CategoryCount {
  category: string;
  count: number;
}

/** Edit categories as they appear in the data, with counts. */
export function editCategoryCounts(): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const edit of videoEdits) counts.set(edit.category, (counts.get(edit.category) ?? 0) + 1);
  return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
}

/** Featured projects; falls back to the first few when nothing is flagged. */
export function featuredTech(fallback = 3): TechProject[] {
  const flagged = techProjects.filter((p) => p.featured);
  return flagged.length > 0 ? flagged : techProjects.slice(0, fallback);
}

/** Featured edits; falls back to the first few when nothing is flagged. */
export function featuredEdits(fallback = 6): VideoEdit[] {
  const flagged = videoEdits.filter((e) => e.featured);
  return flagged.length > 0 ? flagged : videoEdits.slice(0, fallback);
}

/** Every skill item of one side, de-duplicated, in data order. */
export function skillItems(side: Side): string[] {
  const seen = new Set<string>();
  for (const group of skills) {
    if (group.side !== side) continue;
    for (const item of group.items) seen.add(item);
  }
  return Array.from(seen);
}

export function skillGroups(side: Side) {
  return skills.filter((group) => group.side === side);
}

/** "00:29" / "01:02:03" → seconds; null when absent or unparsable. */
export function durationSeconds(duration: string | undefined): number | null {
  if (!duration) return null;
  const parts = duration.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.length < 2 || parts.length > 3 || parts.some((n) => !Number.isFinite(n))) return null;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

export const counts = {
  tech: techProjects.length,
  edits: videoEdits.length,
  experience: experience.length,
};
