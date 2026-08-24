import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { laplace } from "@/lib/dp";
import { useIsMobile } from "@/hooks/use-mobile";

type LogFn = (event: string, data?: Record<string, unknown>) => void;

const DOMAIN: [number, number] = [30, 55];
const TRUE = 42;

// scales
const B_NARROW = 1 / 10;   // ε = 10
const B_WIDE = 1 / 0.5;    // ε = 0.5
const B_MID = 1 / 1;       // ε = 1
// shared y-scale = narrow peak (so contrast is honest)
const SHARED_PEAK = 1 / (2 * B_NARROW); // 5

function pdf(x: number, b: number) {
  return (1 / (2 * b)) * Math.exp(-Math.abs(x - TRUE) / b);
}

/* --------------------------- Compact curve panel --------------------------- */

type Sample = { id: number; x: number };

function CurveCard({
  b,
  color,
  label,
  sublabel,
  visible,
  samples,
  emphasize,
}: {
  b: number;
  color: "primary" | "danger" | "balanced";
  label: string;
  sublabel: string;
  visible: boolean;
  samples: Sample[];
  emphasize?: boolean;
}) {
  const W = 300, H = 150, padL = 24, padR = 14, padT = 12, padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xToPx = (x: number) => padL + ((x - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * plotW;
  const yToPx = (y: number) => padT + plotH - Math.min(1, y / SHARED_PEAK) * (plotH - 4);
  const axisY = padT + plotH;

  const path = useMemo(() => {
    const N = 160;
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const x = DOMAIN[0] + (i / N) * (DOMAIN[1] - DOMAIN[0]);
      const y = pdf(x, b);
      pts.push(`${i === 0 ? "M" : "L"} ${xToPx(x).toFixed(2)} ${yToPx(y).toFixed(2)}`);
    }
    return pts.join(" ");
  }, [b]);

  // Middle "balanced" curve gets a strong warm amber so it reads on cream paper.
  const BALANCED = "#b8791f";
  const stroke =
    color === "primary" ? "var(--color-primary)" :
    color === "danger" ? "var(--color-danger)" :
    BALANCED;

  const borderCls =
    color === "primary" ? "border-primary/50" :
    color === "danger" ? "border-danger/50" :
    "";
  const borderStyle: React.CSSProperties =
    color === "balanced" ? { borderColor: `${BALANCED}99` } : {};

  const labelStyle: React.CSSProperties =
    color === "balanced" ? { color: BALANCED } : {};
  const labelCls =
    color === "primary" ? "text-primary" :
    color === "danger" ? "text-danger" :
    "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.94 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.94 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-2xl border-2 ${borderCls} bg-paper p-3 shadow-lg ${emphasize ? "shadow-[#b8791f]/30 ring-2" : ""}`}
      style={{ ...borderStyle, ...(emphasize && color === "balanced" ? { boxShadow: `0 8px 24px -8px ${BALANCED}55` } : {}) } as React.CSSProperties}
    >
      <div className="flex items-baseline justify-between mb-1">
        <div>
          <div className={`font-mono text-[11px] uppercase tracking-widest ${labelCls} font-bold`} style={labelStyle}>{label}</div>
          <div className="font-serif text-[11px] text-muted-foreground italic">{sublabel}</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <line x1={padL} y1={axisY} x2={padL + plotW} y2={axisY} stroke="var(--color-rule)" />
        {[30, 35, 40, 45, 50, 55].map((t) => (
          <g key={t}>
            <line x1={xToPx(t)} y1={axisY} x2={xToPx(t)} y2={axisY + 3} stroke="var(--color-rule)" />
            <text x={xToPx(t)} y={axisY + 14} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" className="fill-muted-foreground">{t}</text>
          </g>
        ))}
        {/* true line */}
        <line x1={xToPx(TRUE)} x2={xToPx(TRUE)} y1={padT} y2={axisY} stroke={stroke} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.6} />
        {/* curve */}
        <motion.path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={2.4}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={visible ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ pathLength: { duration: 1.1, ease: "easeOut" }, opacity: { duration: 0.2 } }}
        />
        {/* sample dots on curve */}
        {samples.map((s) => {
          const px = xToPx(s.x);
          const py = yToPx(pdf(s.x, b));
          return (
            <motion.circle
              key={s.id}
              cx={px} cy={py} r={3.5}
              fill={stroke}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.6, 1], opacity: 0.85 }}
              transition={{ duration: 0.4 }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

/* --------------------------- Comic caption --------------------------- */

type Entrance = "left" | "right" | "top" | "bottom" | "pop";
type Tone = "cream" | "focus" | "indigo";

function CaptionBox({
  text, tone, entrance, style, emphasize, glow, stacked,
}: {
  text: React.ReactNode; tone: Tone; entrance: Entrance;
  style: React.CSSProperties; emphasize?: boolean; glow?: boolean; stacked?: boolean;
}) {
  const v =
    entrance === "left" ? { initial: { opacity: 0, x: -60, rotate: -4 }, animate: { opacity: 1, x: 0 } } :
    entrance === "right" ? { initial: { opacity: 0, x: 60, rotate: 4 }, animate: { opacity: 1, x: 0 } } :
    entrance === "top" ? { initial: { opacity: 0, y: -40 }, animate: { opacity: 1, y: 0 } } :
    entrance === "bottom" ? { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 } } :
    { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: 1 } };
  const toneCls =
    tone === "focus" ? "bg-gradient-to-br from-secondary to-primary text-primary-foreground border-ink/20" :
    tone === "indigo" ? "bg-primary text-primary-foreground border-primary" :
    "bg-paper text-ink border-primary/60";
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={stacked ? { position: "relative", zIndex: 30, marginTop: 8 } : { position: "absolute", zIndex: 30, ...style }}
      className={`rounded-xl border-2 px-3 py-2 shadow-[3px_4px_0_0_hsl(var(--ink)/0.15)] ${toneCls} ${glow ? "ring-4 ring-secondary/30" : ""}`}
    >
      <p className={`font-serif leading-snug ${emphasize ? "text-sm sm:text-base font-semibold" : "text-xs sm:text-sm"}`}>
        {text}
      </p>
    </motion.div>
  );
}


