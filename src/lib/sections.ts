// Central registry for the 20 sections of the scrollytelling essay.

export type StageId = "motivation" | "tutorial" | "play" | "test";

export type DeliveryMode =
  | "header-only"
  | "scroll-lock"
  | "horizontal"
  | "sticky-graphic"
  | "curtain";

export interface SectionDef {
  num: string;
  id: string;
  stage: StageId;
  title: string;
  subtitle: string;
  mode: DeliveryMode;
  steps?: number;
  stepVh?: number;
  interactiveRelease?: boolean;
}

export const SECTIONS: SectionDef[] = [
  // MOTIVATION (1-7)
  { num: "01", id: "the-hospital", stage: "motivation", title: "The Hospital", subtitle: "One town. One database.", mode: "header-only" },
  { num: "02", id: "inside-the-hospital", stage: "motivation", title: "Inside the Hospital", subtitle: "The private records only the hospital can see.", mode: "horizontal" },
  { num: "03", id: "why-this-data-matters", stage: "motivation", title: "Why This Data Matters", subtitle: "Useful, and dangerous.", mode: "header-only" },
  { num: "04", id: "the-core-question", stage: "motivation", title: "The Core Question", subtitle: "What we're trying to solve.", mode: "header-only" },
  { num: "05", id: "meet-tommy", stage: "motivation", title: "Meet Tommy", subtitle: "Not everyone asks in good faith.", mode: "header-only" },
  { num: "06", id: "the-attack", stage: "motivation", title: "The Attack", subtitle: "Two harmless questions.", mode: "scroll-lock" },
  { num: "07", id: "what-just-happened", stage: "motivation", title: "What Just Happened", subtitle: "The data was safe. The answers were not.", mode: "header-only" },

  // TUTORIAL (8-15)
  { num: "08", id: "the-fix", stage: "tutorial", title: "The Fix", subtitle: "Blur the answer, not the data.", mode: "header-only" },
  { num: "09", id: "the-noise-has-a-shape", stage: "tutorial", title: "The Noise Has a Shape", subtitle: "The shape we just saw is called the Laplace curve.", mode: "header-only" },
  { num: "10", id: "the-noise-dial", stage: "tutorial", title: "The Noise Dial", subtitle: "Turning the width up and down.", mode: "header-only" },
  { num: "11", id: "narrow-and-wide", stage: "tutorial", title: "Narrow and Wide", subtitle: "Two settings. Two worlds.", mode: "header-only" },
  { num: "13", id: "meet-epsilon", stage: "tutorial", title: "Meet Epsilon (ε): Your Dial", subtitle: "Your dial.", mode: "header-only" },

  { num: "14", id: "composition", stage: "tutorial", title: "Composition", subtitle: "Every ask leaks a little.", mode: "header-only" },
  { num: "15", id: "what-you-know-now", stage: "tutorial", title: "What You Know Now", subtitle: "The whole toolkit.", mode: "header-only" },

  // THE LEAK (16)
  { num: "16", id: "the-leak", stage: "play", title: "T H E  L E A K", subtitle: "How published numbers can expose one person.", mode: "header-only" },

];

export const CURTAINS = [
  { id: "curtain-mt", afterStage: "motivation" as StageId, top: "You saw the problem", bottom: "Now the fix" },
  { id: "curtain-tp", afterStage: "tutorial" as StageId, top: "You know the tools", bottom: "Now use them" },
];

export function sectionsForStage(stage: StageId): SectionDef[] {
  return SECTIONS.filter((s) => s.stage === stage);
}

export function findSection(id: string): SectionDef | undefined {
  return SECTIONS.find((s) => s.id === id);
}

/** Ordered list of section ids (used to know what comes before/after the-attack). */
export const SECTION_ORDER: string[] = SECTIONS.map((s) => s.id);

/** True if `id` refers to a section that appears after the scroll-locked attack. */
export function isAfterAttack(id: string): boolean {
  const attackIdx = SECTION_ORDER.indexOf("the-attack");
  const idx = SECTION_ORDER.indexOf(id);
  return attackIdx >= 0 && idx > attackIdx;
}
