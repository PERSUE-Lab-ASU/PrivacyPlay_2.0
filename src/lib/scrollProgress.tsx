/**
 * ScrollProgress: a single app-root rAF loop that publishes window scrollY
 * to any subscriber via React context. Avoids per-component scroll listeners
 * and lets ScrollLockSection compute pin progress from a shared source.
 *
 * Also exposes usePrefersReducedMotion() and useSectionProgress().
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Subscriber = (scrollY: number, vh: number) => void;

interface ScrollBus {
  subscribe: (fn: Subscriber) => () => void;
  /** current scrollY (imperative read; not reactive) */
  read: () => { scrollY: number; vh: number };
}

const ScrollContext = createContext<ScrollBus | null>(null);

export function ScrollProgressProvider({ children }: { children: ReactNode }) {
  const subsRef = useRef<Set<Subscriber>>(new Set());
  const rafRef = useRef<number | null>(null);
  const lastYRef = useRef(0);
  const activeRef = useRef(0); // # of active IntersectionObserver-gated sections

  useEffect(() => {
    // Publisher: single rAF loop, only tick while at least one gated section is intersecting
    const tick = () => {
      rafRef.current = null;
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (y !== lastYRef.current) {
        lastYRef.current = y;
        for (const fn of subsRef.current) fn(y, vh);
      }
      if (activeRef.current > 0) rafRef.current = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      // Only start ticking when at least one section wants updates.
      if (activeRef.current > 0 && rafRef.current == null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    // Passive listener kicks the rAF pump; no work happens in the listener itself.
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const bus: ScrollBus = {
    subscribe(fn) {
      subsRef.current.add(fn);
      activeRef.current += 1;
      // fire once immediately with current values
      fn(window.scrollY, window.innerHeight);
      // If not currently ticking, start.
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(function bootTick() {
          rafRef.current = null;
          const y = window.scrollY;
          const vh = window.innerHeight;
          lastYRef.current = y;
          for (const s of subsRef.current) s(y, vh);
          if (activeRef.current > 0) rafRef.current = requestAnimationFrame(bootTick);
        });
      }
      return () => {
        subsRef.current.delete(fn);
        activeRef.current = Math.max(0, activeRef.current - 1);
      };
    },
    read() {
      return { scrollY: typeof window === "undefined" ? 0 : window.scrollY, vh: typeof window === "undefined" ? 800 : window.innerHeight };
    },
  };

  return <ScrollContext.Provider value={bus}>{children}</ScrollContext.Provider>;
}

export function useScrollBus(): ScrollBus {
  const ctx = useContext(ScrollContext);
  if (!ctx) {
    // Fallback no-op bus so the tree still renders outside the provider (SSR-safe).
    return {
      subscribe: () => () => {},
      read: () => ({ scrollY: 0, vh: 800 }),
    };
  }
  return ctx;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