/* --------------------------- Main scene --------------------------- */

type Phase =
  | "start"
  | "left-in" | "left-cap"
  | "right-in" | "right-cap"
  | "gap-a" | "gap-b"
  | "mid-in" | "mid-a" | "mid-b" | "mid-c"
  | "done";

export function TwoCurvesShowdown({ log }: { log: LogFn; onContinue?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("start");
  const [started, setStarted] = useState(false);
  const [runToken, setRunToken] = useState(0);
  const [leftSamples, setLeftSamples] = useState<Sample[]>([]);
  const [rightSamples, setRightSamples] = useState<Sample[]>([]);
  const [midSamples, setMidSamples] = useState<Sample[]>([]);
  const enteredRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !enteredRef.current) {
          enteredRef.current = true;
          log("three_curves_scene_enter");
          setStarted(true);
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!started) return;
    setPhase("start");
    setLeftSamples([]); setRightSamples([]); setMidSamples([]);
  }, [started, runToken]);

  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(() => (cancelled ? undefined : r()), ms));

    const dropSamples = (b: number, setter: React.Dispatch<React.SetStateAction<Sample[]>>, n = 5) => {
      for (let i = 0; i < n; i++) {
        setTimeout(() => {
          if (cancelled) return;
          setter((prev) => [...prev, { id: Date.now() + Math.random(), x: TRUE + laplace(b) }]);
        }, i * 260);
      }
    };

    async function run() {
      await wait(400);
      setPhase("left-in"); await wait(1200);
      dropSamples(B_NARROW, setLeftSamples, 5);
      setPhase("left-cap"); await wait(2200);

      setPhase("right-in"); await wait(1200);
      dropSamples(B_WIDE, setRightSamples, 5);
      setPhase("right-cap"); await wait(2400);

      setPhase("gap-a"); await wait(1900);
      setPhase("gap-b"); await wait(1700);

      setPhase("mid-in"); await wait(1300);
      dropSamples(B_MID, setMidSamples, 5);
      setPhase("mid-a"); await wait(2200);
      setPhase("mid-b"); await wait(2500);
      setPhase("mid-c"); await wait(2600);
      setPhase("done");
      log("three_curves_scene_complete");
    }
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, runToken]);

  // visibility flags
  const P = phase;
  const idxOf: Record<Phase, number> = {
    "start": 0, "left-in": 1, "left-cap": 2, "right-in": 3, "right-cap": 4,
    "gap-a": 5, "gap-b": 6, "mid-in": 7, "mid-a": 8, "mid-b": 9, "mid-c": 10, "done": 11,
  };
  const at = (min: Phase) => idxOf[P] >= idxOf[min];

  const stacked = useIsMobile();

  const wideBlock = (
    <div className="relative">
      <CurveCard
        b={B_WIDE}
        color="danger"
        label="ε = 0.5"
        sublabel="wide curve"
        visible={at("left-in")}
        samples={rightSamples /* wide samples */}
      />
      <AnimatePresence>
        {at("left-cap") && (
          <CaptionBox
            key="cap-wide"
            stacked={stacked}
            text="Low epsilon. Very private, but the answers are all over the place."
            tone="cream"
            entrance="left"
            style={{ top: "100%", left: "0", right: "0", marginTop: 10 }}
          />
        )}
      </AnimatePresence>
    </div>
  );

  const narrowBlock = (
    <div className="relative">
      <CurveCard
        b={B_NARROW}
        color="primary"
        label="ε = 10"
        sublabel="narrow curve"
        visible={at("right-in")}
        samples={leftSamples /* narrow samples */}
      />
      <AnimatePresence>
        {at("right-cap") && (
          <CaptionBox
            key="cap-narrow"
            stacked={stacked}
            text="High epsilon. Very accurate, but barely private."
            tone="cream"
            entrance="right"
            style={{ top: "100%", left: "0", right: "0", marginTop: 10 }}
          />
        )}
      </AnimatePresence>
    </div>
  );

  const midBlock = (
    <div className="relative">
      <CurveCard
        b={B_MID}
        color="balanced"
        label="ε = 1"
        sublabel="balanced curve"
        visible={at("mid-in")}
        samples={midSamples}
        emphasize
      />
      <AnimatePresence>
        {at("mid-a") && (
          <CaptionBox
            key="mida"
            stacked={stacked}
            text="The sweet spot sits in the middle."
            tone="focus"
            entrance="pop"
            emphasize
            glow
            style={{ top: "100%", left: "0", right: "0", marginTop: 10 }}
          />
        )}
        {at("mid-b") && (
          <CaptionBox
            key="midb"
            stacked={stacked}
            text="A medium epsilon gives answers close enough to be useful, and noisy enough to protect people."
            tone="cream"
            entrance="bottom"
            style={{ top: "calc(100% + 78px)", left: "-40%", right: "-40%" }}
          />
        )}
      </AnimatePresence>
    </div>
  );

  const gapCaptions = (
    <AnimatePresence>
      {at("gap-a") && !at("mid-in") && (
        <CaptionBox
          key="gapa"
          stacked={stacked}
          text="So one extreme is too leaky. The other is too noisy."
          tone="indigo"
          entrance="top"
          emphasize
          style={{ top: 0, left: "50%", transform: "translateX(-50%)", maxWidth: "26rem", textAlign: "center" }}
        />
      )}
      {at("gap-b") && !at("mid-in") && (
        <CaptionBox
          key="gapb"
          stacked={stacked}
          text="What about somewhere in between?"
          tone="cream"
          entrance="pop"
          emphasize
          style={{ top: 42, left: "50%", transform: "translateX(-50%)", maxWidth: "22rem", textAlign: "center" }}
        />
      )}
    </AnimatePresence>
  );

  if (stacked) {
    return (
      <div ref={rootRef} className="relative w-full">
        <div className="mx-auto w-full max-w-md space-y-4 px-1">
          {wideBlock}
          {narrowBlock}
          {gapCaptions}
          {midBlock}
        </div>

        <div className="mt-4 flex items-center justify-center px-2">
          <AnimatePresence>
            {at("mid-c") && (
              <motion.div
                key="finale-m"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full rounded-2xl border-2 border-primary/60 bg-paper px-4 py-3 shadow-lg text-center"
              >
                <p className="font-serif text-base text-ink leading-relaxed">
                  This balance between privacy and accuracy is the <span className="text-primary font-semibold">whole art of choosing epsilon</span>.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 flex items-center justify-center">
          <button
            onClick={() => { log("replay_clicked"); setRunToken((t) => t + 1); }}
            className="px-4 py-1.5 rounded-full border border-rule bg-paper text-ink font-mono text-[10px] uppercase tracking-widest hover:border-primary/60 hover:text-primary transition"
          >
            Replay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative w-full">
      {/* fixed-height stage so everything fits without scroll */}
      <div className="relative mx-auto max-w-6xl" style={{ minHeight: 380 }}>
        <div className="grid grid-cols-3 gap-3 md:gap-4 items-start pt-2">
          {wideBlock}
          {midBlock}
          {narrowBlock}
        </div>
        {gapCaptions}
      </div>


      {/* Final highlighted line */}
      <div className="mt-4 min-h-[80px] flex items-center justify-center px-4">
        <AnimatePresence>
          {at("mid-c") && (
            <motion.div
              key="finale"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border-2 border-primary/60 bg-paper px-6 py-4 shadow-lg text-center w-full max-w-3xl"
            >
              <p className="font-serif text-base sm:text-xl text-ink leading-relaxed">
                This balance between privacy and accuracy is the <span className="text-primary font-semibold">whole art of choosing epsilon</span>.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-center">
        <button
          onClick={() => { log("replay_clicked"); setRunToken((t) => t + 1); }}
          className="px-4 py-1.5 rounded-full border border-rule bg-paper text-ink font-mono text-[10px] uppercase tracking-widest hover:border-primary/60 hover:text-primary transition"
        >
          Replay
        </button>
      </div>
    </div>
  );
}
