"use client";

import { Suspense, useCallback, useEffect, useId, useRef, useState, type ComponentProps, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import TransitionLink from "@/components/layout/TransitionLink";
import { profile, socials } from "@/data/portfolio";
import { cn } from "@/lib/cn";
import { ease, formatTimecode, usePrefersReducedMotion } from "@/lib/motion";
import { lockScroll, scrollState, unlockScroll } from "@/lib/scroll";
import { navItems, normalizePath, type NavItem } from "@/lib/site";

function isActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  const p = normalizePath(pathname);
  return item.href === "/" ? p === "/" : p === item.href || p.startsWith(`${item.href}/`);
}

/** Text that rolls up to a duplicate on hover — the classic edit-cut hover. */
function RollText({ children }: { children: string }) {
  return (
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-500 ease-expo group-hover:-translate-y-full motion-reduce:transition-none">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-expo group-hover:translate-y-0 motion-reduce:transition-none"
      >
        {children}
      </span>
    </span>
  );
}

/* ─────────────────────────── Desktop links ─────────────────────────── */

function DesktopLinks({ pathname }: { pathname: string | null }) {
  return (
    <LayoutGroup id="nav-desktop">
      <ul className="flex items-center gap-1">
        {navItems.map((item) => {
          const active = isActive(item, pathname);
          return (
            <li key={item.href} className="relative">
              <TransitionLink
                href={item.href}
                label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300",
                  active ? "text-accent-contrast" : "text-paper/70 hover:text-paper",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.8 }}
                  />
                )}
                <span className={cn("font-mono text-[10px]", active ? "opacity-70" : "text-mute")}>{item.index}</span>
                <RollText>{item.label}</RollText>
              </TransitionLink>
            </li>
          );
        })}
      </ul>
    </LayoutGroup>
  );
}

function ActiveDesktopLinks() {
  const pathname = usePathname();
  return <DesktopLinks pathname={pathname} />;
}

/* ─────────────────────────── Live readouts ─────────────────────────── */

/** Readouts are `hidden lg:flex` — keep in sync with Tailwind's `lg` breakpoint. */
const READOUTS_QUERY = "(min-width: 64rem)";

/**
 * "● REC 00:01:23:12" session timecode + local clock for the studio city. DOM writes only.
 * Runs only while visible (lg and up): the timecode ticks every frame (once a second under reduced
 * motion) and the clock updates on a 1 s interval.
 */
