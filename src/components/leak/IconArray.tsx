import { motion } from "framer-motion";
import { successOutOf100 } from "@/lib/leakData";

/**
 * A 10 by 10 grid of 100 dots. Exactly as many are filled as the current
 * attack success number, so risk can be counted instead of read.
 * Colours are a colourblind safe red against a neutral grey.
 */
export function IconArray({ epsilon }: { epsilon: number }) {
  const filled = Math.round(successOutOf100(epsilon));

  return (
    <div>
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
        {Array.from({ length: 100 }).map((_, i) => {
          const on = i < filled;
          return (
            <motion.span
              key={i}
              animate={{
                backgroundColor: on ? "#d1495b" : "#d8dbe0",
                scale: on ? 1 : 0.82,
              }}
              transition={{ duration: 0.25, delay: (i % 10) * 0.008 }}
              className="aspect-square w-full rounded-full"
            />
          );
        })}
      </div>
      <div className="mt-3 font-mono text-[11px] text-muted-foreground">
        <span className="text-danger">{filled} out of 100</span> times, the attacker guesses right.
      </div>
    </div>
  );
}
