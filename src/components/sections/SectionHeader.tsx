import { useEffect, useRef, useState } from "react";

interface Props {
  num: string; // "01"
  title: string;
  subtitle: string;
  anchorId?: string;
  hideNum?: boolean; // when true, omit the "SECTION XX" label
}

/**
 * SectionHeader — centered chapter card.
 *  1. Section number  (mono, coral, letter-spaced) — 300ms fade (optional)
 *  2. Title           (serif, 4rem, letter-spaced) — 30ms per-letter cascade
 *  3. Subtitle        (sans, muted)                — fade after title
 *  4. Rule            (120px, coral, from center)  — draws outward last
 */
export function SectionHeader({ num, title, subtitle, anchorId, hideNum }: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio > 0.3) {
          setEntered(true);
          obs.disconnect();
        }
      },
      { threshold: [0, 0.3, 0.6] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const letters = Array.from(title);
  const cascadeStart = hideNum ? 0 : 400; // start immediately if no number label
  const cascadeEnd = cascadeStart + letters.length * 30 + 500;

  return (
    <section
      ref={rootRef}
      id={anchorId}
      className="relative flex items-center justify-center px-4 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-4 sm:pb-6"
    >
      {/* Top divider between chapters: thin slate rule with a coral dot */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 top-0 flex items-center justify-center"
        style={{ width: "min(72%, 900px)", height: 1 }}
      >
        <div className="flex-1 h-px" style={{ background: "color-mix(in oklch, var(--color-foreground) 15%, transparent)" }} />
        <div className="mx-3 rounded-full bg-danger" style={{ width: 6, height: 6 }} />
        <div className="flex-1 h-px" style={{ background: "color-mix(in oklch, var(--color-foreground) 15%, transparent)" }} />
      </div>

      <div className="max-w-4xl w-full flex flex-col items-center text-center">
        {/* Section number */}
        {!hideNum && (
          <div
            className="font-mono text-[0.65rem] sm:text-sm tracking-[0.25em] sm:tracking-[0.4em] text-danger uppercase transition-all"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? "translateY(0)" : "translateY(6px)",
              transitionDuration: "300ms",
            }}
          >
            SECTION {num}
          </div>
        )}

        {/* Title with letter cascade */}
        <h1
          className={`font-serif text-ink leading-[1.05] break-words ${hideNum ? "" : "mt-4 sm:mt-5"}`}
          style={{ letterSpacing: "0.01em", fontSize: "clamp(1.7rem, 1.1rem + 3.4vw, 3rem)" }}
        >
          {(() => {
            let idx = -1;
            return title.split(" ").map((word, w, arr) => (
              <span key={w} className="inline-block whitespace-nowrap">
                {Array.from(word + (w < arr.length - 1 ? " " : "")).map((ch, i) => {
                  idx += 1;
                  const delay = cascadeStart + idx * 30;
                  return (
                    <span
                      key={i}
                      className="inline-block"
                      style={{
                        opacity: entered ? 1 : 0,
                        transform: entered ? "translateY(0)" : "translateY(18px)",
                        transition: "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                        transitionDelay: `${delay}ms`,
                        whiteSpace: ch === " " ? "pre" : undefined,
                      }}
                    >
                      {ch}
                    </span>
                  );
                })}
              </span>
            ));
          })()}

        </h1>

        {/* Subtitle */}
        <p
          className="mt-3 sm:mt-4 text-[0.95rem] sm:text-lg text-muted-foreground measure transition-all"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? "translateY(0)" : "translateY(10px)",
            transitionDuration: "500ms",
            transitionDelay: `${cascadeEnd}ms`,
          }}
        >
          {subtitle}
        </p>

        {/* 120px rule, draws outward from center */}
        <div className="mt-6 relative" style={{ width: 120, height: 2 }}>
          <div
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-danger"
            style={{
              width: entered ? 120 : 0,
              transition: "width 700ms cubic-bezier(0.65, 0, 0.35, 1)",
              transitionDelay: `${cascadeEnd + 400}ms`,
            }}
          />
        </div>
      </div>
    </section>
  );
}
