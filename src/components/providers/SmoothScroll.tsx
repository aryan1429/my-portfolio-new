"use client";

import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState, scrollTo, setLenis } from "@/lib/scroll";
import { installPointerListener } from "@/lib/pointer";
import { usePrefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

function updateDirection(delta: number): void {
  if (delta > 0) scrollState.direction = 1;
  else if (delta < 0) scrollState.direction = -1;
}

/** Resets scroll to the top (or to the URL hash target) whenever the pathname changes. */
function ScrollReset() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(decodeURIComponent(hash)) : null;
    scrollTo(target ?? 0, { immediate: true, offset: target ? -80 : 0 });
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [pathname]);

  return null;
}

/**
 * Root smooth-scroll provider: one Lenis instance driven by gsap.ticker so ScrollTrigger and
 * Lenis share a clock. Falls back to native scrolling under prefers-reduced-motion.
 * Also installs the shared pointer listener and keeps `scrollState` up to date.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => installPointerListener(), []);

  useEffect(() => {
    if (reduced) {
      let lastY = window.scrollY;
      const onNativeScroll = () => {
        const y = window.scrollY;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const delta = y - lastY;
        lastY = y;
        scrollState.y = y;
        scrollState.progress = Math.min(1, Math.max(0, y / max));
        scrollState.velocity = delta;
        updateDirection(delta);
      };
      const decay = () => {
        scrollState.velocity *= 0.9;
        if (Math.abs(scrollState.velocity) < 0.01) scrollState.velocity = 0;
      };
      onNativeScroll();
      scrollState.velocity = 0;
      window.addEventListener("scroll", onNativeScroll, { passive: true });
      gsap.ticker.add(decay);
      return () => {
        window.removeEventListener("scroll", onNativeScroll);
        gsap.ticker.remove(decay);
      };
    }

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      anchors: { offset: -80 },
      stopInertiaOnNavigate: true,
    });

    const onScroll = (l: Lenis) => {
      scrollState.y = l.scroll;
      scrollState.progress = Number.isFinite(l.progress) ? Math.min(1, Math.max(0, l.progress)) : 0;
      scrollState.velocity = l.velocity;
      updateDirection(l.direction);
      ScrollTrigger.update();
    };
    const unsubscribe = lenis.on("scroll", onScroll);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
      if (!lenis.isScrolling) {
        scrollState.velocity *= 0.9;
        if (Math.abs(scrollState.velocity) < 0.01) scrollState.velocity = 0;
      }
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    setLenis(lenis);
    scrollState.y = lenis.scroll;
    scrollState.progress = Number.isFinite(lenis.progress) ? lenis.progress : 0;
    ScrollTrigger.refresh();

    return () => {
      unsubscribe();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      setLenis(null);
      lenis.destroy();
    };
  }, [reduced]);

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <ScrollReset />
      </Suspense>
    </>
  );
}
