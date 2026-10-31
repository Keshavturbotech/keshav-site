// src/components/islands/AnalyticsLoader.jsx
// Ported from App.jsx loadAnalyticsScripts() (line ~8940).
// GA4 + Microsoft Clarity only load after the visitor accepts analytics
// cookies via CookieConsentBanner (or had previously accepted). Cloudflare
// Turnstile is NOT gated here — it sets no tracking cookie and is loaded
// directly by TurnstileWidget.jsx wherever it's used.
//
// CHANGE FROM ORIGINAL: no manual trackPageView()/popstate wiring — that
// existed because the old SPA never did a real page load on navigation, so
// GA4 needed to be told about each route change by hand. With real Astro
// routes, every navigation IS a real page load, so GA4's own script fires
// pageviews automatically. Nothing to reimplement here.
import { useEffect } from "react";

const GA4_ID = import.meta.env.PUBLIC_GA4_ID ?? "";
const CLARITY_ID = import.meta.env.PUBLIC_CLARITY_ID ?? "";
const CF_BEACON_TOKEN = import.meta.env.PUBLIC_CF_BEACON_TOKEN ?? "";
const COOKIE_CONSENT_KEY = "ke_cookie_consent";

// ── Page context sent with every GA4 event ────────────────────────────────
// page_type  -> content_group (built-in GA4 dimension): home, product, products,
//               service, industry, blog, project, contact, downloads, other
// site_language -> the language the visitor is browsing in (custom dimension)
function getPageContext() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length && /^[a-z]{2}(-[a-z]{2,4})?$/i.test(parts[0])) parts.shift(); // strip locale prefix
  const first = (parts[0] || "").replace(/\.html$/, "");
  const detail = parts.length > 1;
  const map = {
    "": "home",
    products: detail ? "product" : "products",
    services: detail ? "service" : "services",
    industries: detail ? "industry" : "industries",
    blog: detail ? "blog_post" : "blog",
    projects: detail ? "project" : "projects",
    contact: "contact",
    downloads: "downloads",
  };
  return {
    page_type: map[first] || "other",
    site_language: document.documentElement.lang || "en",
  };
}

function loadGA4() {
  if (!GA4_ID || document.getElementById("ga4-script")) return;
  const s1 = document.createElement("script");
  s1.id = "ga4-script";
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  s1.async = true;
  document.head.appendChild(s1);

  const s2 = document.createElement("script");
  s2.id = "ga4-init";
  s2.text =
    `window.dataLayer=window.dataLayer||[];` +
    `function gtag(){dataLayer.push(arguments);}` +
    `gtag('js',new Date());` +
    `gtag('config','${GA4_ID}',${JSON.stringify({ content_group: getPageContext().page_type, site_language: getPageContext().site_language })});`;
  document.head.appendChild(s2);
}

function loadClarity() {
  if (!CLARITY_ID || document.getElementById("clarity-script")) return;
  const cs = document.createElement("script");
  cs.id = "clarity-script";
  cs.type = "text/javascript";
  cs.text =
    `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};` +
    `t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;` +
    `y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);` +
    `})(window,document,"clarity","script","${CLARITY_ID}");`;
  document.head.appendChild(cs);
  // Filter Clarity recordings by page type / language / lead
  try {
    const ctx = getPageContext();
    window.clarity("set", "page_type", ctx.page_type);
    window.clarity("set", "site_language", ctx.site_language);
  } catch {
    /* clarity not ready — harmless */
  }
}

// Cloudflare Web Analytics: cookieless, so it needs no consent. Gives a
// baseline visitor count even for people who decline analytics cookies.
function loadCloudflareBeacon() {
  if (!CF_BEACON_TOKEN || document.getElementById("cf-beacon")) return;
  const b = document.createElement("script");
  b.id = "cf-beacon";
  b.defer = true;
  b.src = "https://static.cloudflareinsights.com/beacon.min.js";
  b.setAttribute("data-cf-beacon", JSON.stringify({ token: CF_BEACON_TOKEN }));
  document.head.appendChild(b);
}

// ── Event layer ───────────────────────────────────────────────────────────
let trackingOn = false;

function keTrack(name, params = {}) {
  if (!trackingOn) return;
  const payload = { ...getPageContext(), ...params };
  try {
    if (typeof window.gtag === "function") window.gtag("event", name, payload);
    if (typeof window.clarity === "function") window.clarity("event", name);
  } catch {
    /* never let analytics break the page */
  }
}

// Where on the page a contact link was clicked (nav, footer, sticky bar, ...)
function linkLocation(el) {
  if (el.closest("footer")) return "footer";
  if (el.closest("nav, header")) return "header";
  if (el.closest("[data-sticky-cta], .sticky, .fixed")) return "floating_button";
  if (el.closest("main")) return "page_body";
  return "other";
}

function onDocumentClick(e) {
  const a = e.target.closest && e.target.closest("a[href]");
  if (!a) return;
  const href = a.getAttribute("href") || "";
  if (/^tel:/i.test(href)) {
    keTrack("click_phone", { link_location: linkLocation(a) });
  } else if (/^mailto:/i.test(href)) {
    keTrack("click_email", { link_location: linkLocation(a) });
  } else if (/(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(href)) {
    keTrack("click_whatsapp", { link_location: linkLocation(a) });
  }
}

// BUGFIX: the original App.jsx deferred Clarity's injection with
// requestIdleCallback to keep it off the main thread during initial
// render/hydration — that deferral was dropped in the Astro port, so
// Clarity was loading synchronously again. GA4 stays eager (its own script
// needs to observe the very first navigation), but Clarity has no such
// requirement, so it goes back to idle time. Falls back to a short
// setTimeout on browsers without requestIdleCallback (e.g. Safari).
function loadClarityDeferred() {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(loadClarity, { timeout: 4000 });
  } else {
    setTimeout(loadClarity, 1000);
  }
}

function loadAnalytics() {
  trackingOn = true;
  window.keTrack = keTrack;
  document.addEventListener("click", onDocumentClick, { capture: true });
  loadGA4();
  loadClarityDeferred();
}

function hasAcceptedConsent() {
  return document.cookie.split("; ").some((c) => c === `${COOKIE_CONSENT_KEY}=accepted`);
}

export default function AnalyticsLoader() {
  useEffect(() => {
    loadCloudflareBeacon(); // cookieless — runs regardless of consent
    if (hasAcceptedConsent()) loadAnalytics();
    const onAccept = () => loadAnalytics();
    window.addEventListener("ke:cookieConsentAccepted", onAccept);
    return () => window.removeEventListener("ke:cookieConsentAccepted", onAccept);
  }, []);
  return null;
}
