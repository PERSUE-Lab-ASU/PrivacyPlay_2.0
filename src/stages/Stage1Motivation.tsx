import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { HospitalScene } from "@/components/HospitalScene";
import { HospitalIntroStory } from "@/components/HospitalIntroStory";
import { WhatJustHappened } from "@/components/WhatJustHappened";
import { ChangeTheAnswer } from "@/components/ChangeTheAnswer";

import { useTelemetry } from "@/hooks/useTelemetry";
import { ArrowDown, Lock, X, Play, RotateCw } from "lucide-react";
import researcherUrl from "@/assets/images/researcher.png";
import tommyUrl from "@/assets/images/tommy.png";
const researcherAsset = { url: researcherUrl };
const tommyAsset = { url: tommyUrl };
import { SectionHeader } from "@/components/sections/SectionHeader";
import HorizontalPan from "@/components/HorizontalPan";

const ROWS = [
  { name: "Ann", age: 34, gender: "F", zip: "10024", weight: 142, diabetes: "No", condition: "Flu" },
  { name: "Bruce", age: 56, gender: "M", zip: "10023", weight: 195, diabetes: "Yes", condition: "Diabetes" },
  { name: "Cary", age: 41, gender: "F", zip: "10025", weight: 156, diabetes: "No", condition: "Asthma" },
  { name: "Dick", age: 62, gender: "M", zip: "10021", weight: 210, diabetes: "Yes", condition: "Diabetes" },
  { name: "Eshwar", age: 29, gender: "M", zip: "10022", weight: 168, diabetes: "No", condition: "Viral infection" },
  { name: "Fox", age: 48, gender: "F", zip: "10024", weight: 138, diabetes: "Yes", condition: "Diabetes" },
  { name: "Gary", age: 55, gender: "M", zip: "10023", weight: 220, diabetes: "No", condition: "Heart disease" },
  { name: "Helen", age: 39, gender: "F", zip: "10026", weight: 161, diabetes: "No", condition: "Flu" },
  { name: "Igor", age: 51, gender: "M", zip: "10025", weight: 178, diabetes: "Yes", condition: "Diabetes" },
  { name: "Jean", age: 44, gender: "F", zip: "10022", weight: 149, diabetes: "Yes", condition: "Diabetes" },
  { name: "Ken", age: 37, gender: "M", zip: "10024", weight: 184, diabetes: "No", condition: "Flu" },
  { name: "Lewis", age: 60, gender: "M", zip: "10021", weight: 205, diabetes: "Yes", condition: "Diabetes" },
];

export function ResearcherAvatar({ size = 170, className = "" }: { size?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full -z-10"
        style={{ background: "radial-gradient(circle, color-mix(in oklch, var(--color-primary) 25%, transparent), transparent 65%)" }}
      />
      <img src={researcherAsset.url} alt="Dr. Jim, researcher" width={size} height={size} className="rounded-full object-cover w-full h-full shadow-xl" loading="lazy" />
    </motion.div>
  );
}

function TommyAvatar({ size = 200 }: { size?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full -z-10" style={{ background: "radial-gradient(circle, color-mix(in oklch, var(--color-danger) 28%, transparent), transparent 65%)" }} />
      <img src={tommyAsset.url} alt="Tommy, the snoop" width={size} height={size} className="rounded-full object-cover w-full h-full shadow-xl ring-2 ring-danger/30" loading="lazy" />
    </motion.div>
  );
}

