#!/usr/bin/env node
/**
 * Post-build SEO report over dist/**.html: <title> and meta description
 * lengths, og/twitter parity, double-escaped entities, dangling endings.
 * Usage: node scripts/seo-length-report.cjs [dist-dir]   (exit 1 on problems)
 */
const fs = require("fs");
const path = require("path");
const dist = path.resolve(process.argv[2] || path.join(__dirname, "..", "dist"));
if (!fs.existsSync(dist)) { console.error("No dist/ found; run `npm run build` first."); process.exit(2); }
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : e.name.endsWith(".html") && files.push(p); } })(dist);
const un = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const meta = (h, attr, name) => { const m = h.match(new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`, "i")) || h.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${name}"`, "i")); return m ? m[1] : ""; };
const DANGLING = /((?<![\p{L}\p{N}])(and|or|for|the|of|to|in|with|on|at|by|from|a|an|as)|[&,;:\-\u2013\u2014|])$/iu;
let bad = 0, rows = [];
for (const f of files) {
  const h = fs.readFileSync(f, "utf8");
  const t = (h.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "";
  const d = meta(h, "name", "description");
  const rel = "/" + path.relative(dist, f).replace(/index\.html$/, "").replace(/\.html$/, "");
  const iss = [];
  if (!t) iss.push("no title");
  if (!d) iss.push("no description");
  if (/&amp;amp;/.test(h)) iss.push("double-escaped &amp;amp;");
  if (un(t).length > 60) iss.push(`title ${un(t).length}>60`);
  if (un(d).length > 160) iss.push(`desc ${un(d).length}>160`);
  if (DANGLING.test(un(t))) iss.push("title ends mid-phrase");
  if (DANGLING.test(un(d).replace(/\u2026$/, ""))) iss.push("desc ends mid-phrase");
  if (un(meta(h, "property", "og:title")) !== un(t)) iss.push("og:title != title");
  if (un(meta(h, "name", "twitter:title")) !== un(t)) iss.push("twitter:title != title");
  if (un(meta(h, "property", "og:description")) !== un(d)) iss.push("og:description != description");
  if (un(meta(h, "name", "twitter:description")) !== un(d)) iss.push("twitter:description != description");
  if (/\/blog\/[^/]+$/.test(rel) && !/^\/[a-z-]{2,5}\/blog/.test(rel) && meta(h, "property", "og:type") !== "article") iss.push("blog post og:type != article");
  if (iss.length) bad++;
  rows.push(`${iss.length ? "!!" : "ok"} ${String(un(t).length).padStart(3)}/${String(un(d).length).padStart(3)} ${rel} ${iss.join("; ")}`);
}
console.log(rows.join("\n"));
console.log(`\n${files.length} pages, ${bad} with issues`);
process.exit(bad ? 1 : 0);
