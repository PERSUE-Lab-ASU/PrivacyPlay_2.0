import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { laplace } from "@/lib/dp";
import { EXAMPLE_NOISY, STATS, type LeakCase } from "@/lib/leakData";

type Release = { total: number; men: number; women: number };

function drawRelease(epsilon: number): Release {
  const b = 1 / epsilon;
  return {
    total: STATS.total + laplace(b),
    men: STATS.men + laplace(b),
    women: STATS.women + laplace(b),
  };
}

/**
 * The published sum the attacker checks, recomputed on every release.
 * The first render is the fixed example draw, so the server and the browser
 * always agree before anyone presses anything.
 */
export function NoisyArithmetic({
  epsilon,
  leakCase,
  onPublish,
}: {
  epsilon: number;
  leakCase: LeakCase;
  onPublish?: (gap: number) => void;
}) {
  const [rel, setRel] = useState<Release>({ ...EXAMPLE_NOISY });
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    setRel(drawRelease(epsilon));
    setNonce((n) => n + 1);
  }, [epsilon]);

  const parts = rel.men + rel.women;
  const gap = rel.total - parts;
  const clean = Math.abs(gap - 1) < 0.35;

  const publishAgain = () => {
    const next = drawRelease(epsilon);
    setRel(next);
    setNonce((n) => n + 1);
    onPublish?.(next.total - (next.men + next.women));
  };

  const rows: [string, string][] = [
    [`total with ${leakCase.trait}`, rel.total.toFixed(1)],
    [`men with ${leakCase.trait}`, rel.men.toFixed(1)],
    [`women with ${leakCase.trait}`, rel.women.toFixed(1)],
    ["men plus women", parts.toFixed(1)],
  ];

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-rule">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 border-b border-rule/60 px-3 py-2 last:border-b-0">
            <span className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">{label}</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`${nonce}-${value}`}
                initial={{ opacity: 0, filter: "blur(6px)", y: -6 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.35 }}
                className="shrink-0 font-serif text-lg text-ink"
              >
                {value}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>

      <motion.div
        key={`gap-${nonce}`}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
        className={`mt-3 rounded-xl border px-4 py-3 ${clean ? "border-danger/40 bg-danger/5" : "border-primary/40 bg-primary/5"}`}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">the gap</div>
        <div className={`font-serif text-3xl ${clean ? "text-danger" : "text-primary"}`}>{gap.toFixed(1)}</div>
        <p className="mt-1 text-xs text-muted-foreground">
          {clean
            ? "That sits right on 1. The hidden person shows through."
            : "Nowhere near a clean 1, so the attacker cannot trust it."}
        </p>
      </motion.div>

      <button
        onClick={publishAgain}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/40 px-3 py-1.5 font-mono text-[11px] text-primary transition-colors hover:bg-primary/10"
      >
        <RefreshCw className="h-3.5 w-3.5" /> publish again
      </button>
    </div>
  );
}
