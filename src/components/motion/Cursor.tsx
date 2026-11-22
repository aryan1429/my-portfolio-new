"use client";

import { useEffect, useRef } from "react";
import { damp, prefersReducedMotion, useIsTouch } from "@/lib/motion";
import { installPointerListener, pointerState } from "@/lib/pointer";

const INTERACTIVE =
  'a[href], button, [role="button"], [data-cursor], [data-magnetic], label[for], summary, select, input[type="submit"], input[type="button"]';

const RING_SIZE = 40;

type Mode = "default" | "hover" | "label" | "magnetic";

interface Target {
  el: Element | null;
  mode: Mode;
  label: string;
  magnetic: boolean;
}

function resolveTarget(node: EventTarget | null): Target {
  const start = node instanceof Element ? node : null;
  const el = start?.closest(INTERACTIVE) ?? null;
  if (!el) return { el: null, mode: "default", label: "", magnetic: false };
  if (el.closest("[data-cursor='none'], [data-cursor-hide]")) return { el, mode: "default", label: "", magnetic: false };
  const magnetic = el.hasAttribute("data-magnetic");
  const label = (el.getAttribute("data-cursor") ?? "").trim();
  if (label) return { el, mode: "label", label, magnetic };
  if (magnetic) return { el, mode: "magnetic", label: "", magnetic };
  return { el, mode: "hover", label: "", magnetic: false };
}

function CursorLayer() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const tagText = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const rootEl = root.current;
    const ringEl = ring.current;
    const dotEl = dot.current;
    const tagEl = tag.current;
    const tagTextEl = tagText.current;
    if (!rootEl || !ringEl || !dotEl || !tagEl || !tagTextEl) return;

    const html = document.documentElement;
    html.classList.add("has-custom-cursor");
    const releasePointer = installPointerListener();

    let target: Target = { el: null, mode: "default", label: "", magnetic: false };
    let visible = false;
    let pressed = false;
    let initialised = false;

    const ringPos = { x: pointerState.x, y: pointerState.y };
    const tagPos = { x: pointerState.x, y: pointerState.y };
    const scale = { ring: 1, dot: 1 };

    const setMode = (next: Target) => {
      target = next;
      rootEl.dataset.mode = next.mode;
      if (next.mode === "label") tagTextEl.textContent = next.label;
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const next = resolveTarget(e.target);
      if (next.el !== target.el || next.label !== target.label || next.mode !== target.mode) setMode(next);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!initialised) {
        initialised = true;
        ringPos.x = tagPos.x = e.clientX;
        ringPos.y = tagPos.y = e.clientY;
      }
      if (!visible) {
        visible = true;
        rootEl.dataset.visible = "true";
      }
    };
    const onLeave = (e: PointerEvent) => {
      if (e.relatedTarget === null) {
        visible = false;
        rootEl.dataset.visible = "false";
      }
    };
    const onDown = () => {
      pressed = true;
    };
    const onUp = () => {
      pressed = false;
    };
    const onBlur = () => {
      visible = false;
      rootEl.dataset.visible = "false";
    };

    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("blur", onBlur);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const reduced = prefersReducedMotion();

      // Target vanished (route change) → reset.
      if (target.el && !target.el.isConnected) setMode({ el: null, mode: "default", label: "", magnetic: false });

      const px = pointerState.x;
      const py = pointerState.y;
      let tx = px;
      let ty = py;
      let ringTarget = 1;
      let dotTarget = 1;

      // ── reads first ──
      if (target.magnetic && target.el) {
        const r = target.el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        tx = cx + (px - cx) * 0.22;
        ty = cy + (py - cy) * 0.22;
        if (target.mode === "magnetic") {
          ringTarget = Math.min(3.2, Math.max(1.4, (Math.max(r.width, r.height) + 18) / RING_SIZE));
          dotTarget = 0;
        }
      }
      if (target.mode === "hover") {
        ringTarget = 1.65;
        dotTarget = 0.5;
      } else if (target.mode === "label") {
        ringTarget = 0.4;
        dotTarget = 0;
      }
      if (pressed) {
        ringTarget *= 0.82;
        dotTarget *= 1.6;
      }

      // ── writes ──
      const kRing = reduced ? 1 : damp(0.18, dt);
      const kTag = reduced ? 1 : damp(0.24, dt);
      const kScale = reduced ? 1 : damp(0.2, dt);
      ringPos.x += (tx - ringPos.x) * kRing;
      ringPos.y += (ty - ringPos.y) * kRing;
      tagPos.x += (tx - tagPos.x) * kTag;
      tagPos.y += (ty - tagPos.y) * kTag;
      scale.ring += (ringTarget - scale.ring) * kScale;
      scale.dot += (dotTarget - scale.dot) * kScale;

      dotEl.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale(${scale.dot})`;
      ringEl.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%) scale(${scale.ring})`;
      tagEl.style.transform = `translate3d(${tagPos.x}px, ${tagPos.y}px, 0) translate(-50%, -50%)`;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", onBlur);
      releasePointer();
      html.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden="true"
      data-mode="default"
      data-visible="false"
      className="group/cursor pointer-events-none fixed inset-0 z-[120] opacity-0 transition-opacity duration-300 data-[visible=true]:opacity-100"
    >
      {/* Lagging ring */}
      <div
        ref={ring}
        className="absolute left-0 top-0 rounded-full border border-paper/50 will-change-transform transition-[border-color,background-color] duration-300 group-data-[mode=hover]/cursor:border-accent group-data-[mode=hover]/cursor:bg-accent/10 group-data-[mode=magnetic]/cursor:border-accent/80 group-data-[mode=label]/cursor:border-transparent"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      />
      {/* Label pill ("View", "Play"...) — not scaled, so text stays crisp */}
      <div ref={tag} className="absolute left-0 top-0 will-change-transform">
        <div className="flex size-[88px] scale-50 items-center justify-center rounded-full bg-accent opacity-0 transition-[opacity,scale] duration-300 ease-expo group-data-[mode=label]/cursor:scale-100 group-data-[mode=label]/cursor:opacity-100">
          <span
            ref={tagText}
            className="px-2 text-center font-mono text-[10px] font-medium uppercase leading-tight tracking-[0.18em] text-accent-contrast"
          />
        </div>
      </div>
      {/* Precise dot */}
      <div
        ref={dot}
        className="absolute left-0 top-0 size-1.5 rounded-full bg-paper mix-blend-difference will-change-transform"
      />
    </div>
  );
}

/**
 * Custom cursor: exact dot + lerped ring. Grows over links/buttons, morphs into a label pill for
 * `[data-cursor="View"]`, wraps and is pulled towards `[data-magnetic]` elements.
 * Not rendered on touch / coarse-pointer devices.
 */
export default function Cursor() {
  const isTouch = useIsTouch();
  if (isTouch) return null;
  return <CursorLayer />;
}
