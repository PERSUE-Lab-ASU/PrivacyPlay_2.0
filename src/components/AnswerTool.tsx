import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LaplaceCurve } from "./LaplaceCurve";
import { getTrueCount, type Patient } from "@/lib/dataset";
import { noisyCount } from "@/lib/dp";

export type Cond =
  | "diabetic"
  | "female_diabetic"
  | "male_diabetic"
  | "not_diabetic"
  | "cancer"
  | "cancer_not_igor"
  | "active_diabetic"
  | "inactive_diabetic"
  | "heavy"
  | "heavy_diabetic";

const COND_LABEL: Record<Cond, string> = {
  diabetic: "have diabetes",
  female_diabetic: "are women with diabetes",
  male_diabetic: "are men with diabetes",
  not_diabetic: "do not have diabetes",
  cancer: "have cancer",
  cancer_not_igor: "have cancer, excluding Igor",
  active_diabetic: "are active with diabetes",
  inactive_diabetic: "are inactive with diabetes",
  heavy: "weigh over 100 lbs",
  heavy_diabetic: "weigh over 100 lbs and have diabetes",
};

const COND_FN: Record<Cond, (p: Patient) => boolean> = {
  diabetic: (p) => p.diabetes === "Yes",
  female_diabetic: (p) => p.gender === "Female" && p.diabetes === "Yes",
  male_diabetic: (p) => p.gender === "Male" && p.diabetes === "Yes",
  not_diabetic: (p) => p.diabetes === "No",
  cancer: (p) => p.condition === "Cancer",
  cancer_not_igor: (p) => p.condition === "Cancer" && p.name !== "Igor",
  active_diabetic: (p) => p.activity !== "Low" && p.diabetes === "Yes",
  inactive_diabetic: (p) => p.activity === "Low" && p.diabetes === "Yes",
  heavy: (p) => p.weight > 100,
  heavy_diabetic: (p) => p.weight > 100 && p.diabetes === "Yes",
};

export type AnswerRecord = {
  sentence: string;
  noisy: number;
  truth: number;
  eps: number;
  cond: Cond;
};

export function buildAnswer(cond: Cond, eps: number): AnswerRecord {
  const pred = COND_FN[cond];
  const sentence = `count people who ${COND_LABEL[cond]}`;
  const truth = getTrueCount(pred);
  const noisy = Math.round(noisyCount(truth, eps));
  return { sentence, noisy, truth, eps, cond };
}

type Props = {
  conditions?: Cond[];
  initialCond?: Cond;
  showEpsilon?: boolean;
  maxEps?: number;
  onAsk?: (record: AnswerRecord) => void;
  locked?: boolean;
  fixedSentence?: { cond: Cond };
};

export function AnswerTool({
  conditions = ["diabetic", "female_diabetic", "male_diabetic", "not_diabetic", "cancer", "cancer_not_igor", "active_diabetic", "inactive_diabetic", "heavy", "heavy_diabetic"],
  initialCond,
  showEpsilon = true,
  maxEps = 5,
  onAsk,
  locked = false,
  fixedSentence,
}: Props) {
  const [cond, setCond] = useState<Cond>(fixedSentence?.cond ?? initialCond ?? conditions[0]);
  const [eps, setEps] = useState(1);

  useEffect(() => {
    if (fixedSentence) setCond(fixedSentence.cond);
  }, [fixedSentence]);

  const sentence = `count people who ${COND_LABEL[cond]}`;
  const truth = useMemo(() => getTrueCount(COND_FN[cond]), [cond]);
  const effectiveEps = Math.min(eps, maxEps);
  const b = 1 / Math.max(effectiveEps, 0.05);

  const handleAsk = () => {
    if (locked) return;
    onAsk?.(buildAnswer(cond, effectiveEps));
  };

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-paper p-5 sm:p-6 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg text-primary">Ask the system</h3>
        <span className="font-mono text-[10px] uppercase text-muted-foreground">Answer Tool · counts only</span>
      </div>

      <div className="rounded-lg bg-muted/40 border border-rule p-3 mb-3">
        {fixedSentence ? (
          <p className="font-serif text-lg text-ink leading-snug">"{sentence}."</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-base">
            <span className="font-serif text-ink">count people who</span>
            <select
              value={cond}
              onChange={(e) => setCond(e.target.value as Cond)}
              disabled={locked}
              className="rounded-md bg-paper border border-primary/30 px-2 py-1 font-serif text-ink focus:outline-none focus:border-primary"
            >
              {conditions.map((c) => <option key={c} value={c}>{COND_LABEL[c]}</option>)}
            </select>
          </div>
        )}
      </div>

      {showEpsilon && (
        <div className="grid sm:grid-cols-[1fr,1.3fr] gap-4 mb-3 items-center">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span>more private</span><span>less private</span>
            </div>
            <input type="range" min={0.1} max={Math.max(0.2, maxEps)} step={0.05} value={Math.min(eps, Math.max(0.2, maxEps))}
              onChange={(e) => setEps(parseFloat(e.target.value))} className="w-full accent-[color:var(--color-primary)]" disabled={locked} />
            <div className="mt-1 font-mono text-xs"><span className="text-muted-foreground">epsilon</span> <span className="text-primary font-semibold">{effectiveEps.toFixed(2)}</span></div>
          </div>
          <div className="rounded-lg border border-rule bg-background/50 p-2">
            <LaplaceCurve mu={truth} b={b} height={120} showTrueMark={false} />
            <div className="text-center font-mono text-[10px] text-muted-foreground">live curve preview</div>
          </div>
        </div>
      )}

      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ y: 0 }}
        onClick={handleAsk}
        disabled={locked}
        className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-shadow"
      >
        Ask the system
      </motion.button>
    </div>
  );
}

export { COND_LABEL, COND_FN };
