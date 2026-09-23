// src/components/islands/AnnouncementBar.jsx — ported from App.jsx (line ~15710)
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

const ANNOUNCEMENT = {
  text: "Turbine inspection slots are limited — we take a fixed number of shutdowns per quarter.",
  linkText: "Check Availability →",
  linkPath: "/contact",
};
const ANNOUNCE_KEY = "ke_announce_v1";

export default function AnnouncementBar() {
  // BUGFIX: sessionStorage doesn't exist during Astro's server-side render,
  // so the try/catch below always fell into `catch` on the server and
  // rendered the bar as visible — even for visitors who'd already dismissed
  // it. The instant React hydrated and checked the *real* sessionStorage,
  // it collapsed the bar to nothing, producing a visible flash (bar renders
  // → layout shifts → bar disappears) right under the navbar. Starting
  // hidden everywhere and only revealing it after a genuine client-side
  // check removes that flash and the layout shift it caused.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(ANNOUNCE_KEY)) setVisible(true);
    } catch {
      /* sessionStorage unavailable (e.g. privacy mode) — stay hidden */
    }
  }, []);
  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem(ANNOUNCE_KEY, "1");
    } catch {
      /* ok */
    }
  }, []);
  if (!visible) return null;
  return (
    <div
      className="relative bg-blue-700 text-white text-xs sm:text-sm font-semibold py-2 sm:py-2.5 px-4 flex items-center justify-center gap-2 sm:gap-3 text-center"
      role="banner"
      aria-label="Site announcement"
    >
      <span
        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-300 animate-pulse shrink-0"
        aria-hidden="true"
      />
      <span className="hidden sm:inline">{ANNOUNCEMENT.text}</span>
      <a
        href={ANNOUNCEMENT.linkPath}
        onClick={dismiss}
        className="underline font-black whitespace-nowrap hover:text-cyan-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded"
      >
        {ANNOUNCEMENT.linkText}
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
