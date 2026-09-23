// src/hooks/useCookieBannerOffset.js
// Lets fixed-position widgets (WhatsAppBubble, BackToTopButton) shift
// themselves above the cookie consent banner while it's on-screen, instead
// of sitting underneath/behind it. See src/lib/cookieBannerStore.js.
import { useSyncExternalStore } from "react";
import { subscribeCookieBanner, getCookieBannerSnapshot } from "../lib/cookieBannerStore";

export function useCookieBannerOffset() {
  const { visible, height } = useSyncExternalStore(
    subscribeCookieBanner,
    getCookieBannerSnapshot,
    getCookieBannerSnapshot,
  );
  // Small gap above the banner so widgets don't touch its top edge.
  return visible ? height + 16 : 0;
}
