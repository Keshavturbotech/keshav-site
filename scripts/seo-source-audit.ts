/**
 * Lists <title> and meta-description lengths for every English page,
 * derived from source data with the same composition rules the pages use.
 * Run: npx tsx scripts/seo-source-audit.ts   (exit 1 if any problem)
 * For the built site use: node scripts/seo-length-report.cjs
 */
import { readFileSync } from "node:fs";
import { buildSeoTitle, buildSeoDescription } from "../src/lib/seo.ts";
import { SEO_OVERRIDES } from "../src/data/seo-overrides.ts";
import { BLOG_POSTS } from "../src/data/blog-posts.ts";

const j = (f: string) => JSON.parse(readFileSync(new URL(`../src/i18n/en/${f}.json`, import.meta.url), "utf8"));
const list = (o: any): any[] => (Array.isArray(o) ? o : Object.values(o));
const BRAND = "Keshav Enterprises";
// Mirrors Layout.astro
const layoutTitle = (t: string) => buildSeoTitle(t, t.includes(BRAND) ? [] : [BRAND], "en");

type Row = { page: string; title: string; desc: string };
const rows: Row[] = [];
const ph = j("page-headers");
for (const k of ["products", "services", "industries", "blog", "downloads"])
  rows.push({ page: `/${k}`, title: layoutTitle(ph[k].metaTitle), desc: buildSeoDescription(ph[k].metaDescription, "en") });
const home = j("home").meta, contact = j("contact").meta;
rows.push({ page: "/", title: layoutTitle(home.title), desc: buildSeoDescription(home.description, "en") });
rows.push({ page: "/contact", title: layoutTitle(contact.title), desc: buildSeoDescription(contact.description, "en") });
for (const s of list(j("services"))) rows.push({ page: `/services/${s.slug ?? s.id}`, title: layoutTitle(`${s.title} — ${BRAND}`), desc: buildSeoDescription(s.desc, "en") });
for (const i of list(j("industries"))) rows.push({ page: `/industries/${i.slug ?? i.id}`, title: layoutTitle(`${i.title} Solutions | ${BRAND}`), desc: buildSeoDescription(`${i.desc} — ${BRAND}, Shamli, UP.`, "en") });
for (const c of list(j("case-studies"))) rows.push({ page: `/projects/${c.id}`, title: layoutTitle(`${c.title} — Case Study`), desc: buildSeoDescription(c.scope, "en") });
for (const p of BLOG_POSTS) rows.push({ page: `/blog/${p.slug}`, title: layoutTitle(p.title), desc: buildSeoDescription(p.excerpt, "en") });
for (const p of list(j("products"))) rows.push({ page: `/products/${p.slug ?? p.id}`, title: layoutTitle(buildSeoTitle(p.title, [p.category], "en")), desc: buildSeoDescription(p.desc.length + 35 <= 155 ? `${p.desc} — ${BRAND}, Shamli, UP.` : p.desc, "en") });

for (const r of rows) {
  const o = SEO_OVERRIDES[r.page];
  if (o?.title) r.title = layoutTitle(o.title);
  if (o?.description) r.desc = buildSeoDescription(o.description, "en");
}

const DANGLING = /(\b(and|or|for|the|of|to|in|with|on|at|by|from|a|an|as)|[&,;:\-\u2013\u2014|])$/i;
let bad = 0;
for (const r of rows) {
  const issues: string[] = [];
  if (r.title.length > 60) issues.push(`title ${r.title.length}>60`);
  if (r.desc.length > 160) issues.push(`desc ${r.desc.length}>160`);
  if (DANGLING.test(r.title)) issues.push("title ends mid-phrase");
  if (DANGLING.test(r.desc.replace(/\u2026$/, ""))) issues.push("desc ends mid-phrase");
  if (issues.length) bad++;
  console.log(`${issues.length ? "!!" : "ok"} ${String(r.title.length).padStart(3)}/${String(r.desc.length).padStart(3)} ${r.page}  ${issues.join("; ")}`);
}
console.log(`\n${rows.length} pages, ${bad} with issues`);
if (process.argv.includes("--print")) for (const r of rows) console.log(`${r.page}\n  T: ${r.title}\n  D: ${r.desc}`);
process.exit(bad ? 1 : 0);
