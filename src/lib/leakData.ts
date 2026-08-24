/**
 * THE LEAK — one binary attack, told three ways.
 *
 * The numbers live here once. Cases only swap story strings, so every table,
 * calculation and curve is identical across cases by construction.
 */

export const STATS = { total: 40, men: 22, women: 17 } as const;

/** The one example noisy release shown in step 4 before anything is resampled. */
export const EXAMPLE_NOISY = { total: 40.3, men: 21.6, women: 17.5 } as const;

/** Attack success anchors from Table 1 of the Nanayakkara USENIX 2023 paper. */
export const SUCCESS_ANCHORS: [number, number][] = [
  [0.1, 52],
  [0.5, 61],
  [1.0, 73], // interpolated, not from the paper
  [2.0, 82],
  [4.0, 93],
];

export const EPS_MIN = 0.1;
export const EPS_MAX = 4;

/**
 * Attack success out of 100, anchored to the paper and smoothed between
 * anchors with a monotone cubic fit over log epsilon. Floor is 50.
 */
export function successOutOf100(epsilon: number): number {
  const eps = Math.min(Math.max(epsilon, EPS_MIN), EPS_MAX);
  const xs = SUCCESS_ANCHORS.map(([e]) => Math.log10(e));
  const ys = SUCCESS_ANCHORS.map(([, v]) => v);
  const x = Math.log10(eps);

  const n = xs.length;
  let i = 0;
  while (i < n - 2 && x > xs[i + 1]) i++;

  const h = xs[i + 1] - xs[i];
  const slope = (ys[i + 1] - ys[i]) / h;

  const secant = (k: number) => (ys[k + 1] - ys[k]) / (xs[k + 1] - xs[k]);
  const tangent = (k: number) => {
    if (k === 0) return secant(0);
    if (k === n - 1) return secant(n - 2);
    return (secant(k - 1) + secant(k)) / 2;
  };

  let m0 = tangent(i);
  let m1 = tangent(i + 1);
  // keep it monotone
  if (slope === 0) { m0 = 0; m1 = 0; }
  else {
    if (m0 / slope < 0) m0 = 0;
    if (m1 / slope < 0) m1 = 0;
  }

  const t = (x - xs[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const value =
    (2 * t3 - 3 * t2 + 1) * ys[i] +
    (t3 - 2 * t2 + t) * h * m0 +
    (-2 * t3 + 3 * t2) * ys[i + 1] +
    (t3 - t2) * h * m1;

  return Math.max(50, Math.min(100, value));
}

export function successCaption(epsilon: number): string {
  if (epsilon < 0.3) return "The attacker knows almost nothing.";
  if (epsilon < 0.75) return "Barely better than a guess.";
  if (epsilon < 1.5) return "Now the attacker is usually right.";
  if (epsilon < 3) return "Weak protection.";
  return "The person is exposed.";
}

export type CaseId = "hospital" | "company" | "psychology";

export interface LeakCase {
  id: CaseId;
  label: string;
  cardBlurb: string;
  /** who publishes */
  org: string;
  /** the slice the numbers describe */
  slice: string;
  /** short trait name, used inside table rows */
  trait: string;
  /** the sensitive fact in plain words */
  sensitiveFact: string;
  attacker: string;
  attackerLine: string;
  publishLine: string;
  rowTotal: string;
  rowMen: string;
  rowWomen: string;
  hiddenPerson: string;
}

export const CASES: LeakCase[] = [
  {
    id: "hospital",
    label: "Hospital",
    cardBlurb: "Diabetes counts by zip and gender. The attacker is a nosy neighbor.",
    org: "the hospital",
    slice: "zip 13053",
    trait: "diabetes",
    sensitiveFact: "has diabetes",
    attacker: "a nosy neighbor",
    attackerLine: "The neighbor next door reads the release over morning coffee and notices the numbers do not line up.",
    publishLine: "The hospital publishes diabetes counts to help researchers. No names, just groups.",
    rowTotal: "people in zip 13053 with diabetes",
    rowMen: "men in zip 13053 with diabetes",
    rowWomen: "women in zip 13053 with diabetes",
    hiddenPerson: "one neighbor whose diagnosis was supposed to stay private",
  },
  {
    id: "company",
    label: "Company",
    cardBlurb: "An unhappiness survey by department and gender. The attacker is a manager who wants to retaliate.",
    org: "the company",
    slice: "the Sales department",
    trait: "unhappiness",
    sensitiveFact: "is unhappy at work and planning to leave",
    attacker: "a manager who wants to retaliate",
    attackerLine: "The manager pulls up the survey summary and starts doing the arithmetic on their own team.",
    publishLine: "The company publishes survey results to show it listens. No names, just groups.",
    rowTotal: "people in the Sales department who are unhappy and planning to leave",
    rowMen: "men in the Sales department who are unhappy and planning to leave",
    rowWomen: "women in the Sales department who are unhappy and planning to leave",
    hiddenPerson: "one employee who answered honestly, expecting the survey to be anonymous",
  },
  {
    id: "psychology",
    label: "Psychology",
    cardBlurb: "A depression survey by major and gender. The attacker is a classmate.",
    org: "the university",
    slice: "the Biology major",
    trait: "reported depression",
    sensitiveFact: "reported depression",
    attacker: "a classmate",
    attackerLine: "A classmate skims the study summary and realises the breakdown is one person short.",
    publishLine: "The university publishes study results so other researchers can build on them. No names, just groups.",
    rowTotal: "students majoring in Biology who reported depression",
    rowMen: "men majoring in Biology who reported depression",
    rowWomen: "women majoring in Biology who reported depression",
    hiddenPerson: "one student who filled in a survey they were told was safe",
  },
];

export function findCase(id: CaseId): LeakCase {
  return CASES.find((c) => c.id === id)!;
}
