import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { Lock, Eye, Dice5, UserX, Shuffle, X as XIcon, Sparkles, AlertTriangle, Radio, ArrowDown, MousePointer2, RotateCcw } from "lucide-react";
import { laplace } from "@/lib/dp";
import { LaplaceCurve } from "@/components/LaplaceCurve";


/* ============================================================
   ODOMETER number — counts up from 0 to value
   ============================================================ */
function Odometer({ value, duration = 0.8, className = "" }: { value: number; duration?: number; className?: string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, duration, mv]);
  return <motion.span className={className}>{display}</motion.span>;
}

/* ============================================================
   SCENE 1 — Animated probability curve + progressive answers.
   One fixed curve, then repeated asks that land as black dots.
   ============================================================ */

const TRUE_VALUE = 42;
// Three answers shown one-by-one.
const STORY_ANSWERS = [41, 42, 43];
const CYCLES = STORY_ANSWERS.length;
const GRID_SIZE = STORY_ANSWERS.length;
const FIXED_NOISE_B = 1.8;
// Candidate x-values around the true peak used for the "which value gets picked" beat.
const CANDIDATE_XS = [39, 40, 41, 43, 44, 45];

/** Height of the curve at x, given "spread" b. Common-sense decay. */
function curveHeight(x: number, trueValue: number, b: number): number {
  const decayRate = 1 - 1 / (b + 2); // 0..1
  return Math.pow(decayRate, Math.abs(x - trueValue));
}

/** Weighted random pick, biased toward trueValue, live and real. */
function sampleNoisyAnswer(trueValue: number, b: number, range = 8): number {
  const decayRate = 1 - 1 / (b + 2);
  const weights: { x: number; w: number }[] = [];
  for (let x = trueValue - range; x <= trueValue + range; x++) {
    weights.push({ x, w: Math.pow(decayRate, Math.abs(x - trueValue)) });
  }
  const total = weights.reduce((s, v) => s + v.w, 0);
  let r = Math.random() * total;
  for (const v of weights) {
    r -= v.w;
    if (r <= 0) return v.x;
  }
  return trueValue;
}

type CurvePlotProps = {
  b: number;
  width?: number;
  height?: number;
  dotX?: number | null;
  dotFalling?: boolean;
  dotLabel?: string | null;
  trail?: number[];
  setupBeat?: number;
  showCandidates?: boolean;
};

