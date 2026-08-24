import { useEffect, useRef, useState } from "react";
import { SECTIONS, type StageId } from "@/lib/sections";

interface Props {
  activeStage: StageId;
  activeSectionId?: string | null;
  onJump: (id: string) => void;
}

/**
 * SectionRail — right-edge dot rail showing sections within the current stage.
 * Auto-hides after 2s of no scroll and reappears on scroll.
 */
export function SectionRail({ activeStage, activeSectionId, onJump }: Props) {
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setVisible(true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setVisible(false), 2000);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  const stageSections = SECTIONS.filter((s) => s.stage === activeStage);
  const activeIdx = stageSections.findIndex((s) => s.id === activeSectionId);

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col items-center gap-2.5 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      {stageSections.map((s, i) => {
        const isActive = s.id === activeSectionId;
        const isDone = activeIdx >= 0 && i < activeIdx;
        return (
          <button
            key={s.id}
            onClick={() => onJump(s.id)}
            className="group relative flex items-center justify-end"
            aria-label={`Section ${s.num} — ${s.title}`}
          >
            {/* Tooltip */}
            <span
              className="absolute right-6 whitespace-nowrap rounded-md bg-ink text-paper px-2.5 py-1 text-[11px] font-mono tracking-wide opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            >
              {s.num} · {s.title}
            </span>
            <span
              className="block rounded-full transition-all duration-200"
              style={{
                width: isActive ? 10 : 7,
                height: isActive ? 10 : 7,
                background: isActive ? "var(--danger)" : isDone ? "var(--primary)" : "transparent",
                border: isActive
                  ? "2px solid var(--danger)"
                  : isDone
                    ? "2px solid var(--primary)"
                    : "1.5px solid var(--muted-foreground)",
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}
