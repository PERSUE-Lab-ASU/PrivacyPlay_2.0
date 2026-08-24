import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import researcherUrl from "@/assets/images/researcher.png";
import { laplacePdf } from "@/lib/dp";

/* ----------------- caption box (comic style) ----------------- */

type Entrance = "left" | "right" | "top" | "bottom" | "pop";
type Tone = "cream" | "indigo" | "focus" | "question";

interface Pos {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  maxWidth?: string;
  rotate?: number;
}

function entranceVariants(e: Entrance) {
  switch (e) {
    case "left":
      return { initial: { opacity: 0, x: -80, rotate: -6 }, animate: { opacity: 1, x: 0 } };
    case "right":
      return { initial: { opacity: 0, x: 80, rotate: 6 }, animate: { opacity: 1, x: 0 } };
    case "top":
      return { initial: { opacity: 0, y: -60 }, animate: { opacity: 1, y: 0 } };
    case "bottom":
      return { initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 } };
    case "pop":
    default:
      return { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: 1 } };
  }
}

function toneClasses(t: Tone) {
  switch (t) {
    case "indigo":
      return "bg-primary text-primary-foreground border-primary";
    case "focus":
      return "bg-gradient-to-br from-primary to-secondary text-primary-foreground border-ink/20";
    case "question":
      return "bg-paper text-ink border-secondary";
    case "cream":
    default:
      return "bg-paper text-ink border-primary/70";
  }
}

