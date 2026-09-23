// src/lib/cookieBannerStore.js
// Same cross-island singleton pattern as currencyStore.js: CookieConsentBanner,
// WhatsAppBubble, and BackToTopButton each hydrate as independent React roots,
// so this plain module-level store + pub-sub lets the FABs react to the
// banner's visibility (and measured height) without a shared component tree.
let state = {
  visible: false,
  height: 0,
};

const listeners = new Set();
function emit() {
  for (const l of listeners) l();
}

export function subscribeCookieBanner(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCookieBannerSnapshot() {
  return state;
}

export function setCookieBannerState(next) {
  state = { ...state, ...next };
  emit();
}
