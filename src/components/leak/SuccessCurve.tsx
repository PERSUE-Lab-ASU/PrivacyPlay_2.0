import { useMemo } from "react";
import { motion } from "framer-motion";
import { EPS_MAX, EPS_MIN, successOutOf100 } from "@/lib/leakData";

const W = 500;
const H = 270;
const PAD_L = 46;
const PAD_R = 18;
const PAD_T = 20;
const PAD_B = 44;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const LOG_MIN = Math.log10(EPS_MIN);
const LOG_MAX = Math.log10(EPS_MAX);

function xToPx(eps: number) {
  const t = (Math.log10(eps) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return PAD_L + Math.min(Math.max(t, 0), 1) * PLOT_W;
}
function yToPx(v: number) {
  return PAD_T + PLOT_H - ((v - 50) / 50) * PLOT_H;
}

/** Attack success out of 100 against epsilon, with a dot riding the curve. */
export function SuccessCurve({ epsilon }: { epsilon: number }) {
  const path = useMemo(() => {
    const N = 140;
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const eps = Math.pow(10, LOG_MIN + (i / N) * (LOG_MAX - LOG_MIN));
      pts.push(`${i === 0 ? "M" : "L"} ${xToPx(eps).toFixed(2)} ${yToPx(successOutOf100(eps)).toFixed(2)}`);
    }
    return pts.join(" ");
  }, []);

  const value = successOutOf100(epsilon);
  const axisY = PAD_T + PLOT_H;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[50, 60, 70, 80, 90, 100].map((t) => (
        <g key={t}>
          <line x1={PAD_L} y1={yToPx(t)} x2={PAD_L + PLOT_W} y2={yToPx(t)} stroke="var(--color-rule)" opacity={0.5} />
          <text x={PAD_L - 8} y={yToPx(t) + 3} textAnchor="end" fontSize={9} fontFamily="var(--font-mono)" className="fill-muted-foreground">
            {t}
          </text>
        </g>
      ))}

      <line x1={PAD_L} y1={yToPx(50)} x2={PAD_L + PLOT_W} y2={yToPx(50)} stroke="var(--color-primary)" strokeDasharray="4 4" />
      <text x={PAD_L + 6} y={yToPx(50) - 6} fontSize={9} fontFamily="var(--font-mono)" className="fill-primary">
        pure guessing, 50 out of 100
      </text>

      <line x1={PAD_L} y1={axisY} x2={PAD_L + PLOT_W} y2={axisY} stroke="var(--color-rule)" />
      {[0.1, 0.5, 1, 2, 4].map((t) => (
        <g key={t}>
          <line x1={xToPx(t)} y1={axisY} x2={xToPx(t)} y2={axisY + 4} stroke="var(--color-rule)" />
          <text x={xToPx(t)} y={axisY + 16} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" className="fill-muted-foreground">
            {t}
          </text>
        </g>
      ))}
      <text x={PAD_L + PLOT_W / 2} y={axisY + 34} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" className="fill-muted-foreground">
        epsilon →
      </text>
      <text
        x={12}
        y={PAD_T + PLOT_H / 2}
        transform={`rotate(-90, 12, ${PAD_T + PLOT_H / 2})`}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono)"
        className="fill-muted-foreground"
      >
        attack success out of 100
      </text>

      <motion.path
        d={path}
        fill="none"
        stroke="var(--color-danger)"
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />

      <motion.g
        animate={{ x: xToPx(epsilon), y: yToPx(value) }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <circle r={12} fill="var(--color-danger)" opacity={0.18} />
        <circle r={6} fill="var(--color-danger)" />
        <rect x={-38} y={-36} width={76} height={21} rx={6} fill="var(--color-paper)" stroke="var(--color-danger)" />
        <text y={-21} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" className="fill-danger" style={{ fontWeight: 700 }}>
          {Math.round(value)} of 100
        </text>
      </motion.g>
    </svg>
  );
}