function PatientTable({
  highlight, pulseIgor = false, revealIgor = false, animateRows = false,
  scanIndex = -1, skipIgor = false, dimIgor = false, rowRefs,
  rows = ROWS, big = false, staggerMs = 650, slim = false,
}: {
  highlight?: (r: typeof ROWS[number]) => boolean;
  pulseIgor?: boolean; revealIgor?: boolean; animateRows?: boolean;
  scanIndex?: number; skipIgor?: boolean; dimIgor?: boolean;
  rowRefs?: React.MutableRefObject<(HTMLTableRowElement | null)[]>;
  rows?: typeof ROWS; big?: boolean; staggerMs?: number; slim?: boolean;
}) {
  // Condition column is intentionally hidden throughout — differencing attack
  // only needs the Diabetes flag; showing Condition adds noise to the story.
  const showCol = (c: string) => c !== "Condition" && (!slim || ["Name", "Age", "Gender", "Diabetes"].includes(c));
  // True sequential reveal: only render rows up to `revealed`. Prevents the
  // "all rows offset to -40 and overlap during their staggered animation" bug.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(animateRows ? 0 : rows.length);

  useEffect(() => {
    if (!animateRows) { setRevealed(rows.length); return; }
    const el = wrapRef.current;
    if (!el) return;
    let iv: ReturnType<typeof setInterval> | null = null;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !iv) {
        iv = setInterval(() => {
          setRevealed((n) => {
            if (n >= rows.length) { if (iv) { clearInterval(iv); iv = null; } return n; }
            return n + 1;
          });
        }, staggerMs);
      }
    }, { threshold: 0.25 });
    obs.observe(el);
    return () => { obs.disconnect(); if (iv) clearInterval(iv); };
  }, [animateRows, rows.length, staggerMs]);

  const visibleRows = animateRows ? rows.slice(0, revealed) : rows;

  return (
    <div ref={wrapRef} className={`rounded-2xl border border-rule bg-paper overflow-hidden shadow-xl w-full ${big ? "text-base" : ""}`}>
      <table className={`w-full ${big ? "text-base" : "text-sm"}`}>
        <thead className="bg-primary/10 text-primary">
          <tr>
            {["Name", "Age", "Gender", "Zip", "Weight", "Diabetes", "Condition"].filter(showCol).map((c) => (
              <th key={c} className={`${big ? "px-5 py-4 text-xs" : "px-3 py-3 text-[10px]"} text-left uppercase font-mono tracking-wider`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {visibleRows.map((p, i) => {
              const matched = highlight?.(p) ?? false;
              const isIgor = p.name === "Igor";
              const isScanning = scanIndex === i;
              const scanned = scanIndex >= i;
              const baseBg = i % 2 === 0 ? "transparent" : "color-mix(in oklch, var(--color-primary) 4%, transparent)";
              let bg = baseBg;
              if (matched) bg = "color-mix(in oklch, var(--color-primary) 14%, transparent)";
              if (isScanning) bg = "color-mix(in oklch, var(--color-danger) 28%, transparent)";
              if (pulseIgor && isIgor) bg = "color-mix(in oklch, var(--color-danger) 22%, transparent)";
              const isIgorDimmed = isIgor && skipIgor && scanned && !isScanning;
              return (
                <motion.tr
                  key={p.name}
                  ref={(el) => { if (rowRefs) rowRefs.current[i] = el; }}
                  layout
                  initial={animateRows ? { opacity: 0, x: -30 } : false}
                  animate={{
                    opacity: dimIgor && isIgor ? 0.35 : isIgorDimmed ? 0.35 : 1,
                    x: 0,
                    backgroundColor: bg,
                  }}
                  transition={animateRows
                    ? { duration: 0.55, type: "spring", bounce: 0.45 }
                    : { duration: 0.4 }}
                  className={`border-t border-rule/60 font-mono relative ${big ? "text-[14px]" : "text-[12px]"}`}
                >
                  <td className={`${big ? "px-5 py-4" : "px-3 py-2"} font-semibold text-ink`}>{p.name}</td>
                  <td className={big ? "px-5 py-4" : "px-3 py-2"}>{p.age}</td>
                  <td className={big ? "px-5 py-4" : "px-3 py-2"}>{p.gender}</td>
                  {showCol("Zip") && <td className={big ? "px-5 py-4" : "px-3 py-2"}>{p.zip}</td>}
                  {showCol("Weight") && <td className={big ? "px-5 py-4" : "px-3 py-2"}>{p.weight}</td>}
                  <td className={big ? "px-5 py-4" : "px-3 py-2"}>
                    <motion.span
                      initial={animateRows ? { scale: 0, rotate: -20 } : false}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={animateRows ? { delay: 0.25, type: "spring", bounce: 0.7, duration: 0.55 } : undefined}
                      className={
                        p.diabetes === "Yes"
                          ? `inline-block ${big ? "px-4 py-1.5 text-lg" : "px-3 py-1 text-base"} rounded-full bg-danger/20 text-danger font-extrabold uppercase tracking-wide shadow-md shadow-danger/20 ring-1 ring-danger/40`
                          : `inline-block ${big ? "px-4 py-1.5 text-lg" : "px-3 py-1 text-base"} rounded-full bg-primary/15 text-primary font-extrabold uppercase tracking-wide ring-1 ring-primary/30`
                      }
                    >
                      {p.diabetes}
                    </motion.span>
                  </td>
                  {showCol("Condition") && (
                  <td className={`${big ? "px-5 py-4" : "px-3 py-2"} relative`}>
                    {isIgor && !revealIgor ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground italic"><Lock className="w-3 h-3" /> private</span>
                    ) : isIgor && revealIgor ? (
                      <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className="px-2 py-0.5 rounded bg-danger/20 text-danger font-semibold">{p.condition}</motion.span>
                    ) : p.condition}
                    {isIgorDimmed && (
                      <motion.span
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-danger text-paper"
                      >
                        <X className="w-4 h-4" strokeWidth={3} />
                      </motion.span>
                    )}
                  </td>
                  )}
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
      <div className={`${big ? "px-5 py-3 text-sm" : "px-3 py-2 text-[11px]"} text-muted-foreground italic bg-muted/30 border-t border-rule/60`}>… and 4,000 more</div>
    </div>
  );
}


function AskBox({
  question, answerValue, answerSuffix, staticAnswer, delay = 0, color = "primary",
}: {
  question: string; answerValue?: number; answerSuffix?: string; staticAnswer?: string; delay?: number;
  color?: "primary" | "danger" | "accent";
}) {
  const colorMap = {
    primary: { border: "border-primary/40", chip: "text-primary", num: "text-primary", glow: "shadow-primary/20" },
    danger: { border: "border-danger/40", chip: "text-danger", num: "text-danger", glow: "shadow-danger/20" },
    accent: { border: "border-danger/30", chip: "text-danger", num: "text-danger", glow: "shadow-danger/10" },
  } as const;
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={`rounded-2xl border-2 bg-paper p-5 shadow-lg ${c.border} ${c.glow}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Answer Tool</span>
        <span className={`text-[10px] font-mono ${c.chip}`}>counts only</span>
      </div>
      <div className="font-serif text-lg text-ink leading-snug mb-4 min-h-[3.5rem]">"{question}"</div>
      <div className="flex items-end justify-between">
        <span className="text-xs text-muted-foreground font-mono">answer</span>
        <motion.span
          initial={{ opacity: 0, scale: 0.4 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.4, duration: 0.6, type: "spring", bounce: 0.5 }}
          className={`font-serif text-4xl font-bold ${c.num}`}
        >
          {staticAnswer ?? (<><AnimatedNumber value={answerValue ?? 0} />{answerSuffix}</>)}
        </motion.span>
      </div>
    </motion.div>
  );
}

function Beat({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`pt-2 sm:pt-4 pb-10 sm:pb-14 px-6 sm:px-10 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl mx-auto"
      >
        {children}
      </motion.div>
    </section>
  );
}

function Caption({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`font-serif text-2xl sm:text-3xl text-ink leading-snug ${className}`}
    >
      {children}
    </motion.p>
  );
}


const RESEARCHER_QUESTIONS = [
  "How do we treat diabetes better?",
  "Between men and women, who has higher diabetes counts?",
  "How many active people have diabetes?",
  "How many overweight patients have diabetes?",
  "Which zip codes have the most diabetes cases?",
  "Are younger patients showing diabetes more often now?",
];

// Position questions around the avatar in a radial layout
const ORBIT_POSITIONS = [
  { className: "top-0 left-0 sm:-left-4", tail: "bottom-[-8px] right-8" },
  { className: "top-0 right-0 sm:-right-4", tail: "bottom-[-8px] left-8" },
  { className: "top-1/2 -translate-y-1/2 left-0 sm:-left-8", tail: "top-1/2 -translate-y-1/2 right-[-8px]" },
  { className: "top-1/2 -translate-y-1/2 right-0 sm:-right-8", tail: "top-1/2 -translate-y-1/2 left-[-8px]" },
  { className: "bottom-0 left-0 sm:-left-4", tail: "top-[-8px] right-8" },
  { className: "bottom-0 right-0 sm:-right-4", tail: "top-[-8px] left-8" },
];

/** Sequential counting flow — patient chips fly into a counter. */
function CountingFlow({
  patients, finalCount, excludeIgor = false, delayStart = 0,
}: { patients: typeof ROWS; finalCount: number; excludeIgor?: boolean; delayStart?: number }) {
  const visible = excludeIgor ? patients.filter(p => p.name !== "Igor") : patients;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border-2 border-primary/30 bg-paper p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {excludeIgor ? "Counting diabetes patients (excluding Igor)" : "Counting diabetes patients"}
        </span>
        <span className="font-mono text-[10px] text-primary">live tally</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-5 min-h-[80px]">
        {visible.map((p, i) => {
          const isDiabetic = p.diabetes === "Yes";
          const isIgor = p.name === "Igor";
          return (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 0.5, y: -10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: delayStart + i * 0.08, duration: 0.35, type: "spring", bounce: 0.4 }}
              className={`px-3 py-1.5 rounded-full font-mono text-xs border-2 ${
                isDiabetic
                  ? isIgor
                    ? "bg-danger/20 border-danger text-danger font-bold"
                    : "bg-primary/15 border-primary/50 text-primary font-semibold"
                  : "bg-muted/40 border-rule text-muted-foreground line-through"
              }`}
            >
              {p.name} {isDiabetic ? "✓" : "✗"}
            </motion.div>
          );
        })}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: delayStart + visible.length * 0.08, duration: 0.3 }}
          className="px-3 py-1.5 rounded-full font-mono text-xs bg-muted/30 text-muted-foreground italic"
        >
          … +{finalCount - visible.filter(p => p.diabetes === "Yes").length} more
        </motion.div>
      </div>
      <div className="flex items-end justify-between border-t border-rule/60 pt-4">
        <span className="font-mono text-sm text-muted-foreground">total count</span>
        <motion.span
          initial={{ opacity: 0, scale: 0.3 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: delayStart + visible.length * 0.08 + 0.4, duration: 0.7, type: "spring", bounce: 0.55 }}
          className="font-serif text-6xl font-bold text-danger"
        >
          {finalCount}
        </motion.span>
      </div>
    </motion.div>
  );
}

