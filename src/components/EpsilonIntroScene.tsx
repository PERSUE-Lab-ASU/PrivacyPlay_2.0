import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { laplacePdf } from "@/lib/dp";

/* ---------- caption box (comic style, matches UniformToLaplaceScene) ---------- */

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
  text: React.ReactNode;
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
      className={`rounded-xl border-2 px-4 py-2.5 shadow-[4px_5px_0_0_hsl(var(--ink)/0.15)] ${toneClasses(tone)} ${mobile ? "mx-auto" : ""} ${glow ? "ring-4 ring-primary/30 animate-pulse" : ""}`}
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

/* ---------- breathing curve ---------- */

const W = 620;
const H = 240;
const PAD_L = 40;
const PAD_R = 20;
const PAD_T = 24;
const PAD_B = 40;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const X_MIN = 0;
const X_MAX = 100;

function pathFor(b: number) {
  const N = 160;
  const mu = 42;
  const peak = laplacePdf(mu, mu, b);
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + (i / N) * (X_MAX - X_MIN);
    const y = laplacePdf(x, mu, b);
    const py = PAD_T + PLOT_H - (y / peak) * (PLOT_H - 6);
    const px = PAD_L + (i / N) * PLOT_W;
    pts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return pts.join(" ");
}

function BreathingCurve({ b, label }: { b: number; label: string }) {
  const axisY = PAD_T + PLOT_H;
  const peakX = PAD_L + ((42 - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
  const d = pathFor(b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={PAD_L} y1={axisY} x2={PAD_L + PLOT_W} y2={axisY} stroke="var(--color-rule)" strokeWidth={1} />
      <line x1={peakX} y1={axisY} x2={peakX} y2={axisY + 6} stroke="var(--color-primary)" strokeWidth={1.5} />
      <text x={peakX} y={axisY + 20} textAnchor="middle" fontSize={12} fontFamily="var(--font-mono)" className="fill-primary" style={{ fontWeight: 700 }}>
        42
      </text>
      <text x={peakX} y={axisY + 34} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" className="fill-muted-foreground">
        the truth
      </text>
      <motion.path
        d={d}
        animate={{ d }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        fill="var(--color-primary)"
        opacity={0.12}
      />
      <motion.path
        d={d}
        animate={{ d }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* live b badge */}
      <g>
        <rect x={W - PAD_R - 130} y={PAD_T - 4} width={124} height={34} rx={8} fill="var(--color-paper)" stroke="var(--color-primary)" strokeWidth={1.5} />
        <text x={W - PAD_R - 68} y={PAD_T + 10} fontSize={9} fontFamily="var(--font-mono)" textAnchor="middle" className="fill-muted-foreground" style={{ letterSpacing: 1 }}>
          ε — EPSILON
        </text>
        <text x={W - PAD_R - 68} y={PAD_T + 24} fontSize={13} fontFamily="var(--font-mono)" textAnchor="middle" className="fill-primary" style={{ fontWeight: 700 }}>
          {label}
        </text>
      </g>
    </svg>
  );
}

/* ---------- function notation: f(Q) = Q' → f(Q, ε) = Q' ---------- */

function FunctionNotation({ withEpsilon }: { withEpsilon: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 font-serif text-3xl sm:text-4xl text-ink select-none">
      <span>f(</span>
      <span className="text-primary italic">Q</span>
      <AnimatePresence initial={false}>
        {withEpsilon && (
          <motion.span
            key="eps-piece"
            initial={{ opacity: 0, x: 40, scale: 0.4, rotate: -12 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, x: 40, scale: 0.4 }}
            transition={{ type: "spring", bounce: 0.45, duration: 0.9 }}
            className="flex items-center gap-1"
          >
            <span>,</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.4, repeat: 2 }}
              className="text-secondary font-semibold"
            >
              ε
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
      <span>) =</span>
      <span className="italic text-primary">Q&prime;</span>
    </div>
  );
}

/* ---------- Beats ---------- */

interface CapDef {
  key: string;
  text: React.ReactNode;
  tone: Tone;
  entrance: Entrance;
  pos: Pos;
  emphasize?: boolean;
  glow?: boolean;
}

const ACT1_CAPS: CapDef[] = [
  {
    key: "a1-good",
    text: "Good news. There is a single knob that controls all of this.",
    tone: "cream",
    entrance: "left",
    pos: { top: "6%", left: "2%", maxWidth: "16rem", rotate: -3 },
  },
  {
    key: "a1-decides",
    text: "It decides how narrow or how wide the curve gets.",
    tone: "cream",
    entrance: "right",
    pos: { top: "8%", right: "2%", maxWidth: "16rem", rotate: 2 },
  },
  {
    key: "a1-name",
    text: (
      <>
        It is called <span className="font-semibold text-secondary">epsilon</span>.
      </>
    ),
    tone: "focus",
    entrance: "pop",
    pos: { bottom: "6%", left: "50%", maxWidth: "22rem", rotate: 0 },
    emphasize: true,
    glow: true,
  },
];

const ACT2_CAPS: CapDef[] = [
  {
    key: "a2-note",
    text: "Now our noise function takes one more thing. Epsilon.",
    tone: "indigo",
    entrance: "bottom",
    pos: { bottom: "6%", left: "50%", maxWidth: "24rem", rotate: -1 },
    emphasize: true,
  },
];

const ACT3_CAPS: CapDef[] = [
  {
    key: "a3-best",
    text: "And here is the best part. Epsilon is yours to choose.",
    tone: "cream",
    entrance: "top",
    pos: { top: "2%", left: "50%", maxWidth: "24rem", rotate: -1 },
    emphasize: true,
  },
  {
    key: "a3-you",
    text: "You decide how noisy or how accurate the answers should be.",
    tone: "cream",
    entrance: "left",
    pos: { top: "20%", left: "1%", maxWidth: "15rem", rotate: -3 },
  },
  {
    key: "a3-narrow",
    text: "Turn epsilon one way, the curve gets narrow. Answers stay close to the truth. More accurate.",
    tone: "indigo",
    entrance: "left",
    pos: { bottom: "18%", left: "1%", maxWidth: "17rem", rotate: -2 },
  },
  {
    key: "a3-wide",
    text: "Turn it the other way, the curve gets wide. Answers spread out. More private.",
    tone: "cream",
    entrance: "right",
    pos: { bottom: "18%", right: "1%", maxWidth: "17rem", rotate: 3 },
  },
  {
    key: "a3-final",
    text: "So epsilon is your dial. It is the balance between privacy and accuracy, and you get to set it.",
    tone: "focus",
    entrance: "pop",
    pos: { bottom: "1%", left: "50%", maxWidth: "30rem", rotate: 0 },
    emphasize: true,
    glow: true,
  },
];

/* ---------- Act wrappers ---------- */

function Act1() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (step >= ACT1_CAPS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 400 : 1500);
    return () => clearTimeout(t);
  }, [inView, step]);
  const shown = ACT1_CAPS.slice(0, step);

  return (
    <div ref={ref} className="w-full">
      <div className="relative hidden md:block mx-auto max-w-5xl" style={{ minHeight: 360 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.7, type: "spring", bounce: 0.4 }}
            className="relative"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-40 h-40 rounded-full border-[10px] border-primary bg-paper flex items-center justify-center shadow-xl relative"
            >
              <div className="absolute inset-4 rounded-full border-2 border-dashed border-primary/40" />
              <span className="font-serif text-6xl text-secondary font-bold">ε</span>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-6 bg-primary rounded-full" />
            </motion.div>
            <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              the one knob
            </div>
          </motion.div>
        </div>
        <AnimatePresence>
          {shown.map((c) => (
            <CaptionBox key={c.key} text={c.text} tone={c.tone} entrance={c.entrance} pos={c.pos} emphasize={c.emphasize} glow={c.glow} />
          ))}
        </AnimatePresence>
      </div>
      <div className="md:hidden flex flex-col items-center gap-4">
        <div className="w-32 h-32 rounded-full border-[8px] border-primary bg-paper flex items-center justify-center">
          <span className="font-serif text-5xl text-secondary font-bold">ε</span>
        </div>
        {shown.map((c) => (
          <CaptionBox key={c.key} text={c.text} tone={c.tone} entrance={c.entrance} pos={{ maxWidth: c.pos.maxWidth }} emphasize={c.emphasize} glow={c.glow} mobile />
        ))}
      </div>
    </div>
  );
}