function Readouts() {
  const tcRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const city = profile.location?.split(",")[0]?.trim();
  const timeZone = profile.location && /india|\bIST\b/i.test(profile.location) ? "Asia/Kolkata" : undefined;

  useEffect(() => {
    let formatter: Intl.DateTimeFormat;
    try {
      formatter = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone,
      });
    } catch {
      formatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    const mql = window.matchMedia(READOUTS_QUERY);
    let raf = 0;
    let tcTimer = 0;
    let clockTimer = 0;
    const writeTimecode = () => {
      if (tcRef.current) tcRef.current.textContent = formatTimecode(performance.now() / 1000, 24);
    };
    const writeClock = () => {
      if (clockRef.current) clockRef.current.textContent = formatter.format(new Date());
    };
    const loop = () => {
      writeTimecode();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      window.clearInterval(tcTimer);
      window.clearInterval(clockTimer);
      raf = 0;
      tcTimer = 0;
      clockTimer = 0;
    };
    const start = () => {
      stop();
      if (!mql.matches) return;
      writeTimecode();
      writeClock();
      if (reduced) tcTimer = window.setInterval(writeTimecode, 1000);
      else raf = requestAnimationFrame(loop);
      clockTimer = window.setInterval(writeClock, 1000);
    };
    start();
    mql.addEventListener("change", start);
    return () => {
      mql.removeEventListener("change", start);
      stop();
    };
  }, [timeZone, reduced]);

  return (
    <div className="hidden items-center gap-5 font-mono text-[11px] uppercase tracking-[0.16em] text-mute lg:flex">
      <span className="flex items-center gap-2" title="Session timecode">
        <span className="inline-block size-1.5 rounded-full bg-edit animate-blink" />
        <span className="text-mute">Rec</span>
        <span ref={tcRef} className="tabular-nums text-paper/80">
          00:00:00:00
        </span>
      </span>
      {city && (
        <span className="hidden items-center gap-2 xl:flex" title={profile.location}>
          <span className="text-mute">{city}</span>
          <span ref={clockRef} className="tabular-nums text-paper/80">
            --:--:--
          </span>
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────── Mobile menu ─────────────────────────── */

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Make everything outside `keep` inert (unfocusable, hidden from assistive tech) — the menu covers the
 * page, so nothing under it may take focus. Walks down only through ancestors of the kept elements.
 * Returns the restore function.
 */
function inertOutside(keep: HTMLElement[]): () => void {
  const changed: HTMLElement[] = [];
  const walk = (parent: Element) => {
    for (const child of Array.from(parent.children)) {
      if (!(child instanceof HTMLElement) || keep.includes(child)) continue;
      if (keep.some((k) => child.contains(k))) {
        walk(child);
        continue;
      }
      if (child.inert || child instanceof HTMLScriptElement || child instanceof HTMLStyleElement) continue;
      child.inert = true;
      changed.push(child);
    }
  };
  walk(document.body);
  return () => {
    for (const el of changed) el.inert = false;
  };
}

function MobileMenu({
  id,
  open,
  onClose,
  onDismiss,
  pathname,
  headerRef,
}: {
  id: string;
  open: boolean;
  /** Close and return focus to the toggle (Esc, links, breakpoint change). */
  onClose: () => void;
  /** Close without moving focus (route changed underneath, e.g. browser back). */
  onDismiss: () => void;
  pathname: string | null;
  headerRef: RefObject<HTMLElement | null>;
}) {
  const reduced = usePrefersReducedMotion();
  const firstLink = useRef<HTMLAnchorElement>(null);
  const lastPath = useRef(pathname);

  // Any route change that did not come through a menu link (back/forward gesture, keyboard) closes it.
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (open) onDismiss();
  }, [pathname, open, onDismiss]);

  useEffect(() => {
    if (!open) return;
    lockScroll("menu");
    const dialog = document.getElementById(id);
    const header = headerRef.current;
    const scopes = [header, dialog].filter((el): el is HTMLElement => el !== null);
    // The toggle lives in the header (above the menu), so the modal scope is header + menu, not the dialog alone.
    const restoreInert = inertOutside(scopes);
    const focusTimer = window.setTimeout(() => firstLink.current?.focus(), 350);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = scopes
        .flatMap((scope) => Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)))
        .filter((el) => el.getClientRects().length > 0 && !el.closest("[inert]"));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !nodes.includes(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const mql = window.matchMedia("(min-width: 768px)");
    const onResize = () => {
      if (mql.matches) onClose();
    };
    window.addEventListener("keydown", onKey);
    mql.addEventListener("change", onResize);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      mql.removeEventListener("change", onResize);
      restoreInert();
      unlockScroll("menu");
    };
  }, [open, onClose, id, headerRef]);

  const external = socials.filter((s) => s.id !== "resume");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id={id}
          role="dialog"
          aria-label="Site menu"
          className="fixed inset-0 z-40 flex flex-col bg-ink-2 pt-[var(--nav-height)] md:hidden"
          initial={reduced ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
          animate={reduced ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
          exit={reduced ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: reduced ? 0.15 : 0.7, ease: ease.inOut }}
          data-lenis-prevent
        >
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-linear-to-r from-tech to-edit" />
          <nav aria-label="Mobile" className="container-x flex flex-1 flex-col justify-center">
            <ul className="flex flex-col gap-1">
              {navItems.map((item, i) => {
                const active = isActive(item, pathname);
                return (
                  <li key={item.href} className="overflow-hidden">
                    <motion.div
                      initial={reduced ? { opacity: 0 } : { y: "110%" }}
                      animate={reduced ? { opacity: 1 } : { y: "0%" }}
                      exit={reduced ? { opacity: 0 } : { y: "-110%" }}
                      transition={{
                        duration: reduced ? 0.15 : 0.8,
                        ease: ease.out,
                        delay: reduced ? 0 : 0.18 + i * 0.06,
                      }}
                    >
                      <TransitionLink
                        ref={i === 0 ? firstLink : undefined}
                        href={item.href}
                        label={item.label}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className="group flex items-baseline gap-4 py-1"
                      >
                        <span className={cn("font-mono text-xs", active ? "text-accent" : "text-mute")}>
                          {item.index}
                        </span>
                        <span
                          className={cn(
                            "font-display text-[clamp(3rem,15vw,5.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.04em] transition-colors",
                            active ? "text-accent" : "text-paper group-hover:text-accent",
                          )}
                        >
                          {item.label}
                        </span>
                      </TransitionLink>
                    </motion.div>
                  </li>
                );
              })}
            </ul>
          </nav>
          <motion.div
            className="container-x flex flex-col gap-5 pb-10"
            initial={{ opacity: 0, y: reduced ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: ease.out, delay: reduced ? 0 : 0.45 }}
          >
            <div className="hairline" />
            <ul className="flex flex-wrap gap-x-5">
              {external.map((s) => {
                const isHttp = /^https?:\/\//.test(s.href);
                return (
                  <li key={s.id}>
                    <a
                      href={s.href}
                      {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.2em] text-paper/70 transition-colors hover:text-accent"
                    >
                      {s.label}
                    </a>
                  </li>
                );
              })}
            </ul>
            {profile.location && <p className="eyebrow">{profile.location}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActiveMobileMenu(props: Omit<ComponentProps<typeof MobileMenu>, "pathname">) {
  const pathname = usePathname();
  return <MobileMenu {...props} pathname={pathname} />;
}

/* ─────────────────────────── Nav ─────────────────────────── */

/**
 * Fixed top bar: monogram + name, primary links with an animated active pill (shared layoutId),
 * live REC timecode + studio clock on desktop, and a full-screen staggered menu on mobile.
 * Hides while scrolling down, returns on scroll up.
 */
export default function Nav() {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = useCallback(() => {
    setOpen(false);
    toggle.current?.focus({ preventScroll: true });
  }, []);
  const dismiss = useCallback(() => setOpen(false), []);

  // Hide-on-scroll + "scrolled" backdrop, driven from the shared scroll store (no React state).
  useEffect(() => {
    const el = header.current;
    if (!el) return;
    let raf = 0;
    let hidden = false;
    let scrolled = false;
    let lastY = scrollState.y;
    const loop = () => {
      const y = scrollState.y;
      const dy = y - lastY;
      lastY = y;
      const nextScrolled = y > 24;
      if (nextScrolled !== scrolled) {
        scrolled = nextScrolled;
        el.dataset.scrolled = String(scrolled);
      }
      const pinned = el.dataset.menu === "true" || el.contains(document.activeElement);
      let nextHidden = hidden;
      if (pinned || y < 140) nextHidden = false;
      else if (dy > 1.5) nextHidden = true;
      else if (dy < -1.5) nextHidden = false;
      if (nextHidden !== hidden) {
        hidden = nextHidden;
        el.dataset.hidden = String(hidden);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <header
        ref={header}
        data-hidden="false"
        data-scrolled="false"
        data-menu={String(open)}
        className="group/nav fixed inset-x-0 top-0 z-50 transition-transform duration-700 ease-expo data-[hidden=true]:-translate-y-full"
      >
        {/* Scrolled bar: glass blur on fine pointers only (it re-blurs the live canvas every frame); none while the menu is open. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 border-b border-transparent bg-ink/0 transition-[background-color,border-color,backdrop-filter] duration-500",
            !open &&
              "group-data-[scrolled=true]/nav:border-line group-data-[scrolled=true]/nav:bg-ink/85 fine:group-data-[scrolled=true]/nav:bg-ink/60 fine:group-data-[scrolled=true]/nav:backdrop-blur-md",
          )}
        />
        <nav aria-label="Primary" className="container-x flex h-[var(--nav-height)] items-center justify-between gap-6">
          <TransitionLink
            href="/"
            label="Home"
            onClick={() => setOpen(false)}
            className="group flex items-center gap-3"
            aria-label={`${profile.name} — home`}
          >
            <span className="relative grid size-9 place-items-center overflow-hidden rounded-full border border-paper/20 font-display text-[13px] font-bold tracking-tight transition-colors duration-300 group-hover:border-accent">
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-accent transition-transform duration-500 ease-expo group-hover:scale-y-100" />
              <span className="relative transition-colors duration-300 group-hover:text-accent-contrast">AA</span>
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-[13px] font-semibold tracking-tight">{profile.name}</span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
                {profile.roles.slice(0, 2).join(" / ")}
              </span>
            </span>
          </TransitionLink>

          <div className="hidden md:block">
            <Suspense fallback={<DesktopLinks pathname={null} />}>
              <ActiveDesktopLinks />
            </Suspense>
          </div>

          <Readouts />

          <button
            ref={toggle}
            type="button"
            className="group relative flex h-10 items-center gap-3 rounded-full border border-paper/15 pl-4 pr-3 font-mono text-[11px] uppercase tracking-[0.2em] md:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-4 overflow-hidden">
              <span
                className={cn(
                  "block transition-transform duration-500 ease-expo",
                  open ? "-translate-y-1/2" : "translate-y-0",
                )}
              >
                <span className="block h-4 leading-4">Menu</span>
                <span className="block h-4 leading-4">Close</span>
              </span>
            </span>
            <span className="relative block h-3 w-5" aria-hidden="true">
              <span
                className={cn(
                  "absolute left-0 top-0.5 h-px w-full bg-paper transition-transform duration-500 ease-expo",
                  open && "translate-y-[4px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0.5 left-0 h-px w-full bg-paper transition-transform duration-500 ease-expo",
                  open && "-translate-y-[4px] -rotate-45",
                )}
              />
            </span>
          </button>
        </nav>
      </header>

      <Suspense fallback={null}>
        <ActiveMobileMenu id={menuId} open={open} onClose={close} onDismiss={dismiss} headerRef={header} />
      </Suspense>
    </>
  );
}