// ============================================================================
// AttackScene — the orchestrated 5-beat differencing attack
// ============================================================================

const DIABETIC_VISIBLE = ROWS.filter((r) => r.diabetes === "Yes").length; // 6
const TOTAL_TRUE = 42;
const TOTAL_NO_IGOR = 41;

function CountBox({
  label, value, sublabel, accent = "primary", compact = false,
}: {
  label: string; value: number; sublabel?: string;
  accent?: "primary" | "danger"; compact?: boolean;
}) {
  const isDanger = accent === "danger";
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className={`relative rounded-2xl shadow-xl border-2 ${isDanger ? "border-danger/40" : "border-primary/40"}
        bg-gradient-to-br ${isDanger ? "from-[oklch(0.28_0.08_25)] to-[oklch(0.22_0.05_25)]" : "from-[oklch(0.22_0.07_265)] to-[oklch(0.16_0.05_265)]"}
        text-paper ${compact ? "px-3 sm:px-4 py-3 min-w-[112px] sm:min-w-[140px]" : "px-4 sm:px-6 py-4 sm:py-5 min-w-[150px] sm:min-w-[200px]"}`}
    >
      <div className={`font-mono uppercase tracking-wider opacity-70 ${compact ? "text-[9px]" : "text-[11px]"}`}>{label}</div>
      <div className={`font-serif font-bold leading-none mt-2 ${compact ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl lg:text-7xl"} text-[oklch(0.96_0.04_85)]`}>
        <AnimatedNumber value={value} duration={400} />
      </div>
      {sublabel && (
        <div className={`mt-2 opacity-80 ${compact ? "text-[10px]" : "text-xs"} font-mono`}>{sublabel}</div>
      )}
    </motion.div>
  );
}

type Bubble = { id: string; text: string; variant?: "thought" | "sharp" | "speech"; size?: "sm" | "md" | "lg" };

function holdMs(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(2500, 2500 + words * 60);
}

