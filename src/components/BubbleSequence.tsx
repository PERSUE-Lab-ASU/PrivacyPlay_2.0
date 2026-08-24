import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PopBubble, holdMsForText, type BubblePosition, type BubbleVariant } from "./PopBubble";

export type BubbleStep = {
  text: string;
  position?: BubblePosition;
  variant?: BubbleVariant;
  size?: "sm" | "md" | "lg";
  tailFrom?: "left" | "right" | "bottom" | "top" | "none";
  hold?: number; // ms, override auto
};

type Props = {
  steps: BubbleStep[];
  /** Start when true. If false, sequence resets. */
  active: boolean;
  /** Gap between bubbles after fade out. Default 300ms. */
  gap?: number;
  /** Called once after the last bubble finishes its hold. */
  onComplete?: () => void;
  /** Loop the sequence forever (after onComplete). */
  loop?: boolean;
};

const FADE_IN = 400;
const FADE_OUT = 500;

/** Plays bubble steps one at a time around a relatively positioned parent. */
export function BubbleSequence({ steps, active, gap = 300, onComplete, loop = false }: Props) {
  const [idx, setIdx] = useState(-1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) { setIdx(-1); setDone(false); return; }
    if (idx === -1) { setIdx(0); return; }
    if (idx >= steps.length) {
      if (!done) { setDone(true); onComplete?.(); }
      if (loop) {
        const t = setTimeout(() => { setDone(false); setIdx(0); }, 800);
        return () => clearTimeout(t);
      }
      return;
    }
    const step = steps[idx];
    const hold = step.hold ?? holdMsForText(step.text);
    const total = FADE_IN + hold + FADE_OUT + gap;
    const t = setTimeout(() => setIdx((i) => i + 1), total);
    return () => clearTimeout(t);
  }, [idx, active, steps, gap, onComplete, loop, done]);

  const current = idx >= 0 && idx < steps.length ? steps[idx] : null;

  return (
    <AnimatePresence mode="wait">
      {current && (
        <PopBubble
          key={`b-${idx}`}
          position={current.position}
          variant={current.variant}
          size={current.size}
          tailFrom={current.tailFrom}
        >
          {current.text}
        </PopBubble>
      )}
    </AnimatePresence>
  );
}
