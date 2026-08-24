import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";

interface ChangeTheAnswerProps {
  onContinue: () => void;
  log: (event_type: string, event_data?: Record<string, unknown>) => void;
}

type Entrance = "left" | "right" | "top" | "bottom" | "pop" | "drift";
type Tone = "cream" | "indigo" | "focus" | "question";

interface CaptionBeat {
  key: string;
  kind: "caption";
  text: string;
  entrance: Entrance;
  tone: Tone;
  // Desktop absolute placement (percent). Mobile falls back to natural flow.
  pos: { top?: string; bottom?: string; left?: string; right?: string; maxWidth?: string; rotate?: number };
}
interface VizBeat { key: string; kind: "viz" | "fn" }

type Beat = CaptionBeat | VizBeat;

const BEATS: Beat[] = [
  {
    key: "q",
    kind: "caption",
    text: "How many people have diabetes?",
    entrance: "top",
    tone: "question",
    pos: { top: "2%", left: "50%", maxWidth: "20rem", rotate: -1 },
  },
  {
    key: "b1",
    kind: "caption",
    text: "Say the real answer is 42.",
    entrance: "left",
    tone: "cream",
    pos: { top: "14%", left: "2%", maxWidth: "13rem", rotate: -3 },
  },
  {
    key: "b2",
    kind: "caption",
    text: "Instead of handing back exactly 42, we change it a little.",
    entrance: "right",
    tone: "cream",
    pos: { top: "12%", right: "2%", maxWidth: "15rem", rotate: 2 },
  },
  {
    key: "b3",
    kind: "caption",
    text: "But not randomly. A totally random answer would be useless.",
    entrance: "left",
    tone: "cream",
    pos: { top: "30%", left: "1%", maxWidth: "14rem", rotate: 2 },
  },
  {
    key: "b4",
    kind: "caption",
    text: "So we change it carefully. We add a small amount of noise.",
    entrance: "pop",
    tone: "indigo",
    pos: { top: "28%", right: "1%", maxWidth: "15rem", rotate: -2 },
  },
  { key: "viz", kind: "viz" },
  {
    key: "b5",
    kind: "caption",
    text: "We pick that noise from a probability distribution.",
    entrance: "left",
    tone: "cream",
    pos: { top: "54%", left: "1%", maxWidth: "14rem", rotate: -2 },
  },
  {
    key: "b6",
    kind: "caption",
    text: "A rule for which values are likely, which are rare.",
    entrance: "right",
    tone: "cream",
    pos: { top: "52%", right: "1%", maxWidth: "14rem", rotate: 3 },
  },
  {
    key: "b7",
    kind: "caption",
    text: "Small nudges near 42 are likely. Big jumps are rare.",
    entrance: "drift",
    tone: "indigo",
    pos: { top: "66%", left: "3%", maxWidth: "14rem", rotate: 2 },
  },
  {
    key: "b8",
    kind: "caption",
    text: "The system never returns the raw answer.",
    entrance: "right",
    tone: "cream",
    pos: { top: "68%", right: "3%", maxWidth: "14rem", rotate: -3 },
  },
  {
    key: "b9",
    kind: "caption",
    text: "It passes Q through a function f, and returns the changed version Q\u2032.",
    entrance: "pop",
    tone: "cream",
    pos: { top: "82%", left: "2%", maxWidth: "15rem", rotate: 2 },
  },
  { key: "fn", kind: "fn" },
  {
    key: "end",
    kind: "caption",
    text: "So how do we actually build this f?",
    entrance: "bottom",
    tone: "focus",
    pos: { bottom: "2%", right: "2%", maxWidth: "16rem", rotate: -1 },
  },
];

const BEAT_INTERVAL = 2200;

