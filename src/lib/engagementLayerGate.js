// src/lib/engagementLayerGate.js
//
// FIX (UX audit — overlapping engagement layers): the WhatsApp greeting
// bubble (timer + repeat cycle) and the exit-intent review popup were each
// well-suppressed *individually* (session caps, dismiss memory, excluded
// routes) but had no awareness of each other, so a visitor who lingered
// past ~90s and scrolled 60%+ could see both fire in the same visit.
//
// This is a tiny mutual-exclusion gate over sessionStorage: whichever layer
// is currently visible marks itself active, the other checks before showing
// itself and backs off if something's already up. No new UI, no new state
// library — just a shared read/write contract both widgets already have the
// storage access to honour.
const ACTIVE_KEY = "ke_engagement_layer_active"; // which layer (if any) is currently shown
const STALE_MS = 60_000; // treat a stuck flag (e.g. tab killed mid-display) as cleared after this long

export function isAnyEngagementLayerActive(exceptLayer) {
  try {
    const raw = sessionStorage.getItem(ACTIVE_KEY);
    if (!raw) return false;
    const { layer, ts } = JSON.parse(raw);
    if (Date.now() - ts > STALE_MS) return false; // stale — don't let it block forever
    return layer !== exceptLayer;
  } catch {
    return false;
  }
}

export function markEngagementLayerActive(layer) {
  try {
    sessionStorage.setItem(ACTIVE_KEY, JSON.stringify({ layer, ts: Date.now() }));
  } catch {
    /* private mode / quota — fail open, no mutual suppression this session */
  }
}

export function clearEngagementLayerActive(layer) {
  try {
    const raw = sessionStorage.getItem(ACTIVE_KEY);
    if (!raw) return;
    const { layer: activeLayer } = JSON.parse(raw);
    if (activeLayer === layer) sessionStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}
