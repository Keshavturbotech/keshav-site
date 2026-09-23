// src/components/islands/ContactOfficeStatus.jsx
// Ported from useOfficeHours() in App.jsx (line ~23994) as used in
// ContactPage's Office Hours card. This live status line was missing
// entirely from the Astro migration — that card was fully static with no
// time-of-day awareness. IST calculation lives in lib/officeHours.ts,
// shared with OfficeHoursPill.jsx and ContactForm.jsx.
import { useCallback, useEffect, useState } from "react";
import { isOfficeHoursNow } from "../../lib/officeHours";

export default function ContactOfficeStatus() {
  const [isOfficeHours, setIsOfficeHours] = useState(isOfficeHoursNow);
  const refresh = useCallback(() => setIsOfficeHours(isOfficeHoursNow()), []);
  useEffect(() => {
    // BUGFIX: isOfficeHoursNow() also runs during Astro's server render, on
    // the server's clock. If the real hour/day boundary (9 AM/7 PM IST,
    // Mon-Sat) falls between server render and client hydration, the two
    // disagree — a hydration mismatch on a live status line. Re-syncing to
    // the client's own clock right after mount (in addition to the 60s
    // interval below) closes that window instead of trusting SSR's value.
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <p className="text-[11px] text-slate-500 mt-3 font-medium">
      {isOfficeHours
        ? "● We're online now — expect reply within 2 hours"
        : "● Currently outside office hours — emergency line still active"}
    </p>
  );
}
