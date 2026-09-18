import type { Condition } from "@/lib/types";

export default function Sky({ condition }: { condition: Condition }) {
  return (
    <div className={`sky sky-${condition}`} aria-hidden="true">
      <div className="sun" />
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="cloud c3" />
      <div className="rain">
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} style={{ left: `${(i * 5.4) % 100}%`, animationDelay: `${(i % 7) * 0.18}s` }} />
        ))}
      </div>
      <div className="lightning" />
      <div className="fog-bank" />
      <div className="sea" />
    </div>
  );
}
