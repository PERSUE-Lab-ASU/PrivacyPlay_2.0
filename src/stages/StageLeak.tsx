import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Eye, GraduationCap, Stethoscope, UserCog, Users } from "lucide-react";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { FlyCaption } from "@/components/leak/FlyCaption";
import { SuccessCurve } from "@/components/leak/SuccessCurve";
import { IconArray } from "@/components/leak/IconArray";
import { NoisyArithmetic } from "@/components/leak/NoisyArithmetic";
import { TwoWorldsCurves } from "@/components/leak/TwoWorldsCurves";
import { useTelemetry } from "@/hooks/useTelemetry";
import { findSection } from "@/lib/sections";
import {
  CASES, EPS_MAX, EPS_MIN, EXAMPLE_NOISY, STATS,
  findCase, successCaption, successOutOf100,
  type CaseId, type LeakCase,
} from "@/lib/leakData";

const CASE_ICON: Record<CaseId, typeof Stethoscope> = {
  hospital: Stethoscope,
  company: Building2,
  psychology: GraduationCap,
};

const ATTACKER_ICON: Record<CaseId, typeof Eye> = {
  hospital: Eye,
  company: UserCog,
  psychology: Users,
};

/* ---------------- shared pieces ---------------- */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border border-rule bg-paper p-5 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function StepTitle({ n, title, blurb }: { n: number; title: string; blurb?: string }) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-baseline gap-3">
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Step {n}</span>
        <div className="h-px flex-1 bg-rule" />
      </div>
      <h3 className="font-serif text-2xl text-ink sm:text-3xl">{title}</h3>
      {blurb && <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>}
    </div>
  );
}