function CaptionBox({
  text,
  tone,
  entrance,
  pos,
  emphasize,
  mobile,
  glow,
}: {
  text: string;
  tone: Tone;
  entrance: Entrance;
  pos: Pos;
  emphasize?: boolean;
  mobile?: boolean;
  glow?: boolean;
}) {
  const v = entranceVariants(entrance);
  const rotate = pos.rotate ?? 0;
  const style: React.CSSProperties = mobile
    ? { maxWidth: pos.maxWidth ?? "22rem" }
    : {
        position: "absolute",
        top: pos.top,
        bottom: pos.bottom,
        left: pos.left,
        right: pos.right,
        maxWidth: pos.maxWidth ?? "14rem",
        transform: pos.left === "50%" ? "translateX(-50%)" : undefined,
        zIndex: 20,
      };
  return (
    <motion.div
      initial={v.initial}
      animate={{ ...v.animate, rotate }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={style}
      className={`rounded-xl border-2 px-4 py-2.5 shadow-[4px_5px_0_0_hsl(var(--ink)/0.15)] ${toneClasses(tone)} ${mobile ? "mx-auto" : ""} ${glow ? "ring-4 ring-primary/20 animate-pulse" : ""}`}
    >
      <p
        className={`font-serif leading-snug ${
          emphasize ? "text-base sm:text-lg font-semibold" : "text-sm sm:text-[15px]"
        }`}
      >
        {text}
      </p>
    </motion.div>
  );
}

/* ---------- Morphing curve: uniform → Laplace, then cycling widths ---------- */

const W = 640;
const H = 260;
const PAD_L = 40;
const PAD_R = 20;
const PAD_T = 30;
const PAD_B = 40;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const X_MIN = 0;
const X_MAX = 100;

const xToPx = (x: number) => PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;

/** Generate a curve path. mode: "uniform" flat line; else Laplace(mu=42, b). t = 0..1 morph fraction from uniform to laplace. */
function buildPath(b: number, morph: number) {
  const N = 160;
  const mu = 42;
  const flatY = PAD_T + PLOT_H * 0.7; // baseline height for uniform
  const peak = laplacePdf(mu, mu, b);
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + (i / N) * (X_MAX - X_MIN);
    const y = laplacePdf(x, mu, b);
    const laplaceY = PAD_T + PLOT_H - (y / peak) * (PLOT_H - 6);
    const py = flatY * (1 - morph) + laplaceY * morph;
    const px = PAD_L + (i / N) * PLOT_W;
    pts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return pts.join(" ");
}

function MorphCurve({
  phase,
}: {
  // "uniform" | "morphing" | "laplace" | "widths"
  phase: "uniform" | "morphing" | "laplace" | "widths";
}) {
  const [morph, setMorph] = useState(0); // 0 uniform, 1 laplace
  const [b, setB] = useState(3);
  const rafRef = useRef<number | null>(null);

  // Drive morph target based on phase
  useEffect(() => {
    let target = 0;
    if (phase === "uniform") target = 0;
    else if (phase === "morphing" || phase === "laplace") target = 1;
    else if (phase === "widths") target = 1;
    const start = performance.now();
    const from = morph;
    const dur = 1800;
    function step(now: number) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * p);
      setMorph(from + (target - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Cycle widths in the "widths" phase
  useEffect(() => {
    if (phase !== "widths") {
      setB(3);
      return;
    }
    const cycle = [1, 2.2, 4, 6.5, 3];
    let i = 0;
    const iv = setInterval(() => {
      i = (i + 1) % cycle.length;
      setB(cycle[i]);
    }, 1400);
    return () => clearInterval(iv);
  }, [phase]);

  const d = buildPath(b, morph);
  const flatY = PAD_T + PLOT_H * 0.7;
  const axisY = PAD_T + PLOT_H;

  // Scattered values (7, 42, 91) - visible in uniform phase
  const scattered = [12, 25, 42, 58, 78, 91];
  const showScattered = morph < 0.6;

  // Peak marker
  const peakX = xToPx(42);
  const showPeak = morph > 0.7;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Axis */}
      <line x1={PAD_L} y1={axisY} x2={PAD_L + PLOT_W} y2={axisY} stroke="var(--color-rule)" strokeWidth={1} />
      {/* Ticks at 42 */}
      <line x1={peakX} y1={axisY} x2={peakX} y2={axisY + 6} stroke="var(--color-primary)" strokeWidth={1.5} />
      <text x={peakX} y={axisY + 20} textAnchor="middle" fontSize={12} fontFamily="var(--font-mono)" className="fill-primary" style={{ fontWeight: 700 }}>
        42
      </text>
      <text x={peakX} y={axisY + 34} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" className="fill-muted-foreground">
        the truth
      </text>

      {/* Filled area */}
      <path d={`${d} L ${PAD_L + PLOT_W} ${axisY} L ${PAD_L} ${axisY} Z`} fill="var(--color-primary)" opacity={0.1} />

      {/* Curve */}
      <path d={d} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} strokeLinecap="round" />

      {/* Scattered dots on flat line */}
      {showScattered &&
        scattered.map((x) => {
          const isTruth = x === 42;
          return (
            <g key={x} opacity={1 - morph}>
              <circle cx={xToPx(x)} cy={flatY} r={isTruth ? 7 : 5} fill={isTruth ? "var(--color-danger)" : "var(--color-primary)"} />
              {isTruth && (
                <text x={xToPx(x)} y={flatY - 14} textAnchor="middle" fontSize={11} className="fill-danger" fontFamily="var(--font-mono)" style={{ fontWeight: 700 }}>
                  42
                </text>
              )}
            </g>
          );
        })}

      {/* Peak label */}
      {showPeak && (
        <g opacity={Math.min(1, (morph - 0.7) / 0.3)}>
          <line x1={peakX} y1={PAD_T + 8} x2={peakX} y2={axisY} stroke="var(--color-danger)" strokeWidth={1} strokeDasharray="3 3" />
          <text x={peakX} y={PAD_T - 2} textAnchor="middle" fontSize={11} className="fill-danger" fontFamily="var(--font-mono)" style={{ fontWeight: 700 }}>
            most likely
          </text>
        </g>
      )}

      {/* Live b badge in widths phase */}
      {phase === "widths" && (
        <g>
          <rect x={W - PAD_R - 96} y={PAD_T - 6} width={90} height={30} rx={8} fill="var(--color-paper)" stroke="var(--color-primary)" strokeWidth={1.5} />
          <text x={W - PAD_R - 88} y={PAD_T + 6} fontSize={8} fontFamily="var(--font-mono)" className="fill-muted-foreground">
            width b
          </text>
          <text x={W - PAD_R - 50} y={PAD_T + 18} fontSize={13} fontFamily="var(--font-mono)" textAnchor="middle" className="fill-primary" style={{ fontWeight: 700 }}>
            {b.toFixed(1)}
          </text>
        </g>
      )}

      {/* Wild scattered answers popping */}
      {phase === "uniform" && (
        <>
          <FloatingNumber x={xToPx(7)} y={flatY - 30} value={7} delay={0.3} />
          <FloatingNumber x={xToPx(42)} y={flatY - 30} value={42} delay={0.9} />
          <FloatingNumber x={xToPx(91)} y={flatY - 30} value={91} delay={1.5} />
        </>
      )}
    </svg>
  );
}

function FloatingNumber({ x, y, value, delay }: { x: number; y: number; value: number; delay: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, y: y + 20 }}
      animate={{ opacity: [0, 1, 1, 0], y: [y + 20, y, y - 10, y - 30] }}
      transition={{ duration: 3, delay, repeat: Infinity, repeatDelay: 1.5 }}
    >
      <rect x={x - 18} y={y - 12} width={36} height={22} rx={6} fill="var(--color-danger)" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontFamily="var(--font-mono)" fill="white" style={{ fontWeight: 700 }}>
        {value}
      </text>
    </motion.g>
  );
}

