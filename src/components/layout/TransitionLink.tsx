"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { startTransition } from "@/lib/transition";
import { scrollTo } from "@/lib/scroll";
import { normalizePath } from "@/lib/site";

type LinkProps = ComponentProps<typeof Link>;
type Href = LinkProps["href"];

function hrefToString(href: Href): string {
  if (typeof href === "string") return href;
  const pathname = href.pathname ?? "";
  let search = href.search ?? "";
  if (!search && href.query) {
    if (typeof href.query === "string") {
      search = href.query ? `?${href.query.replace(/^\?/, "")}` : "";
    } else {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(href.query)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const v of value) if (v !== undefined && v !== null) params.append(key, String(v));
        } else {
          params.append(key, String(value));
        }
      }
      const qs = params.toString();
      search = qs ? `?${qs}` : "";
    }
  }
  const hash = href.hash ? (href.hash.startsWith("#") ? href.hash : `#${href.hash}`) : "";
  return `${pathname}${search}${hash}`;
}

/**
 * Drop-in replacement for next/link that plays the editor-cut page transition.
 * Uses Link's `onNavigate`, which only fires for same-origin client navigations — so
 * modifier-clicks, new tabs, downloads and external URLs keep their native behaviour.
 */
export default function TransitionLink(props: ComponentProps<typeof Link> & { label?: string }) {
  const { label, onNavigate, href, ...rest } = props;

  const handleNavigate: NonNullable<LinkProps["onNavigate"]> = (event) => {
    let prevented = false;
    onNavigate?.({
      preventDefault: () => {
        prevented = true;
        event.preventDefault();
      },
    });
    if (prevented) return;

    const url = new URL(hrefToString(href), window.location.href);
    if (url.origin !== window.location.origin) return;

    const samePath = normalizePath(url.pathname) === normalizePath(window.location.pathname);
    if (samePath) {
      // In-page anchor: let Next handle the hash (Lenis anchors take over smooth scrolling).
      if (url.hash) return;
      if (url.search === window.location.search) {
        event.preventDefault();
        scrollTo(0);
        return;
      }
      return;
    }

    event.preventDefault();
    startTransition(`${url.pathname}${url.search}${url.hash}`, label);
  };

  return <Link href={href} onNavigate={handleNavigate} {...rest} />;
}
