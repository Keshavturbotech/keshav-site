// src/components/islands/StatNum.jsx — ported from App.jsx (line ~15757)
// IntersectionObserver count-up animation, identical easing/duration to original.
import { useEffect, useRef, useState } from "react";

export default function StatNum({ end, suffix }) {
  const [val, setVal] = useState(0);
  // BUGFIX: `fired` used to be state and lived in this effect's dependency
  // array. The moment the count-up started, setFired(true) re-ran the
  // effect, disconnecting the observer and creating a brand-new one to
  // re-observe an element that had already fired — extra work on every
  // single stat, and the opposite of the "one stable observer" pattern used
  // elsewhere (ScrollReveal, lazy sections). A ref lets the callback read
  // the latest fired-state without retriggering the effect, so the
  // observer is created once and simply disconnects after it fires.
  const fired = useRef(false);
  const ref = useRef(null);
  useEffect(() => {
    if (end === null) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || fired.current) return;
        fired.current = true;
        obs.disconnect();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setVal(end);
          return;
        }
        const duration = 1400;
        const start = performance.now();
        const easeOut = (t) => 1 - (1 - t) ** 3;
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          setVal(Math.round(easeOut(progress) * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  if (end === null)
    return (
      <span ref={ref} className="ke-stat-num">
        {suffix}
      </span>
    );
  // BUGFIX (layout shift): the count-up animation grows from "0" to the
  // final value one digit at a time (e.g. 0 -> 5 -> 50 -> 500), and with
  // no reserved width the surrounding trust-line text visibly reflows on
  // every hero load. Reserving the final rendered width up front — sized
  // to the end value, since it's always the longest string this element
  // will show — makes the count-up happen in place with zero shift.
  const reservedWidth = `${String(end).length + (suffix?.length || 0)}ch`;
  return (
    <span
      ref={ref}
      className="ke-stat-num"
      style={{ display: "inline-block", minWidth: reservedWidth, fontVariantNumeric: "tabular-nums" }}
    >
      {val}
      {suffix}
    </span>
  );
}
