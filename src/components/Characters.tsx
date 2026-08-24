import { motion } from "framer-motion";

type CharProps = {
  size?: number;
  className?: string;
  glow?: "calm" | "danger" | "none";
};

/** Dr. Jim: male researcher, lab coat, glasses, neat hair. */
export function DrJim({ size = 160, className = "", glow = "none" }: CharProps) {
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {glow === "calm" && (
        <div
          className="absolute inset-0 rounded-full -z-10"
          style={{ background: "radial-gradient(circle, color-mix(in oklch, var(--color-primary) 18%, transparent), transparent 65%)" }}
        />
      )}
      <svg viewBox="0 0 160 160" width={size} height={size}>
        {/* Lab coat shoulders */}
        <path d="M30 150 Q30 110 60 100 L100 100 Q130 110 130 150 Z" fill="#FAFAFA" stroke="var(--color-ink)" strokeWidth="1.5" />
        {/* Coat collar */}
        <path d="M60 100 L80 118 L100 100 L92 100 L80 110 L68 100 Z" fill="var(--color-ink)" />
        {/* Stethoscope hint */}
        <path d="M68 102 Q80 130 92 102" stroke="var(--color-ink)" strokeWidth="1" fill="none" />
        <circle cx="80" cy="130" r="3" fill="#FB7185" />
        {/* Neck */}
        <rect x="74" y="86" width="12" height="14" fill="#F5D6BD" />
        {/* Hair bun back */}
        <circle cx="80" cy="55" r="34" fill="#1A1A2E" />
        {/* Face */}
        <path d="M58 60 Q58 92 80 92 Q102 92 102 60 Q102 40 80 40 Q58 40 58 60 Z" fill="#F5D6BD" stroke="var(--color-ink)" strokeWidth="1" />
        {/* Hair pulled back: side strands */}
        <path d="M58 55 Q56 75 64 86" fill="#1A1A2E" />
        <path d="M102 55 Q104 75 96 86" fill="#1A1A2E" />
        {/* Bun on top/back */}
        <circle cx="105" cy="38" r="9" fill="#1A1A2E" />
        {/* Bangs */}
        <path d="M62 48 Q72 38 86 42 Q98 44 100 50 Q90 46 80 48 Q70 50 62 48 Z" fill="#1A1A2E" />
        {/* Round glasses */}
        <circle cx="71" cy="63" r="7" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />
        <circle cx="89" cy="63" r="7" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />
        <line x1="78" y1="63" x2="82" y2="63" stroke="var(--color-ink)" strokeWidth="1.5" />
        {/* Eyes through glasses */}
        <circle cx="71" cy="63" r="1.4" fill="var(--color-ink)" />
        <circle cx="89" cy="63" r="1.4" fill="var(--color-ink)" />
        {/* Slight smile */}
        <path d="M73 78 Q80 82 87 78" stroke="var(--color-ink)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* Coat pocket */}
        <rect x="38" y="125" width="14" height="10" fill="none" stroke="var(--color-ink)" strokeWidth="0.8" />
      </svg>
    </motion.div>
  );
}

/** Tommy: hooded snoop, shadowed face. */
export function Tommy({ size = 160, className = "", glow = "none" }: CharProps) {
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {glow === "danger" && (
        <div
          className="absolute inset-0 rounded-full -z-10"
          style={{ background: "radial-gradient(circle, color-mix(in oklch, var(--color-danger) 20%, transparent), transparent 65%)" }}
        />
      )}
      <svg viewBox="0 0 160 160" width={size} height={size}>
        {/* Body / hoodie */}
        <path d="M28 150 Q28 110 56 100 L104 100 Q132 110 132 150 Z" fill="#1F2937" stroke="#0F172A" strokeWidth="1.5" />
        {/* Hood front (pulled up around head) */}
        <path d="M40 70 Q40 26 80 22 Q120 26 120 70 Q120 90 110 95 L50 95 Q40 90 40 70 Z" fill="#111827" stroke="#0F172A" strokeWidth="1.5" />
        {/* Face shadow under hood */}
        <ellipse cx="80" cy="68" rx="28" ry="30" fill="#3A3F4B" />
        {/* Subtle face: nose, mouth (mostly shadow) */}
        <circle cx="73" cy="62" r="1.8" fill="#0F172A" />
        <circle cx="87" cy="62" r="1.8" fill="#0F172A" />
        <path d="M75 80 Q80 82 85 80" stroke="#0F172A" strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* Hood shadow line */}
        <path d="M52 76 Q80 96 108 76" fill="none" stroke="#0F172A" strokeWidth="2" opacity="0.6" />
        {/* Drawstrings */}
        <line x1="68" y1="96" x2="66" y2="120" stroke="#9CA3AF" strokeWidth="1.5" />
        <line x1="92" y1="96" x2="94" y2="120" stroke="#9CA3AF" strokeWidth="1.5" />
        <circle cx="66" cy="121" r="1.5" fill="#9CA3AF" />
        <circle cx="94" cy="121" r="1.5" fill="#9CA3AF" />
        {/* Zipper */}
        <line x1="80" y1="100" x2="80" y2="150" stroke="#0F172A" strokeWidth="1" />
      </svg>
    </motion.div>
  );
}

/** Anonymous researcher silhouette (used for crowd scenes). */
export function ResearcherSilhouette({ size = 80, color = "#94A3B8", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className}>
      <circle cx="40" cy="28" r="14" fill={color} />
      <path d="M14 78 Q14 50 40 48 Q66 50 66 78 Z" fill={color} />
    </svg>
  );
}
