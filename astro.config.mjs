// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// ── CHANGE THIS to your final root domain (no trailing slash on path) ──
const SITE_URL = "https://www.keshavturbotech.com";

export default defineConfig({
  site: SITE_URL,
  output: "static", // full static output — best for Cloudflare Pages + SEO + zero server cost
  trailingSlash: "never",
  i18n: {
    defaultLocale: "en",
    locales: [
      "en",
      "hi",
      "mr",
      "gu",
      "ar",
      "fr",
      "ne",
      "es",
      "pt",
      "ru",
      "de",
      // zh-CN: Astro's getRelativeLocaleUrl()/getPathByLocale() always
      // lowercase a plain-string locale code for the URL segment ("zh-cn"),
      // but every other reference to this locale in the codebase
      // (src/i18n/zh-CN/ folder name, src/lib/localeMeta.ts) uses "zh-CN"
      // with a capital CN. Left as a plain string, getStaticPaths params
      // built from the raw code produce a page at the literal-case URL
      // (/zh-CN/) while Layout.astro's hreflang/canonical — built via
      // getRelativeLocaleUrl — point at the lowercased /zh-cn/, a 404.
      // Splitting `code` (content-lookup key) from `path` (URL segment)
      // via this object form makes the two agree: astro:i18n's
      // getPathByLocale("zh-CN") now returns "zh-cn" for both getStaticPaths
      // (see src/pages/[locale]/*.astro) and Layout.astro's hreflang, and
      // Astro.currentLocale still resolves to the code "zh-CN" so
      // getLocalizedData finds src/i18n/zh-CN/*.json.
      { path: "zh-cn", codes: ["zh-CN"] },
      "id",
      "th",
      "vi",
      "tr",
      "sw",
    ],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    react(), // enables React islands (client:* directives) inside .astro files
    sitemap({
      // Excludes private/utility routes from sitemap.xml
      filter: (page) => !page.includes("/thank-you") && !page.includes("/404"),
      changefreq: "weekly",
      priority: 0.7,
      // Part 3, step 3: emit per-URL <xhtml:link rel="alternate" hreflang>
      // entries. The plugin's own `i18n` option (not a custom `serialize`
      // callback — this build's @astrojs/sitemap 3.7.3 already supports
      // this natively, so no hand-rolled serializer is needed to get
      // there) groups every URL in the sitemap by its locale-stripped
      // path and cross-links them. `locales` maps the URL PATH SEGMENT
      // (as it literally appears in each sitemap URL, e.g. "zh-cn" — not
      // the locale CODE used elsewhere in the codebase) to the hreflang
      // value to emit for that segment (the real code, "zh-CN" with a
      // capital CN) — same code/path split as the zh-CN fix in the i18n
      // block above, kept in sync here rather than re-deriving it.
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          hi: "hi",
          mr: "mr",
          gu: "gu",
          ar: "ar",
          fr: "fr",
          ne: "ne",
          es: "es",
          pt: "pt",
          ru: "ru",
          de: "de",
          "zh-cn": "zh-CN",
          id: "id",
          th: "th",
          vi: "vi",
          tr: "tr",
          sw: "sw",
        },
      },
      // The `i18n` option above (plugin v3.7.3) has no x-default support at
      // all — checked its source directly, not inferred from output. Page-
      // level hreflang (Layout.astro) does emit x-default, so left as-is the
      // sitemap and pages disagree, which breaks the "sitemap must mirror
      // page-level hreflang" rule search engines rely on. This serialize
      // runs per-URL after the i18n grouping above already populated
      // `links`, so it only needs to append one extra link — the same
      // `en` URL already present in that group, relabeled `x-default` —
      // not reimplement the grouping itself.
      //
      // The plugin caches one `links` array per locale-stripped path and
      // hands the *same array instance* to every one of the 17 URLs that
      // share it (confirmed in its source: i18nPathToLinksCache). serialize
      // runs once per URL, so mutating that array in place (.push) would
      // append a duplicate x-default on every call — 17 stacked copies by
      // the last URL in the group. Guarding on "already has x-default" and
      // building a new array (no .push) makes this safe against that
      // shared-reference caching regardless of call order.
      serialize(item) {
        if (item.links?.length && !item.links.some((l) => l.lang === "x-default")) {
          const en = item.links.find((link) => link.lang === "en");
          if (en) item.links = [...item.links, { url: en.url, lang: "x-default" }];
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // Lighthouse's network-dependency-tree-insight flagged a deep,
          // largely-serial request chain on first load: 21 files import
          // from lucide-react, and since each icon ships as its own ESM
          // module (lucide-react's tree-shaking design), Rollup's default
          // splitting emits a separate ~450-900 byte chunk per icon
          // (chevron-right, chevron-down, phone, search, x, globe, ...).
          // Several of those sit behind another chunk in the dependency
          // graph (e.g. Navbar.js -> useCurrency.js -> ~10 icon chunks),
          // so the browser discovers and requests them in waves rather
          // than all at once, adding real round-trip time to hydration
          // even though each individual file is tiny.
          // Forcing every lucide-react module into one shared chunk
          // collapses that fan-out into a single cacheable request — same
          // total bytes, far fewer round trips, and it downloads once and
          // is reused across every island and every page on the site.
          manualChunks(id) {
            if (id.includes("lucide-react")) return "icons";
          },
        },
      },
    },
  },
  image: {
    // Astro's built-in image service — auto WebP/AVIF generation for <Image />
    remotePatterns: [{ protocol: "https" }],
  },
  build: {
    // Inline small CSS to cut render-blocking requests; assets get content hashes for long-cache headers
    inlineStylesheets: "auto",
  },
});
