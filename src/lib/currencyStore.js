// src/lib/currencyStore.js
// Ported from CurrencyProvider/useCurrency in App.jsx (line ~7602).
//
// Astro islands each hydrate as their own independent React root, so a
// React Context provider in one island isn't visible to another. This store
// sidesteps that by living as a plain module-level singleton (the browser's
// ES module cache guarantees every island that imports this file gets the
// *same* instance on a given page) with a tiny pub-sub layer that
// useSyncExternalStore (see hooks/useCurrency.js) subscribes to.
import { SUPPORTED_CURRENCIES, FALLBACK_RATES } from "../data/currency";

const CODE_KEY = "ke_currency";
const RATES_CACHE_KEY = "ke_currency_rates";
const RATES_MAX_AGE = 3600_000; // 1 hour — matches the original's in-memory cache window

// Country code → currency code map for IP geo auto-detection
const COUNTRY_CURRENCY = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  CA: "USD",
  AE: "AED",
  QA: "AED",
  KW: "AED",
  BH: "AED",
  OM: "AED",
  SA: "SAR",
  SG: "SGD",
  MY: "SGD",
  AU: "AUD",
  NZ: "AUD",
  JP: "JPY",
  CN: "CNY",
  HK: "CNY",
  TW: "CNY",
  KR: "KRW",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  PT: "EUR",
  GR: "EUR",
  FI: "EUR",
  IE: "EUR",
  PL: "EUR",
};

// Browser language → currency fallback (used only if IP geo fails)
const LOCALE_CURRENCY = {
  "en-IN": "INR",
  hi: "INR",
  mr: "INR",
  gu: "INR",
  pa: "INR",
  "en-US": "USD",
  "en-AU": "AUD",
  "en-CA": "USD",
  "en-GB": "GBP",
  "en-AE": "AED",
  "ar-AE": "AED",
  "ar-SA": "SAR",
  "en-SA": "SAR",
  "en-SG": "SGD",
  ms: "SGD",
  ja: "JPY",
  "ja-JP": "JPY",
  zh: "CNY",
  "zh-CN": "CNY",
  "zh-HK": "CNY",
  ko: "KRW",
  "ko-KR": "KRW",
  de: "EUR",
  fr: "EUR",
  it: "EUR",
  es: "EUR",
  nl: "EUR",
};

function readSavedCode() {
  try {
    const saved = localStorage.getItem(CODE_KEY);
    return SUPPORTED_CURRENCIES.find((c) => c.code === saved)?.code ?? null;
  } catch {
    return null; // localStorage blocked (private browsing, etc.)
  }
}

function readCachedRates() {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const { rates, fetchedAt } = JSON.parse(raw);
    if (!rates || Date.now() - fetchedAt > RATES_MAX_AGE) return null;
    return rates;
  } catch {
    return null;
  }
}

const savedCode = readSavedCode();

let state = {
  code: savedCode ?? "INR",
  rates: readCachedRates() ?? FALLBACK_RATES,
  detectedAuto: false,
};

const listeners = new Set();
function emit() {
  for (const l of listeners) l();
}

export function subscribeCurrency(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCurrencySnapshot() {
  return state;
}

// Manual selection — persists across sessions, same as the original.
export function selectCurrency(code) {
  if (code === state.code) return;
  state = { ...state, code, detectedAuto: false };
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    /* quota exceeded — ignore, selection still works for this session */
  }
  emit();
}

let ratesFetchStarted = false;
export function ensureRatesLoaded() {
  if (ratesFetchStarted) return;
  if (readCachedRates()) return; // fresh cache already in `state`
  ratesFetchStarted = true;
  const ac = new AbortController();
  const timeoutId = setTimeout(() => ac.abort(), 8000); // never let a slow 3rd-party API hang the UI
  fetch("https://open.er-api.com/v6/latest/INR", { signal: ac.signal })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.rates) {
        state = { ...state, rates: data.rates };
        try {
          localStorage.setItem(
            RATES_CACHE_KEY,
            JSON.stringify({ rates: data.rates, fetchedAt: Date.now() }),
          );
        } catch {
          /* ignore */
        }
        emit();
      }
      // No rates back? Keep FALLBACK_RATES — no visible failure to the user.
    })
    .catch(() => {
      /* silently keep FALLBACK_RATES */
    })
    .finally(() => clearTimeout(timeoutId));
}

let autoDetectStarted = false;
export function ensureAutoDetect() {
  if (autoDetectStarted) return;
  if (savedCode) return; // returning visitor — respect their saved preference, never override it
  autoDetectStarted = true;

  const applyDetected = (detectedCode) => {
    const valid = SUPPORTED_CURRENCIES.find((c) => c.code === detectedCode);
    if (valid) {
      state = { ...state, code: valid.code, detectedAuto: true };
      emit();
    }
  };

  // Detection runs entirely off navigator.language(s) — no third-party network
  // call. The old approach hit api.bigdatacloud.net for an IP → country
  // lookup, but that request now reliably 403s (free-tier gating), which
  // logged a console error on every single page load without ever changing
  // the outcome, since it always fell through to this same locale logic anyway.
  //
  // BCP-47 tags carry a region subtag (e.g. "en-AE", "ar-SA", "en-NZ") that
  // maps onto the same COUNTRY_CURRENCY table the IP lookup used to feed —
  // so checking the region first gives equal-or-better coverage (25 countries)
  // versus the older language-only LOCALE_CURRENCY table, with zero latency
  // and nothing to fail.
  for (const lang of navigator.languages?.length ? navigator.languages : [navigator.language || ""]) {
    const region = lang.split("-")[1]?.toUpperCase();
    const fromRegion = region ? COUNTRY_CURRENCY[region] : null;
    if (fromRegion) return applyDetected(fromRegion);

    const fromLang = LOCALE_CURRENCY[lang] ?? LOCALE_CURRENCY[lang.split("-")[0]];
    if (fromLang) return applyDetected(fromLang);
  }
}