/* ---------- Researcher block ---------- */

function ResearcherAside({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="flex items-start gap-4"
        >
          <img
            src={researcherUrl}
            alt="Dr. Jim, researcher"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-lg border-2 border-primary/30 shrink-0"
          />
          <div className="flex flex-col gap-2 pt-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.6, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.4, type: "spring", bounce: 0.4 }}
              className="rounded-2xl rounded-tl-sm bg-paper border-2 border-danger/60 px-3.5 py-2 shadow-[3px_4px_0_0_hsl(var(--ink)/0.12)] max-w-[15rem]"
            >
              <p className="font-serif text-sm sm:text-[15px] text-ink leading-snug">
                Hang on. If the answers are this wild, my research is useless.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.6, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 1.5, type: "spring", bounce: 0.4 }}
              className="rounded-2xl rounded-tl-sm bg-paper border-2 border-danger/60 px-3.5 py-2 shadow-[3px_4px_0_0_hsl(var(--ink)/0.12)] max-w-[15rem] ml-4"
            >
              <p className="font-serif text-sm sm:text-[15px] text-ink leading-snug">
                I cannot learn anything real from pure noise.
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Beats definitions per part ---------- */

interface CapDef {
  key: string;
  text: string;
  tone: Tone;
  entrance: Entrance;
  pos: Pos;
  emphasize?: boolean;
  glow?: boolean;
}

const PART1_CAPS: CapDef[] = [
  {
    key: "p1-open",
    text: "But wait. What does it really mean to add random noise?",
    tone: "question",
    entrance: "top",
    pos: { top: "0%", left: "50%", maxWidth: "22rem", rotate: -1 },
    emphasize: true,
  },
  {
    key: "p1-lazy",
    text: "Let us try the laziest idea first. Pick any value, completely at random.",
    tone: "cream",
    entrance: "left",
    pos: { top: "16%", left: "1%", maxWidth: "15rem", rotate: -3 },
  },
  {
    key: "p1-uniform",
    text: "This flat line is called a uniform distribution. Every value is equally likely.",
    tone: "indigo",
    entrance: "right",
    pos: { top: "14%", right: "1%", maxWidth: "16rem", rotate: 2 },
  },
  {
    key: "p1-42-7-91",
    text: "So one person asks and gets 42. The next gets 7. The next gets 91.",
    tone: "cream",
    entrance: "bottom",
    pos: { bottom: "2%", left: "50%", maxWidth: "22rem", rotate: 1 },
  },
];

const PART3_CAPS: CapDef[] = [
  {
    key: "p3-shape",
    text: "So we shape the noise instead. We make values near the truth much more likely, and far away values rare.",
    tone: "indigo",
    entrance: "left",
    pos: { top: "0%", left: "1%", maxWidth: "17rem", rotate: -2 },
    emphasize: true,
  },
  {
    key: "p3-peak",
    text: "Now the peak sits right on the truth, 42.",
    tone: "cream",
    entrance: "top",
    pos: { top: "2%", right: "1%", maxWidth: "14rem", rotate: 2 },
  },
  {
    key: "p3-close",
    text: "The system usually returns something close to 42, and only rarely drifts far.",
    tone: "cream",
    entrance: "bottom",
    pos: { bottom: "2%", left: "50%", maxWidth: "22rem", rotate: -1 },
  },
];

