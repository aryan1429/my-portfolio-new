"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import { MagneticButton } from "@/components/motion";
import type { TechProject } from "@/data/types";
import { cn } from "@/lib/cn";
import { ease, usePrefersReducedMotion } from "@/lib/motion";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import ProjectGallery from "./ProjectGallery";
import { isHttpUrl, pad2, projectImages } from "./utils";

const LOCK_REASON = "tech-project-modal";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const noopSubscribe = () => () => {};
const clientTrue = () => true;
const serverFalse = () => false;

export interface ProjectModalProps {
  /** Project to show; null = closed. */
  project: TechProject | null;
  /** 1-based position in the full project list. */
  index: number;
  total: number;
  prev: TechProject | null;
  next: TechProject | null;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}

function externalProps(href: string) {
  return isHttpUrl(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

/**
 * Project detail dialog, portalled to <body> (above the nav, below the page-transition wipe and
 * cursor). Depth/blur entrance, focus trap + initial focus on close, ESC / backdrop close, scroll
 * lock, gallery, full write-up, spec sheet, Live / Repo links and persistent prev/next controls.
 */
export default function ProjectModal({ project, index, total, prev, next, onClose, onNavigate }: ProjectModalProps) {
  const mounted = useSyncExternalStore(noopSubscribe, clientTrue, serverFalse);
  const reduced = usePrefersReducedMotion();
  const open = project !== null;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Scroll lock, ESC, focus trap and initial focus — bound to the open state only.
  useEffect(() => {
    if (!open) return;
    lockScroll(LOCK_REASON);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0 && !el.closest("[aria-hidden='true'], [inert]"),
      );
      if (nodes.length === 0) {
        e.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      unlockScroll(LOCK_REASON);
    };
  }, [open]);

  // Switching project inside the dialog starts at the top.
  const slug = project?.slug;
  useEffect(() => {
    if (slug && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [slug]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {project ? (
        <motion.div
          key="tech-project-modal"
          className="fixed inset-0 z-[80] flex items-stretch justify-center md:items-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.15 : 0.45, ease: ease.out }}
        >
          {/* Backdrop — opaque scrim, fades with the wrapper (no animated backdrop-filter over the canvas). */}
          <div aria-hidden="true" className="absolute inset-0 bg-ink/90" onClick={onClose} data-cursor="Close" />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tech-modal-title"
            tabIndex={-1}
            className="relative flex h-[100svh] w-full max-w-6xl flex-col overflow-hidden border-line bg-ink-2/95 shadow-[0_40px_120px_-40px_rgb(91_108_255/0.45)] focus:outline-none md:h-[min(92svh,1000px)] md:rounded-2xl md:border"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.965, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
            transition={{ duration: reduced ? 0.15 : 0.7, ease: ease.out }}
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-tech-2/70 to-transparent" />

            {/* Header bar */}
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 md:px-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute tabular-nums">
                <span className="text-tech-2">PRJ {pad2(index)}</span>/{pad2(total)}
                {project.year ? <span className="ml-3 text-paper/60">{project.year}</span> : null}
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="group flex items-center gap-2.5 rounded-full border border-line px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/80 transition-colors hover:border-tech-2/60 hover:text-paper"
              >
                <span className="hidden sm:inline">Esc</span>
                <X className="size-4 transition-transform duration-300 group-hover:rotate-90" aria-hidden="true" />
                <span className="sr-only">Close project details</span>
              </button>
            </div>

            {/* Scrollable content (keyed per project) */}
            <div ref={scrollRef} data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain">
              <AnimatePresence mode="wait" initial={false}>
                <motion.article
                  key={project.slug}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(6px)" }}
                  transition={{ duration: reduced ? 0.12 : 0.35, ease: ease.out }}
                  className="px-5 pb-12 pt-6 md:px-8 md:pt-8"
                >
                  <header className="flex flex-col gap-4">
                    <ul className="flex flex-wrap gap-1.5" aria-label="Categories">
                      {project.categories.map((c) => (
                        <li
                          key={c}
                          className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-paper/75"
                        >
                          <span aria-hidden="true" className="size-1 rounded-full bg-tech" />
                          {c}
                        </li>
                      ))}
                    </ul>
                    <h2
                      id="tech-modal-title"
                      className="font-display text-[clamp(2rem,5.5vw,4.25rem)] font-bold leading-[0.95] tracking-[-0.03em] text-balance"
                    >
                      {project.title}
                    </h2>
                    <p className="max-w-3xl text-base leading-relaxed text-paper/75 md:text-lg">{project.summary}</p>
                  </header>

                  <div className="mt-7">
                    <ProjectGallery
                      key={project.slug}
                      images={projectImages(project)}
                      title={project.title}
                      startIndex={Math.max(0, projectImages(project).indexOf(project.image))}
                    />
                  </div>

                  <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-10">
                    {/* Write-up */}
                    <div className="flex flex-col gap-8 md:col-span-7">
                      <section aria-labelledby="tech-modal-overview">
                        <h3 id="tech-modal-overview" className="eyebrow">
                          Overview
                        </h3>
                        <p className="mt-4 text-base leading-relaxed text-paper/85 md:text-[17px]">{project.description}</p>
                      </section>

                      {project.highlights.length > 0 ? (
                        <section aria-labelledby="tech-modal-highlights">
                          <h3 id="tech-modal-highlights" className="eyebrow">
                            Highlights
                          </h3>
                          <ol className="mt-4 flex flex-col">
                            {project.highlights.map((h, i) => (
                              <li key={h} className="grid grid-cols-[2.25rem_1fr] gap-3 border-t border-line py-3.5 last:border-b">
                                <span className="pt-0.5 font-mono text-[11px] tabular-nums text-tech-2">{pad2(i + 1)}</span>
                                <span className="text-[15px] leading-relaxed text-paper/80">{h}</span>
                              </li>
                            ))}
                          </ol>
                        </section>
                      ) : null}
                    </div>

                    {/* Spec sheet */}
                    <aside aria-label="Project specs" className="md:col-span-5">
                      <div className="relative rounded-xl border border-line bg-ink/50 p-5 md:p-6">
                        <dl className="flex flex-col gap-5">
                          {project.role ? (
                            <div>
                              <dt className="eyebrow">Role</dt>
                              <dd className="mt-2 text-[15px] text-paper/90">{project.role}</dd>
                            </div>
                          ) : null}
                          {project.year ? (
                            <div>
                              <dt className="eyebrow">Year</dt>
                              <dd className="mt-2 font-mono text-sm text-paper/90">{project.year}</dd>
                            </div>
                          ) : null}
                          <div>
                            <dt className="eyebrow">
                              Stack <span className="tabular-nums">({pad2(project.stack.length)})</span>
                            </dt>
                            <dd className="mt-3">
                              <ul className="flex flex-wrap gap-1.5">
                                {project.stack.map((s) => (
                                  <li
                                    key={s}
                                    className="rounded-md border border-line bg-ink-2 px-2 py-1 font-mono text-[11px] text-paper/80"
                                  >
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                        </dl>

                        {project.liveUrl || project.repoUrl ? (
                          <div className="mt-7 flex flex-wrap gap-3 border-t border-line pt-6">
                            {project.liveUrl ? (
                              <MagneticButton
                                as="a"
                                href={project.liveUrl}
                                {...externalProps(project.liveUrl)}
                                className="flex items-center gap-2 rounded-full bg-tech px-5 py-3 text-sm font-medium text-paper shadow-[0_10px_30px_-10px_var(--color-tech)] transition-colors hover:bg-[#6d7cff]"
                              >
                                {project.liveLabel ?? "Live"}
                                <ArrowUpRight className="size-4" aria-hidden="true" />
                                {isHttpUrl(project.liveUrl) ? <span className="sr-only"> (opens in a new tab)</span> : null}
                              </MagneticButton>
                            ) : null}
                            {project.repoUrl ? (
                              <MagneticButton
                                as="a"
                                href={project.repoUrl}
                                {...externalProps(project.repoUrl)}
                                className="flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-medium text-paper/90 transition-colors hover:border-tech-2/60 hover:text-paper"
                              >
                                Repository
                                <ArrowUpRight className="size-4" aria-hidden="true" />
                                {isHttpUrl(project.repoUrl) ? <span className="sr-only"> (opens in a new tab)</span> : null}
                              </MagneticButton>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </aside>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>

            {/* Persistent prev / next */}
            {prev || next ? (
              <nav aria-label="More projects" className="grid grid-cols-2 border-t border-line">
                <ProjectStep project={prev} dir="prev" onNavigate={onNavigate} />
                <ProjectStep project={next} dir="next" onNavigate={onNavigate} />
              </nav>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function ProjectStep({
  project,
  dir,
  onNavigate,
}: {
  project: TechProject | null;
  dir: "prev" | "next";
  onNavigate: (slug: string) => void;
}) {
  const isNext = dir === "next";
  if (!project) return <span aria-hidden="true" />;
  return (
    <button
      type="button"
      onClick={() => onNavigate(project.slug)}
      className={cn(
        "group flex min-w-0 items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.03] md:px-8",
        isNext ? "justify-end border-l border-line text-right" : "text-left",
      )}
    >
      {!isNext ? (
        <ArrowLeft className="size-4 shrink-0 text-mute transition-transform duration-300 group-hover:-translate-x-1 group-hover:text-tech-2" aria-hidden="true" />
      ) : null}
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">{isNext ? "Next project" : "Previous project"}</span>
        <span className="truncate font-display text-sm font-semibold text-paper/90 md:text-base">{project.title}</span>
      </span>
      {isNext ? (
        <ArrowRight className="size-4 shrink-0 text-mute transition-transform duration-300 group-hover:translate-x-1 group-hover:text-tech-2" aria-hidden="true" />
      ) : null}
    </button>
  );
}