function entranceVariants(entrance: Entrance) {
  switch (entrance) {
    case "left":
      return {
        initial: { opacity: 0, x: -80, rotate: -8 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
      };
    case "right":
      return {
        initial: { opacity: 0, x: 80, rotate: 8 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
      };
    case "top":
      return {
        initial: { opacity: 0, y: -60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
      };
    case "bottom":
      return {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
      };
    case "pop":
      return {
        initial: { opacity: 0, scale: 0.5 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.5, type: "spring" as const, bounce: 0.55 },
      };
    case "drift":
    default:
      return {
        initial: { opacity: 0, y: 20, x: -10, filter: "blur(6px)" },
        animate: { opacity: 1, y: 0, x: 0, filter: "blur(0px)" },
        transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
      };
  }
}

function toneClasses(tone: Tone) {
  switch (tone) {
    case "indigo":
      return "bg-primary text-primary-foreground border-primary shadow-[4px_5px_0_0_hsl(var(--ink)/0.15)]";
    case "focus":
      return "bg-gradient-to-br from-primary to-secondary text-primary-foreground border-ink/20 shadow-[4px_5px_0_0_hsl(var(--ink)/0.2)]";
    case "question":
      return "bg-paper text-ink border-secondary shadow-[4px_5px_0_0_hsl(var(--ink)/0.15)]";
    case "cream":
    default:
      return "bg-[hsl(var(--paper))] text-ink border-primary/70 shadow-[4px_5px_0_0_hsl(var(--ink)/0.15)]";
  }
}

function CaptionBox({ beat, mobile }: { beat: CaptionBeat; mobile: boolean }) {
  const v = entranceVariants(beat.entrance);
  const tone = toneClasses(beat.tone);
  const rotate = beat.pos.rotate ?? 0;

  const style: React.CSSProperties = mobile
    ? { maxWidth: beat.pos.maxWidth ?? "22rem" }
    : {
        position: "absolute",
        top: beat.pos.top,
        bottom: beat.pos.bottom,
        left: beat.pos.left,
        right: beat.pos.right,
        maxWidth: beat.pos.maxWidth ?? "14rem",
        transform: beat.pos.left === "50%" ? "translateX(-50%)" : undefined,
      };

  const emphasized = beat.tone === "indigo" || beat.tone === "focus";

  return (
    <motion.div
      initial={v.initial}
      animate={{ ...v.animate, rotate }}
      transition={v.transition}
      style={style}
      className={`z-20 rounded-xl border-2 px-4 py-2.5 ${tone} ${mobile ? "mx-auto" : ""}`}
    >
      <p
        className={`font-serif leading-snug ${
          emphasized ? "text-[15px] sm:text-base font-semibold" : "text-sm sm:text-[15px]"
        }`}
      >
        {beat.text}
      </p>
    </motion.div>
  );
}

/** Simple "wobbling 42" visual. */
function NoiseVisual() {
  const samples = [42, 41, 43, 42, 44, 41, 42, 43];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % samples.length), 900);
    return () => clearInterval(t);
  }, []);
  const val = samples[idx];
  const particles = Array.from({ length: 8 });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      className="relative mx-auto h-40 w-full max-w-sm rounded-2xl bg-gradient-to-br from-primary/[0.06] to-secondary/[0.05] border border-rule overflow-hidden"
    >
      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
          initial={{ x: Math.random() * 300 - 150, y: Math.random() * 120 - 60, opacity: 0 }}
          animate={{
            x: [Math.random() * 300 - 150, 0, Math.random() * 300 - 150],
            y: [Math.random() * 120 - 60, 0, Math.random() * 120 - 60],
            opacity: [0, 0.9, 0],
          }}
          transition={{ duration: 2.4 + i * 0.2, repeat: Infinity, delay: i * 0.15 }}
          style={{ left: "50%", top: "50%" }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.35 }}
            className="font-serif text-6xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent"
          >
            {val}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute bottom-2 left-3 text-xs text-muted-foreground flex items-center gap-1">
        <Sparkles className="w-3 h-3" /> tiny nudges around 42
      </div>
    </motion.div>
  );
}

function FunctionBox() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
        <Symbol delay={0.1} value="Q" label="the true answer" tone="ink" />
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-2xl text-muted-foreground"
        >
          →
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.5, type: "spring", bounce: 0.4 }}
          className="relative"
        >
          <div className="px-5 py-3 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 border-2 border-primary/40 shadow-md">
            <div className="font-serif italic text-2xl text-primary">f</div>
          </div>
          <div className="mt-1 text-[11px] text-center text-muted-foreground">the noise function</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="text-2xl text-muted-foreground"
        >
          →
        </motion.div>
        <Symbol delay={1.6} value="Q\u2032" label="the noisy answer" tone="secondary" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.1, duration: 0.5 }}
        className="mt-4 text-center font-mono text-lg text-ink"
      >
        f(Q) = Q&prime;
      </motion.div>
    </motion.div>
  );
}

function Symbol({
  value,
  label,
  delay,
  tone,
}: {
  value: string;
  label: string;
  delay: number;
  tone: "ink" | "secondary";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: "spring", bounce: 0.3 }}
      className="flex flex-col items-center"
    >
      <div
        className={`px-4 py-2 rounded-lg border-2 font-serif text-2xl ${
          tone === "secondary"
            ? "border-secondary/40 bg-secondary/10 text-secondary"
            : "border-ink/20 bg-paper text-ink"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground max-w-[110px] text-center">{label}</div>
    </motion.div>
  );
}

export function ChangeTheAnswer({ onContinue, log }: ChangeTheAnswerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.2 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (step >= BEATS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 400 : BEAT_INTERVAL);
    return () => clearTimeout(t);
  }, [inView, step]);

  const handleContinue = () => {
    log("motivation_complete", {});
    onContinue();
  };

  const shown = BEATS.slice(0, step);
  const captions = shown.filter((b): b is CaptionBeat => b.kind === "caption");
  const showViz = shown.some((b) => b.key === "viz");
  const showFn = shown.some((b) => b.key === "fn");

  return (
    <div ref={rootRef} className="w-full px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-6xl mx-auto rounded-3xl border border-rule bg-gradient-to-br from-secondary/[0.05] via-paper to-primary/[0.04] p-6 sm:p-10 shadow-xl shadow-ink/5"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-secondary to-primary origin-center"
          />
          <div className="mt-3 text-[11px] tracking-[0.3em] text-muted-foreground">HOW WE CHANGE THE ANSWER</div>
        </div>

        {/* Desktop: comic page with absolute captions around central visuals */}
        <div className="relative hidden md:block" style={{ minHeight: "780px" }}>
          {/* Central column with visuals */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-full max-w-md flex flex-col items-center gap-6 pt-24">
            <div className="h-40 w-full">{showViz && <NoiseVisual />}</div>
            <div className="min-h-[180px] w-full flex items-center justify-center pt-24">
              {showFn && <FunctionBox />}
            </div>
          </div>

          <AnimatePresence>
            {captions.map((b) => (
              <CaptionBox key={b.key} beat={b} mobile={false} />
            ))}
          </AnimatePresence>
        </div>

        {/* Mobile: stacked flow */}
        <div className="md:hidden flex flex-col items-center gap-4">
          {shown.map((b) => {
            if (b.kind === "viz") return <NoiseVisual key={b.key} />;
            if (b.kind === "fn") return <FunctionBox key={b.key} />;
            return <CaptionBox key={b.key} beat={b as CaptionBeat} mobile />;
          })}
        </div>

        <div className="mt-8 flex justify-center">
          {step >= BEATS.length && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinue}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/20"
            >
              Build the fix <ArrowDown className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
