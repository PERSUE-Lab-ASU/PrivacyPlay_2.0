# Plan: Section System + Horizontal Panning

Five focused changes. Content stays as authored; delivery mechanics change.

## 1. Renumber to 20 sections (continuous across all acts)

Update `src/lib/sections.ts` to match the new list. Key change: **absorb old S03 (Meet Dr. Jim) and S04 (Asking the System) into a single horizontal S02 "Inside the Building"** with 3 panels (table / Dr. Jim / Answer Tool). Renumber everything downstream so numbers run 01–20 continuously.

New numbering:

```text
MOTIVATION  01 Hospital · 02 Inside the Building (horizontal, 3 panels) ·
            03 Meet Tommy · 04 The Attack · 05 What Just Happened
TUTORIAL    06 The Fix · 07 Laplace Curve · 08 Noise Dial ·
            09 Narrow and Wide (horizontal, 3 panels) · 10 Delta ·
            11 Epsilon · 12 Composition ·
            13 What You Know Now (horizontal, 3 panels)
PLAY        14 Your Turn · 15 Task One · 16 Task Two · 17 Task Three
TEST        18 What You Learned
```

Wait — reader wants 20 sections. Reconciling with their list: I'll follow their exact list (01–20) verbatim. That means S02 combines Inside the Building + Dr. Jim scenes (their 02/03/04 → my 02), and the rest shifts. I'll use their exact 20-item numbering.

Add each section's subtitle string to the registry so `SectionHeader` reads them from a single source.

## 2. Strengthen `SectionHeader` (already exists, needs polish)

- Grow to ~70vh min-height (already ~92vh — keep).
- Number prefix already spaced; verify format `S E C T I O N 0 9`.
- Title already cascades at 30ms — good.
- Add centered layout option and a **center-outward 120px rule** (currently a left-anchored 800ms line). Swap to center-origin via `scaleX` from center, 700ms.
- Confirm subtitle timing 400ms after title finishes.

## 3. Right-edge `SectionRail` — already exists

Verify it uses the new registry and auto-hide/tooltip already works. Adjust dot styling if needed. Numbers within the current stage still form the local rail.

## 4. Stronger act curtains — `TransitionCurtain`

Rewrite to be a scroll-locked 2-step, full-bleed section:
- Background transitions cream → indigo as it enters, indigo → cream as it exits (driven by scroll progress on the outer container).
- Small coral mono "A C T T W O" label at top.
- Two lines cross-fade in place (line 1 out, line 2 in) — never stacked.
- Uses `ScrollLockSection` under the hood with 2 steps.

## 5. New `HorizontalPanSection` polish

Existing component pans on X already. Add:
- Bottom progress bar (already has one — verify).
- Three small dots above the progress bar showing active panel (coral filled).
- Pulsing right-chevron in right margin, fades when last panel active.
- Per-panel `IntersectionObserver` (>50% visible) → fires an `onPanelActive(i)` prop so children animate in once.
- `will-change: transform` toggled on/off via `inView` state (already partially done).
- Mobile (<768px) and `prefers-reduced-motion`: stacked vertical, entrance animations still fire via IO (already handled for reduced-motion; add same for mobile with a `useMediaQuery`).

## 6. Wire S02 as one horizontal section

Create `src/components/InsideTheBuilding.tsx` with 3 panels:
- **Panel 1**: DataTable + "Only the system can see these rows." Rows slide up staggered 60ms; "…and 4,000 more" fades in last at 40% opacity.
- **Panel 2**: Dr. Jim illustration (existing `Characters.tsx`) center, 6 question bubbles pop around him staggered 400ms with bounce, persistent.
- **Panel 3**: `AnswerTool` card with 3 pre-baked count queries (women=1247, men=1089, active=412). Question types out, pause 300ms, number counts up from 0.

Extract the existing Stage1 subsections that this replaces; remove their now-duplicated top-level scenes so we don't render twice.

## 7. Wire S09 (Narrow and Wide) as horizontal

`TwoCurvesShowdown` is currently one big scene. Split into 3 panel props (narrow world / wide world / side-by-side logs with range bars) fed into `HorizontalPanSection`.

## 8. Wire S13 (What You Know Now) as horizontal

Build `DeltaEpsilonRecap.tsx` with 3 panels: Delta card / Epsilon card / together (two mini curves side by side, summary line). Content pulled from existing prose in Stage2.

## 9. Content fix — Test Q4

Edit `Stage4Test.tsx`: replace the MAX question with the Composition question. Three options, correct = "Each one must spend less epsilon, so each answer gets noisier."

## 10. AnswerTool badge

`AnswerTool.tsx`: change "aggregate only" badge text → "counts only". Grep for any other "aggregate" references.

## Files touched

New:
- `src/components/InsideTheBuilding.tsx`
- `src/components/DeltaEpsilonRecap.tsx`

Edited:
- `src/lib/sections.ts` (new 20-section list + subtitles)
- `src/components/sections/SectionHeader.tsx` (center-outward rule)
- `src/components/sections/HorizontalPanSection.tsx` (dots, chevron, onPanelActive)
- `src/components/sections/TransitionCurtain.tsx` (full-bleed cream↔indigo, act label, cross-fade lines, 2-step lock)
- `src/components/AnswerTool.tsx` (badge text)
- `src/components/TwoCurvesShowdown.tsx` (split into 3 panels for horizontal mode)
- `src/stages/Stage1Motivation.tsx` (remove old Dr. Jim + AnswerTool scenes, they now live in InsideTheBuilding)
- `src/stages/Stage2Tutorial.tsx` (swap TwoCurvesShowdown wrapper; add DeltaEpsilonRecap horizontal)
- `src/stages/Stage4Test.tsx` (Q4 replace)
- `src/routes/index.tsx` (mount 3 curtains between acts; wrap new horizontal sections)

Not touched: bubble copy, math, characters, colors, fonts, telemetry event names.

## Non-goals

- No perf rewrite of existing dot-cloud SVG → canvas this turn (Phase 5 territory).
- No changes to Stage 3 task logic.
- No new content in stages besides the Q4 swap.

## Rollout

Ship as a single batch. Verify build passes; spot-check the horizontal S02 in preview at desktop and mobile widths.
