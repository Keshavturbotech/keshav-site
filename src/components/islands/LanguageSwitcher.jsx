// src/components/islands/LanguageSwitcher.jsx
// Part 2 (Phase 5) rewrite. Previously this showed a single flat
// TOP_LANGUAGES list of 10 codes, all wired to the googtrans cookie +
// client-side Google Translate overlay — including 8 codes that are now
// real Tier-1 locales with their own pre-rendered pages (Part 1). Clicking
// "Hindi" used to trigger a translate overlay instead of navigating to the
// real /hi/ page. Fixed below: two explicit tiers, each entry tagged with
// which one it belongs to (never inferred by matching code strings against
// a list, since "es"/"fr"/etc. exist as both a Tier-1 locale AND could in
// principle still appear in a Tier-2 list elsewhere).
//
// Tier 1 (17 locales, real pre-rendered pages): rendered as plain <a href>
// elements. The href for each is computed SERVER-SIDE in Layout.astro (via
// astro:i18n's getRelativeLocaleUrl(), the same call used for
// hreflang/canonical) and passed down as the `equivalentLocalePaths` prop —
// this island cannot import astro:i18n itself, and re-implementing
// Astro's locale-path-prefix logic client-side (especially the zh-CN
// casing exception, see astro.config.mjs) would risk drifting out of sync
// with it. `currentLocale` is also passed down from Astro.currentLocale —
// the authoritative source for "which Tier-1 locale is active", not
// something inferred from a cookie.
//
// Tier 2 (Google Translate overlay, client-side only): stays wired to the
// existing googtrans cookie + window.location.replace reload flow.
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { LOCALES, DEFAULT_LOCALE } from "../../lib/localeMeta";

// FIXED (kept from the original): emoji flags don't render as flags on
// Windows Chrome (falls back to plain two-letter text) — small inline SVGs
// render identically on every OS/browser. Extended here to cover every
// Tier-1 locale's country, not just the original 10.
function FlagIcon({ code, className = "w-5 h-3.5 rounded-[2px] shrink-0" }) {
  const common = { className, viewBox: "0 0 24 16", "aria-hidden": true };
  switch (code) {
    case "in": // India — used for hi, mr, gu (all official languages of India)
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#fff" />
          <rect width="24" height="5.33" fill="#FF9933" />
          <rect y="10.67" width="24" height="5.33" fill="#138808" />
          <circle cx="12" cy="8" r="2" fill="none" stroke="#000080" strokeWidth="0.4" />
        </svg>
      );
    case "np": // Nepal — simplified as a rectangle (real flag is two stacked
      // pennants; that shape doesn't read cleanly at 24x16, same tradeoff
      // this file already makes for other flags below)
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#DC143C" />
          <rect width="24" height="16" fill="none" stroke="#003893" strokeWidth="1.2" />
        </svg>
      );
    case "cn": // China
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#DE2910" />
          <path d="M4 3l.6 1.8H6.4L5 5.9l.6 1.8L4 6.6 2.4 7.7 3 5.9 1.6 4.8h1.8z" fill="#FFDE00" />
        </svg>
      );
    case "es": // Spain
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#c60b1e" />
          <rect y="4" width="24" height="8" fill="#ffc400" />
        </svg>
      );
    case "fr": // France
      return (
        <svg {...common}>
          <rect width="8" height="16" fill="#0055A4" />
          <rect x="8" width="8" height="16" fill="#fff" />
          <rect x="16" width="8" height="16" fill="#EF4135" />
        </svg>
      );
    case "ae": // UAE — used for ar (Arabic is spoken across many countries;
      // UAE picked as a representative Gulf flag given this business's
      // GCC export focus, same reasoning the original file used)
      return (
        <svg {...common}>
          <rect x="6" width="18" height="16" fill="#00732F" />
          <rect x="6" y="5.33" width="18" height="5.34" fill="#fff" />
          <rect x="6" y="10.67" width="18" height="5.33" fill="#000" />
          <rect width="6" height="16" fill="#FF0000" />
        </svg>
      );
    case "ru": // Russia
      return (
        <svg {...common}>
          <rect width="24" height="5.33" fill="#fff" />
          <rect y="5.33" width="24" height="5.33" fill="#0039A6" />
          <rect y="10.67" width="24" height="5.33" fill="#D52B1E" />
        </svg>
      );
    case "pt": // Portugal
      return (
        <svg {...common}>
          <rect width="9.6" height="16" fill="#006600" />
          <rect x="9.6" width="14.4" height="16" fill="#FF0000" />
        </svg>
      );
    case "de": // Germany
      return (
        <svg {...common}>
          <rect width="24" height="5.33" fill="#000" />
          <rect y="5.33" width="24" height="5.33" fill="#DD0000" />
          <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
        </svg>
      );
    case "id": // Indonesia
      return (
        <svg {...common}>
          <rect width="24" height="8" fill="#CE1126" />
          <rect y="8" width="24" height="8" fill="#fff" />
        </svg>
      );
    case "th": // Thailand
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#fff" />
          <rect width="24" height="3.2" fill="#A51931" />
          <rect y="12.8" width="24" height="3.2" fill="#A51931" />
          <rect y="4.8" width="24" height="6.4" fill="#2D2A4A" />
        </svg>
      );
    case "vn": // Vietnam — simplified without the central star (small yellow
      // star doesn't read cleanly at this size, same tradeoff as elsewhere)
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#DA251D" />
          <circle cx="12" cy="8" r="3" fill="#FFCD00" />
        </svg>
      );
    case "tr": // Turkey — simplified without the crescent/star detail
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#E30A17" />
          <circle cx="10" cy="8" r="3.2" fill="#fff" />
          <circle cx="11.2" cy="8" r="2.6" fill="#E30A17" />
        </svg>
      );
    case "tz": // Tanzania — used for sw (Swahili is official across East
      // Africa; Tanzania picked as a representative flag)
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#1EB53A" />
          <path d="M0 16L24 0V4.5L4.5 16H0z" fill="#000" />
          <path d="M0 16L24 0V2.5L2.5 16H0z" fill="#00A3DD" />
          <rect width="24" height="16" fill="none" />
        </svg>
      );
    case "jp": // Japan — Tier 2 default
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#fff" />
          <circle cx="12" cy="8" r="4.5" fill="#BC002D" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#94a3b8" />
        </svg>
      );
  }
}