function AttackScene({ onLog, autoStart = false, runKey = 0, onComplete }: { onLog: (event: string, data?: Record<string, unknown>) => void; autoStart?: boolean; runKey?: number; onComplete?: () => void }) {
  // phase machine
  // 0 idle → 1..3 tommy bubbles → 4 Q1 sentence → 5 Q1 scanning → 6 Q1 done bubble
  // → 7 Q2 sentence (box1 shrinks) → 8 Q2 scanning (skip Igor) → 9 Q2 done bubble
  // → 10 subtraction build → 11 revelation
  const [phase, setPhase] = useState(0);
  const [tommyBubble, setTommyBubble] = useState<Bubble | null>(null);
  const [centerBubble, setCenterBubble] = useState<Bubble | null>(null);
  const [sentence, setSentence] = useState<string>("");
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [scanIdx, setScanIdx] = useState(-1);
  const [scanMode, setScanMode] = useState<"none" | "all" | "skipIgor">("none");
  const [showBox1, setShowBox1] = useState(false);
  const [showBox2, setShowBox2] = useState(false);
  const [box1Compact, setBox1Compact] = useState(false);
  const [eqStep, setEqStep] = useState(0); // 0..6
  const [revealIgor, setRevealIgor] = useState(false);
  const [chips, setChips] = useState<{ id: string; rowIdx: number; target: 1 | 2 }[]>([]);

  const sectionRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const equationRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scrollTo = (_el: HTMLElement | null, _block: ScrollLogicalPosition = "center") => {
    // Fixed-frame demo: everything fits within one pinned viewport, so we
    // intentionally do NOT scroll the page. Left as a no-op for compatibility.
  };

  const wait = (ms: number) => new Promise<void>((r) => {
    const t = setTimeout(r, ms);
    timers.current.push(t);
  });


  const showTommyBubble = async (b: Bubble) => {
    setTommyBubble(b);
    await wait(400 + holdMs(b.text));
    setTommyBubble(null);
    await wait(500 + 300);
  };

  const showCenterBubble = async (b: Bubble, extraHold = 0) => {
    setCenterBubble(b);
    await wait(400 + holdMs(b.text) + extraHold);
    setCenterBubble(null);
    await wait(500 + 300);
  };

  const typeSentence = async (text: string) => {
    setSentence("");
    for (let i = 1; i <= text.length; i++) {
      setSentence(text.slice(0, i));
      await wait(22);
    }
  };

  const runScan = async (target: 1 | 2, skipIgor: boolean) => {
    setScanMode(skipIgor ? "skipIgor" : "all");
    let running = 0;
    for (let i = 0; i < ROWS.length; i++) {
      setScanIdx(i);
      await wait(260);
      if (ROWS[i].diabetes === "Yes" && !(skipIgor && ROWS[i].name === "Igor")) {
        running += 1;
        const chipId = `${target}-${i}-${Date.now()}`;
        setChips((c) => [...c, { id: chipId, rowIdx: i, target }]);
        // remove chip after fly
        const t = setTimeout(() => setChips((c) => c.filter((x) => x.id !== chipId)), 900);
        timers.current.push(t);
        if (target === 1) setCount1(running);
        else setCount2(running);
      }
      // Igor highlight extra pause when skipping
      if (skipIgor && ROWS[i].name === "Igor") await wait(500);
    }
    setScanIdx(-1);
    // fast scrub through "4000 more"
    await wait(300);
    const finalVal = target === 1 ? TOTAL_TRUE : TOTAL_NO_IGOR;
    const steps = 18;
    for (let s = 1; s <= steps; s++) {
      const v = Math.round(running + (finalVal - running) * (s / steps));
      if (target === 1) setCount1(v);
      else setCount2(v);
      await wait(40);
    }
    setScanMode("none");
  };

  // run state machine
  const runScene = async () => {
    try {
      onLog("attack_scene_enter", {});
      scrollTo(topRef.current, "start");
      await wait(400);
      // BEAT 1
      setPhase(1);
      await showTommyBubble({ id: "t1", text: "First, I will count everyone with diabetes.", variant: "thought", size: "md" });
      await showTommyBubble({ id: "t2", text: "Then I will count again, but skip Igor.", variant: "thought", size: "md" });
      await showTommyBubble({ id: "t3", text: "Two harmless counts.", variant: "sharp", size: "sm" });

      // BEAT 2
      setPhase(2);
      setShowBox1(true);
      await typeSentence("count patients with diabetes.");
      await wait(400);
      scrollTo(tableRef.current, "center");
      await wait(700);
      await runScan(1, false);
      await wait(300);
      await showCenterBubble({ id: "c1", text: "Final count: 42.", variant: "speech", size: "md" });
      onLog("first_count_complete", { value: TOTAL_TRUE });
      await wait(600);

      // BEAT 3
      setPhase(3);
      setBox1Compact(true);
      setShowBox2(true);
      setCount2(0);
      scrollTo(topRef.current, "start");
      await wait(500);
      await typeSentence("count patients with diabetes whose name is not Igor.");
      await wait(400);
      scrollTo(tableRef.current, "center");
      await wait(700);
      await runScan(2, true);
      await wait(300);
      await showCenterBubble({ id: "c2", text: "Final count: 41.", variant: "speech", size: "md" });
      onLog("second_count_complete", { value: TOTAL_NO_IGOR });
      await wait(600);

      // BEAT 4 — subtraction
      setPhase(4);
      await wait(200);
      scrollTo(equationRef.current, "center");
      await wait(500);
      await showCenterBubble({ id: "c3", text: "Tommy puts the two answers together.", variant: "speech", size: "md" });
      setEqStep(1); await wait(800);
      setEqStep(2); await wait(600);
      setEqStep(3); await wait(800);
      setEqStep(4); await wait(600);
      setEqStep(5); await wait(2000);
      onLog("subtraction_complete", {});

      // BEAT 5 — revelation
      setPhase(5);
      await showCenterBubble({ id: "r1", text: "That difference of 1 is Igor.", variant: "sharp", size: "lg" });
      setRevealIgor(true);
      scrollTo(tableRef.current, "center");
      await wait(800);
      await showCenterBubble({ id: "r2", text: "So Igor has diabetes.", variant: "sharp", size: "md" });
      await showCenterBubble({ id: "r3", text: "Tommy never saw a single row. He only asked counts.", variant: "speech", size: "lg" }, 800);
      onLog("attack_scene_complete", {});
    } catch (err) {
      onLog("attack_scene_error", { message: err instanceof Error ? err.message : String(err) });
    } finally {
      // ALWAYS signal completion so the scroll lock in <AttackGate /> is released,
      // even if a timer was throttled, an exception was thrown, or the scene
      // was interrupted by an unmount.
      onComplete?.();
    }
  };



  useEffect(() => {
    if (autoStart) {
      // Reset state for replays
      startedRef.current = true;
      setPhase(0); setTommyBubble(null); setCenterBubble(null); setSentence("");
      setCount1(0); setCount2(0); setScanIdx(-1); setScanMode("none");
      setShowBox1(false); setShowBox2(false); setBox1Compact(false);
      setEqStep(0); setRevealIgor(false); setChips([]);
      const t = setTimeout(() => runScene(), 100);
      timers.current.push(t);
      return () => {
        timers.current.forEach((tm) => clearTimeout(tm));
        timers.current = [];
      };
    }
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          runScene();
        }
      }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => {
      obs.disconnect();
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, runKey]);

  const isPlaying = phase > 0 && phase < 5;
  const isDone = phase >= 5;

  return (
    <div
      ref={sectionRef}
      className="relative w-full flex-1 min-h-0 overflow-hidden flex flex-col px-3 sm:px-6 py-2"
    >
      {/* Playing/Done banner */}
      <div className="flex items-center justify-center mb-2 shrink-0 h-8">
        <AnimatePresence mode="wait">
          {isPlaying && (
            <motion.div
              key="playing-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-2 rounded-full bg-danger text-paper px-4 py-1 shadow-lg shadow-danger/40">
                <motion.span
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-paper"
                />
                <span className="font-mono text-[10px] uppercase tracking-widest">Live scene · step {phase}/5</span>
              </div>
            </motion.div>
          )}
          {isDone && (
            <motion.div
              key="done-banner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1 border border-primary/30">
                <span className="font-mono text-[10px] uppercase tracking-widest">✓ Scene complete</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main: 2-column, side-by-side. Left = narrative, Right = table. */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-3 overflow-hidden">

        {/* LEFT PANE — Tommy + Answer Tool + Counts + Equation, all reserved */}
        <div className="min-h-0 flex flex-col gap-2 overflow-hidden">
          {/* Tommy + bubble to the right (never above, so it can't clip) */}
          <div ref={topRef} className="flex items-start gap-3 shrink-0">
            <div className="flex flex-col items-center shrink-0">
              <TommyAvatar size={72} />
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-danger">Tommy</div>
            </div>
            <div className="relative flex-1 min-h-[70px]">
              <AnimatePresence mode="wait">
                {tommyBubble ? (
                  <motion.div
                    key={tommyBubble.id}
                    initial={{ opacity: 0, scale: 0.85, x: -12 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                    transition={{ duration: 0.35, type: "spring", stiffness: 240, damping: 20 }}
                    className={`px-3 py-2 font-serif text-ink shadow-md text-sm ${
                      tommyBubble.variant === "sharp"
                        ? "bg-paper border-2 border-danger/70 rounded-md"
                        : "bg-paper border border-primary/40 rounded-2xl"
                    }`}
                  >
                    {tommyBubble.text}
                  </motion.div>
                ) : (
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground italic opacity-60 pt-2">
                    tommy is thinking…
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Answer Tool — reserved fixed height */}
          <div className="rounded-lg border-2 border-primary/30 bg-paper px-3 py-2 shadow-sm shrink-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Answer Tool</span>
              <span className="font-mono text-[9px] text-primary">counts only</span>
            </div>
            <div className="font-serif text-sm sm:text-base text-ink leading-snug min-h-[2.5rem]">
              {sentence ? <>"{sentence}<span className="inline-block w-1 h-3.5 bg-primary/60 align-middle ml-0.5 animate-pulse" />"</> : <span className="text-muted-foreground italic text-xs">waiting for query…</span>}
            </div>
          </div>

          {/* Count boxes — reserved row */}
          <div className="flex gap-2 items-stretch shrink-0 min-h-[64px]">
            <div className="flex-1">
              {showBox1 ? <CountBox label="with Igor" value={count1} compact /> : <ReservedSlot />}
            </div>
            <div className="flex-1">
              {showBox2 ? <CountBox label="without Igor" value={count2} accent="danger" compact /> : <ReservedSlot />}
            </div>
          </div>

          {/* Equation slot — fills remaining space */}
          <div ref={equationRef} className="relative flex-1 min-h-0 flex flex-col items-center justify-center gap-2 rounded-lg border border-rule/60 bg-paper/50 p-2 overflow-hidden">
            <AnimatePresence mode="wait">
              {centerBubble && (
                <motion.div
                  key={centerBubble.id}
                  initial={{ opacity: 0, scale: 0.85, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.35 } }}
                  transition={{ duration: 0.35, type: "spring", stiffness: 240, damping: 20 }}
                  className={`text-center font-serif text-ink shadow-sm px-3 py-1.5 ${
                    centerBubble.variant === "sharp"
                      ? "bg-paper border-2 border-danger/70 rounded-md"
                      : "bg-paper border border-primary/40 rounded-2xl"
                  } text-sm max-w-[28ch]`}
                >
                  {centerBubble.text}
                </motion.div>
              )}
            </AnimatePresence>

            {phase >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-center gap-2 font-serif"
              >
                {eqStep >= 1 && (
                  <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.4 }} className="flex flex-col items-center">
                    <span className="text-3xl sm:text-4xl font-bold text-primary leading-none">42</span>
                    <span className="mt-0.5 text-[9px] font-mono text-muted-foreground">with Igor</span>
                  </motion.div>
                )}
                {eqStep >= 2 && <motion.span initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} className="text-2xl text-muted-foreground self-center pb-3">−</motion.span>}
                {eqStep >= 3 && (
                  <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.4 }} className="flex flex-col items-center">
                    <span className="text-3xl sm:text-4xl font-bold text-primary leading-none">41</span>
                    <span className="mt-0.5 text-[9px] font-mono text-muted-foreground">without Igor</span>
                  </motion.div>
                )}
                {eqStep >= 4 && <motion.span initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} className="text-2xl text-muted-foreground self-center pb-3">=</motion.span>}
                {eqStep >= 5 && (
                  <motion.div initial={{ opacity: 0, scale: 0, rotate: -180 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.6, duration: 0.9 }} className="flex flex-col items-center">
                    <span className="text-4xl sm:text-5xl font-bold text-danger leading-none drop-shadow-[0_0_14px_color-mix(in_oklch,var(--color-danger)_60%,transparent)]">1</span>
                    <span className="mt-0.5 text-[9px] font-mono text-danger">= Igor</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {phase === 0 && !centerBubble && (
              <div className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground opacity-50">
                calculation will appear here
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE — the table, scoped to viewport with clipping */}
        <div ref={tableRef} className="relative min-h-0 overflow-hidden flex flex-col rounded-lg border border-rule bg-paper">
          <div className="flex-1 min-h-0 overflow-hidden">
            <PatientTable
              highlight={(r) => r.diabetes === "Yes" && scanMode !== "none"}
              scanIndex={scanIdx}
              skipIgor={scanMode === "skipIgor"}
              pulseIgor={phase === 5}
              revealIgor={revealIgor}
              slim
            />
          </div>

          {/* Flying ghost chips */}
          <AnimatePresence>
            {chips.map((chip) => {
              const row = ROWS[chip.rowIdx];
              const startY = 32 + chip.rowIdx * 26 + 10;
              return (
                <motion.div
                  key={chip.id}
                  initial={{ opacity: 0, x: 40, y: startY, scale: 0.7 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: [40, 100, 200, 300],
                    y: [startY, startY - 30, startY - 120, -60],
                    scale: [0.7, 1, 0.9, 0.5],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.85, ease: "easeInOut", times: [0, 0.2, 0.7, 1] }}
                  className="absolute left-0 top-0 px-2 py-0.5 rounded-full bg-danger text-paper text-[10px] font-mono font-semibold shadow-lg pointer-events-none z-20"
                >
                  {row.name}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}

function ReservedSlot() {
  return (
    <div className="h-full min-h-[64px] rounded-lg border border-dashed border-rule/40 bg-paper/20" />
  );
}

// ============================================================================
// AttackGate — intro card with Play button, locks page scroll until the demo
// has played through once. After that, the intro returns with "Play Again".
// ============================================================================
function AttackGate({ log }: { log: (event: string, data?: Record<string, unknown>) => void }) {
  const [state, setState] = useState<"intro" | "playing" | "done">("intro");
  const [runKey, setRunKey] = useState(0);
  const [playedOnce, setPlayedOnce] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const reachedRef = useRef(false);
  const [reached, setReached] = useState(false);

  // Detect when the gate enters the viewport for the first time.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !reachedRef.current) {
        reachedRef.current = true;
        setReached(true);
        log("attack_gate_reached", {});
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [log]);

  // Scroll is never locked: readers can scroll past the demo without playing it.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
  }, [reached]);

  const handlePlay = () => {
    log("attack_play_click", { replay: playedOnce });
    sentinelRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    requestAnimationFrame(() => {
      setRunKey((k) => k + 1);
      setState("playing");
    });
  };

  const handleComplete = () => {
    setState("done");
    setPlayedOnce(true);
  };

  const handleSkip = () => {
    log("attack_skip_click", {});
    handleComplete();
  };


  const showIntro = state === "intro";
  const showScene = state === "playing" || state === "done";

  return (
    <section
      ref={sentinelRef}
      className={`relative px-0 sm:px-0 bg-gradient-to-b from-background via-danger/[0.04] to-background border-y-2 border-danger/20 flex flex-col ${showScene ? "" : "py-16 px-6 sm:px-10"}`}
    >
      <div className={`w-full ${showScene ? "" : "max-w-5xl mx-auto flex-1 flex flex-col"}`}>
        {showIntro && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-7 py-12 min-h-[80vh]"
          >
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="inline-flex items-center gap-2 rounded-full bg-danger/15 text-danger px-5 py-2 font-mono text-[10px] uppercase tracking-widest border border-danger/30"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-danger animate-pulse" />
              Live demonstration ahead
            </motion.div>

            <Caption className="!text-4xl sm:!text-5xl max-w-3xl">
              Watch what two harmless questions can do.
            </Caption>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-muted-foreground max-w-xl text-base leading-relaxed"
            >
              You'll see Tommy run two ordinary count queries against the system. Press Play to start. The scene plays inside one fixed frame — the page won't scroll while it runs.
            </motion.p>

            <motion.button
              onClick={handlePlay}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              animate={{ boxShadow: [
                "0 10px 30px -10px color-mix(in oklch, var(--color-danger) 35%, transparent)",
                "0 14px 36px -8px color-mix(in oklch, var(--color-danger) 55%, transparent)",
                "0 10px 30px -10px color-mix(in oklch, var(--color-danger) 35%, transparent)",
              ] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="inline-flex items-center gap-3 px-9 py-4 rounded-full bg-danger text-paper font-semibold text-lg shadow-2xl shadow-danger/30 border-2 border-paper"
            >
              <Play className="w-5 h-5 fill-paper" />
              Play the demo
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.8 }}
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
            >
              Scrolling is paused until you watch this scene.
            </motion.div>
          </motion.div>
        )}

        {showScene && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative w-full h-[100svh] flex flex-col overflow-hidden bg-background"
          >
            <div className="flex-1 min-h-0 flex flex-col">
              <AttackScene
                onLog={log}
                autoStart
                runKey={runKey}
                onComplete={handleComplete}
              />
            </div>
            <div className="shrink-0 flex flex-wrap items-center justify-center gap-4 px-4 py-2 border-t border-rule/50 bg-paper/70 backdrop-blur">
              {state === "playing" && (
                <button
                  onClick={handleSkip}
                  className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-ink underline underline-offset-4 transition-colors"
                >
                  Skip the demo →
                </button>
              )}
              {state === "done" && (
                <>
                  <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest">
                    <span>✓ Scene complete — scroll on for the lesson</span>
                    <ArrowDown className="w-3 h-3 animate-bounce" />
                  </div>
                  <motion.button
                    onClick={handlePlay}
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-danger/10 hover:bg-danger/15 text-danger font-semibold border border-danger/30 transition-colors text-sm"
                  >
                    <RotateCw className="w-4 h-4" />
                    Play Again
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

const INSIDE_SENTENCES = [
  "So now the hospital holds all of this data.",
  "It could be useful for research.",
  "It could help doctors understand who is at risk and treat diabetes earlier.",
  "But this data cannot be open to the public.",
  "If it leaked, an attacker could learn private things about people they know.",
  "Things like whether a neighbor or coworker has diabetes.",
];

function InsideSentences() {
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!inView) return;
    if (step >= INSIDE_SENTENCES.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 2000);
    return () => clearTimeout(t);
  }, [inView, step]);
  return (
    <div ref={ref} className="space-y-4">
      {INSIDE_SENTENCES.slice(0, step + 1).map((s, i) => {
        const isCurrent = i === step;
        return (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: isCurrent ? 1 : 0.4, y: 0, scale: isCurrent ? 1 : 0.98 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className={isCurrent
              ? "font-serif text-xl sm:text-2xl leading-snug text-ink"
              : "font-serif text-base sm:text-lg leading-snug text-muted-foreground"}
          >
            {s}
          </motion.p>
        );
      })}
    </div>
  );
}

function InsideBuildingPan() {
  return (
    <HorizontalPan>
      {[
        <div key="p1-2" className="w-full max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-6 lg:gap-10 items-center" id="s03">
          {/* LEFT: The private records — animated sentences */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="mb-6">
              <div className="inline-block rounded-full bg-primary/10 px-5 py-2 mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">The Records</div>
              <p className="font-serif text-2xl sm:text-4xl text-ink leading-tight">
                Only the hospital can see <span className="italic text-primary">what's inside.</span>
              </p>
            </div>
            <InsideSentences />
          </motion.div>


          {/* RIGHT: Dr. Jim — appears AFTER the left table finishes */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 3.0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 3.2 }}
              className="text-center mb-6"
            >
              <div className="inline-block rounded-full bg-primary/10 px-5 py-2 mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">The Researcher</div>
              <p className="font-serif text-2xl sm:text-4xl text-ink">Meet Dr. Jim.</p>
              <p className="font-serif text-base sm:text-lg text-muted-foreground mt-2 max-w-xl mx-auto">
                He wants to learn from this data. Not about any one person. Only about populations.
              </p>
            </motion.div>
            <div className="relative mx-auto" style={{ maxWidth: 560, minHeight: 420 }}>
              {/* Avatar appears first */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 3.6, duration: 0.7, type: "spring", bounce: 0.4 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
              >
                <ResearcherAvatar size={150} />
                <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Dr. Jim, researcher
                </div>
              </motion.div>
              {/* Only the 3 highlighted questions, appearing one by one AFTER the avatar */}
              {[
                { q: "Between men and women, who has higher diabetes counts?", pos: ORBIT_POSITIONS[1] },
                { q: "How many active people have diabetes?", pos: ORBIT_POSITIONS[2] },
                { q: "How many overweight patients have diabetes?", pos: ORBIT_POSITIONS[3] },
              ].map(({ q, pos }, i) => (
                <motion.div
                  key={q}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 4.4 + i * 0.9, duration: 0.6, type: "spring", bounce: 0.5 }}
                  className={`absolute w-[46%] rounded-2xl border-2 border-primary/40 bg-paper px-3 py-2 shadow-lg shadow-primary/20 ${pos.className}`}
                >
                  <p className="font-serif italic text-ink text-xs sm:text-sm leading-snug">"{q}"</p>
                  <span className={`absolute w-2.5 h-2.5 rounded-full bg-paper border-2 border-primary/40 ${pos.tail}`} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>,
        <div key="p3" id="s04" className="px-4 w-full max-w-6xl">
          <div className="text-center mb-8">
            <div className="inline-block rounded-full bg-primary/10 px-5 py-2 mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">Panel 3 · The Answer Tool</div>
            <p className="font-serif text-3xl sm:text-4xl text-ink leading-snug">
              He asks the system to <span className="text-primary italic">count</span> something.
            </p>
            <p className="font-serif text-lg sm:text-xl text-muted-foreground mt-2">
              He gets back a number. Nothing else.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <AskBox question="Count women with diabetes." answerValue={1247} delay={0} color="primary" />
            <AskBox question="Count men with diabetes." answerValue={1089} delay={0.4} color="accent" />
            <AskBox question="Count active patients with diabetes." answerValue={412} delay={0.8} color="danger" />
          </div>
          <p className="text-center text-muted-foreground mt-6 text-sm">
            Population counts. How many people match. Never anything about one person.
          </p>
        </div>,
      ]}
    </HorizontalPan>
  );
}


// ============================================================================
// WhyDataMattersScene — threat model only (intro sentences moved to Section 02)
// ============================================================================
function WhyDataMattersScene() {
  return (
    <div className="max-w-4xl mx-auto">
      <ThreatModel />
    </div>
  );
}


function ThreatModel() {
  const target = { name: "Ivy", zip: "13068", diabetes: "Yes" };
  const rows = [
    { name: "Ann", zip: "13053", d: "No" },
    { name: "Bruce", zip: "13068", d: "Yes" },
    target ? { name: target.name, zip: target.zip, d: target.diabetes } : null,
    { name: "Cary", zip: "13053", d: "No" },
  ].filter(Boolean) as { name: string; zip: string; d: string }[];

  return (
    <div className="rounded-2xl border-2 border-danger/30 bg-paper p-6 sm:p-8 shadow-xl shadow-danger/10">
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        {/* Left: leaked table */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="rounded-xl border border-rule bg-muted/30 overflow-hidden"
        >
          <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-danger bg-danger/10 border-b border-danger/20">
            leaked records
          </div>
          <table className="w-full text-xs">
            <tbody>
              {rows.map((r, i) => {
                const isTarget = r.name === "Ivy";
                return (
                  <motion.tr
                    key={r.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, backgroundColor: isTarget ? "color-mix(in oklch, var(--color-danger) 15%, transparent)" : "transparent" }}
                    transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                    className="border-t border-rule/60 font-mono"
                  >
                    <td className="px-3 py-2 font-semibold">{r.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.zip}</td>
                    <td className="px-3 py-2">
                      <span className={r.d === "Yes" ? "px-2 py-0.5 rounded bg-danger/20 text-danger font-bold" : "px-2 py-0.5 rounded bg-muted text-muted-foreground"}>
                        {r.d}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>

        {/* Middle: glowing arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="flex flex-col items-center justify-center relative"
        >
          <svg width="80" height="60" viewBox="0 0 80 60">
            <defs>
              <linearGradient id="leakGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="oklch(0.6 0.22 25)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="oklch(0.6 0.22 25)" stopOpacity="1" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 5 30 Q 40 10 70 30"
              stroke="url(#leakGrad)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.5, duration: 1.2 }}
            />
            <motion.polygon
              points="65,25 75,30 65,35"
              fill="oklch(0.6 0.22 25)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 0.3 }}
            />
          </svg>
          <div className="font-mono text-[10px] uppercase tracking-widest text-danger mt-1">leaked</div>
        </motion.div>

        {/* Right: adversary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.0, duration: 0.6 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="relative">
            <img src={tommyAsset.url} alt="Adversary" width={110} height={110} className="rounded-full object-cover shadow-xl ring-2 ring-danger/40" />
            <motion.div
              className="absolute inset-0 rounded-full -z-10"
              animate={{ boxShadow: ["0 0 0 0 color-mix(in oklch, var(--color-danger) 40%, transparent)", "0 0 0 24px color-mix(in oklch, var(--color-danger) 0%, transparent)"] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          </div>
          <div className="text-center">
            <div className="font-serif text-lg text-ink font-semibold">Insurance Co.</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-danger">adversary</div>
          </div>
        </motion.div>
      </div>

      {/* Consequence row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.0, duration: 0.7 }}
        className="mt-8 grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-center"
      >
        {/* Bullets */}
        <ul className="space-y-2 text-sm text-ink">
          {[
            "Spots one row: diabetes = Yes.",
            "Reads that person's zip and address.",
            "Contacts them again and again.",
          ].map((t, i) => (
            <motion.li
              key={t}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 3.2 + i * 0.35, duration: 0.5 }}
              className="flex items-start gap-2"
            >
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
              <span>{t}</span>
            </motion.li>
          ))}
        </ul>

        {/* Message icons flying */}
        <div className="relative w-24 h-24 mx-auto">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ x: -20, y: 40, opacity: 0, scale: 0.6 }}
              animate={{ x: [-20, 60], y: [40, 20], opacity: [0, 1, 0], scale: [0.6, 1, 0.8] }}
              transition={{ delay: 3.6 + i * 0.5, duration: 1.4, repeat: Infinity, repeatDelay: 1.4 }}
              className="absolute inline-flex items-center justify-center w-8 h-8 rounded-full bg-danger/90 text-paper text-xs shadow-md"
            >
              ✉
            </motion.div>
          ))}
        </div>

        {/* Worried person */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 3.4, duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <svg width="90" height="100" viewBox="0 0 90 100">
            <circle cx="45" cy="30" r="18" fill="oklch(0.78 0.06 70)" stroke="oklch(0.3 0.02 60)" strokeWidth="1" />
            <path d="M 20 100 Q 20 60 45 55 Q 70 60 70 100 Z" fill="oklch(0.55 0.08 250)" stroke="oklch(0.3 0.02 60)" strokeWidth="1" />
            {/* worried eyes */}
            <ellipse cx="38" cy="28" rx="1.6" ry="2.2" fill="oklch(0.2 0.02 60)" />
            <ellipse cx="52" cy="28" rx="1.6" ry="2.2" fill="oklch(0.2 0.02 60)" />
            {/* frown */}
            <path d="M 38 40 Q 45 36 52 40" stroke="oklch(0.3 0.02 60)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            {/* sweat drop */}
            <motion.circle
              cx="60" cy="30" r="2"
              fill="oklch(0.7 0.15 240)"
              animate={{ cy: [30, 42, 30], opacity: [0, 1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 3.8 }}
            />
          </svg>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">the person</div>
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 4.6, duration: 0.8 }}
        className="mt-8 font-serif italic text-center text-lg sm:text-xl text-danger/90 max-w-3xl mx-auto leading-snug"
      >
        "They learned who has diabetes, and where they live — and would not stop pushing expensive insurance at them."
      </motion.p>
    </div>
  );
}

// ============================================================================
// CoreQuestionScene — two lines + Dr. Jim's picked question rising up
// ============================================================================
function CoreQuestionScene() {
  const [step, setStep] = useState(0); // 0 -> nothing, 1 -> line1, 2 -> line2, 3 -> picked Q
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (step >= 3) return;
    const delays = [1200, 2200, 2400];
    const t = setTimeout(() => setStep((s) => s + 1), delays[step]);
    return () => clearTimeout(t);
  }, [inView, step]);

  return (
    <div ref={rootRef} className="max-w-4xl mx-auto min-h-[460px] flex flex-col items-center justify-center text-center gap-10 py-10">
      <AnimatePresence>
        {step >= 1 && (
          <motion.h2
            key="q1"
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-3xl sm:text-5xl leading-tight text-ink"
          >
            How can we keep this data protected inside the hospital,
            <br className="hidden sm:block" />
            <span className="text-primary"> and still let researchers get real answers from it?</span>
          </motion.h2>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step >= 2 && (
          <motion.p
            key="q2"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-serif italic text-lg sm:text-2xl text-muted-foreground max-w-2xl"
          >
            Because those answers could genuinely help people.
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            key="picked"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              boxShadow: [
                "0 0 0 0 color-mix(in oklch, var(--color-primary) 0%, transparent)",
                "0 0 40px 8px color-mix(in oklch, var(--color-primary) 30%, transparent)",
                "0 0 20px 4px color-mix(in oklch, var(--color-primary) 18%, transparent)",
              ],
            }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 rounded-2xl border-2 border-primary/50 bg-paper px-8 py-6 shadow-xl"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary mb-3">
              Dr. Jim's first question
            </div>
            <div className="font-serif text-xl sm:text-3xl text-ink leading-snug">
              "Between men and women, who has higher diabetes counts?"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Stage1Motivation({ onContinue }: { onContinue: () => void }) {
  const { log } = useTelemetry("motivation");
  useEffect(() => { log("page_enter", {}); }, [log]);



  return (
    <div className="bg-background">
      <SectionHeader num="01" title="The Hospital" subtitle="One town. One database." anchorId="the-hospital" />
      {/* OPENING */}
      <Beat>
        <HospitalIntroStory />
      </Beat>

      {/* SECTION 02 — Inside the Hospital (HORIZONTAL: Sentences → Dr. Jim → Answer Tool) */}
      <SectionHeader
        num="02"
        title="Inside the Hospital"
        subtitle="The private records only the hospital can see."
        anchorId="inside-the-hospital"
      />
      <InsideBuildingPan />

      {/* SECTION 03 — Why this data matters (threat model) */}
      <SectionHeader
        num="03"
        title="Why This Data Matters"
        subtitle="Useful, and dangerous."
        anchorId="why-this-data-matters"
      />
      <Beat>
        <WhyDataMattersScene />
      </Beat>

      {/* SECTION 04 — The Core Question */}
      <SectionHeader
        num="04"
        title="The Core Question"
        subtitle="What we're trying to solve."
        anchorId="the-core-question"
      />
      <Beat>
        <CoreQuestionScene />
      </Beat>



      <SectionHeader num="05" title="Meet Tommy" subtitle="Not everyone asks in good faith." anchorId="meet-tommy" />

      {/* Opening question + mini hospital table */}
      <Beat>
        <div className="max-w-4xl mx-auto space-y-10">
          <motion.p
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.35 }}
            className="font-serif text-2xl sm:text-3xl md:text-4xl text-ink text-center leading-snug"
          >
            Even without seeing the records, could an attacker still figure out
            <span className="text-danger"> something private </span>
            about one person?
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.6, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl border border-rule bg-card overflow-hidden shadow-sm"
          >
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground border-b border-rule">
              patients.csv
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  {["Name", "Age", "Gender", "Zip", "Diabetes"].map((h) => (
                    <th key={h} className="px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Ann", age: 34, gender: "F", zip: "10021", diabetes: "No" },
                  { name: "Bruce", age: 58, gender: "M", zip: "10021", diabetes: "Yes" },
                  { name: "Cary", age: 41, gender: "F", zip: "10022", diabetes: "No" },
                ].map((r, i) => (
                  <motion.tr
                    key={r.name}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 1.0 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="border-t border-rule"
                  >
                    <td className="px-3 py-2 font-medium text-ink">{r.name}</td>
                    <td className="px-2 py-2 text-ink/80">{r.age}</td>
                    <td className="px-2 py-2 text-ink/80">{r.gender}</td>
                    <td className="px-2 py-2 text-ink/80 font-mono text-xs">{r.zip}</td>
                    <td className="px-3 py-2">
                      <span className={
                        r.diabetes === "Yes"
                          ? "inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-danger/15 text-danger"
                          : "inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground"
                      }>
                        {r.diabetes}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-2 text-xs text-muted-foreground border-t border-rule/70 bg-muted/30 italic">
              … 4,000 more rows
            </div>
          </motion.div>
        </div>
      </Beat>

      {/* TOMMY — avatar first, then writeups orbit around */}
      <Beat>
        <div className="text-center mb-10">
          <TommyAvatar size={200} />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-3 font-mono text-[11px] uppercase tracking-widest text-danger"
          >
            Tommy, the snoop
          </motion.div>
        </div>

        <div className="relative max-w-3xl mx-auto space-y-5">
          {[
            { text: "Tommy is curious about his neighbor Igor.", delay: 0.8, serif: true, size: "text-2xl sm:text-3xl", color: "text-ink" },
            { text: "Igor visited the hospital last week. Tommy wants to know why.", delay: 1.3, serif: true, size: "text-xl sm:text-2xl", color: "text-muted-foreground" },
          ].map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: line.delay, duration: 0.6, type: "spring", bounce: 0.4 }}
              className={`font-serif ${line.size} ${line.color} text-center leading-snug`}
            >
              {line.text}
            </motion.p>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 1.8, duration: 0.6, type: "spring", bounce: 0.4 }}
            className="rounded-xl bg-danger/10 border-2 border-danger/30 p-5 font-serif italic text-lg text-ink shadow-lg shadow-danger/10"
          >
            "I cannot see anyone's record. I can only ask population questions.
            <span className="text-danger"> That should be safe… right?</span>"
          </motion.div>
        </div>
      </Beat>

      <SectionHeader num="06" title="The Attack" subtitle="Two harmless questions." anchorId="the-attack" />
      <AttackGate log={log} />

      <SectionHeader num="07" title="What Just Happened" subtitle="The data was safe. The answers were not." anchorId="what-just-happened" />
      <Beat><WhatJustHappened log={log} /></Beat>

      <SectionHeader num="07b" title="How We Change The Answer" subtitle="Meet the noise, and the function that adds it." anchorId="s07b" />
      <Beat>
        <ChangeTheAnswer onContinue={onContinue} log={log} />
      </Beat>

    </div>
  );
}
