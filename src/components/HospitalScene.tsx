import { motion } from "framer-motion";

/**
 * Animated SVG: a small-town hospital with people walking in/out,
 * an ambulance, doctors, nurses, and patients moving across the scene.
 */
export function HospitalScene({ height = 360 }: { height?: number }) {
  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-rule"
      style={{
        height,
        background:
          "linear-gradient(to bottom, oklch(0.92 0.04 240) 0%, oklch(0.94 0.03 80) 70%, oklch(0.88 0.04 60) 100%)",
      }}
    >
      <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        {/* sun */}
        <circle cx="680" cy="70" r="34" fill="oklch(0.92 0.12 80)" opacity="0.8" />
        {/* ground */}
        <rect x="0" y="290" width="800" height="110" fill="oklch(0.82 0.04 100)" />
        <rect x="0" y="290" width="800" height="4" fill="oklch(0.7 0.05 100)" />
        {/* road */}
        <rect x="0" y="330" width="800" height="38" fill="oklch(0.45 0.02 250)" />
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={i} x={i * 60 + 10} y={347} width={30} height={4} fill="oklch(0.95 0.08 90)" />
        ))}

        {/* hospital building */}
        <g>
          {/* main body */}
          <rect x="220" y="120" width="360" height="180" fill="oklch(0.97 0.01 240)" stroke="oklch(0.55 0.05 240)" strokeWidth="2" />
          {/* roof */}
          <rect x="210" y="110" width="380" height="14" fill="oklch(0.5 0.08 250)" />
          {/* big red cross */}
          <g transform="translate(380, 145)">
            <rect x="-8" y="-22" width="16" height="44" fill="oklch(0.6 0.22 25)" />
            <rect x="-22" y="-8" width="44" height="16" fill="oklch(0.6 0.22 25)" />
          </g>
          {/* sign */}
          <rect x="320" y="195" width="160" height="22" fill="oklch(0.5 0.08 250)" />
          <text x="400" y="211" textAnchor="middle" fill="oklch(0.97 0.02 80)" fontSize="13" fontFamily="serif" fontWeight="bold">
            HOSPITAL
          </text>
          {/* windows */}
          {[0, 1, 2, 3].map((row) => (
            [0, 1, 2, 3, 4].map((col) => {
              const cx = 240 + col * 70;
              const cy = 230 + row * 18;
              if (row === 0 && (col === 2)) return null;
              return (
                <motion.rect
                  key={`w-${row}-${col}`}
                  x={cx} y={cy} width={34} height={12}
                  fill="oklch(0.78 0.1 240)"
                  animate={{ fill: ["oklch(0.78 0.1 240)", "oklch(0.92 0.14 90)", "oklch(0.78 0.1 240)"] }}
                  transition={{ duration: 4, repeat: Infinity, delay: (row * 5 + col) * 0.3 }}
                />
              );
            })
          ))}
          {/* door */}
          <rect x="370" y="250" width="60" height="50" fill="oklch(0.35 0.05 250)" />
          <rect x="372" y="252" width="56" height="46" fill="oklch(0.7 0.12 230)" opacity="0.5" />
          <circle cx="420" cy="278" r="2" fill="oklch(0.9 0.1 80)" />
        </g>

        {/* ambulance */}
        <motion.g
          initial={{ x: -200 }}
          animate={{ x: [-200, 80, 80, 80, 850] }}
          transition={{ duration: 14, repeat: Infinity, times: [0, 0.25, 0.55, 0.7, 1], ease: "easeInOut" }}
        >
          <rect x="20" y="305" width="90" height="40" rx="4" fill="oklch(0.97 0.02 80)" stroke="oklch(0.4 0.05 250)" strokeWidth="1.5" />
          <rect x="20" y="305" width="30" height="40" rx="4" fill="oklch(0.95 0.02 80)" />
          <rect x="55" y="312" width="14" height="24" fill="oklch(0.6 0.22 25)" />
          <rect x="48" y="319" width="28" height="10" fill="oklch(0.6 0.22 25)" />
          <text x="90" y="332" fill="oklch(0.4 0.04 250)" fontSize="9" fontFamily="monospace" fontWeight="bold">AMB</text>
          <rect x="25" y="310" width="22" height="14" fill="oklch(0.75 0.12 230)" />
          <motion.circle cx="38" cy="350" r="7" fill="oklch(0.2 0 0)" animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "38px 350px" }} />
          <motion.circle cx="92" cy="350" r="7" fill="oklch(0.2 0 0)" animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "92px 350px" }} />
          <motion.circle cx="35" cy="302" r="3" fill="oklch(0.65 0.22 25)" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity }} />
          <motion.circle cx="100" cy="302" r="3" fill="oklch(0.6 0.2 240)" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
        </motion.g>

        {/* people */}
        <Person x={-50} delay={0} duration={18} kind="patient" toDoor />
        <Person x={-150} delay={3} duration={20} kind="doctor" toDoor />
        <Person x={-260} delay={6} duration={22} kind="patient" toDoor />
        <Person x={850} delay={1.5} duration={19} kind="nurse" leavingDoor />
        <Person x={950} delay={4.5} duration={21} kind="patient" leavingDoor />
        <Person x={1050} delay={8} duration={23} kind="doctor" leavingDoor />
        <Person x={-400} delay={9} duration={22} kind="nurse" toDoor />
        <Person x={1150} delay={11} duration={20} kind="patient" leavingDoor />
      </svg>
    </div>
  );
}