// Tier 1 — every real Tier-1 locale (must match src/lib/localeMeta.ts's
// LOCALES exactly; not re-derived from it automatically since name/flagCode
// are presentation-only metadata that has no equivalent in that
// client-safe-but-minimal file).
//
// `color` is only ever rendered as this button's small text label (see the
// lone `active.color` usage below) — never as a background or flag swatch —
// so it doubles as a text color and must clear WCAG AA's 4.5:1 against the
// white "scrolled" navbar background. Three of the original brand-flag
// hues (en/ar/sw) sat around 2-3.7:1, which is what Lighthouse's
// color-contrast audit was flagging; they're darkened here just enough to
// pass (~4.6-5.9:1) while staying recognizably the same hue.
const TIER1_META = {
  en: { name: "English", flagCode: "in", color: "#995B1E" },
  hi: { name: "हिन्दी", flagCode: "in", color: "#138808" },
  mr: { name: "मराठी", flagCode: "in", color: "#138808" },
  gu: { name: "ગુજરાતી", flagCode: "in", color: "#138808" },
  ar: { name: "العربية", flagCode: "ae", color: "#007B36" },
  fr: { name: "Français", flagCode: "fr", color: "#0055A4" },
  ne: { name: "नेपाली", flagCode: "np", color: "#DC143C" },
  es: { name: "Español", flagCode: "es", color: "#c60b1e" },
  pt: { name: "Português", flagCode: "pt", color: "#006600" },
  ru: { name: "Русский", flagCode: "ru", color: "#D52B1E" },
  de: { name: "Deutsch", flagCode: "de", color: "#DD0000" },
  "zh-CN": { name: "中文", flagCode: "cn", color: "#DE2910" },
  id: { name: "Bahasa Indonesia", flagCode: "id", color: "#CE1126" },
  th: { name: "ไทย", flagCode: "th", color: "#A51931" },
  vi: { name: "Tiếng Việt", flagCode: "vn", color: "#DA251D" },
  tr: { name: "Türkçe", flagCode: "tr", color: "#E30A17" },
  sw: { name: "Kiswahili", flagCode: "tz", color: "#157E28" },
};

