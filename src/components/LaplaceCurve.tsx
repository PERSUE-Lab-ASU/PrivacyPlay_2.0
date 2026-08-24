import { useMemo } from "react";
import { motion } from "framer-motion";
import { laplacePdf } from "@/lib/dp";

type Props = {
  mu: number;
  b: number;
  width?: number;
  height?: number;
  samples?: number[]; // x values to mark as dots
  domain?: [number, number];
  showTrueMark?: boolean;
  showAxes?: boolean;
  xLabel?: string;
  yLabel?: string;
  liveBadge?: { label: string; value: string | number; color?: "primary" | "danger" };
};

export function LaplaceCurve({
  mu, b, width = 520, height = 220, samples = [],
  domain, showTrueMark = true,
  showAxes = true,
  xLabel = "noisy answer value",
  yLabel = "how likely",
  liveBadge,
}: Props) {
  const padL = showAxes ? 38 : 8;
  const padB = showAxes ? 36 : 24;
  const padT = 18;
  const padR = 12;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const [xMin, xMax] = useMemo<[number, number]>(() => {
    if (domain) return domain;
    const span = Math.max(8, 8 * b);
    return [mu - span, mu + span];
  }, [domain, mu, b]);

  const path = useMemo(() => {
    const N = 160;
    const peak = laplacePdf(mu, mu, b);
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin);
      const y = laplacePdf(x, mu, b);
      const px = padL + (i / N) * plotW;
      const py = padT + plotH - (y / peak) * (plotH - 4);
      pts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`);
    }
    return pts.join(" ");
  }, [mu, b, xMin, xMax, plotW, plotH, padL, padT]);

  const fillPath = useMemo(
    () => `${path} L ${padL + plotW} ${padT + plotH} L ${padL} ${padT + plotH} Z`,
    [path, padL, plotW, padT, plotH],
  );

  const xToPx = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * plotW;

  const ticks: number[] = [];
  const step = Math.max(1, Math.round((xMax - xMin) / 8));
  for (let v = Math.ceil(xMin / step) * step; v <= xMax; v += step) ticks.push(v);

  const axisY = padT + plotH;

  return (
    <svg viewBox={`0 0 ${width} ${height + 8}`} className="w-full h-auto">
      {/* y axis label */}
      {showAxes && (
        <motion.g
          initial={{ opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <text
            x={10}
            y={padT + plotH / 2}
            transform={`rotate(-90, 10, ${padT + plotH / 2})`}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {yLabel} →
          </text>
          {/* y axis line */}
          <line x1={padL} y1={padT} x2={padL} y2={axisY} stroke="var(--color-rule)" strokeWidth={1} />
        </motion.g>
      )}

      {/* x axis */}
      <line x1={padL} y1={axisY} x2={padL + plotW} y2={axisY} stroke="var(--color-rule)" strokeWidth={1} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={xToPx(t)} y1={axisY} x2={xToPx(t)} y2={axisY + 4} stroke="var(--color-rule)" />
          <text x={xToPx(t)} y={axisY + 16} textAnchor="middle" className="fill-muted-foreground" fontSize={10} fontFamily="var(--font-mono)">
            {Math.round(t)}
          </text>
        </g>
      ))}
      {showAxes && (
        <motion.text
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          x={padL + plotW / 2}
          y={axisY + 32}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={10}
          fontFamily="var(--font-mono)"
        >
          {xLabel} →
        </motion.text>
      )}

      {/* true mark */}
      {showTrueMark && (
        <g>
          <line x1={xToPx(mu)} y1={padT} x2={xToPx(mu)} y2={axisY} stroke="var(--color-primary)" strokeWidth={1} strokeDasharray="3 3" />
          <text x={xToPx(mu)} y={padT - 4} textAnchor="middle" fontSize={10} className="fill-primary" fontFamily="var(--font-mono)">
            true = {mu.toFixed(mu % 1 === 0 ? 0 : 1)}
          </text>
        </g>
      )}

      {/* filled area underneath */}
      <motion.path
        d={fillPath}
        fill="var(--color-primary)"
        opacity={0.08}
        initial={false}
        animate={{ d: fillPath }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* curve — draw-on first time, then morph */}
      <motion.path
        d={path}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        animate={{ d: path }}
        transition={{ pathLength: { duration: 1.1, ease: "easeOut" }, opacity: { duration: 0.3 }, d: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
      />

      {/* live badge (b, ε etc) */}
      {liveBadge && (
        <motion.g
          key={`${liveBadge.label}-${liveBadge.value}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
        >
          <rect
            x={width - padR - 96}
            y={padT}
            width={92}
            height={32}
            rx={8}
            fill="var(--color-paper)"
            stroke={liveBadge.color === "danger" ? "var(--color-danger)" : "var(--color-primary)"}
            strokeWidth={1.5}
          />
          <text x={width - padR - 88} y={padT + 13} fontSize={8} fontFamily="var(--font-mono)" className="fill-muted-foreground" textAnchor="start">
            {liveBadge.label}
          </text>
          <text
            x={width - padR - 50}
            y={padT + 26}
            fontSize={14}
            fontFamily="var(--font-mono)"
            className={liveBadge.color === "danger" ? "fill-danger" : "fill-primary"}
            textAnchor="middle"
            style={{ fontWeight: 700 }}
          >
            {liveBadge.value}
          </text>
        </motion.g>
      )}

      {/* samples */}
      {samples.map((s, i) => {
        const px = xToPx(s);
        const peak = laplacePdf(mu, mu, b);
        const y = laplacePdf(s, mu, b);
        const py = padT + plotH - (y / peak) * (plotH - 4);
        return (
          <motion.circle
            key={`${s.toFixed(4)}-${i}`}
            cx={px}
            cy={py}
            r={4}
            fill="var(--color-danger)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.85, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.02 }}
          />
        );
      })}
    </svg>
  );
}