function Act2() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const [withEps, setWithEps] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setWithEps(true), 1400);
    const t2 = setTimeout(() => setShowCaption(true), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView]);

  return (
    <div ref={ref} className="w-full">
      <div className="relative hidden md:block mx-auto max-w-5xl" style={{ minHeight: 280 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="rounded-2xl border-2 border-primary/40 bg-paper px-10 py-8 shadow-[6px_7px_0_0_hsl(var(--ink)/0.12)]">
            <FunctionNotation withEpsilon={withEps} />
          </div>
        </motion.div>
        <AnimatePresence>
          {showCaption &&
            ACT2_CAPS.map((c) => (
              <CaptionBox key={c.key} text={c.text} tone={c.tone} entrance={c.entrance} pos={c.pos} emphasize={c.emphasize} glow={c.glow} />
            ))}
        </AnimatePresence>
      </div>
      <div className="md:hidden flex flex-col items-center gap-4">
        <div className="rounded-2xl border-2 border-primary/40 bg-paper px-6 py-5">
          <FunctionNotation withEpsilon={withEps} />
        </div>
        {showCaption &&
          ACT2_CAPS.map((c) => (
            <CaptionBox key={c.key} text={c.text} tone={c.tone} entrance={c.entrance} pos={{ maxWidth: c.pos.maxWidth }} emphasize={c.emphasize} glow={c.glow} mobile />
          ))}
      </div>
    </div>
  );
}

const EPS_CYCLE = [
  { eps: 2.5, label: "2.5", note: "narrow — accurate" },
  { eps: 1.0, label: "1.0", note: "medium" },
  { eps: 0.3, label: "0.3", note: "wide — private" },
  { eps: 1.0, label: "1.0", note: "medium" },
];

function Act3() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const [step, setStep] = useState(0);
  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (step >= ACT3_CAPS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 500 : 1800);
    return () => clearTimeout(t);
  }, [inView, step]);

  useEffect(() => {
    if (!inView) return;
    const iv = setInterval(() => setCycleIdx((i) => (i + 1) % EPS_CYCLE.length), 1900);
    return () => clearInterval(iv);
  }, [inView]);

  const shown = ACT3_CAPS.slice(0, step);
  const current = EPS_CYCLE[cycleIdx];
  const b = 1 / current.eps;

  return (
    <div ref={ref} className="w-full">
      <div className="relative hidden md:block mx-auto max-w-5xl" style={{ minHeight: 520 }}>
        <div className="absolute inset-x-0 top-[22%] px-16">
          {inView && <BreathingCurve b={b} label={`${current.label} · ${current.note}`} />}
        </div>
        <AnimatePresence>
          {shown.map((c) => (
            <CaptionBox key={c.key} text={c.text} tone={c.tone} entrance={c.entrance} pos={c.pos} emphasize={c.emphasize} glow={c.glow} />
          ))}
        </AnimatePresence>
      </div>
      <div className="md:hidden flex flex-col items-center gap-4">
        {inView && (
          <div className="w-full">
            <BreathingCurve b={b} label={`${current.label} · ${current.note}`} />
          </div>
        )}
        {shown.map((c) => (
          <CaptionBox key={c.key} text={c.text} tone={c.tone} entrance={c.entrance} pos={{ maxWidth: c.pos.maxWidth }} emphasize={c.emphasize} glow={c.glow} mobile />
        ))}
      </div>
    </div>
  );
}

/* ---------- main export ---------- */

export function EpsilonIntroScene() {
  return (
    <div className="w-full px-4 sm:px-6 py-6 sm:py-8 space-y-16">
      <div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase mb-4"
        >
          Act 1 — Meet the knob
        </motion.h3>
        <Act1 />
      </div>
      <div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase mb-4"
        >
          Act 2 — The function grows up
        </motion.h3>
        <Act2 />
      </div>
      <div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase mb-4"
        >
          Act 3 — Your dial
        </motion.h3>
        <Act3 />
      </div>
    </div>
  );
}