// Tier 2 — Google Translate overlay only. Full catalog of the classic
// Google Website Translator widget (~103 languages), minus every code
// already covered as a real Tier-1 locale (see TIER1_META above /
// localeMeta.ts). Over-inclusive by design: element.js silently skips any
// code it doesn't recognize, so there's no downside to listing a language
// Google later drops or never actually supported in this exact widget
// build — but the reverse isn't true, so if Keshav finds languages missing
// after deploy, they can just be appended here and to Layout.astro's
// includedLanguages string.
//
// This entire array is search-only in the UI (see LanguageSwitcher's query
// state, added in Part 2 of the i18n expansion) — it must never render
// unfiltered. That behavior lives in the dropdown render logic below; this
// array itself has no visibility logic of its own.
const TIER2_LANGUAGES = [
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Shqip" }, // Albanian
  { code: "am", name: "አማርኛ" }, // Amharic
  { code: "hy", name: "Հայերեն" }, // Armenian
  { code: "az", name: "Azərbaycan dili" }, // Azerbaijani
  { code: "eu", name: "Euskara" }, // Basque
  { code: "be", name: "Беларуская" }, // Belarusian
  { code: "bn", name: "বাংলা" }, // Bengali
  { code: "bs", name: "Bosanski" }, // Bosnian
  { code: "bg", name: "Български" }, // Bulgarian
  { code: "ca", name: "Català" }, // Catalan
  { code: "ceb", name: "Cebuano" },
  { code: "ny", name: "Chichewa" },
  { code: "zh-TW", name: "繁體中文" }, // Chinese (Traditional) — zh-CN (Simplified) is Tier-1
  { code: "co", name: "Corsu" }, // Corsican
  { code: "hr", name: "Hrvatski" }, // Croatian
  { code: "cs", name: "Čeština" }, // Czech
  { code: "da", name: "Dansk" }, // Danish
  { code: "nl", name: "Nederlands" }, // Dutch
  { code: "eo", name: "Esperanto" },
  { code: "et", name: "Eesti" }, // Estonian
  { code: "tl", name: "Filipino" },
  { code: "fi", name: "Suomi" }, // Finnish
  { code: "fy", name: "Frysk" }, // Frisian
  { code: "gl", name: "Galego" }, // Galician
  { code: "ka", name: "ქართული" }, // Georgian
  { code: "el", name: "Ελληνικά" }, // Greek
  { code: "ht", name: "Kreyòl Ayisyen" }, // Haitian Creole
  { code: "ha", name: "Hausa" },
  { code: "haw", name: "ʻŌlelo Hawaiʻi" }, // Hawaiian
  { code: "iw", name: "עברית" }, // Hebrew
  { code: "hmn", name: "Hmong" },
  { code: "hu", name: "Magyar" }, // Hungarian
  { code: "is", name: "Íslenska" }, // Icelandic
  { code: "ig", name: "Igbo" },
  { code: "ga", name: "Gaeilge" }, // Irish
  { code: "it", name: "Italiano" }, // Italian
  { code: "ja", name: "日本語" }, // Japanese — was the sole Tier-2 entry before
  { code: "jw", name: "Basa Jawa" }, // Javanese
  { code: "kn", name: "ಕನ್ನಡ" }, // Kannada
  { code: "kk", name: "Қазақ тілі" }, // Kazakh
  { code: "km", name: "ខ្មែរ" }, // Khmer
  { code: "rw", name: "Ikinyarwanda" }, // Kinyarwanda
  { code: "ko", name: "한국어" }, // Korean
  { code: "ku", name: "Kurdî" }, // Kurdish (Kurmanji)
  { code: "ky", name: "Кыргызча" }, // Kyrgyz
  { code: "lo", name: "ລາວ" }, // Lao
  { code: "la", name: "Latina" }, // Latin
  { code: "lv", name: "Latviešu" }, // Latvian
  { code: "ln", name: "Lingála" }, // Lingala
  { code: "lt", name: "Lietuvių" }, // Lithuanian
  { code: "lg", name: "Luganda" },
  { code: "lb", name: "Lëtzebuergesch" }, // Luxembourgish
  { code: "mk", name: "Македонски" }, // Macedonian
  { code: "mai", name: "मैथिली" }, // Maithili
  { code: "mg", name: "Malagasy" },
  { code: "ms", name: "Bahasa Melayu" }, // Malay
  { code: "ml", name: "മലയാളം" }, // Malayalam
  { code: "mt", name: "Malti" }, // Maltese
  { code: "mi", name: "Māori" }, // Maori
  { code: "mn", name: "Монгол" }, // Mongolian
  { code: "my", name: "မြန်မာ" }, // Myanmar (Burmese)
  { code: "no", name: "Norsk" }, // Norwegian
  { code: "or", name: "ଓଡ଼ିଆ" }, // Odia
  { code: "ps", name: "پښتو" }, // Pashto
  { code: "fa", name: "فارسی" }, // Persian
  { code: "pl", name: "Polski" }, // Polish
  { code: "pa", name: "ਪੰਜਾਬੀ" }, // Punjabi
  { code: "ro", name: "Română" }, // Romanian
  { code: "sm", name: "Gagana Sāmoa" }, // Samoan
  { code: "gd", name: "Gàidhlig" }, // Scots Gaelic
  { code: "sr", name: "Српски" }, // Serbian
  { code: "st", name: "Sesotho" },
  { code: "sn", name: "Shona" },
  { code: "sd", name: "سنڌي" }, // Sindhi
  { code: "si", name: "සිංහල" }, // Sinhala
  { code: "sk", name: "Slovenčina" }, // Slovak
  { code: "sl", name: "Slovenščina" }, // Slovenian
  { code: "so", name: "Soomaali" }, // Somali
  { code: "su", name: "Basa Sunda" }, // Sundanese
  { code: "sv", name: "Svenska" }, // Swedish
  { code: "tg", name: "Тоҷикӣ" }, // Tajik
  { code: "ta", name: "தமிழ்" }, // Tamil
  { code: "tt", name: "Татар" }, // Tatar
  { code: "te", name: "తెలుగు" }, // Telugu
  { code: "ug", name: "ئۇيغۇرچە" }, // Uyghur
  { code: "uk", name: "Українська" }, // Ukrainian
  { code: "ur", name: "اردو" }, // Urdu
  { code: "uz", name: "Oʻzbek" }, // Uzbek
  { code: "cy", name: "Cymraeg" }, // Welsh
  { code: "xh", name: "isiXhosa" }, // Xhosa
  { code: "yi", name: "ייִדיש" }, // Yiddish
  { code: "yo", name: "Yorùbá" }, // Yoruba
  { code: "zu", name: "isiZulu" }, // Zulu
];

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, { path = "/", domain } = {}) {
  let str = `${name}=${value};path=${path}`;
  if (domain) str += `;domain=${domain}`;
  document.cookie = str;
}

