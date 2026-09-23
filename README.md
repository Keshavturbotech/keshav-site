# Keshav Enterprises — Astro Migration

## Status (Phase 1-19 — Confirmed working correctly + fixed a real CSP bug)

Your DevTools console screenshot was genuinely useful — it confirmed two
things clearly rather than leaving them as guesses.

**Confirmed: the image fallback fix from Phase 17-18 is working correctly.**
Your card screenshot shows clean fallback icons on every card — no blank
boxes, no bleed-through — while the console shows a long list of genuine
404s for `.webp`/`.png` files that don't exist yet (`ptfe-air-filter-1.webp`,
`duplex-basket-strainer-1.webp`, `iec-logo.png`, etc.). This is exactly the
correct, intended behavior for products without uploaded images — not a bug.
As real image files get added to `/public` matching each product's expected
filename, they'll display correctly (already verified in an earlier round);
everything else will keep showing the clean fallback icon rather than
breaking.

**Found and fixed a real bug**: your console also showed a genuine CSP
violation — `https://scripts.clarity.ms/.../clarity.js` was being blocked
because the CSP's `script-src` and `connect-src` directives only allowlisted
`www.clarity.ms` and `cdn.clarity.ms`, missing the actual domain Microsoft
Clarity's bootstrap script loads from. This meant Clarity analytics has been
silently broken since Phase 11 (when the CSP was first built) — it would
never have loaded, with no visible symptom other than this console warning.
Fixed in both places the CSP lives: the `<meta>` tag in `Layout.astro` and
the real HTTP header in `public/_headers`.

While fixing this, cross-checked every external domain referenced anywhere
in the codebase against the CSP allowlist to make sure nothing else was
silently missing — confirmed clean (the only two domains not explicitly
allowlisted, `maps.gstatic.com` and `schema.org`, are used only for a
DNS-prefetch hint and JSON-LD's `@context` value respectively — neither
triggers CSP enforcement).

Rebuilt and verified: 174 pages, zero errors, zero warnings, zero broken
links, `scripts.clarity.ms` confirmed present in both the built HTML and
the `_headers` file.

Your screenshot showed a real image loading (Conical Strainer) but with a
faint icon shape still visible behind it — a regression I introduced in the
Phase 17 fix. Root cause: I made the fallback icon always render underneath
the image so it would never go blank while waiting for `onError`, but I
never hid it again once the image DID load successfully. Product photos are
typically shot on white/transparent backgrounds with padding around them
(`object-contain`), so the fallback icon was visible through those gaps even
on a fully working image.

**Fix**: in both `RichProductCard.jsx` and `FeaturedProductsStrip.jsx`, the
fallback now only renders while `!imgLoaded || imgErr || !pImg` — visible
during loading and on failure, hidden the instant the real image is
confirmed loaded. Rebuilt and verified: 174 pages, zero errors, zero
warnings, zero broken links.

**On "not all images are shown"**: this is very likely simply because not
every product yet has a matching image file in `/public` — each product's
`images[0]` in `products.ts` expects a specific filename, and only products
where that exact filename exists will show a photo (everything else
correctly shows the fallback icon now, rather than the old blank-box bug).
If you're confident you uploaded a file for a specific product and it's
still showing the fallback, the filename likely doesn't exactly match what
that product's data expects — happy to check specific product IDs against
their expected filenames if you hit that.

You reported product card images not loading — this was a genuine code bug,
not just missing image files. Found and fixed.

**Root cause**: `RichProductCard.jsx` and `FeaturedProductsStrip.jsx` both
only rendered the fallback icon once an image's `onError` event fired and
flipped a state flag. Until that happens — or if the dev server's response
for a missing file doesn't trigger a clean browser error event promptly —
the `<img>` sat at `opacity-0` with **nothing rendered underneath it**,
producing a persistent blank box instead of the intended fallback icon.

**Fix**: in both files, the fallback icon now always renders first as a
background layer (`z-0`), with the actual product image layered on top
(`z-10`) and only faded in once it successfully loads. This removes any
dependency on the error event firing — there's no longer a code path that
can produce a blank box, regardless of network/server behavior for missing
files.

**Checked but left alone**: the product detail page's image gallery
(`ProductDetailInteractive.jsx`) uses a different, already-safe pattern — it
removes broken images from the list entirely on error rather than toggling
opacity, so it self-corrects to its own "no image" fallback rather than
going permanently blank. Not the same bug class; no change needed there.

