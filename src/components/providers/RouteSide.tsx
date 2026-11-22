"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { getRouteSide } from "@/lib/site";

/**
 * Mirrors the current route onto `<html data-side="home|tech|edits|contact">`, which drives
 * `--accent` (and anything else keyed off the side) in globals.css. The inline boot script sets
 * the same attribute before first paint; this keeps it in sync on client navigations.
 */
export default function RouteSide() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const side = getRouteSide(pathname);
    const root = document.documentElement;
    if (root.getAttribute("data-side") !== side) root.setAttribute("data-side", side);
  }, [pathname]);

  return null;
}
