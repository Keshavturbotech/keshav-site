// src/components/islands/OfficeHoursPill.jsx
// Ported from useOfficeHours() in App.jsx (line ~23994). This was previously
// a hardcoded static pill with the wrong text entirely ("Mon-Sat, 9 AM – 7
// PM IST") — caught via screenshot comparison against the live site. The
// real behavior checks the current time in IST every 60 seconds and shows
// one of two genuinely different messages depending on whether it's inside
// business hours right now. IST calculation lives in lib/officeHours.ts,
// shared with ContactOfficeStatus.jsx and ContactForm.jsx.
import { useCallback, useEffect, useState } from "react";
import { isOfficeHoursNow } from "../../lib/officeHours";

const EMERALD_LABEL = "Engineers online now — reply within 2 hrs";
const AMBER_LABEL = "Emergency line active 24×7 — planned RFQs answered by 9 AM IST";

function getStatus() {
  const inHours = isOfficeHoursNow();
  return inHours
    ? { isOfficeHours: true, label: EMERALD_LABEL, color: "emerald" }
    : { isOfficeHours: false, label: AMBER_LABEL, color: "amber" };
}

// BUGFIX (layout shift): this is a fully static build (output: "static") —
// the HTML above is generated once at deploy time and served unchanged
// afterward, so the message baked in at build time almost never matches
// the visitor's actual local time. The moment `refresh()` re-syncs to the
// client's clock in the effect below, the label can swap from the short
// emerald message to the much longer amber one (or back), pushing every
// element below the pill down/up — a real, frequent CLS hit, not an edge
// case. Reserving width for the longer of the two strings up front means
// that swap happens inside a fixed-size box instead of resizing it.
const RESERVED_CH = Math.max(EMERALD_LABEL.length, AMBER_LABEL.length) + 4;

export default function OfficeHoursPill() {
  const [status, setStatus] = useState(getStatus);
  const refresh = useCallback(() => setStatus(getStatus()), []);
  useEffect(() => {
    // BUGFIX: getStatus() also runs during Astro's server render, using the
    // server's clock. If the real hour/day boundary (9 AM/7 PM IST, Mon-Sat)
    // falls between server render and client hydration, the two disagree —
    // a hydration mismatch on a live status pill. Re-syncing to the client's
    // own clock right after mount (in addition to the 60s interval below)
    // closes that window instead of trusting the SSR-computed value.
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const isEmerald = status.color === "emerald";
  return (
    <div
      className={`flex items-center gap-2.5 self-center lg:self-start px-3.5 py-2 rounded-full border text-xs sm:text-sm font-bold ${
        isEmerald
          ? "text-emerald-300 bg-emerald-400/10 border-emerald-400/25"
          : "text-amber-300 bg-amber-400/10 border-amber-400/25"
      }`}
      style={{ minWidth: `min(${RESERVED_CH}ch, 100%)` }}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${isEmerald ? "bg-emerald-400" : "bg-amber-400"}`}
        aria-hidden="true"
      />
      <span className="text-center lg:text-left">{status.label}</span>
    </div>
  );
}