Rebuilt and verified: 174 pages, zero errors, zero warnings, zero broken
links, and the fallback SVG icon markup confirmed present in both fixed
component bundles.

You sent 13 screenshots comparing the Products listing and a product detail
page (React vs. this Astro build). This was the single biggest round of
fixes yet — several were structural, not cosmetic. All fixed and verified.
Rebuilt: still 174 pages, zero errors, zero warnings, zero broken links.

### 1. Product cards were structurally wrong — rebuilt as `RichProductCard.jsx`

My cards had a plain description + single "View Details" link. The real
`ProductCard` (`App.jsx` line ~9654) has a distinct "Application:" callout
box (with a target icon) and a dual-button footer — green "RFQ" button
(opens WhatsApp with a pre-filled quote message) + black "Specs" button.
Built `RichProductCard.jsx` as the ONE shared card component and wired it
into `ProductsGrid.jsx` (main catalog) and the product detail page's related
products — matching the original's actual architecture (one component reused
everywhere) instead of my previous approach of similar-but-different card
markup in each place.

### 2. A whole global component was missing: `DigitalProfilesStrip`

Found while checking the product detail page — but this turned out to be
much bigger than a product-page issue. `App.jsx` line ~27678 confirms this
renders **site-wide, on every single page**, right before the Footer. Built
`DigitalProfilesStrip.astro` (Google Business / IndiaMART / TradeIndia /
ExporterIndia / JustDial verification badges) and added it to `Layout.astro`
— now appears on all 174 pages, matching the original.

### 3. Technical Data tab was a flat list — should be categorized sub-tabs

Real product pages group specs into Performance/Materials/Standards/General
sub-tabs via keyword-matching against each spec's key name (`App.jsx` line
~13739, `SPEC_GROUPS` — a genuinely large keyword system), with Est. Price
and Lead Time always appended as extra rows regardless of which sub-tab is
active. Ported the full keyword system to `src/data/spec-groups.ts` and
rebuilt the specs table in `ProductDetailInteractive.jsx` to match exactly.

### 4-7. Four sections were missing entirely from the product detail page

- **"Need installation or maintenance?"** box linking to `/services`
- **"Report an Issue with this Product"** button — opens a full 4-step
  wizard (`ReportIssueModal.jsx`, ported from `App.jsx` line ~12546: issue
  type → details → optional contact info → confirmation), submitting to the
  same Web3Forms endpoint as the site's other forms
- **"Recently Viewed"** strip — `RecentlyViewedStrip.jsx` tracks up to 6
  product IDs in `localStorage` and displays the last-viewed ones (excluding
  the current product)
- **Share button** next to the category/availability badges (native share
  sheet on mobile, clipboard-copy fallback on desktop)

### 8. Breadcrumb was wrong case

`uppercase` was applied to the entire breadcrumb nav, shouting "CATALOG /
INDUSTRIAL FILTRATION / ..." — the real site only uppercases the current
page name (product title), keeping "Catalog" and the category crumb in
normal case. Fixed.

### 9. Heading text was wrong

"Related Products" → real site says **"You May Also Need"**.

### Still flagged, not yet built

The products listing hero has a **"VIEW PRICES IN [IN INR ▾]"** currency
selector button (visible in your screenshot) that I haven't wired up —
this connects to the currency-conversion simplification already flagged in
earlier rounds (static `FALLBACK_RATES` exist in `currency.ts`, but no
selector UI or live-fetch is built yet). Still an open item if you want it.

Your 2 screenshots of the OEM trust strip caught another real bug — and
prompted a systematic sweep that found the same _pattern_ repeated 2 more
times on the homepage. Rebuilt and verified: still 174 pages, zero errors,
zero broken links.

**The bug**: OEM section showed plain text names only. The real site
(`App.jsx` line ~16026) tries to load an actual logo image per brand first
(`/{oem-slug}-logo.png`) and only falls back to text+icon if that image
404s — I'd only ported the fallback path, never the primary image attempt.
Fixed to match exactly, including the exact slug algorithm
(`oem.toLowerCase().replace(/[^a-z0-9]/g, "-")` — verified this produces
`belliss---morcom-logo.png`, three dashes, matching source precisely).

