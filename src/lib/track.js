// src/lib/track.js — tiny wrapper so components never touch gtag directly.
// window.keTrack is defined by AnalyticsLoader.jsx. It does nothing until the
// visitor has accepted analytics cookies, so calling it is always safe.
export function track(name, params = {}) {
  if (typeof window !== "undefined" && typeof window.keTrack === "function") {
    window.keTrack(name, params);
  }
}
