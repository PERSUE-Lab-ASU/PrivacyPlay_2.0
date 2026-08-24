import { motion } from "framer-motion";

const STAGES = ["Motivation", "Tutorial", "Lab"] as const;
export type StageName = (typeof STAGES)[number];

type Props = {
  active: StageName;
  onJump: (s: StageName) => void;
};

export function ProgressRail({ active, onJump }: Props) {
  const activeIdx = STAGES.indexOf(active);
  const fillPct = ((activeIdx + 1) / STAGES.length) * 100;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-paper/85 backdrop-blur border-b border-rule">
      <div className="relative h-1 bg-rule/40">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary"
          initial={false}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <nav className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:px-6 sm:py-3">
        <div className="min-w-0 truncate font-serif text-[0.8rem] leading-tight text-primary tracking-tight sm:text-base">
          <span className="hidden sm:inline">A Field Guide to </span>
          <span className="italic">Differential Privacy</span>
        </div>
        <ul className="flex shrink-0 items-center gap-1 text-[0.7rem] sm:gap-2 sm:text-sm">

          {STAGES.map((s, i) => {
            const reached = i <= activeIdx;
            const current = i === activeIdx;
            return (
              <li key={s}>
                <button
                  onClick={() => onJump(s)}
                  className={`whitespace-nowrap rounded-full px-2 py-1 transition-all duration-300 sm:px-3 ${
                    current
                      ? "bg-primary text-primary-foreground"
                      : reached
                        ? "text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <span className="font-mono mr-1 opacity-60">{i + 1}</span>
                  {s}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export { STAGES };