function clearCookie(name, { path = "/", domain } = {}) {
  let str = `${name}=;path=${path};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  if (domain) str += `;domain=${domain}`;
  document.cookie = str;
}

export default function LanguageSwitcher({
  scrolled,
  currentLocale = DEFAULT_LOCALE,
  equivalentLocalePaths = {},
}) {
  const [open, setOpen] = useState(false);
  const [tier2Code, setTier2Code] = useState(null);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  // The googtrans cookie only matters when currentLocale is English AND a
  // Tier-2 overlay is active — a real Tier-1 locale page (currentLocale !==
  // "en") is never "actually" showing a Google-translated overlay, no
  // matter what a stale cookie says.
  useEffect(() => {
    if (currentLocale !== DEFAULT_LOCALE) {
      setTier2Code(null);
      return;
    }
    const val = getCookie("googtrans");
    if (val) {
      const m = val.match(/^\/en\/(.+)$/);
      if (m && m[1] !== "en") setTier2Code(m[1]);
    }
  }, [currentLocale]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Autofocus the search input every time the dropdown opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Active-language indicator: a real Tier-1 locale takes priority; only
  // fall back to a Tier-2 cookie code when on the English/default build.
  const activeTier1 = TIER1_META[currentLocale] ? currentLocale : DEFAULT_LOCALE;
  const activeTier2 = tier2Code ? TIER2_LANGUAGES.find((l) => l.code === tier2Code) : null;
  const active = activeTier2 ?? { code: activeTier1, ...TIER1_META[activeTier1] };

  const clearGoogTrans = () => {
    clearCookie("googtrans", { path: "/", domain: window.location.hostname });
    clearCookie("googtrans", { path: "/" });
  };

  const goToTier1 = (locale) => {
    setOpen(false);
    setQuery("");
    const href = equivalentLocalePaths[locale];
    if (!href) return;
    // Critical fix (Part 2, step 3): a lingering googtrans cookie from a
    // Tier-2 overlay must not be allowed to interfere with the real,
    // pre-rendered Tier-1 page being navigated to.
    clearGoogTrans();
    window.location.assign(href);
  };

  const setTier2 = (code) => {
    setOpen(false);
    setQuery("");
    const cookieVal = `/en/${code}`;
    setCookie("googtrans", cookieVal, { path: "/", domain: window.location.hostname });
    setCookie("googtrans", cookieVal, { path: "/" });
    window.location.replace(window.location.href);
  };

  // Search: Tier-1 filters (and stays visible) with no query; Tier-2 is
  // search-only — it must render nothing until the user types. q === ""
  // must yield an empty filteredTier2 array, full stop.
  const q = query.trim().toLowerCase();
  const filteredTier1 = LOCALES.filter(
    (code) => !q || TIER1_META[code].name.toLowerCase().includes(q) || code.toLowerCase().includes(q),
  );
  const filteredTier2 = q
    ? TIER2_LANGUAGES.filter(
        (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q),
      )
    : [];
  const noMatches = q && filteredTier1.length === 0 && filteredTier2.length === 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Change language (currently ${active.code === "zh-CN" ? "ZH" : active.code.toUpperCase()})`}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-language-switcher-trigger
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-2.5 rounded-xl font-bold text-[13px] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          scrolled
            ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
            : "bg-white/10 border border-white/25 text-white hover:bg-white/20 backdrop-blur-md"
        }`}
      >
        {activeTier2 ? (
          <Globe
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: scrolled ? "#94a3b8" : "#ffffff" }}
            aria-hidden="true"
          />
        ) : (
          <FlagIcon code={active.flagCode} />
        )}
        <span
          className="text-[12px] font-black tracking-widest leading-none"
          style={{ color: scrolled ? (activeTier2 ? "#475569" : active.color) : "#ffffff" }}
        >
          {active.code === "zh-CN" ? "ZH" : active.code.toUpperCase()}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-250 max-h-96 overflow-y-auto"
        >
          <div className="px-3 pt-2 pb-1 sticky top-0 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all languages..."
              aria-label="Search languages"
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {filteredTier1.length > 0 && (
            <>
              <li className="px-4 pt-1 pb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                <Globe className="w-3 h-3" aria-hidden="true" />
                Available on this site
              </li>
              {filteredTier1.map((code) => (
                <li key={code} role="option" aria-selected={code === activeTier1 && !activeTier2}>
                  <button
                    type="button"
                    onClick={() => goToTier1(code)}
                    className={`w-full text-left px-4 py-2 text-sm font-semibold flex items-center gap-2.5 hover:bg-blue-50 ${
                      code === activeTier1 && !activeTier2 ? "text-blue-600 bg-blue-50/50" : "text-slate-700"
                    }`}
                  >
                    <FlagIcon code={TIER1_META[code].flagCode} />
                    {TIER1_META[code].name}
                  </button>
                </li>
              ))}
            </>
          )}

          {/*
            FIX (UX audit — undiscoverable Tier-2 languages): nothing told
            first-time users that typing in the search box unlocks 90+ more
            languages beyond this visible list, so the search field's real
            purpose was easy to miss. One quiet hint line, shown only until
            they start typing.
          */}
          {!q && (
            <li className="px-4 pt-2 pb-1 text-xs text-slate-500 font-medium border-t border-slate-100 mt-1.5">
              Search above for 90+ more languages (auto-translated)
            </li>
          )}

          {/* Tier-2 is search-only: this whole section (header + list) is
              omitted from the DOM entirely when q is empty, not just
              filtered down to zero rows. */}
          {q && (
            <>
              <li className="mt-1.5 mx-4 border-t border-slate-100" aria-hidden="true" />
              <li className="px-4 pt-2 pb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                Other languages (auto-translated)
              </li>
              {filteredTier2.length > 0 ? (
                filteredTier2.map((l) => (
                  <li key={l.code} role="option" aria-selected={l.code === tier2Code}>
                    <button
                      type="button"
                      onClick={() => setTier2(l.code)}
                      className={`w-full text-left px-4 py-2 text-sm font-semibold flex items-center gap-2.5 hover:bg-blue-50 ${
                        l.code === tier2Code ? "text-blue-600 bg-blue-50/50" : "text-slate-700"
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      {l.name}
                    </button>
                  </li>
                ))
              ) : (
                !noMatches && (
                  <li className="px-4 py-2 text-sm text-slate-600">No matches</li>
                )
              )}
            </>
          )}

          {noMatches && <li className="px-4 py-2 text-sm text-slate-600">No matches</li>}
        </ul>
      )}
    </div>
  );
}
