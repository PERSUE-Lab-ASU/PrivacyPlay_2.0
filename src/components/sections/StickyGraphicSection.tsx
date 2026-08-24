import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  graphic: ReactNode;
  /** narration blocks — the index of the active one is exposed via onActiveChange */
  narration: ReactNode[];
  onActiveChange?: (idx: number) => void;
  id?: string;
}

/**
 * StickyGraphicSection — Pudding-style: graphic pinned on the left, narration
 * scrolls past on the right. Each narration block controls the graphic's state
 * via onActiveChange.
 */
export function StickyGraphicSection({ graphic, narration, onActiveChange, id }: Props) {
  const narrRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        // pick the block closest to the middle of the viewport
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const av = Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - window.innerHeight / 2);
            const bv = Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - window.innerHeight / 2);
            return av - bv;
          });
        if (visible[0]) {
          const idx = Number((visible[0].target as HTMLElement).dataset.idx);
          if (!Number.isNaN(idx)) {
            setActive(idx);
            onActiveChange?.(idx);
          }
        }
      },
      { rootMargin: "-30% 0px -30% 0px", threshold: [0, 0.5, 1] },
    );
    narrRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [onActiveChange, narration.length]);

  return (
    <section id={id} className="px-6 sm:px-10 py-16">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr,1fr] gap-8 md:gap-14">
        <div className="hidden md:block">
          <div className="sticky top-[20vh] h-[60vh] flex items-center justify-center">
            {graphic}
          </div>
        </div>
        {/* Mobile: graphic pins to top */}
        <div className="md:hidden sticky top-[8vh] z-10 bg-background/95 backdrop-blur h-[40vh] flex items-center justify-center border-b border-rule">
          {graphic}
        </div>
        <div className="space-y-[60vh]">
          {narration.map((block, i) => (
            <div
              key={i}
              ref={(el) => { narrRefs.current[i] = el; }}
              data-idx={i}
              className="transition-opacity duration-500"
              style={{ opacity: active === i ? 1 : 0.45 }}
            >
              {block}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
