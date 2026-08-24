import { motion, AnimatePresence } from "framer-motion";
import { VISIBLE_PATIENTS, type Patient } from "@/lib/dataset";
import { Lock } from "lucide-react";

type SensitiveCol = keyof Patient | null;

type Props = {
  staggered?: boolean;
  sensitiveCol?: SensitiveCol;
  highlightPredicate?: (p: Patient) => boolean;
  pulseName?: string;
  removeIgor?: boolean;
  revealIgorCondition?: boolean;
};

const COLS: { key: keyof Patient; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "ssn", label: "SSN" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "zip", label: "Zip" },
  { key: "weight", label: "Weight" },
  { key: "activity", label: "Activity" },
  { key: "diabetes", label: "Diabetes" },
  { key: "condition", label: "Condition" },
];

export function DataTable({
  staggered = false,
  sensitiveCol = null,
  highlightPredicate,
  pulseName,
  removeIgor = false,
  revealIgorCondition = false,
}: Props) {
  const rows = removeIgor ? VISIBLE_PATIENTS.filter((p) => p.name !== "Igor") : VISIBLE_PATIENTS;

  return (
    <div className="rounded-lg border border-rule bg-paper overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={`px-2 sm:px-3 py-2 text-left font-medium tracking-wide uppercase text-[10px] transition-colors duration-500 ${
                    sensitiveCol === c.key ? "text-danger" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {sensitiveCol === c.key && <Lock className="w-3 h-3" />}
                    {c.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {rows.map((p, i) => {
                const isMatch = highlightPredicate?.(p) ?? false;
                const isPulse = pulseName && p.name === pulseName;
                return (
                  <motion.tr
                    key={p.name}
                    layout
                    initial={staggered ? { opacity: 0, x: -12 } : false}
                    animate={{
                      opacity: 1,
                      x: 0,
                      backgroundColor: isPulse
                        ? "color-mix(in oklch, var(--color-danger) 18%, transparent)"
                        : isMatch
                          ? "color-mix(in oklch, var(--color-primary) 8%, transparent)"
                          : "rgba(0,0,0,0)",
                    }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.5, delay: staggered ? i * 0.05 : 0, ease: [0.22, 1, 0.36, 1] }}
                    className="border-t border-rule/70"
                  >
                    {COLS.map((c) => {
                      const dim = sensitiveCol && sensitiveCol !== c.key;
                      const isSens = sensitiveCol === c.key;
                      const isIgorCondCell = p.name === "Igor" && c.key === "condition";
                      return (
                        <td
                          key={c.key}
                          className={`px-2 sm:px-3 py-2 transition-all duration-500 ${
                            dim ? "opacity-25" : "opacity-100"
                          } ${isSens ? "text-danger font-medium" : ""} ${c.key === "ssn" || c.key === "name" ? "font-mono" : ""}`}
                        >
                          {isIgorCondCell && revealIgorCondition ? (
                            <motion.span
                              key="reveal"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="px-1.5 py-0.5 rounded bg-danger/15 text-danger font-medium"
                            >
                              Cancer
                            </motion.span>
                          ) : isIgorCondCell ? (
                            <span className="text-muted-foreground italic">private</span>
                          ) : (
                            String(p[c.key])
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 text-xs text-muted-foreground border-t border-rule/70 bg-muted/30 italic">
        … 4,000 more rows
      </div>
    </div>
  );
}