const PART4_CAPS: CapDef[] = [
  {
    key: "p4-catch",
    text: "But here is the catch. How wide should this curve be?",
    tone: "cream",
    entrance: "left",
    pos: { top: "4%", left: "1%", maxWidth: "16rem", rotate: -2 },
  },
  {
    key: "p4-final",
    text: "This is a huge range. Narrow or wide? Which one do we pick, and how do we even decide?",
    tone: "focus",
    entrance: "pop",
    pos: { bottom: "4%", left: "50%", maxWidth: "26rem", rotate: 0 },
    emphasize: true,
    glow: true,
  },
];

/* ---------- Part wrapper: pinned stage + captions reveal one-by-one ---------- */

function Part({
  title,
  captions,
  phase,
  showResearcher,
  onBridge,
  bridge,
  stageMinH = 420,
}: {
  title?: string;
  captions: CapDef[];
  phase: "uniform" | "morphing" | "laplace" | "widths";
  showResearcher?: boolean;
  bridge?: string;
  onBridge?: () => void;
  stageMinH?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.35 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (step >= captions.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 400 : 1400);
    return () => clearTimeout(t);
  }, [inView, step, captions.length]);

  const shown = captions.slice(0, step);

  return (
    <div ref={rootRef} className="w-full">
      {title && (
        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase mb-4"
        >
          {title}
        </motion.h3>
      )}
      {bridge && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center font-serif text-lg text-muted-foreground max-w-2xl mx-auto mb-6"
        >
          {bridge}
        </motion.p>
      )}

      {/* Desktop stage */}
      <div className="relative hidden md:block mx-auto max-w-5xl" style={{ minHeight: stageMinH }}>
        {/* central curve */}
        <div className="absolute inset-x-0 top-[30%] px-8">
          {inView && <MorphCurve phase={phase} />}
        </div>
        {/* researcher block (Part 2 uses this) */}
        {showResearcher && (
          <div className="absolute left-[6%] top-[6%]">
            <ResearcherAside show={inView} />
          </div>
        )}
        <AnimatePresence>
          {shown.map((c) => (
            <CaptionBox
              key={c.key}
              text={c.text}
              tone={c.tone}
              entrance={c.entrance}
              pos={c.pos}
              emphasize={c.emphasize}
              glow={c.glow}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile stacked */}
      <div className="md:hidden flex flex-col items-center gap-4">
        {showResearcher && <ResearcherAside show={inView} />}
        {inView && (
          <div className="w-full">
            <MorphCurve phase={phase} />
          </div>
        )}
        {shown.map((c) => (
          <CaptionBox key={c.key} text={c.text} tone={c.tone} entrance={c.entrance} pos={{ maxWidth: c.pos.maxWidth }} emphasize={c.emphasize} glow={c.glow} mobile />
        ))}
      </div>
    </div>
  );
}

/* ---------- Simple researcher-only mini part (Part 2) ---------- */

function Part2Researcher() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.3 });
  return (
    <div ref={rootRef} className="max-w-4xl mx-auto flex flex-col items-center gap-5 py-6">
      <ResearcherAside show={inView} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 2.6, duration: 0.6 }}
      >
        <CaptionBox
          text="He has a point. When every value is equally likely, the answer means nothing."
          tone="indigo"
          entrance="pop"
          pos={{ maxWidth: "28rem" }}
          emphasize
          mobile
        />
      </motion.div>
    </div>
  );
}

/* ---------- Main export ---------- */

export function UniformToLaplaceScene() {
  return (
    <div className="w-full px-4 sm:px-6 py-6 sm:py-10 space-y-14">
      {/* PART 1 */}
      <Part
        title="Part 1 — What if the noise was totally random?"
        captions={PART1_CAPS}
        phase="uniform"
        stageMinH={460}
      />

      {/* PART 2 */}
      <div>
        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase mb-4"
        >
          Part 2 — Bring in the researcher
        </motion.h3>
        <Part2Researcher />
      </div>

      {/* PART 3 — the morph */}
      <Part
        title="Part 3 — Shape the noise"
        captions={PART3_CAPS}
        phase="laplace"
        stageMinH={460}
      />

      {/* PART 4 — width motivation */}
      <Part
        title="Part 4 — How wide should it be?"
        captions={PART4_CAPS}
        phase="widths"
        stageMinH={480}
      />
    </div>
  );
}
