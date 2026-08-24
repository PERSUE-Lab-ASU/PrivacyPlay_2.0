import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LaplaceCurve } from "@/components/LaplaceCurve";
import { PopBubble, holdMsForText } from "@/components/PopBubble";
import { laplace } from "@/lib/dp";

type LogFn = (k: string, d?: Record<string, unknown>) => void;

type Bubble = { text: string; big?: boolean };

async function playBubbles(
  list: Bubble[],
  setBubble: (b: Bubble | null) => void,
  signal: { cancelled: boolean },
) {
  for (const b of list) {
    if (signal.cancelled) return;
    setBubble(b);
    await new Promise((r) => setTimeout(r, 400 + holdMsForText(b.text)));
    if (signal.cancelled) return;
    setBubble(null);
    await new Promise((r) => setTimeout(r, 400));
  }
}

const TRUE = 42;
const DOMAIN: [number, number] = [28, 56];

function CurveTile({
  epsilon,
  sample,
  label,
  compact,
}: {
  epsilon: number;
  sample: number | null;
  label: string;
  compact?: boolean;
}) {
  const b = 1 / epsilon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 160, damping: 22 }}
      className="rounded-xl border border-rule bg-background/50 p-2 flex flex-col items-center"
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-primary mb-1">{label}</div>
      <LaplaceCurve
        mu={TRUE}
        b={b}
        domain={DOMAIN}
        height={compact ? 130 : 190}
        width={compact ? 240 : 380}
        samples={sample != null ? [sample] : []}
        showAxes={!compact}
      />
      {sample != null && (
        <motion.div
          key={sample}
          initial={{ opacity: 0, y: -6, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mt-1 font-serif text-lg text-danger"
        >
          {Math.round(sample)}
        </motion.div>
      )}
    </motion.div>
  );
}

