import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useScrollBus, usePrefersReducedMotion } from "@/lib/scrollProgress";

interface Props {
  panels: ReactNode[];
  panelVh?: number;
  id?: string;
  className?: string;
  /** Called with the active panel index (0-based) whenever it changes. */
  onPanelActive?: (i: number) => void;
}

/**
 * HorizontalPanSection — vertical scroll translates content horizontally.
 * Outer wrapper is `panels * panelVh` tall; inner sticky flex row translates X.
 * Mobile <768px and prefers-reduced-motion fall back to a vertical stack.
 */
export function HorizontalPanSection({ panels, panelVh = 100, id, className = "", onPanelActive }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const bus = useScrollBus();
  const reduced = usePrefersReducedMotion();
  const [x, setX] = useState(0);
  const [p, setP] = useState(0);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const n = panels.length;

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (reduced || isMobile) return;
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "50% 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced, isMobile]);

  useEffect(() => {
    if (reduced || isMobile || !inView) return;
    const el = wrapRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;
    const compute = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height - vh;
      const scrolled = -r.top;
      const prog = Math.max(0, Math.min(1, total > 0 ? scrolled / total : 0));
      const innerW = inner.scrollWidth;
      const viewportW = window.innerWidth;
      const maxX = Math.max(0, innerW - viewportW);
      setX(prog * maxX);
      setP(prog);
      // Active panel = whichever panel occupies center of viewport
      const idx = Math.min(n - 1, Math.max(0, Math.round(prog * (n - 1))));
      setActive(idx);
    };
    return bus.subscribe(compute);
  }, [bus, inView, reduced, isMobile, n]);

  // Fire onPanelActive callback when active changes
  useEffect(() => {
    onPanelActive?.(active);
  }, [active, onPanelActive]);

  if (reduced || isMobile) {
    return (
      <section id={id} className={`px-6 py-16 space-y-24 ${className}`}>
        {panels.map((panel, i) => (
          <div key={i} className="max-w-5xl mx-auto">
            {panel}
          </div>
        ))}
      </section>
    );
  }

  return (
    <section id={id} ref={wrapRef} className={`relative ${className}`} style={{ height: `${n * panelVh}vh`, minHeight: `${n * panelVh}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div
          ref={innerRef}
          className="flex h-full items-center"
          style={{
            transform: `translate3d(${-x}px, 0, 0)`,
            transition: "transform 60ms linear",
            willChange: inView ? "transform" : undefined,
          }}
        >
          {panels.map((panel, i) => (
            <div
              key={i}
              data-panel-index={i}
              className="shrink-0 w-screen h-full flex items-center justify-center px-6 sm:px-14"
            >
              <div className="w-full max-w-5xl">{panel}</div>
            </div>
          ))}
        </div>

        {/* Right-margin pulsing chevron — fades on last panel */}
        <div
          className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            opacity: active < n - 1 ? 0.7 : 0,
            transition: "opacity 400ms ease",
            animation: active < n - 1 ? "hpanChev 1.6s ease-in-out infinite" : "none",
          }}
          aria-hidden
        >
          <ChevronRight className="w-8 h-8 text-danger" />
        </div>

        {/* Progress indicators, bottom */}
        <div className="absolute bottom-0 inset-x-0 flex flex-col items-center gap-2 pb-3">
          <div className="flex items-center gap-2">
            {panels.map((_, i) => (
              <span
                key={i}
                className="block rounded-full transition-all duration-200"
                style={{
                  width: i === active ? 8 : 6,
                  height: i === active ? 8 : 6,
                  background: i === active ? "var(--danger)" : "var(--muted-foreground)",
                  opacity: i === active ? 1 : 0.4,
                }}
              />
            ))}
          </div>
          <div className="h-[2px] w-40 bg-rule/40 overflow-hidden rounded-full">
            <div
              className="h-full bg-danger origin-left"
              style={{ transform: `scaleX(${p})`, transformOrigin: "left center", transition: "transform 120ms linear" }}
            />
          </div>
        </div>

        <style>{`
          @keyframes hpanChev {
            0%, 100% { transform: translate(0, -50%); }
            50% { transform: translate(6px, -50%); }
          }
        `}</style>
      </div>
    </section>
  );
}
