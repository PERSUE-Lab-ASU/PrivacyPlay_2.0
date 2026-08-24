import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LaplaceCurve } from "@/components/LaplaceCurve";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useTelemetry } from "@/hooks/useTelemetry";
import { laplace } from "@/lib/dp";
import { ArrowDown, RefreshCw, User } from "lucide-react";
import { TrueAnswerReveal, EpsilonReveal } from "@/components/TutorialScenes";
import { TwoCurvesShowdown } from "@/components/TwoCurvesShowdown";
import { CompositionScene } from "@/components/CompositionScene";
import { UniformToLaplaceScene } from "@/components/UniformToLaplaceScene";
import { EpsilonIntroScene } from "@/components/EpsilonIntroScene";
import { SectionHeader } from "@/components/sections/SectionHeader";


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


/** Animated noise drips into a true answer to make a noisy answer. */
function NoiseDrip({ trueValue, scale }: { trueValue: number; scale: number }) {
  const [samples, setSamples] = useState<number[]>([]);

  useEffect(() => {
    setSamples([]);
    const iv = setInterval(() => {
      setSamples((prev) => {
        if (prev.length >= 6) { clearInterval(iv); return prev; }
        return [...prev, trueValue + laplace(scale)];
      });
    }, 700);
    return () => clearInterval(iv);
  }, [trueValue, scale]);

  return (
    <div className="rounded-2xl bg-paper border border-rule p-5">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">True answer</span>
        <span className="font-serif text-3xl text-muted-foreground">{trueValue}</span>
      </div>
      <div className="h-px bg-rule my-3" />
      <div className="font-mono text-[10px] uppercase tracking-wider text-primary mb-3">Noisy answers shown to the world</div>
      <div className="grid grid-cols-3 gap-2 min-h-[80px]">
        <AnimatePresence>
          {samples.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: -10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }} className="rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 text-center font-serif text-xl text-primary">
              {Math.round(s)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ===========================================================================
   ANIMATED LAPLACE — auto-cycles b through 4 values so the curve breathes
   =========================================================================== */
const CYCLE_VALUES = [0.6, 1.5, 3, 6];

function AnimatedLaplaceDemo() {
  const [idx, setIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setActive(e.isIntersecting),
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => setIdx((i) => (i + 1) % CYCLE_VALUES.length), 2200);
    return () => clearInterval(iv);
  }, [active]);

  const b = CYCLE_VALUES[idx];
  const widthLabel = b <= 1 ? "narrow" : b <= 2 ? "medium" : b <= 4 ? "wide" : "very wide";

  return (
    <div ref={containerRef} className="rounded-2xl border border-rule bg-paper p-6 shadow-md">
      <div className="grid lg:grid-cols-[1fr_220px] gap-6 items-center">
        <LaplaceCurve mu={42} b={b} height={260} domain={[28, 56]} liveBadge={{ label: "noise scale b", value: b.toFixed(1), color: "primary" }} />
        {/* dial */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-center">noise dial — turning…</div>
          <div className="flex justify-center gap-2">
            {CYCLE_VALUES.map((v, i) => (
              <motion.button
                key={v}
                onClick={() => setIdx(i)}
                animate={{ scale: i === idx ? 1.15 : 1, opacity: i === idx ? 1 : 0.5 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className={`w-12 h-12 rounded-full font-mono font-bold text-sm border-2 ${i === idx ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/40" : "bg-paper text-muted-foreground border-rule"}`}
              >
                {v}
              </motion.button>
            ))}
          </div>
          <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="font-serif text-lg text-ink">curve is <span className="text-primary font-semibold">{widthLabel}</span></div>
            <div className="text-xs text-muted-foreground mt-1">small b → answers near the truth · large b → answers far away</div>
          </motion.div>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4 italic">
        Watch the shape breathe. The peak stays on the true answer. Only the width changes.
      </p>
    </div>
  );
}

/* ===========================================================================
   DELTA JOURNEY — fully animated, scroll-triggered explainer.
   Title → Question 1 (narrow) → divider → Question 2 (wide) → compare → slider.
   =========================================================================== */

/* ===========================================================================
   PROBLEM: wide curve is too noisy. Let's introduce epsilon to fix it.
   =========================================================================== */




/* ===========================================================================
   PROBLEM: wide curve is too noisy. Let's introduce epsilon to fix it.
   =========================================================================== */
function EpsilonRescue({ log }: { log: (k: string, d?: Record<string, unknown>) => void }) {
  const [epsilon, setEpsilon] = useState(0.5);
  const delta = 1; // count queries: one person can change the count by 1
  const b = delta / epsilon;
  const mu = 42;
  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-paper p-6 shadow-lg">
      <div className="grid lg:grid-cols-[1fr,300px] gap-6 items-center">
        <div>
          <LaplaceCurve mu={mu} b={b} height={240} showTrueMark liveBadge={{ label: "b = Δ/ε", value: b.toFixed(1), color: "primary" }} />
        </div>
        <div className="space-y-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">ε — epsilon, your dial</div>
            <p className="text-sm text-ink leading-snug">
              Delta is fixed by the question. Epsilon is <span className="text-primary font-semibold">your choice.</span>
              Turn it up to make the curve narrow again, at the cost of privacy.
            </p>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">ε</label>
              <span className="font-serif text-3xl text-primary"><AnimatedNumber value={epsilon} decimals={2} /></span>
            </div>
            <input type="range" min={0.1} max={5} step={0.05} value={epsilon}
              onChange={(e) => { setEpsilon(parseFloat(e.target.value)); log("rescue_eps_change", { epsilon: parseFloat(e.target.value) }); }}
              className="w-full accent-primary" />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1">
              <span>more privacy</span><span>more accuracy</span>
            </div>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Δ (fixed)</span><span className="font-mono">{delta}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ε (yours)</span><span className="font-mono">{epsilon.toFixed(2)}</span></div>
            <div className="flex justify-between text-primary"><span>noise scale b = Δ / ε</span><span className="font-mono">{b.toFixed(1)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   INTERACTIVE: click the plot, sample a point, see it pop on the Laplace curve
   =========================================================================== */
function NoisyClickPlot({ log }: { log: (k: string, d?: Record<string, unknown>) => void }) {
  const [samples, setSamples] = useState<{ x: number; idx: number }[]>([]);
  const [popup, setPopup] = useState<{ id: number; val: number } | null>(null);
  const trueValue = 42;
  const epsilon = 0.8;
  const b = 1 / epsilon;
  const idRef = useRef(0);

  const draw = () => {
    const x = trueValue + laplace(b);
    const rounded = Math.round(x);
    const id = ++idRef.current;
    setSamples((s) => [...s, { x, idx: id }]);
    setPopup({ id, val: rounded });
    log("noisy_click_sample", { value: rounded });
    setTimeout(() => setPopup((p) => (p && p.id === id ? null : p)), 2200);
  };

  const reset = () => { setSamples([]); setPopup(null); };

  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-paper p-6 shadow-lg relative">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Click to ask the system. Each click = one noisy answer.</div>
        <button onClick={reset} className="text-muted-foreground hover:text-ink" title="reset"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <div
        onClick={draw}
        className="cursor-pointer rounded-xl bg-background/50 border border-rule p-3 hover:bg-primary/5 transition relative"
      >
        <LaplaceCurve mu={trueValue} b={b} samples={samples.map(s => s.x)} height={260} liveBadge={{ label: "samples", value: samples.length, color: "danger" }} />
        <AnimatePresence>
          {popup && (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, scale: 0.4, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, scale: 0.7 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
              className="absolute left-1/2 -translate-x-1/2 top-6 z-20 px-6 py-3 rounded-2xl bg-danger text-paper shadow-2xl border-2 border-paper"
            >
              <div className="font-mono text-[10px] uppercase opacity-80">noisy answer</div>
              <div className="font-serif text-5xl font-bold leading-none">{popup.val}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-4 flex items-baseline justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">
          <span className="font-mono">true count = 42</span> · count queries are integers, so noisy answers are rounded.
        </div>
        <div className="text-sm font-mono">{samples.length} answer{samples.length === 1 ? "" : "s"} so far</div>
      </div>
      {samples.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {samples.slice(-12).map((s) => (
            <span key={s.idx} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 font-mono text-sm text-primary">
              {Math.round(s.x)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===========================================================================
   20 RESEARCHERS — narrow vs wide. Same question, twenty askers.
   =========================================================================== */
function TwentyResearchers({ log }: { log: (k: string, d?: Record<string, unknown>) => void }) {
  const [mode, setMode] = useState<"narrow" | "wide">("narrow");
  const trueValue = 42;
  const epsilon = mode === "narrow" ? 2 : 0.3;
  const b = 1 / epsilon;

  const [samples, setSamples] = useState<number[]>([]);
  useEffect(() => {
    setSamples(Array.from({ length: 20 }, () => Math.round(trueValue + laplace(b))));
  }, [mode, b]);


  const min = samples.length ? Math.min(...samples) : 0;
  const max = samples.length ? Math.max(...samples) : 0;
  const spread = max - min;

  return (
    <div className="rounded-2xl border-2 border-rule bg-paper p-6 shadow-lg space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => { setMode("narrow"); log("twenty_mode", { mode: "narrow" }); }}
          className={`rounded-xl p-4 border-2 text-left transition ${mode === "narrow" ? "border-primary bg-primary/5 shadow-md" : "border-rule hover:border-primary/40"}`}
        >
          <div className="font-serif text-lg">Narrow curve</div>
          <div className="text-xs text-muted-foreground mt-1">Less noise. Answers cluster tightly around 42.</div>
        </button>
        <button
          onClick={() => { setMode("wide"); log("twenty_mode", { mode: "wide" }); }}
          className={`rounded-xl p-4 border-2 text-left transition ${mode === "wide" ? "border-danger bg-danger/5 shadow-md" : "border-rule hover:border-danger/40"}`}
        >
          <div className="font-serif text-lg">Wide curve</div>
          <div className="text-xs text-muted-foreground mt-1">More noise. Answers scatter far from 42.</div>
        </button>
      </div>

      <div className="rounded-xl border border-rule bg-background/50 p-3">
        <LaplaceCurve
          mu={trueValue}
          b={b}
          samples={samples}
          height={220}
          liveBadge={{ label: "ε epsilon", value: epsilon.toFixed(1), color: mode === "narrow" ? "primary" : "danger" }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">20 different researchers, same question</div>
          <div className="font-mono text-xs">spread: <span className={mode === "narrow" ? "text-primary" : "text-danger"}>{spread}</span></div>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 min-h-[68px]">
          {samples.map((v, i) => (
            <motion.div
              key={`${mode}-${i}`}
              initial={{ opacity: 0, scale: 0.4, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", bounce: 0.4 }}
              className="flex flex-col items-center"
            >
              <User className={`w-6 h-6 ${mode === "narrow" ? "text-primary" : "text-danger"}`} />
              <span className="mt-1 font-mono text-xs">{v}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.p
        key={mode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-serif text-lg text-ink"
      >
        {mode === "narrow"
          ? "Twenty researchers asked the same question and got nearly the same answer. The system is precise but spends privacy fast."
          : "Twenty researchers asked the same question and got wildly different answers. Privacy is strong, but trust is hard."}
      </motion.p>
    </div>
  );
}


/* =========================================================================== */

export default function Stage2Tutorial({ onContinue }: { onContinue: () => void }) {
  const { log } = useTelemetry("tutorial");
  useEffect(() => { log("page_enter", {}); }, [log]);

  return (
    <div className="bg-background">
      <SectionHeader num="08" title="The Fix" subtitle="Blur the answer, not the data." anchorId="the-fix" />
      {/* The fix */}
      <Beat>
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">The fix</div>
          <h2 className="font-serif text-5xl text-ink leading-tight">
            Building the noise <span className="italic text-primary">Q&prime;</span>
          </h2>
          <Caption className="!text-xl text-muted-foreground">
            Not random. Not broken. Just blurred enough to hide any single row.
          </Caption>
        </div>
      </Beat>

      {/* Cinematic true-answer reveal — compact wrapper so graph + table fit on one screen */}
      <section className="pt-1 pb-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <TrueAnswerReveal />
        </div>
      </section>


      <SectionHeader num="09" title="The Noise Has a Shape" subtitle="The shape we just saw is called the Laplace curve." anchorId="the-noise-has-a-shape" hideNum />

      {/* From uniform to Laplace — comic-style morph */}
      <Beat>
        <UniformToLaplaceScene />
      </Beat>

      <SectionHeader num="10" title="The Noise Dial" subtitle="Turning the width up and down." anchorId="the-noise-dial" />
      <Beat>
        <EpsilonIntroScene />
      </Beat>
      <Beat>
        <AnimatedLaplaceDemo />
      </Beat>

      <SectionHeader num="11" title="Narrow and Wide" subtitle="Two settings. Two worlds." anchorId="narrow-and-wide" />
      {/* Three curves: wide, balanced (revealed last), narrow */}
      <Beat>
        <TwoCurvesShowdown log={log} />
      </Beat>

      <SectionHeader num="13" title="Meet Epsilon (ε): Your Dial" subtitle="Your dial." anchorId="meet-epsilon" />
      {/* Epsilon — 3-act reveal */}
      <Beat>
        <EpsilonReveal log={log} />
      </Beat>



      <SectionHeader num="14" title="Composition" subtitle="Every ask leaks a little." anchorId="composition" />
      {/* Composition Theorem — sequential composition */}
      <Beat>
        <CompositionScene log={log} />
      </Beat>




      <SectionHeader num="15" title="What You Know Now" subtitle="The whole toolkit." anchorId="what-you-know-now" />
      {/* Ending */}
      <Beat>
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <Caption className="!text-4xl">You now know everything you need.</Caption>
          <Caption className="!text-xl text-muted-foreground">
            Δ is set by the question. ε is your choice. Every answer comes from the Laplace curve.
          </Caption>
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { log("tutorial_complete", {}); onContinue(); }}
            className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/20"
          >
            Let me try it <ArrowDown className="w-4 h-4" />
          </motion.button>
        </div>
      </Beat>
    </div>
  );
}