function StatTable({
  head,
  rows,
}: {
  head: string[];
  rows: { cells: (string | number)[]; tone?: "plain" | "danger" | "primary" }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-rule">
      <table className="w-full min-w-[17rem] text-sm">
        <thead className="bg-muted/50">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr
              key={r.cells.join("|")}
              initial={{ opacity: 0, x: -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.18 }}
              className={`border-t border-rule/60 ${
                r.tone === "danger" ? "bg-danger/5 text-danger" : r.tone === "primary" ? "bg-primary/5 text-primary" : "text-ink/85"
              }`}
            >
              {r.cells.map((c, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "" : "whitespace-nowrap font-mono"}`}>
                  {c}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CaseSelector({
  active,
  onPick,
  compact = false,
}: {
  active: CaseId | null;
  onPick: (id: CaseId) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">story</span>
        {CASES.map((c) => {
          const Icon = CASE_ICON[c.id];
          const on = active === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
                on ? "border-primary bg-primary/10 text-primary" : "border-rule text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {c.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {CASES.map((c, i) => {
        const Icon = CASE_ICON[c.id];
        const on = active === c.id;
        return (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            onClick={() => onPick(c.id)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              on ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-rule hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <Icon className={`h-6 w-6 ${on ? "text-primary" : "text-muted-foreground"}`} />
            <div className="mt-2 font-serif text-xl text-ink">{c.label}</div>
            <p className="mt-1 text-xs text-muted-foreground">{c.cardBlurb}</p>
            <div className="mt-2 font-mono text-[10px] text-primary">the sensitive fact: {c.sensitiveFact}</div>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ---------------- the module ---------------- */

export default function StageLeak() {
  const section = findSection("the-leak")!;
  const { log } = useTelemetry("leak");

  const [caseId, setCaseId] = useState<CaseId | null>(null);
  const [epsilon, setEpsilon] = useState(1);
  const [step, setStep] = useState(1);
  const [seen, setSeen] = useState<CaseId[]>([]);

  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const liveSeconds = useRef(0);
  const epsRef = useRef(1);
  const caseRef = useRef<CaseId | null>(null);

  const c: LeakCase | null = caseId ? findCase(caseId) : null;
  const value = Math.round(successOutOf100(epsilon));

  useEffect(() => { epsRef.current = epsilon; }, [epsilon]);
  useEffect(() => { caseRef.current = caseId; }, [caseId]);

  // time spent on the live screen
  useEffect(() => {
    if (!liveRef.current) return;
    let visible = false;
    const obs = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.3 });
    obs.observe(liveRef.current);
    const t = window.setInterval(() => { if (visible) liveSeconds.current += 1; }, 1000);
    return () => { obs.disconnect(); window.clearInterval(t); };
  }, [caseId]);

  // settling epsilon on leave
  useEffect(() => {
    return () => {
      log("leak_settled", {
        epsilon: epsRef.current,
        successOutOf100: Math.round(successOutOf100(epsRef.current)),
        case: caseRef.current,
        liveSeconds: liveSeconds.current,
      });
    };
  }, [log]);

  // step tracking
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step)); }),
      { rootMargin: "-40% 0px -50% 0px" },
    );
    stepRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [caseId]);

  const holder = (n: number) => (el: HTMLDivElement | null) => { stepRefs.current[n] = el; };

  const pickCase = (id: CaseId) => {
    setCaseId(id);
    setSeen((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      log("leak_case_chosen", { case: id, casesSeen: next.length, replay: prev.length > 0 });
      return next;
    });
  };

  const onEpsilon = (v: number) => {
    setEpsilon(v);
    log("leak_epsilon_change", { epsilon: v, successOutOf100: Math.round(successOutOf100(v)), case: caseId });
  };

  const totalSteps = 8;
  const balance = useMemo(
    () => [
      "Push epsilon low. The attacker is stuck at a coin flip. The person is safe.",
      "But the published statistics get so noisy that researchers cannot use them.",
      "Push epsilon high. The statistics are accurate and useful.",
      "But the attacker is nearly certain, and the person is exposed.",
    ],
    [],
  );

  return (
    <div>
      <SectionHeader num={section.num} title={section.title} subtitle={section.subtitle} anchorId={section.id} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 pb-24 sm:px-10">
        {/* progress and case switcher */}
        <div className="sticky top-14 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-rule bg-paper/90 px-4 py-2 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Step {step} of {totalSteps}
            </span>
            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full bg-primary" animate={{ width: `${(step / totalSteps) * 100}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
          {c && <CaseSelector active={caseId} onPick={pickCase} compact />}
        </div>

        {/* STEP 1 */}
        <div ref={holder(1)} data-step={1}>
          <Card>
            <StepTitle n={1} title="Pick a story" blurb="Three stories, one attack. The numbers and the math are identical in all three. Only the person we are protecting changes." />
            <CaseSelector active={caseId} onPick={pickCase} />
            {!c && (
              <p className="mt-4 font-mono text-[11px] text-muted-foreground">pick one to keep going.</p>
            )}
          </Card>
        </div>

        <AnimatePresence>
          {c && (
            <motion.div key="rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* STEP 2 */}
              <div ref={holder(2)} data-step={2}>
                <Card>
                  <StepTitle n={2} title={`${c.org.charAt(0).toUpperCase()}${c.org.slice(1)} publishes statistics`} blurb={c.publishLine} />
                  <StatTable
                    head={["statistic", "value"]}
                    rows={[
                      { cells: [c.rowTotal, STATS.total] },
                      { cells: [c.rowMen, STATS.men] },
                      { cells: [c.rowWomen, STATS.women] },
                    ]}
                  />
                  <div className="mt-4">
                    <FlyCaption from="left">Every row is a big group. No row is about one person. This looks safe.</FlyCaption>
                  </div>
                </Card>
              </div>

              {/* STEP 3 */}
              <div ref={holder(3)} data-step={3}>
                <Card>
                  <StepTitle n={3} title="The attack, the sum that does not add up" />
                  <StatTable
                    head={["statistic", "value"]}
                    rows={[
                      { cells: [`men with ${c.trait}`, STATS.men] },
                      { cells: [`women with ${c.trait}`, STATS.women] },
                      { cells: ["men plus women", STATS.men + STATS.women], tone: "primary" },
                      { cells: [`total with ${c.trait}`, STATS.total] },
                      { cells: ["gap", "40 minus 39 equals 1"], tone: "danger" },
                    ]}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.7, delay: 0.9 }}
                    className="mt-4 flex items-center gap-3 rounded-xl border border-danger/40 bg-danger/5 px-4 py-3"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">the gap</span>
                    <span className="font-serif text-4xl text-danger">1</span>
                    <span className="min-w-0 text-sm text-danger">{c.hiddenPerson}</span>
                  </motion.div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <FlyCaption from="left">
                      22 plus 17 is 39, but the total is 40. One person is missing from the breakdown. That gap is one real person, and slicing a
                      little more corners exactly who.
                    </FlyCaption>
                    <div className="space-y-3">
                      {(() => {
                        const AIcon = ATTACKER_ICON[c.id];
                        return (
                          <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", bounce: 0.35, duration: 0.7 }}
                            className="flex items-start gap-3 rounded-xl border border-rule bg-muted/20 px-4 py-3"
                          >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/10">
                              <AIcon className="h-5 w-5 text-danger" />
                            </span>
                            <div className="min-w-0">
                              <div className="font-mono text-[10px] uppercase tracking-wider text-danger">the attacker, {c.attacker}</div>
                              <p className="mt-1 text-sm text-ink">{c.attackerLine}</p>
                            </div>
                          </motion.div>
                        );
                      })()}
                      <FlyCaption from="right" delay={0.15}>
                        No hacking. No queries. Just arithmetic on public numbers. The more detailed the statistics, the easier to single someone out.
                      </FlyCaption>
                    </div>
                  </div>
                </Card>
              </div>

              {/* STEP 4 */}
              <div ref={holder(4)} data-step={4}>
                <Card>
                  <StepTitle n={4} title="The fix, statistics with noise" blurb="So instead of publishing exact numbers, we publish noisy ones." />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <StatTable
                      head={["statistic", "true", "published noisy"]}
                      rows={[
                        { cells: ["total", STATS.total, EXAMPLE_NOISY.total.toFixed(1)] },
                        { cells: ["men", STATS.men, EXAMPLE_NOISY.men.toFixed(1)] },
                        { cells: ["women", STATS.women, EXAMPLE_NOISY.women.toFixed(1)] },
                      ]}
                    />
                    <StatTable
                      head={["the attacker retries", "before noise", "after noise"]}
                      rows={[
                        { cells: ["total", STATS.total, EXAMPLE_NOISY.total.toFixed(1)] },
                        { cells: ["men plus women", STATS.men + STATS.women, "39.1"] },
                        { cells: ["gap", 1, "1.2"], tone: "primary" },
                      ]}
                    />
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="space-y-3">
                      <FlyCaption from="left">
                        The gap no longer points cleanly at one person. Each release gives a different number, so the attacker cannot trust it.
                      </FlyCaption>
                      <FlyCaption from="left" delay={0.15}>How much noise we add is called epsilon.</FlyCaption>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        press publish again a few times. the gap wanders every release.
                      </p>
                    </div>
                    <div className="rounded-xl border border-rule bg-muted/20 p-4">
                      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">a fresh release</div>
                      <NoisyArithmetic
                        epsilon={1}
                        leakCase={c}
                        onPublish={(gap) => log("leak_publish_again", { where: "step4", epsilon: 1, gap: Number(gap.toFixed(2)), case: c.id })}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* STEP 5 */}
              <div ref={holder(5)} data-step={5}>
                <Card>
                  <StepTitle n={5} title="What the attacker is guessing" blurb="In the end, the attacker is trying to tell two worlds apart." />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3">
                      <StatTable
                        head={["", "true answer", "meaning"]}
                        rows={[
                          { cells: ["world A", 1, "there is one hidden person, the trait is theirs"], tone: "danger" },
                          { cells: ["world B", 0, "no hidden person"], tone: "primary" },
                        ]}
                      />
                      <FlyCaption from="left">
                        The attacker looks at the noisy gap and guesses which world it came from. The cutoff is the middle, 0.5. Above it, guess
                        world A. Below it, guess world B.
                      </FlyCaption>
                    </div>
                    <div className="rounded-xl border border-primary/30 bg-paper p-4">
                      <TwoWorldsCurves epsilon={1} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* STEP 6 — the live screen */}
              <div ref={holder(6)} data-step={6}>
                <Card>
                  <StepTitle n={6} title="Drag epsilon" blurb="Watch the attack get easier or harder, live." />

                  <div ref={liveRef} className="space-y-4">
                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">epsilon</div>
                          <motion.p key={successCaption(epsilon)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className="mt-1 font-serif text-base text-ink sm:text-lg">
                            {successCaption(epsilon)}
                          </motion.p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-serif text-4xl text-primary sm:text-5xl">{epsilon.toFixed(2)}</div>
                          <div className="font-mono text-[11px] text-danger">{value} out of 100</div>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={Math.log10(EPS_MIN)}
                        max={Math.log10(EPS_MAX)}
                        step={0.01}
                        value={Math.log10(epsilon)}
                        onChange={(e) => onEpsilon(Math.round(Math.pow(10, parseFloat(e.target.value)) * 100) / 100)}
                        className="mt-3 w-full accent-primary"
                        aria-label={`epsilon, currently ${epsilon.toFixed(2)}`}
                      />
                      <div className="flex justify-between gap-3 font-mono text-[9px] text-muted-foreground">
                        <span>0.1 more private, more noise</span>
                        <span className="text-right">4 less private, less noise</span>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                      <div className="rounded-xl border border-rule bg-paper p-4">
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">the attack success curve</div>
                        <SuccessCurve epsilon={epsilon} />
                      </div>
                      <div className="rounded-xl border border-rule bg-muted/20 p-4">
                        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">the noisy arithmetic</div>
                        <NoisyArithmetic
                          epsilon={epsilon}
                          leakCase={c}
                          onPublish={(gap) => log("leak_publish_again", { where: "live", epsilon, gap: Number(gap.toFixed(2)), case: c.id })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                      <div className="rounded-xl border border-rule bg-paper p-4">
                        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">100 attempts</div>
                        <IconArray epsilon={epsilon} />
                      </div>
                      <div className="rounded-xl border border-rule bg-muted/20 p-4">
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">the two worlds now</div>
                        <TwoWorldsCurves epsilon={epsilon} showEps />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Wide curves overlap, so the worlds blur together. Narrow curves pull apart, and the attacker can tell them apart.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* STEP 7 */}
              <div ref={holder(7)} data-step={7}>
                <Card>
                  <StepTitle n={7} title="The balance" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {balance.map((line, i) => (
                      <FlyCaption key={line} from={i % 2 === 0 ? "left" : "right"} delay={i * 0.12}>
                        {line}
                      </FlyCaption>
                    ))}
                  </div>
                  <div className="mt-5 flex justify-center">
                    <FlyCaption from="bottom" focus delay={0.2}>
                      There is no perfect setting. Only a chosen balance. Epsilon is the dial.
                    </FlyCaption>
                  </div>
                </Card>
              </div>

              {/* STEP 8 */}
              <div ref={holder(8)} data-step={8}>
                <Card>
                  <StepTitle n={8} title="Try the other stories" />
                  <FlyCaption from="left">Try another story. The numbers stay the same. Only the person we are protecting changes.</FlyCaption>
                  <div className="mt-4">
                    <CaseSelector active={caseId} onPick={pickCase} />
                  </div>
                  {seen.length > 1 && (
                    <div className="mt-5">
                      <FlyCaption from="bottom" focus>
                        Same math, different lives. That is the point. This is not about hospitals or companies. It is about any published data.
                      </FlyCaption>
                    </div>
                  )}
                  <p className="mt-4 font-mono text-[10px] text-muted-foreground">
                    attack success numbers come from Table 1 of the Nanayakkara USENIX 2023 paper, binary setup, Laplace noise. epsilon 1.0 is
                    interpolated.
                  </p>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