export function CompositionScene({ log }: { log: LogFn }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [beat, setBeat] = useState(0); // 0..7
  const [bubble, setBubble] = useState<Bubble | null>(null);

  // beat state
  const [curveCount, setCurveCount] = useState(1); // 1 in beat1, 2 in beat2/3/4/5
  const [perAskEps, setPerAskEps] = useState(1); // 1 in beat1-3, drops to 0.5 in beat5
  const [totalLabel, setTotalLabel] = useState("ε_total = 1");
  const [totalTone, setTotalTone] = useState<"ok" | "violated">("ok");
  const [samples, setSamples] = useState<(number | null)[]>([null]);

  // interactive slider (beat 6+)
  const [asks, setAsks] = useState(2);
  const [interactive, setInteractive] = useState(false);
  const [finished, setFinished] = useState(false);
  const dwellRef = useRef<number>(Date.now());

  // trigger on viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) { setStarted(true); log("composition_scene_enter"); } },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started, log]);

  // sequence
  useEffect(() => {
    if (!started) return;
    const signal = { cancelled: false };
    (async () => {
      // Opening
      await playBubbles(
        [
          { text: "One more thing about epsilon." },
          { text: "What if you ask more than once?" },
          { text: "Every ask leaks a little." },
          { text: "The leaks add up." },
        ],
        setBubble, signal,
      );
      if (signal.cancelled) return;

      // Beat 1 — single ask
      setBeat(1);
      setCurveCount(1);
      setPerAskEps(1);
      setSamples([TRUE + laplace(1)]);
      await playBubbles(
        [
          { text: "One ask. Epsilon of 1. Curve looks like this." },
          { text: "You promised the world your privacy leak stays under 1." },
          { text: "And it does. One ask, one leak of 1." },
        ],
        setBubble, signal,
      );
      if (signal.cancelled) return;

      // Beat 2 — add second ask, break promise
      setBeat(2);
      log("second_ask_triggered");
      setCurveCount(2);
      setSamples([TRUE + laplace(1), TRUE + laplace(1)]);
      setTotalLabel("ε_total = 2");
      setTotalTone("violated");
      log("promise_violation_shown");
      await playBubbles(
        [
          { text: "Two asks. Each leaks 1." },
          { text: "Total leak is now 2." },
          { text: "You promised 1. You broke your promise." },
        ],
        setBubble, signal,
      );
      if (signal.cancelled) return;

      // Beat 3 — sequential composition as bubbles
      setBeat(3);
      log("composition_theorem_revealed");
      await playBubbles(
        [
          { text: "This is called sequential composition." },
          { text: "Every ask you make on the same data adds up." },
          { text: "Ask once with a leak of 1." },
          { text: "Ask again with a leak of 1." },
          { text: "Your total leak is now 2." },
          { text: "Ask a third time with a leak of 1." },
          { text: "Your total leak is now 3." },
          { text: "The rule is simple. Add up every ask's epsilon. That is your total leak." },
        ],
        setBubble, signal,
      );
      if (signal.cancelled) return;

      // Beat 4 — restore promise, share budget as bubbles
      setBeat(4);
      log("per_ask_formula_revealed");
      setTotalLabel("ε_total = 1");
      setTotalTone("ok");
      await playBubbles(
        [
          { text: "So how do you keep your promise?" },
          { text: "First, decide the total leak you can live with." },
          { text: "Then share that budget across every ask." },
          { text: "Planning two asks? Give each half of your budget." },
          { text: "Planning three asks? Give each a third." },
          { text: "Planning ten asks? Give each a tenth." },
          { text: "The more asks you plan, the less each one gets." },
        ],
        setBubble, signal,
      );
      if (signal.cancelled) return;

      // Beat 5 — widen curves
      setBeat(5);
      log("curve_widening_animated");
      setPerAskEps(0.5);
      setSamples([TRUE + laplace(2), TRUE + laplace(2)]);
      await new Promise((r) => setTimeout(r, 800));
      await playBubbles(
        [
          { text: "Both curves got wider." },
          { text: "Because each ask now spends less epsilon." },
          { text: "The price of asking twice is more noise in every answer." },
        ],
        setBubble, signal,
      );
      if (signal.cancelled) return;

      // Beat 6 — interactive
      setBeat(6);
      setInteractive(true);
      setAsks(2);
      dwellRef.current = Date.now();
      await playBubbles(
        [
          { text: "Try planning more asks." },
          { text: "Watch what happens to each curve." },
        ],
        setBubble, signal,
      );
    })();
    return () => { signal.cancelled = true; };
  }, [started, log]);

  // Interactive sampling — resample every 2.4s
  useEffect(() => {
    if (!interactive) return;
    const b = asks / 1; // ε_total = 1
    const draw = () => setSamples(Array.from({ length: asks }, () => TRUE + laplace(b)));
    draw();
    const iv = setInterval(draw, 2400);
    return () => clearInterval(iv);
  }, [asks, interactive]);

  // Log slider changes with dwell time
  const onAsksChange = (n: number) => {
    if (n === asks) return;
    const dwell = Date.now() - dwellRef.current;
    log("asks_planned_change", { old: asks, new: n, dwell_ms: dwell });
    dwellRef.current = Date.now();
    setAsks(n);
    const eps = 1 / n;
    const sampled = Array.from({ length: n }, () => TRUE + laplace(n));
    log("sample_at_n_asks", { n, epsilon_per_ask: eps, sampled_values: sampled.map((v) => Math.round(v)) });
    if (n >= 10) {
      setBubble({ text: "Ten asks. You can barely read the truth." });
    } else if (n >= 5) {
      setBubble({ text: "Five asks. Now the noise is loud." });
    } else if (n >= 3) {
      setBubble({ text: "Three asks. Each curve gets wider. Answers less accurate." });
    }
  };

  const finish = async () => {
    setInteractive(false);
    setBeat(7);
    const signal = { cancelled: false };
    await playBubbles(
      [
        { text: "The more you plan to ask, the noisier every answer must be.", big: true },
        { text: "This is the price of your privacy promise." },
        { text: "You cannot ask forever. Your budget runs out." },
        { text: "That is why real systems limit how many questions you can ask." },
        { text: "Plan your asks. Split your budget. Live with the noise." },
      ],
      setBubble, signal,
    );
    setAsks(2);
    setFinished(true);
    log("composition_scene_complete");
  };

  // Displayed curves
  const displayedEps = interactive ? 1 / asks : perAskEps;
  const displayedCount = interactive ? asks : curveCount;
  const paddedSamples = useMemo(() => {
    const arr = [...samples];
    while (arr.length < displayedCount) arr.push(null);
    return arr.slice(0, displayedCount);
  }, [samples, displayedCount]);

  return (
    <div ref={containerRef} className="relative rounded-2xl border-2 border-primary/30 bg-paper p-6 shadow-lg min-h-[560px]">
      {/* Top row: title + guarantee box */}
      <div className="grid lg:grid-cols-[1fr_260px] gap-4 items-start mb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Composition</div>
          <h3 className="font-serif text-3xl text-ink leading-tight">
            Epsilon is a <span className="text-primary">total budget</span>, not a per-question dial.
          </h3>
        </div>
        <motion.div
          animate={totalTone === "violated" ? { backgroundColor: ["hsl(var(--danger)/0.15)", "hsl(var(--danger)/0.35)", "hsl(var(--danger)/0.15)"], borderColor: "hsl(var(--danger))" } : {}}
          transition={{ duration: 0.6, repeat: totalTone === "violated" ? 3 : 0 }}
          className={`rounded-xl border-2 p-3 ${totalTone === "violated" ? "border-danger" : "border-primary/40"}`}
        >
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {totalTone === "violated" ? "Total privacy leak" : "Total privacy guarantee"}
          </div>
          <div className={`font-serif text-2xl mt-1 ${totalTone === "violated" ? "text-danger" : "text-primary"}`}>{totalLabel}</div>
        </motion.div>
      </div>


      {/* Curves grid */}
      <div className="relative min-h-[240px] flex justify-center">
        <motion.div
          layout
          className={`grid gap-3 w-full ${displayedCount <= 2 ? "grid-cols-1 sm:grid-cols-2" : displayedCount <= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-5"}`}
        >
          <AnimatePresence>
            {paddedSamples.map((s, i) => (
              <CurveTile
                key={`c-${i}-${displayedCount}`}
                epsilon={displayedEps}
                sample={s}
                label={`ε = ${displayedEps.toFixed(displayedEps < 1 ? 2 : 0)}`}
                compact={displayedCount > 2}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Bubble overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <AnimatePresence>
            {bubble && (
              <PopBubble key={bubble.text} position="centered" size={bubble.big ? "lg" : "md"} variant="speech">
                {bubble.text}
              </PopBubble>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Asks counter / slider */}
      <div className="mt-5 rounded-xl bg-muted/40 p-4">
        {!interactive ? (
          <div className="text-sm font-mono text-muted-foreground text-center">
            asks planned: <span className="text-ink text-lg font-serif">{displayedCount}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">asks planned</label>
              <span className="font-serif text-2xl text-primary">{asks}</span>
            </div>
            <input
              type="range" min={1} max={10} step={1} value={asks}
              onChange={(e) => onAsksChange(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <span>each ask spends ε = <span className="text-primary">{(1 / asks).toFixed(2)}</span></span>
              <span>ε_total stays 1</span>
            </div>
            {!finished && (
              <div className="text-center mt-3">
                <button
                  onClick={finish}
                  className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
