import { useEffect, useRef, useState } from "react";
import { useScrollBus, usePrefersReducedMotion } from "@/lib/scrollProgress";

interface Props {
  id?: string;
  act?: string; // "ACT TWO"
  top: string;
  bottom: string;
}

/**
 * TransitionCurtain — full-bleed, scroll-locked chapter break.
 *
 * Outer 200vh; inner sticky h:100vh. Progress p in [0..1]:
 *   0.00..0.20 background fades cream → indigo
 *   0.15..0.40 "top" line + act label fade in
 *   0.40..0.60 hold
 *   0.55..0.80 "top" fades out, "bottom" fades in (cross-fade in place)
 *   0.80..1.00 background fades indigo → cream
 */
export function TransitionCurtain({ id, act, top, bottom }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bus = useScrollBus();
  const reduced = usePrefersReducedMotion();
  const [p, setP] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "50% 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (reduced || !inView) return;
    const el = wrapRef.current;
    if (!el) return;
    const compute = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height - vh;
      const scrolled = -r.top;
      const prog = Math.max(0, Math.min(1, total > 0 ? scrolled / total : 0));
      setP(prog);
    };
    return bus.subscribe(compute);
  }, [bus, inView, reduced]);

  if (reduced) {
    return (
      <section id={id} className="bg-primary text-primary-foreground py-24 px-6 text-center">
        {act && <div className="font-mono text-xs tracking-[0.35em] text-danger mb-6">{act.split("").join(" ")}</div>}
        <div className="font-serif text-5xl tracking-wide">{top}</div>
        <div className="font-serif text-5xl tracking-wide mt-6 opacity-80">{bottom}</div>
      </section>
    );
  }

  const bgAlpha = smooth(p, 0.0, 0.2) * (1 - smooth(p, 0.8, 1.0));
  const topAlpha = smooth(p, 0.15, 0.4) * (1 - smooth(p, 0.55, 0.75));
  const bottomAlpha = smooth(p, 0.55, 0.8);
  const actAlpha = Math.min(topAlpha + bottomAlpha, 1);

  return (
    <section id={id} ref={wrapRef} className="relative" style={{ height: "200vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* full-bleed indigo layer over cream */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "var(--primary)",
            opacity: bgAlpha,
            transition: "opacity 60ms linear",
          }}
        />
        <div className="relative z-10 text-center px-6 max-w-4xl">
          {act && (
            <div
              className="font-mono text-xs sm:text-sm tracking-[0.4em] text-danger mb-10"
              style={{ opacity: actAlpha, transition: "opacity 100ms linear" }}
            >
              {act.split("").join(" ")}
            </div>
          )}
          {/* cross-fade lines in the same slot */}
          <div className="relative min-h-[6em]">
            <div
              className="absolute inset-0 flex items-center justify-center font-serif text-5xl sm:text-7xl tracking-wide leading-tight"
              style={{
                opacity: topAlpha,
                transform: `translateY(${(1 - topAlpha) * 12}px)`,
                transition: "opacity 100ms linear, transform 100ms linear",
                color: "var(--primary-foreground)",
              }}
            >
              {top}
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center font-serif text-5xl sm:text-7xl tracking-wide leading-tight"
              style={{
                opacity: bottomAlpha,
                transform: `translateY(${(1 - bottomAlpha) * 12}px)`,
                transition: "opacity 100ms linear, transform 100ms linear",
                color: "var(--primary-foreground)",
              }}
            >
              {bottom}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function smooth(p: number, a: number, b: number) {
  if (b <= a) return p >= b ? 1 : 0;
  return Math.max(0, Math.min(1, (p - a) / (b - a)));
}
