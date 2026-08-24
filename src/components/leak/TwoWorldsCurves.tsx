import { useMemo } from "react";
import { motion } from "framer-motion";
import { laplacePdf } from "@/lib/dp";

const W = 460;
const H = 210;
const PAD_L = 14;
const PAD_R = 14;
const PAD_T = 28;
const PAD_B = 44;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

/** Two worlds, one hidden person or none, seen through noise. */
export function TwoWorldsCurves({ epsilon, showEps = false }: { epsilon: number; showEps?: boolean }) {
  const b = 1 / epsilon;
  const xMin = -4;
  const xMax = 5;

  const xToPx = (x: number) => PAD_L + ((Math.min(Math.max(x, xMin), xMax) - xMin) / (xMax - xMin)) * PLOT_W;
  const peak = laplacePdf(0, 0, b);

  const build = (mu: number) => {
    const N = 200;
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin);
      const y = laplacePdf(x, mu, b);
      const px = PAD_L + (i / N) * PLOT_W;
      const py = PAD_T + PLOT_H - (y / peak) * (PLOT_H - 6);
      pts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`);
    }
    return pts.join(" ");
  };

  const pathB = useMemo(() => build(0), [b]);
  const pathA = useMemo(() => build(1), [b]);
  const axisY = PAD_T + PLOT_H;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={PAD_L} y1={axisY} x2={PAD_L + PLOT_W} y2={axisY} stroke="var(--color-rule)" />

      <line x1={xToPx(0.5)} y1={PAD_T - 8} x2={xToPx(0.5)} y2={axisY} stroke="var(--color-ink)" strokeDasharray="4 4" opacity={0.55} />
      <text x={xToPx(0.5)} y={PAD_T - 14} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" className="fill-ink" opacity={0.7}>
        cutoff 0.5
      </text>

      <motion.path d={pathB} fill="var(--color-primary)" opacity={0.1} animate={{ d: pathB }} transition={{ duration: 0.35 }} />
      <motion.path d={pathA} fill="var(--color-danger)" opacity={0.1} animate={{ d: pathA }} transition={{ duration: 0.35 }} />
      <motion.path d={pathB} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} animate={{ d: pathB }} transition={{ duration: 0.35 }} />
      <motion.path d={pathA} fill="none" stroke="var(--color-danger)" strokeWidth={2.5} animate={{ d: pathA }} transition={{ duration: 0.35 }} />

      <text x={xToPx(-1.6)} y={axisY + 16} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" className="fill-primary">
        world B, gap 0
      </text>
      <text x={xToPx(2.8)} y={axisY + 16} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" className="fill-danger">
        world A, gap 1
      </text>
      <text x={PAD_L + PLOT_W / 2} y={axisY + 34} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" className="fill-muted-foreground">
        where the noisy gap might land
      </text>

      {showEps && (
        <text x={PAD_L + PLOT_W} y={PAD_T - 14} textAnchor="end" fontSize={10} fontFamily="var(--font-mono)" className="fill-muted-foreground">
          epsilon {epsilon.toFixed(2)}
        </text>
      )}
    </svg>
  );
}
