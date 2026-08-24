import { useEffect, useRef, useState } from "react";

export default function HorizontalPan({ children }) {
  const outerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [stacked, setStacked] = useState(false);
  const panels = Array.isArray(children) ? children : [children];
  const count = panels.length;

  useEffect(() => {
    const check = () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setStacked(window.innerWidth < 768 || reduced);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (stacked) return;
    let frame;
    const tick = () => {
      const el = outerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        const raw = travel > 0 ? -rect.top / travel : 0;
        setProgress(Math.min(1, Math.max(0, raw)));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stacked]);

  if (stacked) {
    return (
      <div>
        {panels.map((panel, i) => (
          <div key={i} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            {panel}
          </div>
        ))}
      </div>
    );
  }

  const shift = progress * (count - 1) * 100;
  const active = Math.round(progress * (count - 1));

  return (
    <div ref={outerRef} style={{ height: `${count * 100}vh`, position: "relative" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            height: "100%",
            width: `${count * 100}%`,
            transform: `translate3d(-${shift / count}%, 0, 0)`,
            willChange: "transform",
          }}
        >
          {panels.map((panel, i) => (
            <div
              key={i}
              style={{
                width: `${100 / count}%`,
                flexShrink: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {panel}
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", bottom: 32, left: 0, right: 0 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
            {panels.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: i === active ? "#FB7185" : "rgba(30,27,75,0.2)",
                  transition: "background 200ms",
                }}
              />
            ))}
          </div>
          <div style={{ height: 2, background: "rgba(30,27,75,0.1)", margin: "0 15%" }}>
            <div
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                background: "#FB7185",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
