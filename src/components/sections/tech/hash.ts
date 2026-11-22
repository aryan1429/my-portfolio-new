"use client";

import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------------------------------ */
/* location.hash as an external store: the URL is the single source of truth for the modal.   */
/* ------------------------------------------------------------------------------------------ */

const hashListeners = new Set<() => void>();

function subscribeHash(listener: () => void): () => void {
  hashListeners.add(listener);
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    hashListeners.delete(listener);
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

function readHash(): string {
  return window.location.hash;
}

const serverHash = (): string => "";

/** Current `location.hash` ("" on the server and when absent). Updates on hashchange / back-forward / setLocationHash. */
export function useLocationHash(): string {
  return useSyncExternalStore(subscribeHash, readHash, serverHash);
}

/** Decoded hash without the leading "#". */
export function hashToId(hash: string): string {
  const raw = hash.replace(/^#/, "");
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Replace the URL hash without adding a history entry (null clears it), then notify subscribers
 * (replaceState does not fire `hashchange`).
 */
export function setLocationHash(id: string | null): void {
  const { pathname, search } = window.location;
  const url = id ? `${pathname}${search}#${encodeURIComponent(id)}` : `${pathname}${search}`;
  window.history.replaceState(null, "", url);
  for (const l of hashListeners) l();
}
