import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** min-height for the placeholder, e.g. "300vh" */
  minHeight: string;
  /** rootMargin, default 150% */
  rootMargin?: string;
  /** if true, hydrate immediately (eager) */
  eager?: boolean;
  id?: string;
}

/**
 * LazySection — renders a min-height placeholder until the section is within
 * `rootMargin` of the viewport, then swaps in the real children. Prevents
 * heavy SVG / Framer trees from all mounting on first paint.
 */
export function LazySection({ children, minHeight, rootMargin = "150% 0px", eager = false, id }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(eager);

  useEffect(() => {
    if (ready) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setReady(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ready, rootMargin]);

  return (
    <div ref={ref} id={id} style={ready ? undefined : { minHeight }}>
      {ready ? children : null}
    </div>
  );
}
