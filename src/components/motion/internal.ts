/**
 * Private helpers shared by the motion primitives (not part of the public barrel).
 * - registers @gsap/react once
 * - `useMotionReady()` gates entrance animations while a page transition covers the screen
 * - text splitting + numeric parsing utilities
 */

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useEffect, useState } from "react";
import { useIntroReady, useTransitionState } from "@/lib/transition";

// Module evaluation happens once per bundle, so the plugin is registered exactly once.
gsap.registerPlugin(useGSAP);

export { gsap, useGSAP };

/** Safety net: if no Preloader ever marks the intro ready, stop waiting after this long. */
const INTRO_FALLBACK_MS = 4000;

/**
 * `true` when the page is visible enough for entrance animations to play:
 * the first-visit preloader has started lifting and no transition panel covers the viewport.
 */
export function useMotionReady(): boolean {
  const intro = useIntroReady();
  const { phase } = useTransitionState();
  const [introTimedOut, setIntroTimedOut] = useState(false);

  useEffect(() => {
    if (intro) return;
    const t = window.setTimeout(() => setIntroTimedOut(true), INTRO_FALLBACK_MS);
    return () => window.clearTimeout(t);
  }, [intro]);

  return (intro || introTimedOut) && (phase === "idle" || phase === "revealing");
}

const graphemeSegmenter: Intl.Segmenter | null =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

/** Splits a string into user-perceived characters (keeps emoji / accents intact). */
export function splitGraphemes(value: string): string[] {
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(value), (s) => s.segment);
  }
  return Array.from(value);
}

/** Splits text into lines (explicit "\n") of words. Empty words are dropped. */
export function splitLinesWords(text: string): string[][] {
  return text.split(/\r?\n/).map((line) => line.split(/\s+/).filter(Boolean));
}

export interface ParsedNumeric {
  prefix: string;
  value: number;
  decimals: number;
  suffix: string;
  grouped: boolean;
}

/**
 * Parses strings like "15+", "3.5k", "1,200+", "$40K", "99%".
 * Returns null when the string carries no number.
 */
export function parseNumeric(input: string): ParsedNumeric | null {
  const match = /^(\D*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/.exec(input);
  if (!match) return null;
  const [, prefix, raw, suffix] = match;
  const grouped = raw.includes(",");
  const clean = raw.replace(/,/g, "");
  const value = Number.parseFloat(clean);
  if (!Number.isFinite(value)) return null;
  const dot = clean.indexOf(".");
  const decimals = dot === -1 ? 0 : clean.length - dot - 1;
  return { prefix, value, decimals, suffix, grouped };
}

export function formatNumeric(n: number, parsed: ParsedNumeric): string {
  const fixed = n.toFixed(parsed.decimals);
  if (!parsed.grouped) return `${parsed.prefix}${fixed}${parsed.suffix}`;
  const [int, dec] = fixed.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${parsed.prefix}${dec ? `${withCommas}.${dec}` : withCommas}${parsed.suffix}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
