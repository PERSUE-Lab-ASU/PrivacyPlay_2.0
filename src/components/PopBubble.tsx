import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type BubblePosition =
  | "above"
  | "upper-left"
  | "upper-right"
  | "lower-left"
  | "lower-right"
  | "below"
  | "centered";

export type BubbleVariant = "speech" | "thought" | "sharp" | "plain";

type Props = {
  children: ReactNode;
  position?: BubblePosition;
  variant?: BubbleVariant;
  size?: "sm" | "md" | "lg";
  tailFrom?: "left" | "right" | "bottom" | "top" | "none";
  className?: string;
};

/** A comic style pop-up bubble. Positions itself absolutely relative to a parent
 *  with `position: relative`. Use `centered` for free-floating bubbles. */
export function PopBubble({
  children,
  position = "centered",
  variant = "speech",
  size = "md",
  tailFrom = "bottom",
  className = "",
}: Props) {
  const positionStyles: Record<BubblePosition, string> = {
    above: "left-1/2 -translate-x-1/2 -top-4 -translate-y-full",
    "upper-left": "right-[58%] -top-4 -translate-y-full",
    "upper-right": "left-[58%] -top-4 -translate-y-full",
    "lower-left": "right-[58%] -bottom-4 translate-y-full",
    "lower-right": "left-[58%] -bottom-4 translate-y-full",
    below: "left-1/2 -translate-x-1/2 -bottom-4 translate-y-full",
    centered: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  };
  const sizeStyles: Record<"sm" | "md" | "lg", string> = {
    sm: "px-3 py-1.5 text-sm max-w-[16ch]",
    md: "px-4 py-2 text-base max-w-[24ch]",
    lg: "px-5 py-3 text-lg sm:text-xl max-w-[34ch]",
  };
  const variantStyles: Record<BubbleVariant, string> = {
    speech: "bg-paper border border-primary/40 rounded-2xl shadow-md",
    thought: "bg-paper border border-primary/40 rounded-[2rem] shadow-md",
    sharp: "bg-paper border-2 border-danger/70 rounded-md shadow-md",
    plain: "bg-paper/95 border border-rule rounded-xl shadow",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.5 } }}
      transition={{ duration: 0.4, type: "spring", stiffness: 220, damping: 18 }}
      className={`absolute ${positionStyles[position]} ${sizeStyles[size]} ${variantStyles[variant]} text-ink font-serif leading-snug pointer-events-none z-20 ${className}`}
      style={{ transformOrigin: "center" }}
    >
      {children}
      {variant === "thought" && tailFrom !== "none" && (
        <>
          <span className="absolute -bottom-2 left-6 w-3 h-3 rounded-full bg-paper border border-primary/40" />
          <span className="absolute -bottom-4 left-9 w-2 h-2 rounded-full bg-paper border border-primary/40" />
        </>
      )}
      {variant === "speech" && tailFrom !== "none" && (
        <span
          className={`absolute w-3 h-3 bg-paper border-primary/40 rotate-45 ${
            tailFrom === "bottom"
              ? "border-b border-r -bottom-1.5 left-8"
              : tailFrom === "top"
                ? "border-t border-l -top-1.5 left-8"
                : tailFrom === "left"
                  ? "border-l border-b -left-1.5 top-6"
                  : "border-r border-t -right-1.5 top-6"
          }`}
        />
      )}
      {variant === "sharp" && tailFrom !== "none" && (
        <span
          className={`absolute w-3 h-3 bg-paper border-danger/70 rotate-45 ${
            tailFrom === "bottom"
              ? "border-b-2 border-r-2 -bottom-1.5 left-8"
              : tailFrom === "left"
                ? "border-l-2 border-b-2 -left-1.5 top-6"
                : "border-r-2 border-t-2 -right-1.5 top-6"
          }`}
        />
      )}
    </motion.div>
  );
}

export function holdMsForText(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(2500, 2200 + words * 60);
}
