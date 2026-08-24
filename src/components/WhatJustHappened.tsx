import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface WhatJustHappenedProps {
  log: (event_type: string, event_data?: Record<string, unknown>) => void;
}


const SENTENCES = [
  { text: "What you just saw is called a differencing attack.", key: "diff" },
  { text: "The attacker never opened the database. They could not see a single record.", key: "no-open" },
  { text: "Instead, they asked the system many questions, each one allowed and harmless on its own.", key: "many-questions" },
  { text: "Then they simply took the difference between the answers.", key: "difference" },
  { text: "That difference pointed straight at one person.", key: "one-person", highlight: true, tone: "danger" },
  { text: "So locking the data away is not enough.", key: "not-enough" },
  { text: "People can still uncover private facts by asking enough questions and doing a little math on the answers.", key: "uncover" },
  { text: "The fix is to stop giving back perfectly exact answers.", key: "stop-exact" },
  { text: "We add a small amount of noise to each response, just enough to hide any single person.", key: "add-noise", highlight: true, tone: "primary" },
  { text: "That is the idea we will build next.", key: "build-next" },
];

const CARD_DELAY = 0.2;
const LINE_DELAY = 0.7;
const LINE_INTERVAL = 3000;

export function WhatJustHappened({ log: _log }: WhatJustHappenedProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.35 });
  const [current, setCurrent] = useState(0);
  const [cardReady, setCardReady] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => setCardReady(true), CARD_DELAY * 1000);
    return () => clearTimeout(timer);
  }, [inView]);

  useEffect(() => {
    if (!cardReady || current >= SENTENCES.length - 1) return;
    const timer = setTimeout(() => {
      setCurrent((i) => Math.min(i + 1, SENTENCES.length - 1));
    }, LINE_INTERVAL);
    return () => clearTimeout(timer);
  }, [cardReady, current]);



  return (
    <div ref={rootRef} className="w-full px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 32, scale: 0.97 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto rounded-3xl border border-rule bg-gradient-to-br from-primary/[0.04] via-paper to-secondary/[0.03] p-8 sm:p-12 shadow-xl shadow-ink/5 backdrop-blur-sm"
      >
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary to-danger origin-center"
          />
        </div>


        <div className="space-y-3 sm:space-y-4 text-center">
          {SENTENCES.map((s, i) => {
            const visible = i <= current;
            const highlighted = s.highlight;
            const toneClass =
              s.tone === "danger"
                ? "text-danger"
                : s.tone === "primary"
                ? "text-primary"
                : "text-ink";
            const sizeClass = highlighted ? "text-lg sm:text-xl" : "text-base sm:text-lg";
            const weightClass = highlighted ? "font-semibold" : "font-normal";

            return (
              <motion.p
                key={s.key}
                initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
                animate={
                  visible
                    ? { opacity: 1, y: 0, filter: "blur(0px)" }
                    : { opacity: 0, y: 18, filter: "blur(4px)" }
                }
                transition={{
                  duration: 0.8,
                  delay: visible ? LINE_DELAY + i * 0.06 : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`font-serif ${sizeClass} ${weightClass} ${toneClass} leading-relaxed`}
              >
                {s.text}
              </motion.p>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

