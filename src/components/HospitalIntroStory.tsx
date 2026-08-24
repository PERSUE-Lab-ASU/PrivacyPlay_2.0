import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SENTENCES = [
  "Imagine a small town with one hospital.",
  "Everyone who lives here comes through its doors.",
  "Every time someone visits, the hospital writes down a record.",
  "The record holds a few simple facts about them.",
  "Their name. Their age. Their gender. Their zip code.",
  "And whether they have diabetes. Just a yes or a no.",
  "One visit becomes one row in a table.",
];

const WALKER_COUNT = 3;
const LINE_MS = 2500;

export function HospitalIntroStory() {
  const [step, setStep] = useState(0);
  const [walker, setWalker] = useState<number>(-1);
  const [started, setStarted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (step >= SENTENCES.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), LINE_MS);
    return () => clearTimeout(t);
  }, [step, started]);

  useEffect(() => {
    if (step < 6) return;
    let cancelled = false;
    const run = async () => {
      for (let i = 0; i < WALKER_COUNT; i++) {
        if (cancelled) return;
        setWalker(i);
        await new Promise((r) => setTimeout(r, 1800));
      }
      setWalker(-1);
    };
    run();
    return () => { cancelled = true; };
  }, [step >= 6]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={rootRef} className="grid md:grid-cols-2 gap-10 items-center">
      <div className="min-h-[420px] space-y-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-6">
          A short story about a number
        </div>
        <div className="space-y-3">
          {SENTENCES.slice(0, step + 1).map((s, i) => {
            const isCurrent = i === step;
            return (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: isCurrent ? 1 : 0.35, y: 0, scale: isCurrent ? 1 : 0.98 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={
                  isCurrent
                    ? "font-serif text-2xl sm:text-3xl leading-snug text-ink"
                    : "font-serif text-lg sm:text-xl leading-snug text-muted-foreground"
                }
              >
                {s}
              </motion.p>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <HospitalStage walker={walker} />
        <PatientRowsTable revealed={walker < 0 ? (step >= 6 ? ROWS.length : 0) : walker + 1} />
      </div>
    </div>
  );
}

const ROWS = [
  { name: "Ann",   age: 34, sex: "F", zip: "10021", diabetes: "no" },
  { name: "Bruce", age: 58, sex: "M", zip: "10021", diabetes: "yes" },
  { name: "Cary",  age: 41, sex: "F", zip: "10022", diabetes: "no" },
];

function PatientRowsTable({ revealed }: { revealed: number }) {
  return (
    <div className="rounded-xl border border-rule bg-card overflow-hidden shadow-sm">
      <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground border-b border-rule">
        patients.csv
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2">Name</th>
            <th className="px-2 py-2">Age</th>
            <th className="px-2 py-2">Sex</th>
            <th className="px-2 py-2">Zip</th>
            <th className="px-3 py-2">Diabetes</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r, i) => (
            <motion.tr
              key={r.name}
              initial={{ opacity: 0, x: 20 }}
              animate={i < revealed ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="border-t border-rule"
            >
              <td className="px-3 py-2 font-medium text-ink">{r.name}</td>
              <td className="px-2 py-2 text-ink/80">{r.age}</td>
              <td className="px-2 py-2 text-ink/80">{r.sex}</td>
              <td className="px-2 py-2 text-ink/80 font-mono text-xs">{r.zip}</td>
              <td className="px-3 py-2">
                <span className={
                  r.diabetes === "yes"
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
    </div>
  );
}

function HospitalStage({ walker }: { walker: number }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-rule shadow-sm"
      style={{
        height: 300,
        background:
          "linear-gradient(to bottom, oklch(0.94 0.03 240) 0%, oklch(0.95 0.02 80) 70%, oklch(0.9 0.03 60) 100%)",
      }}
    >
      <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <rect x="0" y="230" width="400" height="70" fill="oklch(0.86 0.03 100)" />
        <rect x="0" y="250" width="400" height="20" fill="oklch(0.5 0.02 250)" />
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={i * 42 + 6} y={258} width={22} height={3} fill="oklch(0.95 0.06 90)" />
        ))}
        <rect x="110" y="80" width="220" height="150" fill="oklch(0.97 0.01 240)" stroke="oklch(0.55 0.05 240)" strokeWidth="1.5" />
        <rect x="105" y="72" width="230" height="12" fill="oklch(0.5 0.08 250)" />
        <g transform="translate(220, 110)">
          <rect x="-7" y="-20" width="14" height="40" fill="oklch(0.6 0.22 25)" />
          <rect x="-20" y="-7" width="40" height="14" fill="oklch(0.6 0.22 25)" />
        </g>
        <rect x="175" y="150" width="90" height="16" fill="oklch(0.5 0.08 250)" />
        <text x="220" y="163" textAnchor="middle" fill="oklch(0.97 0.02 80)" fontSize="10" fontFamily="serif" fontWeight="bold">
          HOSPITAL
        </text>
        {[0, 1].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect key={`w${row}${col}`} x={125 + col * 50} y={175 + row * 16} width={32} height={10} fill="oklch(0.78 0.1 240)" />
          )),
        )}
        <rect x="205" y="200" width="30" height="30" fill="oklch(0.35 0.05 250)" />
        <rect x="207" y="202" width="26" height="26" fill="oklch(0.7 0.12 230)" opacity="0.6" />

        <AnimatePresence>
          {walker >= 0 && <Walker key={walker} idx={walker} />}
        </AnimatePresence>
      </svg>
    </div>
  );
}

function Walker({ idx }: { idx: number }) {
  const palettes = [
    { body: "oklch(0.55 0.13 30)" },
    { body: "oklch(0.45 0.15 260)" },
    { body: "oklch(0.65 0.14 340)" },
  ];
  const c = palettes[idx];
  return (
    <motion.g
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: [-30, 210, 210], opacity: [0, 1, 0] }}
      transition={{ duration: 2.2, times: [0, 0.75, 1], ease: "linear" }}
    >
      <g transform="translate(0, 240)">
        <circle cx={0} cy={-24} r={6} fill="oklch(0.78 0.06 70)" stroke="oklch(0.3 0.02 60)" strokeWidth="0.4" />
        <rect x={-6} y={-18} width={12} height={18} rx={2} fill={c.body} stroke="oklch(0.3 0.02 60)" strokeWidth="0.4" />
        <motion.g
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "0px -2px" }}
        >
          <rect x={-5} y={0} width={3} height={10} fill="oklch(0.3 0.04 250)" />
          <rect x={2} y={0} width={3} height={10} fill="oklch(0.3 0.04 250)" />
        </motion.g>
      </g>
    </motion.g>
  );
}
