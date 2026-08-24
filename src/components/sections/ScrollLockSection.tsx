import { useEffect, useRef, useState, type ReactNode } from "react";
import { useScrollBus, usePrefersReducedMotion } from "@/lib/scrollProgress";

interface Props {
  /** ordered content — one per step */
  steps: ReactNode[];
  /** viewport heights per step, default 0.8 */
  stepVh?: number;
  /** if true, unpin immediately at final step so an interactive can breathe */
  interactiveRelease?: boolean;
  /** optional label shown alongside the counter */
  label?: string;
  /** DOM id anchor */
  id?: string;
  className?: string;
}

/**
 * ScrollLockSection — a native-scroll pinned stepper.
 *
 *  Outer wrapper is `steps * stepVh * 100vh` tall.
 *  Inner content is `position: sticky; top:0; height:100vh`.
 *  As the user scrolls through the outer wrapper, progress advances the step.
 *
 *  Reduced-motion: renders every step vertically stacked, no pinning.
 */
export function ScrollLockSection({
  steps,
  stepVh = 0.8,
  interactiveRelease = false,
  label,
  id,
  className = "",
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bus = useScrollBus();
  const reduced = usePrefersReducedMotion();
  const [stepIdx, setStepIdx] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [inView, setInView] = useState(false);
  const stepsCount = steps.length;
  const pinHeightVh = Math.max(1, stepsCount * stepVh * 100);

  // Gate scroll subscription with IntersectionObserver
  useEffect(() => {
    if (reduced) return;
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "50% 0px",
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  // Subscribe while in view; compute progress from bounding rect
  useEffect(() => {
    if (reduced || !inView) return;
    const el = wrapperRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // total scrollable distance = wrapper height - one viewport (the sticky window)
      const total = rect.height - vh;
      // scrolled = distance from top-of-wrapper into scroll range
      const scrolled = -rect.top;
      let p = total > 0 ? scrolled / total : 0;
      p = Math.max(0, Math.min(1, p));
      // If interactiveRelease, treat the last step's window as "final" so we don't jitter past 100
      const effectiveSteps = stepsCount;
      let idx = Math.floor(p * effectiveSteps);
      if (idx >= effectiveSteps) idx = effectiveSteps - 1;
      setStepIdx(idx);
      setProgressPct(p * 100);
    };
    const unsub = bus.subscribe(compute);
    return unsub;
  }, [bus, inView, reduced, stepsCount]);

  // Keyboard support: ↓/Space advance by one step's worth of scroll, ↑ reverse
  useEffect(() => {
    if (reduced || !inView) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName?.match(/^(INPUT|TEXTAREA|SELECT)$/)) return;
      const wrap = wrapperRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      // only act if we're actually pinned
      if (rect.top > 40 || rect.bottom < window.innerHeight - 40) return;
      const oneStep = window.innerHeight * stepVh;
      if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        window.scrollBy({ top: oneStep, behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        window.scrollBy({ top: -oneStep, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inView, reduced, stepVh]);

  // Reduced motion: static stack
  if (reduced) {
    return (
      <section id={id} className={`px-6 sm:px-12 py-16 space-y-24 ${className}`}>
        {steps.map((s, i) => (
          <div key={i} className="max-w-5xl mx-auto">
            {s}
          </div>
        ))}
      </section>
    );
  }

  return (
    <section
      id={id}
      ref={wrapperRef}
      className={`relative ${className}`}
      style={{ height: `${pinHeightVh}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center px-4 sm:px-8">
          {steps.map((s, i) => {
            const active = i === stepIdx;
            return (
              <div
                key={i}
                className="absolute inset-0 flex items-center justify-center px-4 sm:px-10"
                style={{
                  opacity: active ? 1 : 0,
                  transform: active ? "translateY(0)" : "translateY(12px)",
                  transitionProperty: "opacity, transform",
                  transitionDuration: active ? "350ms" : "250ms",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  pointerEvents: active ? "auto" : "none",
                  willChange: active ? "opacity, transform" : undefined,
                }}
                aria-hidden={!active}
              >
                <div className="w-full max-w-5xl">{s}</div>
              </div>
            );
          })}
        </div>

        {/* Step counter */}
        <div className="absolute bottom-6 right-6 font-mono text-xs tracking-widest text-muted-foreground/80 pointer-events-none">
          {label && <span className="mr-3 uppercase text-[10px] opacity-70">{label}</span>}
          <span className="text-ink">{String(stepIdx + 1).padStart(2, "0")}</span>
          <span className="opacity-40"> / {String(stepsCount).padStart(2, "0")}</span>
        </div>

        {/* Bottom progress bar */}
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-rule/40 pointer-events-none">
          <div
            className="h-full bg-danger origin-left"
            style={{
              transform: `scaleX(${progressPct / 100})`,
              transformOrigin: "left center",
              transition: "transform 120ms linear",
            }}
          />
        </div>
      </div>

      {/* Optional interactive-release tail: if enabled, the final quarter of the outer scroll releases the pin visually — the sticky naturally unpins as the wrapper bottom exits. Nothing to do here. */}
      {interactiveRelease ? null : null}
    </section>
  );
}