type PersonKind = "patient" | "doctor" | "nurse";

function Person({
  x, delay, duration, kind, toDoor, leavingDoor,
}: {
  x: number; delay: number; duration: number; kind: PersonKind;
  toDoor?: boolean; leavingDoor?: boolean;
}) {
  // Walk to the door (400) and then "into" hospital, or out of door to off-screen
  const path = toDoor
    ? { x: [x, 400, 400, 400], y: [310, 310, 280, 280], opacity: [1, 1, 0, 0] }
    : { x: [400, 400, leavingDoor ? -100 : 900, leavingDoor ? -100 : 900], y: [280, 310, 310, 310], opacity: [0, 1, 1, 1] };

  const colors: Record<PersonKind, { body: string; head: string; accent: string }> = {
    patient: { body: "oklch(0.55 0.13 30)", head: "oklch(0.78 0.06 70)", accent: "oklch(0.55 0.13 30)" },
    doctor: { body: "oklch(0.97 0.01 80)", head: "oklch(0.78 0.06 70)", accent: "oklch(0.55 0.18 25)" },
    nurse: { body: "oklch(0.85 0.12 350)", head: "oklch(0.78 0.06 70)", accent: "oklch(0.55 0.22 350)" },
  };
  const c = colors[kind];

  return (
    <motion.g
      initial={{ x, opacity: 0 }}
      animate={path}
      transition={{ duration, delay, repeat: Infinity, ease: "linear", times: [0, 0.45, 0.55, 1] }}
    >
      {/* head */}
      <circle cx={0} cy={-22} r={6} fill={c.head} stroke="oklch(0.3 0.02 60)" strokeWidth="0.5" />
      {/* body */}
      <rect x={-6} y={-16} width={12} height={18} rx={2} fill={c.body} stroke="oklch(0.3 0.02 60)" strokeWidth="0.5" />
      {/* legs (with little walk wiggle) */}
      <motion.g
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "0px 2px" }}
      >
        <rect x={-5} y={2} width={3} height={10} fill="oklch(0.3 0.04 250)" />
        <rect x={2} y={2} width={3} height={10} fill="oklch(0.3 0.04 250)" />
      </motion.g>
      {/* accent (cross for doctor, cap for nurse, bandage for patient) */}
      {kind === "doctor" && (
        <g>
          <rect x={-1.5} y={-12} width={3} height={6} fill={c.accent} />
          <rect x={-3} y={-10.5} width={6} height={3} fill={c.accent} />
        </g>
      )}
      {kind === "nurse" && <rect x={-5} y={-29} width={10} height={3} fill={c.accent} />}
      {kind === "patient" && <rect x={-4} y={-23} width={8} height={2} fill="oklch(0.95 0.02 80)" />}
    </motion.g>
  );
}