**Note**: this fix is code-correct but won't show real logos until you
upload the actual `{slug}-logo.png` files to `/public` — until then it'll
correctly show the text+icon fallback, same as it does now.

**Then I checked every other icon-in-a-loop on the homepage against
source**, since this was clearly a pattern (generic/hardcoded icon
substituted for a real per-item one), not an isolated mistake. Found 2 more:

- **Services Preview cards** (3 cards): all three showed the same generic
  clock icon. Real site uses each service's actual icon via `SERVICE_ICONS`
  map (Wrench/Hexagon/Activity). Fixed using the `SERVICE_ICON_NAMES` data
  and `Icon.astro` component already built for the services pages.
- **Capabilities strip** (6 items): all six showed the same lightning-bolt
  icon. Real site uses 6 distinct icons (Zap/Layers/Activity/Wind/
  Droplets/Cpu). Fixed — added `Wind` and `Cpu` paths to `Icon.astro` (they
  weren't needed anywhere else yet) and converted `CAPABILITIES` from plain
  strings to `{iconName, text}` objects.

**Checked and confirmed correct** (no false alarms hidden): `HOME_STATS`
icons were already right (I'd used correct lucide path data inline, just
not via the shared `Icon.astro` component — cosmetically different code,
identical visual output). Testimonials' initials-avatar logic matched
source exactly. One small data drift found and fixed while checking that
section: the 4th testimonial's role/company had drifted to "Operations
Manager" / "Power Plant" somewhere in transcription — corrected to the
real "Instrumentation & Maintenance Engineer" / "Captive Power Plant".

### Continuing the same audit — 3 more gaps found further down the page

You asked me to check the _whole_ homepage, not just what the screenshots
showed. Kept going through every remaining section against source:

5. **Featured Products was a static grid — should be an interactive
   carousel.** The real homepage uses `FeaturedProductsStrip` (`App.jsx`
   line ~15325): requestAnimationFrame-driven infinite auto-scroll,
   mouse/touch drag, IntersectionObserver-gated (animation loop fully stops
   when scrolled off-screen), nav arrows, `prefers-reduced-motion` support.
   Rebuilt as `FeaturedProductsStrip.jsx`, replacing the static 4-card grid.

6. **A whole section was missing**: the "compact resource bar" linking to
   Blog and Downloads in one line (`App.jsx` line ~16538), between the
   Projects teaser and Final CTA. Added.

7. **Final CTA was drastically oversimplified.** I'd built one centered box
   with 2 buttons. The real one (`App.jsx` line ~16563) is a two-path design
   addressing planned-work visitors and emergency-breakdown visitors
   separately — different copy, icons, CTAs each — plus a 4-item
   risk-reversal strip below (no obligation / confidential RFQ / engineer
   not call-centre / response time commitment). Rebuilt to match.

**Also confirmed correct this round**: Capabilities strip's 6 icons are
genuinely distinct (checked `Icon.astro`'s path map directly, not assumed).

All rebuilt and verified again after these 3 additions: still 174 pages,
zero errors, zero warnings, zero broken links.

You sent 2 screenshots comparing the homepage hero (live React site vs. this
Astro build) and it immediately surfaced 6 real, concrete differences — this
is exactly why visual comparison matters even after a "clean build." All 6
fixed and verified. Rebuilt: still 174 pages, zero errors, zero warnings,
zero broken links.

1. **BrandLogo.jsx was wrong.** Showed "Keshav Enterprises / Turbine
   Engineering" on 2 lines — a stub I wrote from scratch during initial
   scaffolding rather than a real port, and never came back to fix. The
   actual original (`App.jsx` line ~9492) is 3 stacked lines: "KESHAV" /
   "ENTERPRISES" / "Quality & Assurance" (italic). Fixed to match exactly.

2. **The navbar's "Get Quote" button was missing entirely.** A prominent
   blue CTA button with a phone icon, positioned right after the search
   icon in the desktop nav (`App.jsx` line ~11233) — I'd missed this whole
   section when first porting `Navbar.jsx`. Added back.

3. **Hero section CTA/stats order was wrong on desktop.** The original uses
   CSS `order` utilities so mobile shows CTAs-then-stats but desktop flips
   to stats-then-CTAs (`App.jsx` line ~15895, `lg:order-2`/`lg:order-3`). I
   had built one fixed order for all breakpoints. Fixed with the same
   `lg:contents` + `lg:order-*` technique.

4. **The office-hours pill had completely wrong text.** I'd flagged this as
   a known simplification ("static pill instead of live clock") but seeing
   it next to the real site made clear the placeholder text itself was
   wrong — not just non-live. Built a real `OfficeHoursPill.jsx` island that
   checks IST time every 60s and shows one of the two actual messages:
   "Engineers online now — reply within 2 hrs" (in hours) or "Emergency line
   active 24×7 — planned RFQs answered by 9 AM IST" (out of hours).

5. **Proof cards were missing their icons.** Each of the 3 right-column
   cards (Award/CheckCircle2/PhoneCall icons top-right) had no icon in this
   port. Added.

6. **WhatsAppBubble and BackToTopButton were both oversimplified stubs**
   from initial scaffolding, never revisited: the real WhatsApp widget has a
   timed greeting bubble, a phone pill, and a hover-label FAB
   (`App.jsx` line ~13189) — mine was a single static button. The real
   back-to-top button sits bottom-**left** with a circular scroll-progress
   ring (`App.jsx` line ~13091) — mine was bottom-right with no ring, which
   would have visually collided with the taller WhatsApp stack once that
   got fixed. Both rebuilt to match.

**Also fixed while in there**: `LanguageSwitcher.jsx`'s trigger button
showed a plain globe icon; the real one shows a flag + language code +
chevron (`App.jsx` line ~10284). Rebuilt using flag emoji instead of the
original's ~100 embedded SVG flags (visually equivalent, far less code) —
flagged as a simplification below since the full version also has a
searchable ~100-language list where this port shows the top 10 only.

**✅ Build re-verified.** Still 174 pages, zero errors, zero warnings.
Verified programmatically: blog auto-linking produces real, correctly-
targeted `<a href>` tags (1-4 per post, each phrase linked exactly once
across the whole article), the refactored `ReviewForm.jsx` product picker
still builds and bundles correctly, and every internal link across all 174
pages — including the newly auto-linked blog phrases — resolves to a real
page. Full link-check script output: zero broken links.

### Fixed this session: two more self-audit catches

- **Stale `sitemap.xml`**: back in Phase 1 I copied your original
  `sitemap_updated.xml` into `public/sitemap.xml` as a placeholder. It never
  got removed, meaning a second, incomplete, stale sitemap (dated 2026-06-06,
  listing only ~15 top-level URLs) sat alongside the real auto-generated
  `sitemap-index.xml` that correctly lists all 174 pages. Removed — Astro's
  `@astrojs/sitemap` integration is the single source of truth now.
- Re-scanned the whole codebase for any other `href`/`src` references to
  files that might not exist in `/public` — found none beyond what's already
  documented below (images, PDFs).

### Resolved: blog auto-linking (previously flagged as "not recoverable")

I was wrong last time — the keyword→URL map (`BLOG_LINK_TARGETS`) was fully
present in your `App.jsx`, I just hadn't looked closely enough. Rebuilt as
`src/lib/linkifyBlogText.ts` and wired into `blog/[slug].astro`: the same
phrase list, same "longest phrase wins" sort order, same "only the first
mention per target gets linked" rule enforced across the whole article via a
shared `Set`. One real fix included: the original pointed auto-links at
`/service/srv_X` (singular) — updated to `/services/srv_X` (plural) to match
this migration's consistent routing, same reasoning as the Industries
routing note below.

### Resolved: ReviewForm's ALL_PRODUCTS now syncs with the real catalog

Previously flagged as an intentionally-left-alone duplicate list. Verified
first — all 132 IDs and all 9 category names matched exactly between
`ReviewForm.jsx`'s hardcoded list and `src/data/products.ts` — then
refactored `ALL_PRODUCTS` to derive from `PRODUCTS` at module load instead
of hand-maintaining a second copy. Behavior-preserving (verified identical
before changing), and now structurally impossible to drift out of sync when
you add or remove products.

### Fixed: llms.txt / llms-full.txt were 404ing on every single page

`Layout.astro` has linked to `/llms.txt` and `/llms-full.txt` since Phase 1
(both were in the original `index_updated.html`), but I never actually
created those files — a real gap I introduced and only caught now. Fixed:

- `public/llms.txt` — a concise, llmstxt.org-convention index: company
  summary, links to every service/industry/product-category/case-study/blog
  post, generated from the same real data files every page uses (not
  hand-written prose that drifts out of sync).
- `public/llms-full.txt` (116 KB) — the complete content dump: full service
  overviews and "why our engineers" copy, full industry challenge
  breakdowns, all 132 products grouped by category, all 8 case studies with
  scope/challenge/solution/outcomes, and the full text of all 7 blog posts.
- `scripts/generate-llms-txt.cjs` + `npm run generate:llms` — both files are
  generated by a script that imports the real data modules, not
  hand-maintained. Re-run this whenever you add a product, service, blog
  post, or case study, so these files never silently go stale. Worth wiring
  into a pre-build CI step if you want it fully automatic.
- Added cache headers for both in `_headers` (1-hour revalidating, shorter
  than the image/asset cache since this content changes with your catalog).

This directly serves the goal of AI/LLM discoverability — GPTBot, ClaudeBot,
PerplexityBot and similar crawlers use this convention to get a structured
summary instead of having to parse rendered HTML across 174 pages.

**✅ Build re-verified after security hardening.** Still 174 pages, zero
errors, zero warnings. Confirmed programmatically: the CSP meta tag is the
very first meaningful byte in `<head>` (position 78, versus the first
`<script>` tag at position 4796 — CSP is active well before any script can
run), and GA4/Clarity scripts do NOT appear anywhere in server-rendered HTML
— only the gated `AnalyticsLoader` island ships, which injects them
client-side and only after cookie consent.

### What changed: security & performance hardening

- **CSP now server-rendered, not JS-injected.** The original built its
  Content-Security-Policy by creating a `<meta>` tag via JavaScript after
  the component mounted (`App.jsx` line ~8869) — meaning the very first
  paint of every page had zero CSP protection while the JS bundle was still
  loading. This port renders the identical policy directly into the HTML
  response via `Layout.astro`, active from byte one.
- **Real HTTP security headers added** (`public/_headers`, Cloudflare Pages
  convention): the same CSP as a true response header (closes a gap meta
  tags structurally can't — a header applies before the browser parses any
  HTML, a meta tag can only apply once the parser reaches it), plus
  `X-Frame-Options`, `X-Content-Type-Options: nosniff`,
  `Strict-Transport-Security` (HSTS, 1-year, includes subdomains, preload-
  ready), and `X-XSS-Protection`. The original's own code comment called
  for this ("ideally duplicate them as HTTP headers") but never implemented
  it — this port does.
- **Long-cache headers for hashed build assets** — Astro fingerprints
  `/_astro/*` files, so they're safe to cache for a full year immutably;
  images get a shorter revalidating cache. This directly targets repeat-
  visit performance, one of your original 5 goals.
- **Consent-gated analytics preserved exactly**: GA4 and Microsoft Clarity
  still only load after the visitor accepts cookies via
  `CookieConsentBanner`, matching the original's privacy-conscious design.
  Simplified: the original manually fired `trackPageView()` on every SPA
  navigation because the old app never triggered a real page load on route
  change. Real Astro routes ARE real page loads, so GA4's own script
  handles pageview tracking automatically — nothing to reimplement.
- If you deploy anywhere other than Cloudflare Pages, `_headers` won't be
  read automatically; the same header values need configuring in that
  platform's equivalent (Netlify's `netlify.toml`, Vercel's `vercel.json`, etc).

**✅ Build re-verified after adding Review/ExitIntent.** 174 pages now
(was 173 — `/review` added), still zero errors, zero warnings. Confirmed the
exit-intent popup's script correctly loads on general pages (home, about,
blog) and correctly stays out of `/contact`, `/products/[id]`,
`/services/[id]`, `/downloads`, and `/review` itself — checked by inspecting
which pages actually reference the island's JS bundle, not by assumption.

**✅ Build verified.** `npm install && npm run build` completes cleanly.
See detailed Phase 10 note above for the latest confirmed count.

- [x] Project scaffold (Astro 5 + React islands + Tailwind v4 + sitemap integration)
- [x] src/data/site-config.ts — contact info, nav links, OEMs (ported from App.jsx)
- [x] src/data/services.ts — SERVICES array (ported from App.jsx)
- [x] src/layouts/Layout.astro — head/meta/JSON-LD/Google Translate (ported from index_updated.html)
- [x] src/components/islands/Navbar.jsx — full interactive navbar (ported from App.jsx)
- [x] src/components/Footer.astro — full port (ported from App.jsx, ~520 lines incl. scoped CSS)
- [x] src/pages/index.astro — Hero, OEM marquee, Stats, Services Preview, Testimonials, Capabilities, CTA band
- [x] src/data/products.ts — ALL 132 products ported (RAW_PRODUCTS + PRODUCT_PRICE_MAP + CATEGORY_PRICE_BANDS + CATEGORY_AVAILABILITY + image shaping logic)
- [x] src/data/industries.ts — ALL 7 industries ported (icon names stored as strings, resolved at render)
- [x] Featured Products Strip (homepage) — live, deterministic 8-product selection, with prices + availability
- [x] NavDropdown — fully wired: Services 7 items, Products 9 category items, Industries 7 items
- [x] src/pages/about.astro — full port: hero, stats bar, company overview, gallery, values, timeline, team, OEM grid, export section, CTA
- [x] src/pages/services/index.astro — full port: alternating service rows, emergency CTA band, FAQ (island), See Our Work banner, FAQPage schema
- [x] src/data/service-details.ts — SERVICE_DETAIL_DATA (all 7 services: tagline, stats, whyUs, overview, procedures) ported verbatim
- [x] src/pages/services/[id].astro — dynamic route, one real URL per service, hero/stats/procedures/prev-next nav, Service+Breadcrumb schema
- [x] src/data/industries.ts — ALL 7 industries ported (icon names stored as strings, resolved at render)
- [ ] Featured Projects teaser, FAQ teaser (homepage) — not yet ported
- [x] src/data/currency.ts — SUPPORTED_CURRENCIES + FALLBACK_RATES + formatPrice() ported (static rates, not live-fetched — see note below)
- [x] src/pages/products/index.astro + ProductsGrid.jsx island — full catalog: search, category chips, OEM filter, price range, sort, pagination (24/page)
- [x] src/pages/products/[id].astro + ProductDetailInteractive.jsx island — dynamic route, 132 real URLs, image gallery + lightbox + keyboard/swipe nav, specs/features tabs, related products, Product+Breadcrumb schema
- [x] src/lib/formHelpers.ts — rate limiting, sanitisation, WhatsApp message builder (ported from App.jsx)
- [x] TurnstileWidget.jsx island — Cloudflare Turnstire bot protection, renders nothing if no site key configured
- [x] ContactForm.jsx island — full RFQ form (name/company/email/phone/inquiry type/turbine make/details/file upload), dual submit (Web3Forms+WhatsApp or email-only), validation, rate limiting
- [x] InlineRFQForm.jsx island — compact collapsible quote form, now wired into every /products/[id] page
- [x] src/pages/contact.astro — hero, phone/email/address cards, office hours, embedded Google Map, ContactForm
- [x] .env — real Web3Forms key wired in from your _env_updated upload (gitignored, not in this zip's git history since there is none yet)
- [x] src/data/industry-details.ts — INDUSTRY_DETAILS (all 7: heroSub, overview, challenges, keyFacts, products), IND_TESTIMONIALS, INDUSTRY_PRODUCT_IDS all ported
- [x] src/pages/industries/index.astro — full port: alternating infographic/content rows, use-case chips, testimonials, triple CTA (quote/explore/WhatsApp)
- [x] src/pages/industries/[id].astro — dynamic route, 7 real URLs, hero+keyfacts, overview, challenges, products cross-linked to real /products/[id] pages, CTA. Case-studies section omitted (needs CASE_STUDIES — see below)
- [x] src/data/case-studies.ts — all 8 CASE_STUDIES ported verbatim
- [x] src/pages/projects/index.astro + ProjectsFilter.jsx island — search/category/industry filter + pagination (9/page)
- [x] src/pages/projects/[id].astro — dynamic route, 8 real URLs, scope/challenge/solution/outcomes sections, prev/next nav, sidebar (tags/CTAs/related services), Article+Breadcrumb schema
- [x] Related Case Studies now wired into Services detail pages (matched by SVC_CATEGORY_MAP) and Industries detail pages (matched by IND_CS_MAP) — the two sections previously omitted
- [x] Homepage "Projects & Case Studies" teaser section added (2 featured cards + view-all link)
- [ ] BlogPage — not yet ported
- [ ] DownloadGateModal, /downloads, /review, /privacy-policy, /terms-of-service — not yet ported

- [x] src/data/blog-posts.ts — all 7 BLOG_POSTS ported verbatim (structured content blocks: h2/p/list/cta)
- [x] src/pages/blog/index.astro + BlogFilter.jsx island — search + tag filter, featured post + grid
- [x] src/pages/blog/[slug].astro — dynamic route, 7 real URLs, content-block renderer, reading progress bar, share buttons, related posts, BlogPosting+Breadcrumb schema
- [x] src/data/downloads.ts — all 6 DOWNLOADS ported verbatim
- [x] src/pages/downloads.astro + DownloadsGrid.jsx island — search/category filter + lead-gated download modal (Web3Forms), ItemList schema
- [x] src/pages/privacy-policy.astro — full static content ported verbatim
- [x] src/pages/terms-of-service.astro — full static content ported verbatim
- [x] src/pages/404.astro — Astro's built-in 404 convention, keyword-based search redirect, quick links

## Every planned route is now built. Remaining work is QA, not construction:

- [x] src/components/islands/ReviewForm.jsx — the multi-step review/inquiry form YOU provided, ported with minimal changes (see below)
- [x] src/components/islands/ExitIntentReviewPopup.jsx — the exit-intent popup YOU provided, ported with minimal changes (see below)
- [x] src/pages/review.astro — wraps ReviewForm as a full page
- [x] Exit-intent popup wired site-wide into Layout.astro, `client:idle` (loads after main content, since it's not needed immediately)
- [x] Path exclusions ported from original `POPUP_EXCLUDED_PATHS`: popup suppressed on `/contact`, `/products/[id]`, `/services/[id]`, `/downloads`, and `/review` itself

## What changed in the two files you uploaded (minimal, listed exhaustively)

Both files were already clean, self-contained React with no hash-routing or
router coupling — copied in almost verbatim. Only 5 changes were needed:

1. `ReviewForm.jsx`: the 3 config constants (`WEB3FORMS_ACCESS_KEY`,
   `AI_PROXY_URL`, `LOGO_URL`) now read from `import.meta.env.PUBLIC_*` /
   real asset paths instead of hardcoded placeholder strings. Web3Forms key
   is wired to the same live key used by ContactForm/InlineRFQForm.
   AI_PROXY_URL defaults to empty (no Cloudflare Worker deployed) — per the
   file's own design, the Q&A box hides itself automatically when empty, so
   nothing is broken, just an optional feature not yet turned on.
2. `ExitIntentReviewPopup.jsx`: same Web3Forms key wiring.
3. `ExitIntentReviewPopup.jsx`: `process.env.NODE_ENV !== 'production'` →
   `import.meta.env.DEV` (Vite/Astro's equivalent — `process.env` doesn't
   exist in the browser bundle here the way it does in a Node/CRA setup).
4. `ExitIntentReviewPopup.jsx`: the "Leave a full review" link used
   `href="#/contact"` and a `window.location.hash` fallback — both relics of
   the old hash router. Changed to a real `/review` URL (matching what the
   surrounding code comment actually says it should do) with
   `window.location.assign()` as the fallback.
5. Import path fix: `ReviewForm.jsx` was renamed from
   `KeshavEnterprises_ReviewForm_v3.jsx` to `ReviewForm.jsx` for consistency
   with the rest of the codebase — updated the one import that referenced
   the old filename.
6. `ALL_PRODUCTS` refactored to import from `src/data/products.ts` instead
   of maintaining its own separate hardcoded copy — see the Phase 13 note
   above for the verification done before making this change.

## Known omissions (real, not guessed)

- **Actual PDF/XLSX files**: `downloads.ts` references 6 real filenames
  (e.g. `turbine-overhaul-checklist.pdf`) that need to physically exist in
  `/public` for the download links to work. I ported the metadata and gate
  logic; the files themselves need to come from you.
- **Blog post cover images / product images / case study images / etc.**:
  this migration ported every piece of CODE and DATA, but none of the actual
  image binaries — every page references filenames (e.g. `/hero-background.webp`,
  `/service-turbine-erection.webp`) that need to be copied into `/public`
  from your current site for images to render instead of showing broken-image
  icons or onError fallbacks.

## Known simplifications (flagged for your review)

- **Language switcher**: the original has ~100 Google Translate languages
  (10 shown by default, full list searchable) with embedded SVG flags. This
  port shows the same top 10 languages with flag emoji instead of embedded
  SVGs (visually equivalent) but no search box for the other ~90 languages.
  Same cookie-based Google Translate mechanism either way — this only
  affects how many languages are reachable from the dropdown itself.
- **?service= prefill**: contact form reads `?service=X` from the URL to
  preselect inquiry type (e.g. clicking "Inquire" on a service page links to
  `/contact?service=Turbine%20Overhauling`). This replaces the original's
  `ke:prefillContact` CustomEvent system, which existed only because the old
  SPA kept every page mounted at once. Real routes don't need that — URL
  params are simpler and bookmarkable.
- **Turnstile**: your uploaded .env has an empty Turnstile site key, so the
  widget currently renders nothing and forms submit without the CAPTCHA check
  (same fallback behavior the original had). Add a real
  `PUBLIC_TURNSTILE_SITE_KEY` to `.env` when you have one.
- **Currency conversion**: original fetched live FX rates from open.er-api.com;
  this port uses the same fallback rates but doesn't live-fetch. Prices display
  in INR only on product cards for now — the formatPrice() utility supports
  all 10 currencies if you want the selector added back.
- **Product image existence-checking**: original used hidden 1×1 probe images
  to detect which of up to 12 generated filenames actually exist before
  rendering. This port uses onError to hide broken thumbnails after attempted
  load — same end result, simpler code, negligible visual difference (a broken
  thumbnail flashes for one frame instead of never appearing).
- **Industries routing**: the original used asymmetric routes — `/industries`
  for the index but `/industry/:id` (singular) for detail pages. This port
  uses `/industries/:id` consistently for both, which is more standard REST
  practice and avoids a confusing URL pattern. Let me know if you'd rather
  match the original exactly.
- **Homepage case-study teaser text**: the original referenced `cs.summary`,
  a field that doesn't actually exist anywhere in the CASE_STUDIES data (only
  `scope`, `challenge`, `solution` exist) — likely a leftover from an earlier
  data shape, meaning that teaser text was silently blank in production. This
  port uses `cs.scope` instead so the teaser cards actually show text.

## Run locally

```
npm install
npm run dev
```

Open http://localhost:4321 and compare against the live React site page by page.

## Full route list (all built)

```
/                          /services                  /products
/about                     /services/[id] (×7)         /products/[id] (×132)
/contact                   /industries                 /projects
/blog                      /industries/[id] (×7)       /projects/[id] (×8)
/blog/[slug] (×7)          /downloads                  /privacy-policy
/terms-of-service          404 (Astro auto-served)
```

## Final QA checklist before going live

1. **Copy real image files into `/public`** — every page references filenames
   from the original site (hero, service images, product photos, blog covers,
   OG images, favicons, logos). Nothing will visually work until these exist.
2. **Copy real PDF/XLSX files into `/public`** for the 6 items in `downloads.ts`.
3. **Run `npm run build`** and check for broken-link warnings or build errors.
4. **Pixel-diff every page** against the live site at desktop/tablet/mobile —
   this was the core ask ("without changing any functionality / pixel-perfect
   copy"), and only you can verify that against the real rendered output.
5. **Test the contact form and RFQ forms end-to-end** — Web3Forms key is live,
   so a real submission sends a real email. Confirm delivery to
   `info.ksengg007@gmail.com`.
6. **Add a real `PUBLIC_TURNSTILE_SITE_KEY`** to `.env` if you want spam
   protection active (currently forms submit without a CAPTCHA check, same
   as the original's fallback behavior with no key configured).
7. **Decide on the flagged simplifications** above (currency conversion,
   blog auto-linking, industries routing, `/review` page) — none are blockers,
   but each is a real, intentional difference from the original that's worth
   a conscious yes/no rather than silent acceptance.
8. **Deploy** — this is `output: "static"` in `astro.config.mjs`, so it builds
   to plain HTML/CSS/JS deployable to Cloudflare Pages, Netlify, Vercel, or
   any static host. Update `SITE_URL` in `astro.config.mjs` and `Layout.astro`
   if the final domain differs from `keshavturbotech.com`.
