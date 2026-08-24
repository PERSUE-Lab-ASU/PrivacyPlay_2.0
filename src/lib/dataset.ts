// Synthetic medical dataset. 4000 rows total; first 12 are named and visible.
// Igor (index 9) is Male, Cancer — the differencing attack target.

export type Patient = {
  name: string;
  ssn: string;
  age: number;
  gender: "Male" | "Female";
  zip: string;
  weight: number;
  activity: "Low" | "Medium" | "High";
  diabetes: "Yes" | "No";
  condition: "Heart disease" | "Viral infection" | "Cancer" | "Flu";
};

const VISIBLE_NAMES = [
  "Ann", "Bruce", "Cary", "Dick", "Eshwar", "Fox",
  "Gary", "Helen", "Igor", "Jean", "Ken", "Lewis",
];

// Tiny deterministic PRNG so the dataset is stable across reloads.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(7);

function ssn(): string {
  const a = 100 + Math.floor(rand() * 900);
  const b = 10 + Math.floor(rand() * 90);
  const c = 1000 + Math.floor(rand() * 9000);
  return `${a} ${b} ${c}`;
}

function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }

const CONDITIONS: Patient["condition"][] = ["Heart disease", "Viral infection", "Cancer", "Flu"];
const ACTIVITY: Patient["activity"][] = ["Low", "Medium", "High"];

function buildDataset(): Patient[] {
  const rows: Patient[] = [];
  for (let i = 0; i < 4000; i++) {
    const isVisible = i < VISIBLE_NAMES.length;
    let gender: Patient["gender"] = rand() < 0.5 ? "Male" : "Female";
    let condition: Patient["condition"] = pick(CONDITIONS);
    let name = isVisible ? VISIBLE_NAMES[i] : `P${i + 1}`;

    // pin Igor
    if (isVisible && name === "Igor") {
      gender = "Male";
      condition = "Cancer";
    }

    // small bias so women have slightly higher diabetes rate (Task 1 has a true answer)
    const diabBase = gender === "Female" ? 0.22 : 0.17;
    const diabetes: Patient["diabetes"] = rand() < diabBase ? "Yes" : "No";

    rows.push({
      name,
      ssn: ssn(),
      age: 18 + Math.floor(rand() * 70),
      gender,
      zip: String(10000 + Math.floor(rand() * 89999)),
      weight: Math.round((55 + rand() * 60) * 10) / 10,
      activity: pick(ACTIVITY),
      diabetes,
      condition,
    });
  }
  // Ensure Cancer count is around 42 for visible attack demo: bump to exactly 42.
  const cancerIdx = rows
    .map((r, i) => (r.condition === "Cancer" ? i : -1))
    .filter((i) => i >= 0);
  const targetCancer = 42;
  if (cancerIdx.length > targetCancer) {
    for (let k = targetCancer; k < cancerIdx.length; k++) {
      const i = cancerIdx[k];
      if (rows[i].name === "Igor") continue;
      rows[i].condition = pick(["Heart disease", "Viral infection", "Flu"]);
    }
  } else if (cancerIdx.length < targetCancer) {
    let need = targetCancer - cancerIdx.length;
    for (let i = 12; i < rows.length && need > 0; i++) {
      if (rows[i].condition !== "Cancer") {
        rows[i].condition = "Cancer";
        need--;
      }
    }
  }
  return rows;
}

export const PATIENTS: Patient[] = buildDataset();
export const VISIBLE_PATIENTS: Patient[] = PATIENTS.slice(0, 12);

export type Predicate = (p: Patient) => boolean;

export function getTrueCount(pred: Predicate): number {
  let c = 0;
  for (const p of PATIENTS) if (pred(p)) c++;
  return c;
}
export function getTrueSum(col: keyof Patient, pred: Predicate): number {
  let s = 0;
  for (const p of PATIENTS) if (pred(p)) s += Number(p[col]);
  return s;
}
export function getTrueMean(col: keyof Patient, pred: Predicate): number {
  const c = getTrueCount(pred);
  if (c === 0) return 0;
  return getTrueSum(col, pred) / c;
}

// Named predicates used in queries.
export const PREDICATES: Record<string, { label: string; fn: Predicate }> = {
  cancer: { label: "Condition = Cancer", fn: (p) => p.condition === "Cancer" },
  cancer_not_igor: { label: "Condition = Cancer AND Name ≠ Igor", fn: (p) => p.condition === "Cancer" && p.name !== "Igor" },
  female_diabetic: { label: "Gender = Female AND Diabetes = Yes", fn: (p) => p.gender === "Female" && p.diabetes === "Yes" },
  male_diabetic: { label: "Gender = Male AND Diabetes = Yes", fn: (p) => p.gender === "Male" && p.diabetes === "Yes" },
  female: { label: "Gender = Female", fn: (p) => p.gender === "Female" },
  male: { label: "Gender = Male", fn: (p) => p.gender === "Male" },
  diabetic: { label: "Diabetes = Yes", fn: (p) => p.diabetes === "Yes" },
  heart: { label: "Condition = Heart disease", fn: (p) => p.condition === "Heart disease" },
};
