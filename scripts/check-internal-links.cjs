#!/usr/bin/env node
/**
 * Post-build internal link + sitemap check over dist/.
 *  - every internal href/src (starting with "/") resolves to a built file
 *    (honouring public/_redirects as valid targets)
 *  - every <loc> in the sitemaps and every hreflang alternate exists
 * Usage: node scripts/check-internal-links.cjs [dist-dir]
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const dist = path.resolve(process.argv[2] || path.join(root, "dist"));
if (!fs.existsSync(dist)) { console.error("No dist/; run `npm run build` first."); process.exit(2); }
const redirects = new Set();
const rf = path.join(root, "public", "_redirects");
if (fs.existsSync(rf)) for (const l of fs.readFileSync(rf, "utf8").split("\n")) { const p = l.trim().split(/\s+/); if (p[0] && p[0].startsWith("/") && !p[0].includes("*")) redirects.add(p[0]); }
const htmls = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : e.name.endsWith(".html") && htmls.push(p); } })(dist);
function exists(u) {
  let p = decodeURIComponent(u.split("#")[0].split("?")[0]);
  if (p === "" ) return true;
  if (redirects.has(p)) return true;
  const clean = p.replace(/\/$/, "");
  return [path.join(dist, clean), path.join(dist, clean + ".html"), path.join(dist, clean, "index.html")].some((f) => fs.existsSync(f) && (fs.statSync(f).isFile()));
}
const ASSET = /\.(webp|png|jpe?g|gif|svg|avif|ico|pdf|xlsx?|docx?|zip|woff2?)$/i;
const broken = new Map(); const brokenAssets = new Map(); const linked = new Set();
for (const f of htmls) {
  const h = fs.readFileSync(f, "utf8");
  const rel = "/" + path.relative(dist, f);
  for (const m of h.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
    const u = m[1];
    if (u.startsWith("//")) continue;
    linked.add(u.replace(/\/$/, "").replace(/\.html$/, ""));
    if (!exists(u)) { const tgt = ASSET.test(u) ? brokenAssets : broken; if (!tgt.has(u)) tgt.set(u, new Set()); tgt.get(u).add(rel); }
  }
}
// sitemap + hreflang
let sitemapMissing = [], locs = 0, oldDomain = 0;
const siteMaps = fs.readdirSync(dist).filter((f) => /^sitemap.*\.xml$/.test(f));
const base = (fs.readFileSync(path.join(root, "astro.config.mjs"), "utf8").match(/site:\s*"([^"]+)"/) || [])[1] || "";
for (const sm of siteMaps) {
  const x = fs.readFileSync(path.join(dist, sm), "utf8");
  if (/keshavturboservices/.test(x)) oldDomain++;
  for (const m of x.matchAll(/<(?:loc|xhtml:link[^>]*href)>?\s*"?([^<"\s]+)/g)) { }
  for (const m of x.matchAll(/(?:<loc>|href=")(https?:\/\/[^<"]+)/g)) {
    locs++;
    const u = m[1].replace(base.replace(/\/$/, ""), "");
    if (u.startsWith("http")) continue; // other host or sitemap index entry
    if (!u || u.endsWith(".xml")) continue;
    if (!exists(u || "/")) sitemapMissing.push(u);
  }
}
console.log(`${htmls.length} pages, ${linked.size} distinct internal link targets, ${broken.size} broken targets`);
console.log(`missing asset files (images/PDFs not in this checkout\'s public/ or src/assets; check the live repo): ${brokenAssets.size}`);
for (const [u] of [...brokenAssets].slice(0, 8)) console.log(`  ASSET ${u}`);
for (const [u, from] of [...broken].slice(0, 40)) console.log(`  BROKEN ${u}  (from ${[...from].slice(0, 2).join(", ")}${from.size > 2 ? ` +${from.size - 2}` : ""})`);
console.log(`sitemap files: ${siteMaps.join(", ")}; urls/alternates checked: ${locs}; missing: ${sitemapMissing.length}; old-domain refs: ${oldDomain}`);
sitemapMissing.slice(0, 20).forEach((u) => console.log("  SITEMAP-MISSING " + u));
const pages = new Set(htmls.map((f) => "/" + path.relative(dist, f).replace(/index\.html$/, "").replace(/\.html$/, "").replace(/\/$/, "")));
const orphans = [...pages].filter((p) => p && p !== "/404" && !linked.has(p) && !p.startsWith("/_"));
console.log(`pages never linked from another page (excluding home/404): ${orphans.length}`);
orphans.slice(0, 15).forEach((p) => console.log("  ORPHAN " + p));
process.exit(broken.size || sitemapMissing.length || oldDomain ? 1 : 0);