function CurvePlot({ b, width = 560, height = 240, dotX = null, dotFalling = false, dotLabel = null, trail = [], setupBeat = 0, showCandidates = false }: CurvePlotProps) {
  const padL = 82, padR = 22, padT = 44, padB = 50;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // domain widens as spread grows
  const span = 8;
  const xMin = TRUE_VALUE - span;
  const xMax = TRUE_VALUE + span;

  const xToPx = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
  const hToPy = (h: number) => padT + plotH - h * (plotH - 6);

  const path = useMemo(() => {
    const N = 200;
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin);
      const px = padL + (i / N) * plotW;
      const py = hToPy(curveHeight(x, TRUE_VALUE, b));
      pts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`);
    }
    return pts.join(" ");
  }, [b, xMin, xMax, plotW, padL, padT, plotH]);

  const fillPath = `${path} L ${padL + plotW} ${padT + plotH} L ${padL} ${padT + plotH} Z`;

  const peakX = xToPx(TRUE_VALUE);
  const peakY = hToPy(1);

  // x-axis ticks — a handful of integer marks
  const step = Math.max(1, Math.round((xMax - xMin) / 8));
  const ticks: number[] = [];
  for (let v = Math.ceil(xMin / step) * step; v <= xMax; v += step) ticks.push(v);

  const axisY = padT + plotH;
  const gradId = `storyCurveGrad-${Math.round(b * 10)}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ overflow: "visible" }} role="img" aria-label={`Probability density curve centered at ${TRUE_VALUE}`}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* axes */}
      <motion.line x1={padL} y1={padT} x2={padL} y2={axisY} stroke="var(--color-rule)" initial={{ pathLength: 0 }} animate={{ pathLength: setupBeat >= 1 ? 1 : 0 }} transition={{ duration: 0.55 }} />
      <motion.line x1={padL} y1={axisY} x2={padL + plotW} y2={axisY} stroke="var(--color-rule)" initial={{ pathLength: 0 }} animate={{ pathLength: setupBeat >= 1 ? 1 : 0 }} transition={{ duration: 0.55, delay: 0.1 }} />

      <motion.text
        x={padL + 6}
        y={padT + 12}
        textAnchor="start"
        className="fill-muted-foreground"
        fontSize={11}
        fontFamily="var(--font-mono)"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: setupBeat >= 2 ? 1 : 0, y: setupBeat >= 2 ? 0 : -4 }}
        transition={{ duration: 0.45 }}
      >
        probability of selecting a value ↑
      </motion.text>

      {/* ticks */}
      {ticks.map((t, i) => (
        <motion.g key={t} initial={{ opacity: 0, y: 5 }} animate={{ opacity: setupBeat >= 1 ? 1 : 0, y: setupBeat >= 1 ? 0 : 5 }} transition={{ duration: 0.25, delay: 0.25 + i * 0.03 }}>
          <line x1={xToPx(t)} y1={axisY} x2={xToPx(t)} y2={axisY + 4} stroke="var(--color-rule)" />
          <text x={xToPx(t)} y={axisY + 16} textAnchor="middle" className="fill-muted-foreground" fontSize={10} fontFamily="var(--font-mono)">
            {t}
          </text>
        </motion.g>
      ))}
      <motion.text
        x={padL + plotW / 2}
        y={axisY + 38}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={11}
        fontFamily="var(--font-mono)"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: setupBeat >= 2 ? 1 : 0, y: setupBeat >= 2 ? 0 : 6 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        possible answer returned →
      </motion.text>

      {/* filled area */}
      <motion.path
        d={fillPath}
        fill={`url(#${gradId})`}
        initial={false}
        animate={{ d: fillPath, opacity: setupBeat >= 3 ? 1 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* curve line — draws on first mount, then morphs */}
      <motion.path
        d={path}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={3.2}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: setupBeat >= 3 ? 1 : 0, opacity: setupBeat >= 3 ? 1 : 0, d: path }}
        transition={{
          pathLength: { duration: 0.9, ease: "easeOut" },
          opacity: { duration: 0.3 },
          d: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        }}
      />

      {/* peak dashed guide + label */}
      <motion.line x1={peakX} y1={axisY} x2={peakX} y2={axisY} animate={{ y2: setupBeat >= 4 ? peakY : axisY }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} stroke="var(--color-primary)" strokeWidth={1.4} strokeDasharray="4 4" opacity={0.8} />
      <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: setupBeat >= 4 ? 1 : 0, scale: setupBeat >= 4 ? 1 : 0.8 }} transition={{ type: "spring", bounce: 0.4, duration: 0.55 }}>
        <rect x={peakX - 92} y={peakY - 38} width={184} height={28} rx={14} fill="var(--color-primary)" />
        <text x={peakX} y={peakY - 19} textAnchor="middle" fontSize={12} className="fill-paper" fontFamily="var(--font-mono)" style={{ fontWeight: 700 }}>
          Q = {TRUE_VALUE} · The True Value
        </text>
      </motion.g>

      <motion.g initial={{ opacity: 0, x: 12 }} animate={{ opacity: setupBeat >= 5 ? 1 : 0, x: setupBeat >= 5 ? 0 : 12 }} transition={{ duration: 0.5 }}>
        <path d={`M ${peakX + 46} ${peakY + 22} C ${peakX + 74} ${peakY + 20}, ${peakX + 82} ${peakY + 62}, ${peakX + 98} ${peakY + 62}`} fill="none" stroke="var(--color-primary)" strokeWidth={1.4} strokeDasharray="3 4" />
        <rect x={peakX + 92} y={peakY + 43} width={158} height={40} rx={12} fill="var(--color-paper)" stroke="var(--color-rule)" />
        <text x={peakX + 171} y={peakY + 59} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" className="fill-muted-foreground">highest point</text>
        <text x={peakX + 171} y={peakY + 75} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" className="fill-primary" style={{ fontWeight: 700 }}>x = 42 most likely</text>
      </motion.g>

      {/* Candidate dots + arrows — "the function picks from these values" beat */}
      {showCandidates && CANDIDATE_XS.map((cx, i) => {
        const px = xToPx(cx);
        const py = hToPy(curveHeight(cx, TRUE_VALUE, b));
        return (
          <motion.g
            key={`cand-${cx}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 * i, type: "spring", bounce: 0.5, duration: 0.5 }}
          >
            <circle cx={px} cy={py} r={5} fill="var(--color-primary)" opacity={0.55} />
            <circle cx={px} cy={py} r={9} fill="none" stroke="var(--color-primary)" strokeOpacity={0.35} strokeWidth={1.2} />
            <text x={px} y={py - 12} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" className="fill-primary" style={{ fontWeight: 700 }}>
              {cx}
            </text>
          </motion.g>
        );
      })}
      {/* Left/right sweep arrows around the peak */}
      {showCandidates && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          <defs>
            <marker id="arrLeft" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 10 0 L 0 5 L 10 10 z" fill="var(--color-primary)" />
            </marker>
            <marker id="arrRight" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-primary)" />
            </marker>
          </defs>
          <line
            x1={xToPx(TRUE_VALUE - 1.2)} y1={hToPy(0.05)}
            x2={xToPx(TRUE_VALUE - 6)} y2={hToPy(0.05)}
            stroke="var(--color-primary)" strokeWidth={1.8}
            markerEnd="url(#arrLeft)"
          />
          <line
            x1={xToPx(TRUE_VALUE + 1.2)} y1={hToPy(0.05)}
            x2={xToPx(TRUE_VALUE + 6)} y2={hToPy(0.05)}
            stroke="var(--color-primary)" strokeWidth={1.8}
            markerEnd="url(#arrRight)"
          />
        </motion.g>
      )}

      {/* trail of past landing points */}
      {trail.map((tx, i) => {
        const py = hToPy(curveHeight(tx, TRUE_VALUE, b));
        return (
          <motion.circle
            key={`trail-${i}-${tx}`}
            cx={xToPx(tx)}
            cy={py}
            r={3}
            fill="var(--color-ink)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ duration: 0.3 }}
          />
        );
      })}

      {/* active dot: guide line + falling circle. Persistent (no keyed remount) so cy/cx animate smoothly. */}
      {dotX !== null && (() => {
        const cx = xToPx(dotX);
        const landedCy = hToPy(curveHeight(dotX, TRUE_VALUE, b));
        const targetCy = dotFalling ? landedCy : padT - 4;
        return (
          <g>
            <motion.line
              x1={cx} x2={cx}
              y1={padT - 4} y2={axisY}
              stroke="var(--color-ink)"
              strokeWidth={1}
              strokeDasharray="2 3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ duration: 0.2 }}
            />
            <motion.circle
              r={7}
              fill="var(--color-ink)"
              initial={{ cx, cy: padT - 4, opacity: 0, scale: 0.5 }}
              animate={{
                cx,
                cy: targetCy,
                opacity: 1,
                scale: 1,
              }}
              style={{ filter: "drop-shadow(0 5px 8px color-mix(in oklab, var(--color-ink) 30%, transparent))" }}
              transition={{
                cy: dotFalling
                  ? { type: "spring", bounce: 0.55, duration: 0.75 }
                  : { duration: 0.25, ease: "easeOut" },
                cx: { duration: 0.25 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.25 },
              }}
            />
            {dotLabel && (
              <motion.g
                initial={{ opacity: 0, y: 8, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", bounce: 0.45, duration: 0.45 }}
              >
                <rect
                  x={cx - 24}
                  y={landedCy - 36}
                  width={48}
                  height={24}
                  rx={12}
                  fill="var(--color-ink)"
                />
                <polygon
                  points={`${cx - 4},${landedCy - 12} ${cx + 4},${landedCy - 12} ${cx},${landedCy - 6}`}
                  fill="var(--color-ink)"
                />
                <text
                  x={cx}
                  y={landedCy - 19}
                  textAnchor="middle"
                  fontSize={13}
                  fontFamily="var(--font-mono)"
                  fill="var(--color-paper)"
                  style={{ fontWeight: 600 }}
                >
                  {dotLabel}
                </text>
              </motion.g>
            )}
          </g>
        );
      })()}
    </svg>
  );
}

export function TrueAnswerReveal() {
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState(0);
  const [tiles, setTiles] = useState<(number | null)[]>(Array(GRID_SIZE).fill(null));
  const [queryNum, setQueryNum] = useState(0);
  const [chipPulse, setChipPulse] = useState(0);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [dotX, setDotX] = useState<number | null>(null);
  const [dotFalling, setDotFalling] = useState(false);
  const [dotLabel, setDotLabel] = useState<string | null>(null);
  const [trail, setTrail] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [showClosing, setShowClosing] = useState(false);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [flying, setFlying] = useState<{ id: number; from: { x: number; y: number }; to: { x: number; y: number }; value: number } | null>(null);
  const [answerPop, setAnswerPop] = useState<number | null>(null);
  const [rightPhase, setRightPhase] = useState<"idle" | "heading" | "running" | "done">("idle");
  const [rightSlot, setRightSlot] = useState<"none" | "question" | "result">("none");
  const [currentResult, setCurrentResult] = useState<number | null>(null);

  const ref = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const started = useRef(false);
  const cancelToken = useRef(0);
  const flyingId = useRef(0);
  const playingRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const startShow = () => {
      if (started.current) return;
      started.current = true;
      const seq = [180, 320, 340, 360, 380, 520];
      let t = 0;
      seq.forEach((d, i) => { t += d; setTimeout(() => setBeat(i + 1), t); });
      setTimeout(() => setRightPhase("heading"), t + 200);
      setTimeout(() => { void runSequence(); }, t + 2800);
    };

    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) startShow();
    }, { threshold: 0.18, rootMargin: "0px 0px -18% 0px" });
    obs.observe(el);

    const checkPosition = () => {
      const rect = el.getBoundingClientRect();
      const enteredView = rect.top < window.innerHeight * 0.82 && rect.bottom > window.innerHeight * 0.12;
      if (enteredView) startShow();
    };
    checkPosition();
    window.addEventListener("scroll", checkPosition, { passive: true });
    window.addEventListener("resize", checkPosition);
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", checkPosition);
      window.removeEventListener("resize", checkPosition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  // Convert a curve x-value to pixel coords inside the card container.
  const computeDotPointInCard = (xVal: number) => {
    const card = cardRef.current;
    const svgWrap = svgWrapRef.current;
    if (!card || !svgWrap) return null;
    const svg = svgWrap.querySelector("svg");
    if (!svg) return null;
    const cardRect = card.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    // svg viewBox is 560x310 (from CurvePlot defaults)
    const vbW = 560, vbH = 240;
    const padL = 82, padR = 22, padT = 44, padB = 50;
    const plotW = vbW - padL - padR;
    const plotH = vbH - padT - padB;
    const xMin = TRUE_VALUE - 8, xMax = TRUE_VALUE + 8;
    const b = FIXED_NOISE_B;
    const decayRate = 1 - 1 / (b + 2);
    const h = Math.pow(decayRate, Math.abs(xVal - TRUE_VALUE));
    const vbX = padL + ((xVal - xMin) / (xMax - xMin)) * plotW;
    const vbY = padT + plotH - h * (plotH - 6);
    const sx = svgRect.width / vbW;
    const sy = svgRect.height / vbH;
    return {
      x: svgRect.left - cardRect.left + vbX * sx,
      y: svgRect.top - cardRect.top + vbY * sy,
    };
  };

  const centerQuestionInCard = () => {
    const card = cardRef.current;
    const question = card?.querySelector<HTMLElement>('[data-story-question="true"]');
    if (!card || !question) return null;
    const cardRect = card.getBoundingClientRect();
    const qRect = question.getBoundingClientRect();
    return {
      x: qRect.left - cardRect.left + qRect.width / 2,
      y: qRect.top - cardRect.top + qRect.height / 2,
    };
  };

  const computeRowPointInCard = (i: number) => {
    const card = cardRef.current;
    const row = rowRefs.current[i];
    if (!card || !row) return null;
    const cardRect = card.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    return {
      x: rowRect.left - cardRect.left + rowRect.width / 2,
      y: rowRect.top - cardRect.top + rowRect.height / 2,
    };
  };

  const runSequence = async () => {
    if (playingRef.current) return;
    playingRef.current = true;
    setPlaying(true);
    cancelToken.current += 1;
    const token = cancelToken.current;
    setTiles(Array(GRID_SIZE).fill(null));
    setTrail([]);
    setQueryNum(0);
    setChipPulse(0);
    setShowClosing(false);
    setDotX(null);
    setDotFalling(false);
    setDotLabel(null);
    setActiveRow(null);
    setFlying(null);
    setAnswerPop(null);
    setQuestionVisible(false);
    setCurrentResult(null);
    setRightSlot("none");
    setRightPhase("running");

    if (reduced) {
      setTiles(STORY_ANSWERS);
      setTrail(STORY_ANSWERS);
      setQueryNum(GRID_SIZE);
      setShowClosing(true);
      setRightPhase("done");
      setPlaying(false);
      playingRef.current = false;
      return;
    }

    const cancelled = () => cancelToken.current !== token;

    for (let i = 0; i < CYCLES; i++) {
      if (cancelled()) { playingRef.current = false; return; }

      // STEP A — Question box appears (and only the question).
      setQueryNum(i + 1);
      setChipPulse((c) => c + 1);
      setActiveRow(i);
      setDotX(null);
      setDotFalling(false);
      setDotLabel(null);
      setAnswerPop(null);
      setCurrentResult(null);
      setRightSlot("question");
      setQuestionVisible(true);
      await wait(2500);
      if (cancelled()) { playingRef.current = false; return; }

      // STEP B — Result appears on its own (question hides).
      const sampled = STORY_ANSWERS[i];
      setQuestionVisible(false);
      setDotX(sampled);
      await wait(350);
      setDotFalling(true);
      setDotLabel(String(sampled));
      setCurrentResult(sampled);
      setRightSlot("result");
      await wait(2400);
      if (cancelled()) { playingRef.current = false; return; }

      // STEP C — Result drops into the table as the next row.
      setTiles((prev) => {
        const next = [...prev];
        next[i] = sampled;
        return next;
      });
      // shared layoutId hands off the number to the row; clear the center slot.
      setRightSlot("none");
      setCurrentResult(null);
      setTrail((prev) => [...prev.slice(-7), sampled]);
      await wait(1400);

      // reset curve visuals for next round
      setDotX(null);
      setDotLabel(null);
      setDotFalling(false);
    }
    setActiveRow(null);
    setQuestionVisible(false);
    setShowClosing(true);
    setRightPhase("done");
    setPlaying(false);
    playingRef.current = false;
  };


  return (
    <div ref={ref} data-true-answer-reveal="true" className="relative scroll-mt-20">
      {/* Ultra-compact single-line heading */}
      <div className="text-center max-w-4xl mx-auto mb-2">
        <motion.h2 className="font-serif text-lg sm:text-xl text-ink leading-snug">
          <motion.span initial={{ opacity: 0, y: 6 }} animate={beat >= 1 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }}>
            The true answer is 42.{" "}
          </motion.span>
          <motion.span initial={{ opacity: 0, y: 10 }} animate={beat >= 2 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-muted-foreground">
            Noise picks what people actually see.
          </motion.span>
        </motion.h2>
      </div>

      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={beat >= 3 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-6xl mx-auto rounded-2xl bg-paper border border-rule shadow-2xl p-3 sm:p-4 overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-4 md:gap-5 items-stretch">
          {/* LEFT — curve + per-cycle cartoon question + f caption */}
          <div className="relative flex flex-col">
            <div ref={svgWrapRef} className="relative rounded-xl bg-background/40 border border-rule/60 p-1 flex-1">
              <CurvePlot
                b={FIXED_NOISE_B}
                dotX={dotX}
                dotFalling={dotFalling}
                dotLabel={dotLabel}
                trail={trail}
                setupBeat={beat}
                showCandidates={beat >= 6 && queryNum === 0}
              />

              {/* f(Q) = Q' cartoon caption — appears after candidates, hides once cycles start */}
              <AnimatePresence>
                {beat >= 6 && queryNum === 0 && (
                  <motion.div
                    data-story-question="true"
                    key="f-caption"
                    initial={{ opacity: 0, y: 14, scale: 0.7, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: -1 }}
                    exit={{ opacity: 0, scale: 0.7, y: 8 }}
                    transition={{ type: "spring", bounce: 0.45, duration: 0.6 }}
                    className="absolute left-3 bottom-3 z-20 max-w-[240px] rounded-2xl bg-ink text-paper border-2 border-primary shadow-xl px-3 py-2"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-0.5">the noise function</div>
                    <div className="font-serif text-lg font-bold leading-tight">f(Q) = Q&prime;</div>
                    <div className="mt-1 text-[11px] leading-snug text-paper/85">
                      Picks a value based on the probability of these
                      <span className="text-primary font-semibold"> ← nearby values →</span>
                    </div>
                    {/* tail */}
                    <div className="absolute -top-2 left-8 w-3 h-3 rotate-45 bg-ink border-t-2 border-l-2 border-primary" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Per-cycle cartoon question bubble — appears each time we ask */}
              <AnimatePresence>
                {questionVisible && (
                  <motion.div
                    key={`question-bubble-${chipPulse}`}
                    initial={{ opacity: 0, y: -20, scale: 0.55, rotate: -3 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: -1.5 }}
                    exit={{ opacity: 0, y: -10, scale: 0.7 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                    className="absolute left-1/2 -translate-x-1/2 top-2 z-30 max-w-[320px] rounded-2xl bg-paper text-ink border-[3px] border-ink shadow-[4px_6px_0_0_hsl(var(--primary))] px-4 py-2 text-center"
                  >
                    <div className="font-mono text-[9px] uppercase tracking-widest text-primary">Question #{queryNum}</div>
                    <div className="font-serif text-sm sm:text-base font-semibold leading-tight">
                      Q = How many patients have diabetes?
                    </div>
                    {/* tail */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-paper border-r-[3px] border-b-[3px] border-ink" />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {answerPop !== null && (
                  <motion.div
                    key={`answer-pop-${answerPop}-${queryNum}`}
                    initial={{ opacity: 0, scale: 0.45, y: 10 }}
                    animate={{ opacity: 1, scale: [0.45, 1.24, 1], y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: -10 }}
                    transition={{ duration: 0.5, ease: [0.22, 1.25, 0.36, 1] }}
                    className="absolute left-1/2 bottom-12 z-10 -translate-x-1/2 rounded-full bg-primary text-paper shadow-xl px-5 py-2 font-mono text-sm font-bold"
                  >
                    Answer: {answerPop}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT — strict step-by-step sequence */}
          <div className="relative flex flex-col">
            {/* Step 0 — heading question, then swaps to sub-label once running */}
            <div className="min-h-[54px] mb-2 text-center flex items-center justify-center px-2">
              <AnimatePresence mode="wait">
                {rightPhase === "heading" && (
                  <motion.h3
                    key="right-heading"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="font-serif text-lg sm:text-xl text-ink leading-snug"
                  >
                    When we run a single query multiple times?
                  </motion.h3>
                )}
                {(rightPhase === "running" || rightPhase === "done") && (
                  <motion.div
                    key="right-sublabel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    {rightPhase === "done" ? "All three answers returned" : `Round ${Math.min(queryNum || 1, CYCLES)} of ${CYCLES}`}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Center stage — ONE thing at a time: question box, then result. */}
            <div className="relative min-h-[132px] mb-3 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {rightSlot === "question" && (
                  <motion.div
                    key={`q-${queryNum}-${chipPulse}`}
                    initial={{ opacity: 0, y: -16, scale: 0.7, rotate: -3 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: -1 }}
                    exit={{ opacity: 0, scale: 0.75, y: -10 }}
                    transition={{ type: "spring", bounce: 0.45, duration: 0.55 }}
                    className="rounded-2xl bg-paper border-[3px] border-ink shadow-[4px_6px_0_0_hsl(var(--primary))] px-5 py-3 max-w-[340px] text-center"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">Query #{queryNum}</div>
                    <div className="font-serif text-base sm:text-lg font-semibold leading-snug text-ink">
                      Q = How many patients have diabetes?
                    </div>
                  </motion.div>
                )}
                {rightSlot === "result" && currentResult !== null && (
                  <motion.div
                    key={`r-${queryNum}`}
                    layoutId={`answer-${queryNum}`}
                    initial={{ opacity: 0, scale: 0.35, y: -20 }}
                    animate={{ opacity: 1, scale: [0.35, 1.3, 1], y: 0 }}
                    exit={{ opacity: 1 }}
                    transition={{ duration: 0.55, ease: [0.22, 1.3, 0.36, 1] }}
                    className="rounded-full bg-primary text-paper px-8 py-3 font-serif text-4xl sm:text-5xl font-bold shadow-2xl"
                  >
                    {currentResult}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Table — rows fill in strictly one after another */}
            <div className="rounded-xl border border-rule overflow-hidden bg-background/40">
              <div className="grid grid-cols-[70px_1fr] bg-ink/95 text-paper">
                <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest border-r border-paper/20">Round</div>
                <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest">Returned answer</div>
              </div>
              {tiles.map((v, i) => {
                const revealed = v !== null;
                const isActive = activeRow === i && !revealed;
                return (
                  <div
                    key={i}
                    ref={(el) => { rowRefs.current[i] = el; }}
                    className={`grid grid-cols-[70px_1fr] items-center border-t border-rule/70 min-h-[60px] transition-colors duration-500 ${
                      revealed ? "bg-primary/5" : isActive ? "bg-primary/10" : "bg-transparent"
                    }`}
                  >
                    <div className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground border-r border-rule/60">
                      #{i + 1}
                    </div>
                    <div className="px-4 py-2 relative">
                      {revealed ? (
                        <motion.div
                          layoutId={`answer-${i + 1}`}
                          transition={{ type: "spring", bounce: 0.35, duration: 0.7 }}
                          className="flex items-baseline gap-3"
                        >
                          <span className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-none">{v}</span>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-primary">landed</span>
                        </motion.div>
                      ) : (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                          {isActive ? "waiting for answer…" : "waiting"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>



        {/* Flying number overlay — travels from curve dot → row */}
        <AnimatePresence>
          {flying && (
            <>
              {/* connector line */}
              <motion.svg
                key={`line-${flying.id}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <line
                  x1={flying.from.x}
                  y1={flying.from.y}
                  x2={flying.to.x}
                  y2={flying.to.y}
                  stroke="var(--color-primary)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              </motion.svg>
              <motion.div
                key={`fly-${flying.id}`}
                initial={{ x: flying.from.x, y: flying.from.y, scale: 1, opacity: 1 }}
                animate={{ x: flying.to.x, y: flying.to.y, scale: 1.1, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-0 left-0 pointer-events-none z-20"
                style={{ translateX: "-50%", translateY: "-50%" }}
              >
                <div className="px-2.5 py-1 rounded-full bg-primary text-paper font-mono text-sm font-bold shadow-lg">
                  {flying.value}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showClosing && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.7 }}
              className="mx-auto mt-4 max-w-2xl rounded-2xl bg-ink text-paper border-2 border-primary shadow-[4px_6px_0_0_hsl(var(--primary))] px-5 py-3 text-center"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">the takeaway</div>
              <p className="font-serif text-base sm:text-lg leading-snug">
                Same question, three different answers. <span className="text-primary font-semibold">That is the noise at work.</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}


/* ============================================================
   SCENE 2 — THE PROBLEM (no static curve, number-line story)
   ============================================================ */
export function ProblemScene() {
  const [beat, setBeat] = useState(0);
  const [round, setRound] = useState(0); // pinball rounds
  const [dotX, setDotX] = useState(50);
  const [landed, setLanded] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const seq = [400, 800, 500, 700, 800, 1200, 700, 700];
        let t = 0;
        seq.forEach((d, i) => { t += d; setTimeout(() => setBeat(i + 1), t); });
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // pinball animation
  useEffect(() => {
    if (beat < 3) return;
    let cancelled = false;
    const run = async (target: number) => {
      const bounces = [50, 12, 88, 25, 75, 35, target];
      for (const x of bounces) {
        if (cancelled) return;
        setDotX(x);
        await new Promise((r) => setTimeout(r, 220));
      }
      setLanded(Math.round(3200 + (target / 100) * 4000));
    };
    const seq = async () => {
      setLanded(null);
      await run(82); // far right
      await new Promise((r) => setTimeout(r, 1100));
      setRound(1);
      setLanded(null);
      await run(14); // far left
    };
    seq();
    return () => { cancelled = true; };
  }, [beat]);

  const offBy = landed !== null ? Math.abs(landed - 4200) : 0;

  return (
    <div ref={ref} className="space-y-10">
      {/* Pill */}
      <div className="text-center">
        <motion.div
          initial={{ y: -40, opacity: 0 }} animate={beat >= 1 ? { y: [0, -8, 0], opacity: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}

          className="inline-block rounded-full px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white"
          style={{ background: "#c94f2c" }}
        >
          The problem
        </motion.div>
      </div>

      {/* Heading */}
      <div className="text-center max-w-4xl mx-auto space-y-3">
        <h2 className="font-serif text-3xl sm:text-5xl text-ink leading-tight">
          {beat >= 1 && "A wide curve means the noisy answer can land".split(" ").map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="inline-block mr-2"
            >
              {w}
            </motion.span>
          ))}{" "}
          <AnimatePresence>
            {beat >= 2 && (
              <motion.span
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: [0, -3, 3, -3, 3, 0] }}
                transition={{ scale: { type: "spring", bounce: 0.5, duration: 0.5 }, x: { duration: 0.3, delay: 0.4 } }}
                className="inline-block italic font-bold relative px-2"
                style={{ color: "#c94f2c" }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.4, 0, 0.4, 0] }}
                  transition={{ duration: 1.4, delay: 0.3 }}
                  className="absolute inset-0 rounded-md -z-10"
                  style={{ background: "#c94f2c33" }}
                />
                way off.
              </motion.span>
            )}
          </AnimatePresence>
        </h2>

        {/* Sub */}
        <div className="space-y-1 pt-3">
          {beat >= 2 && (
            <>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-serif text-lg" style={{ color: "#3a8a5a" }}>
                Useful for privacy.
              </motion.span>{" "}
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="font-serif text-lg" style={{ color: "#c94f2c" }}>
                Painful for accuracy. <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0.8] }} transition={{ delay: 0.7, duration: 1.6 }}>😬</motion.span>
              </motion.span>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="text-ink font-serif text-xl pt-2">
                <motion.span initial={{ rotate: 0 }} animate={{ rotate: 90 }} transition={{ delay: 1.4 }} className="inline-block mr-2">🎛️</motion.span>
                We need a knob to pull the curve back in.
              </motion.p>
            </>
          )}
        </div>
      </div>

      {/* Number line story */}
      <motion.div
        initial={{ opacity: 0 }} animate={beat >= 3 ? { opacity: 1 } : {}}
        className="rounded-2xl border-2 bg-paper p-6 shadow-xl"
        style={{ borderColor: "#c94f2c40" }}
      >
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3 text-center">
          watch where the noisy answer lands · round {round + 1} of 2
        </div>
        <div className="relative h-32">
          <svg viewBox="0 0 600 100" className="w-full h-full">
            {/* line */}
            <motion.line
              x1={20} y1={60} x2={580} y2={60}
              stroke="var(--color-ink)" strokeWidth={2}
              initial={{ pathLength: 0 }} animate={beat >= 3 ? { pathLength: 1 } : {}}
              transition={{ duration: 0.8 }}
            />
            {[3200, 3600, 4000, 4200, 4400, 4800, 5600].map((v, i) => {
              const x = 20 + ((v - 3000) / 2800) * 560;
              const isTrue = v === 4200;
              return (
                <motion.g key={v} initial={{ opacity: 0 }} animate={beat >= 3 ? { opacity: 1 } : {}} transition={{ delay: 0.3 + i * 0.05 }}>
                  <line x1={x} y1={56} x2={x} y2={64} stroke="var(--color-ink)" />
                  <text x={x} y={80} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" className={isTrue ? "fill-primary font-bold" : "fill-muted-foreground"}>{v}</text>
                  {isTrue && (
                    <motion.g
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      style={{ transformOrigin: `${x}px 40px` }}
                    >
                      <text x={x} y={42} textAnchor="middle" fontSize={18}>⭐</text>
                      <text x={x} y={22} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" className="fill-primary">true ✓ 4200</text>
                    </motion.g>
                  )}
                </motion.g>
              );
            })}
            {/* pinball dot */}
            {beat >= 3 && (
              <motion.circle
                animate={{ cx: 20 + (dotX / 100) * 560 }}
                transition={{ type: "spring", stiffness: 240, damping: 14 }}
                cy={60} r={9} fill="#c94f2c"
                style={{ filter: "drop-shadow(0 0 6px #c94f2c80)" }}
              />
            )}
            {/* bracket when landed */}
            {landed !== null && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                {(() => {
                  const trueX = 20 + ((4200 - 3000) / 2800) * 560;
                  const landX = 20 + (dotX / 100) * 560;
                  const lo = Math.min(trueX, landX);
                  const hi = Math.max(trueX, landX);
                  return (
                    <>
                      <line x1={lo} y1={40} x2={hi} y2={40} stroke="#c94f2c" strokeWidth={2} />
                      <line x1={lo} y1={40} x2={lo} y2={50} stroke="#c94f2c" strokeWidth={2} />
                      <line x1={hi} y1={40} x2={hi} y2={50} stroke="#c94f2c" strokeWidth={2} />
                      <text x={(lo + hi) / 2} y={32} textAnchor="middle" fontSize={14} fontWeight="bold" className="fill-[#c94f2c]">
                        Off by {offBy} 😱
                      </text>
                    </>
                  );
                })()}
              </motion.g>
            )}
          </svg>
        </div>

        {beat >= 4 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-muted-foreground italic mt-2">
            {round === 0 ? "Watch the dot bounce wildly before landing." : "And it could be even worse next time."}
          </motion.p>
        )}

        {beat >= 5 && (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center font-serif text-base text-ink mt-4">
            With <span className="font-mono text-[#c94f2c] font-bold">b = 400</span>, the noise can send your answer over <span className="font-bold text-[#c94f2c]">1,000 units</span> away from the truth.
          </motion.p>
        )}
      </motion.div>

      {/* Real consequence callout */}
      <AnimatePresence>
        {beat >= 6 && (
          <motion.div
            initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", bounce: 0.35, duration: 0.7 }}
            className="rounded-xl p-5 shadow-xl mx-auto max-w-lg"
            style={{ background: "#fff4ef", border: "2px solid #c94f2c" }}
          >
            <div className="flex items-center gap-2 mb-3 font-mono text-[11px] uppercase tracking-widest text-[#c94f2c]">
              <AlertTriangle className="w-4 h-4" /> Real consequence
            </div>
            <p className="text-sm text-ink mb-2">If a hospital asks: <em>"How many patients have diabetes?"</em></p>
            <div className="font-mono text-sm space-y-1 text-ink">
              <div>True:&nbsp;&nbsp;&nbsp;&nbsp;<Odometer value={1247} /></div>
              <div>Reported: <Odometer value={892} /></div>
              <div className="text-[#c94f2c] font-bold">Error: <Odometer value={355} /> — off by hundreds of people!</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tug of war */}
      <AnimatePresence>
        {beat >= 7 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-paper border border-rule p-6 shadow-md max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-between font-serif text-lg">
              <div className="flex items-center gap-1.5 text-ink">🔒 Privacy</div>
              <div className="flex items-center gap-1.5 text-[#c94f2c]">Accuracy 📊</div>
            </div>
            <div className="relative h-8 mt-3 mx-2">
              <div className="absolute inset-y-1/2 left-0 right-0 h-1 bg-gradient-to-r from-ink to-[#c94f2c] -translate-y-1/2 rounded-full" />
              <motion.div
                initial={{ left: "50%" }} animate={{ left: "22%" }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-paper border-2 border-ink shadow-lg flex items-center justify-center text-xs"
              >
                ⚓
              </motion.div>
            </div>
            <p className="text-center text-xs text-muted-foreground italic mt-3">
              Right now the rope is too far left. We need a way to pull right.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition */}
      <AnimatePresence>
        {beat >= 8 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3 pt-4">
            <p className="font-serif text-xl text-ink italic">So we invented a second parameter to fix this.</p>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.2, repeat: Infinity }} className="flex justify-center">
              <ArrowDown className="w-5 h-5 text-primary" />
            </motion.div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Parameter two →</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SCENE 3 — EPSILON 3-act reveal
   ============================================================ */



export function EpsilonReveal({ log }: { log: (k: string, d?: Record<string, unknown>) => void }) {
  const [epsilon, setEpsilon] = useState(0.5);
  const delta = 100;
  const b = delta / epsilon;

  const [popups, setPopups] = useState({ p1: true, p2: true, p3: true });
  const [act1Started, setAct1Started] = useState(false);
  const [act2Started, setAct2Started] = useState(false);
  const [act3Started, setAct3Started] = useState(false);

  const act1Ref = useRef<HTMLDivElement>(null);
  const act2Ref = useRef<HTMLDivElement>(null);
  const act3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setup = (el: HTMLElement | null, cb: () => void) => {
      if (!el) return () => {};
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) cb(); }, { threshold: 0.3 });
      obs.observe(el);
      return () => obs.disconnect();
    };
    const a = setup(act1Ref.current, () => setAct1Started(true));
    const b2 = setup(act2Ref.current, () => setAct2Started(true));
    const c = setup(act3Ref.current, () => setAct3Started(true));
    return () => { a(); b2(); c(); };
  }, []);

  const widthMsg =
    epsilon < 0.3 ? { text: "Very wide — high privacy, low accuracy ⚠️", color: "#c94f2c" }
    : epsilon <= 0.8 ? { text: "Moderate — balanced tradeoff ⚖️", color: "#1e1b5e" }
    : { text: "Narrow — high accuracy, lower privacy 🔓", color: "#3a8a5a" };

  return (
    <div className="space-y-16 relative">
      {/* Sticky formula bar */}
      <div className="sticky top-16 z-20 mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-full bg-paper border border-rule shadow-md px-5 py-2 flex items-center justify-around font-mono text-sm gap-3 backdrop-blur"
        >
          <span className="text-[#e8a838] font-bold">Δ = {delta}</span>
          <span className="text-[#7b68c8] font-bold">ε = {epsilon.toFixed(2)} <span className="text-[10px] text-muted-foreground">▶ drag</span></span>
          <span className="text-[#c94f2c] font-bold">b = {b.toFixed(1)}</span>
        </motion.div>
      </div>

      {/* ACT 1 — Writeup */}
      <div ref={act1Ref} className="text-center max-w-3xl mx-auto space-y-6">
        <div className="space-y-3 text-lg text-muted-foreground">
          {["Turn ε up to pull the curve back in.", "Turn it down to keep more privacy.", "Drag and watch the curve shrink."].map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 8 }} animate={act1Started ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.5 + i * 0.3 }}
              className="flex items-center justify-center gap-2"
            >
              {line}
              {i === 0 && <motion.span animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 1 }}>↗</motion.span>}
              {i === 1 && <Lock className="w-4 h-4 text-[#7b68c8]" />}
              {i === 2 && <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}><MousePointer2 className="w-4 h-4 text-primary" /></motion.span>}
            </motion.p>
          ))}
        </div>

        {/* Formula teaser */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={act1Started ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 2.6, type: "spring", bounce: 0.4 }}
          className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-paper border border-rule shadow-md font-serif text-3xl"
        >
          <motion.span animate={act1Started ? { textShadow: ["0 0 0px transparent", "0 0 16px #e8a83880", "0 0 0px transparent"] } : {}} transition={{ delay: 2.9, duration: 1.2 }} style={{ color: "#e8a838" }} className="font-bold">b</motion.span>
          <span className="text-muted-foreground">=</span>
          <motion.span animate={act1Started ? { textShadow: ["0 0 0px transparent", "0 0 16px #e8a83880", "0 0 0px transparent"] } : {}} transition={{ delay: 3.3, duration: 1.2 }} style={{ color: "#e8a838" }} className="font-bold">Δ</motion.span>
          <span className="text-muted-foreground">/</span>
          <motion.span animate={act1Started ? { textShadow: ["0 0 0px transparent", "0 0 16px #7b68c880", "0 0 0px transparent"] } : {}} transition={{ delay: 3.7, duration: 1.2 }} style={{ color: "#7b68c8" }} className="font-bold">ε</motion.span>
        </motion.div>
      </div>

      {/* ACT 2 — Graph + interactive slider */}
      <div ref={act2Ref} className="rounded-2xl border-2 border-primary/40 bg-paper p-6 shadow-2xl">
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3 text-center">Act 2 · the graph</div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={act2Started ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
        >
          <LaplaceCurve
            mu={4200}
            b={Math.max(b, 1)}
            height={260}
            domain={[4200 - 1400, 4200 + 1400]}
            liveBadge={{ label: "b = Δ/ε", value: b.toFixed(1), color: epsilon < 0.5 ? "danger" : "primary" }}
          />

        </motion.div>

        {/* Interactive ε slider */}
        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-baseline">
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">ε — drag to control privacy vs accuracy</label>
            <span className="font-serif text-3xl font-bold" style={{ color: "#7b68c8" }}>{epsilon.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.1} max={2.0} step={0.05}
            value={epsilon}
            onChange={(e) => { setEpsilon(parseFloat(e.target.value)); log("epsilon_change", { epsilon: parseFloat(e.target.value) }); }}
            className="w-full accent-[#7b68c8] h-2"
            aria-label={`epsilon dial, current value ${epsilon.toFixed(2)}, curve is ${widthMsg.text}`}
          />
          <motion.div
            key={widthMsg.text}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-center font-serif text-base"
            style={{ color: widthMsg.color }}
          >
            {widthMsg.text}
          </motion.div>
        </div>
      </div>

      {/* ACT 3 — popups */}
      <div ref={act3Ref} className="grid md:grid-cols-3 gap-4">
        <AnimatePresence>
          {popups.p1 && act3Started && (
            <motion.div
              initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0, type: "spring", bounce: 0.4, duration: 0.7 }}
              className="rounded-xl p-4 shadow-lg relative bg-primary/5 border-2 border-primary/40"
            >
              <button onClick={() => setPopups((p) => ({ ...p, p1: false }))} className="absolute top-2 right-2 text-muted-foreground hover:text-ink"><XIcon className="w-3 h-3" /></button>
              <div className="flex items-center gap-2 mb-2 text-primary font-mono text-[10px] uppercase tracking-widest">📐 what does b control?</div>
              <p className="text-sm text-ink">b is the noise scale. Big b = wide curve = more noise = more privacy. Small b = narrow = less noise = more accuracy.</p>
            </motion.div>
          )}
          {popups.p2 && act3Started && (
            <motion.div
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="rounded-xl p-4 shadow-lg relative border-2"
              style={{ background: "#fff8e6", borderColor: "#e8a838" }}
            >
              <button onClick={() => setPopups((p) => ({ ...p, p2: false }))} className="absolute top-2 right-2 text-muted-foreground hover:text-ink"><XIcon className="w-3 h-3" /></button>
              <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-widest" style={{ color: "#a07820" }}>🤔 why not ε = 1000?</div>
              <p className="text-sm text-ink">You could — but then almost no noise is added, and privacy disappears entirely. Someone could reverse-engineer the original data.</p>
            </motion.div>
          )}
          {popups.p3 && act3Started && (
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="rounded-xl p-4 shadow-lg relative border-2"
              style={{ background: "#f1eef9", borderColor: "#7b68c8" }}
            >
              <button onClick={() => setPopups((p) => ({ ...p, p3: false }))} className="absolute top-2 right-2 text-muted-foreground hover:text-ink"><XIcon className="w-3 h-3" /></button>
              <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-widest" style={{ color: "#7b68c8" }}><Radio className="w-3.5 h-3.5" /> volume dial analogy</div>
              <p className="text-sm text-ink">Think of ε as a volume dial. Low = static (privacy). High = clear signal (eavesdroppers hear too).</p>
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.4, repeat: Infinity }} className="mt-2 text-2xl">📻</motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Final caption */}
      <motion.p
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        transition={{ delay: 0.6 }}
        className="text-center font-serif text-2xl text-ink pt-4"
      >
        Epsilon is your{" "}
        <span className="relative inline-block">
          only
          <motion.span
            initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
            transition={{ delay: 1, duration: 0.7 }}
            style={{ originX: 0 }}
            className="absolute left-0 right-0 -bottom-0.5 h-[3px] bg-[#e8a838]"
          />
        </span>{" "}
        lever. Use it{" "}
        <motion.span
          animate={{ color: ["#c94f2c", "#c94f2c", "var(--color-ink)"] }}
          transition={{ duration: 2, delay: 1.6 }}
          className="italic font-bold"
        >wisely.</motion.span>
      </motion.p>

      <Sparkles className="hidden" />
    </div>
  );
}
