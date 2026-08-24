import { motion } from "framer-motion";

/** A caption box that flies in from a side and stays put once it lands. */
export function FlyCaption({
  from = "left",
  delay = 0,
  focus = false,
  children,
}: {
  from?: "left" | "right" | "bottom";
  delay?: number;
  focus?: boolean;
  children: React.ReactNode;
}) {
  const offset = from === "left" ? { x: -48, y: 0 } : from === "right" ? { x: 48, y: 0 } : { x: 0, y: 36 };

  return (
    <motion.div
      initial={{ opacity: 0, ...offset, rotate: from === "bottom" ? 0 : from === "left" ? -2 : 2 }}
      whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: "spring", bounce: 0.35, duration: 0.7, delay }}
      className={
        focus
          ? "rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4 font-serif text-xl text-primary shadow-[0_0_28px_-8px_var(--color-primary)] sm:text-2xl"
          : "rounded-xl border border-rule bg-paper px-4 py-3 text-sm text-ink shadow-sm sm:text-base"
      }
    >
      {children}
    </motion.div>
  );
}
