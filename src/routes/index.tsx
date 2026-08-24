import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProgressRail, STAGES, type StageName } from "@/components/ProgressRail";
import Stage1Motivation from "@/stages/Stage1Motivation";
import Stage2Tutorial from "@/stages/Stage2Tutorial";
import StageLeak from "@/stages/StageLeak";
import { TransitionCurtain } from "@/components/sections/TransitionCurtain";
import { SectionRail } from "@/components/sections/SectionRail";
import { SECTIONS, CURTAINS, type StageId } from "@/lib/sections";
import { IntroHero } from "@/components/IntroHero";
import { useHashScroll } from "@/hooks/useHashScroll";


const STAGE_TO_ID: Record<StageName, StageId> = {
  Motivation: "motivation",
  Tutorial: "tutorial",
  Lab: "play",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Field Guide to Differential Privacy" },
      { name: "description", content: "An interactive scrollytelling explainer of differential privacy, in four acts: Motivation, Tutorial, Play, Test." },
      { property: "og:title", content: "A Field Guide to Differential Privacy" },
      { property: "og:description", content: "Learn DP by watching an attack succeed, then watching noise defeat it." },
    ],
  }),
  component: Index,
});

function Index() {
  const [stage, setStage] = useState<StageName>("Motivation");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const containerRefs = {
    Motivation: useRef<HTMLDivElement>(null),
    Tutorial: useRef<HTMLDivElement>(null),
    Lab: useRef<HTMLDivElement>(null),
  };

  // Deep-link support: scroll to window.location.hash after mount + on hashchange.
  useHashScroll();

  // Track active stage + active section via IntersectionObserver
  useEffect(() => {
    const handler = () => {
      const vh = window.innerHeight;

      // active stage: whichever container has most visible area
      let best: StageName = "Motivation"; let bestScore = -Infinity;
      for (const s of STAGES) {
        const el = containerRefs[s].current;
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        if (visible > bestScore) { bestScore = visible; best = s; }
      }
      setStage(best);

      // active section: the section anchor closest to the top of the viewport
      const targetLine = vh * 0.35;
      let bestSec: string | null = null; let bestDist = Infinity;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        // consider sections whose top has passed the target line and bottom is still below it
        if (r.top <= targetLine && r.bottom >= targetLine) {
          const d = Math.abs(r.top - targetLine);
          if (d < bestDist) { bestDist = d; bestSec = s.id; }
        }
      }
      setActiveSectionId(bestSec);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  const jump = (s: StageName) => containerRefs[s].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const jumpToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const curtainMT = CURTAINS.find((c) => c.afterStage === "motivation")!;
  const curtainTP = CURTAINS.find((c) => c.afterStage === "tutorial")!;

  return (
    <div className="min-h-screen bg-background">
      <ProgressRail active={stage} onJump={jump} />
      <SectionRail activeStage={STAGE_TO_ID[stage]} activeSectionId={activeSectionId} onJump={jumpToSection} />
      <main className="page-cap">
        <IntroHero onStart={() => containerRefs.Motivation.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />



        <div ref={containerRefs.Motivation}><Stage1Motivation onContinue={() => jump("Tutorial")} /></div>
        <TransitionCurtain id={curtainMT.id} top={curtainMT.top} bottom={curtainMT.bottom} />
        <div ref={containerRefs.Tutorial}><Stage2Tutorial onContinue={() => jump("Lab")} /></div>
        <TransitionCurtain id={curtainTP.id} top={curtainTP.top} bottom={curtainTP.bottom} />
        <div ref={containerRefs.Lab}><StageLeak /></div>
      </main>
      <footer className="border-t border-rule py-8 text-center text-xs text-muted-foreground">
        A small editorial study of differential privacy. Built for learners.
      </footer>
    </div>
  );
}
