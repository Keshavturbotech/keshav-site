#!/usr/bin/env node
// scripts/generate-llms-txt.cjs
// Regenerates public/llms.txt and public/llms-full.txt.
//
// Source of truth: the page templates render the ENGLISH i18n JSON
// (src/i18n/en/*.json), while src/data/*.ts holds the structural base data.
// The two had drifted (product titles, SKUs, categories, lead times, price
// notes, years claims), so this script merges the English JSON over the TS
// data, field by field, exactly like the pages do. That way the LLM files
// state what a visitor to keshavturbotech.com actually sees.
//
// Every count (products, categories, services, ...) and every year claim is
// derived here; nothing is typed in by hand.
//
// Run whenever content changes:  npm run generate:llms
// (Wire it into CI/prebuild so these never go stale.)
//
// Needs a TypeScript-aware loader for the .ts imports, e.g.
//   npx tsx scripts/generate-llms-txt.cjs

const fs = require("fs");
const path = require("path");

const { SERVICES } = require("../src/data/services.ts");
const { SERVICE_DETAIL_DATA } = require("../src/data/service-details.ts");
const { PRODUCTS } = require("../src/data/products.ts");
const { INDUSTRIES } = require("../src/data/industries.ts");
const { INDUSTRY_DETAILS } = require("../src/data/industry-details.ts");
const { CASE_STUDIES } = require("../src/data/case-studies.ts");
const { BLOG_POSTS } = require("../src/data/blog-posts.ts");
const {
  CONTACT_INFO,
  OEMS,
  YEARS_IN_BUSINESS,
  FOUNDER_ENGINEERING_YEAR,
  BUSINESS_OPERATING_YEAR,
  OVERHAULS_COMPLETED,
} = require("../src/data/site-config.ts");
const { LOCALES } = require("../src/lib/localeMeta.ts");

const SITE = "https://keshavturbotech.com";
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public");

const readJson = (f) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, "src", "i18n", "en", f), "utf8"));

// merge English JSON (what pages render) over the TS base item, by id
const withJson = (list, json) => list.map((item) => ({ ...item, ...(json[item.id] || {}) }));
const years = (s) => (typeof s === "string" ? s.replace("{years}", String(YEARS_IN_BUSINESS)) : s);

const services = withJson(SERVICES, readJson("services.json"));
const serviceScope = readJson("service-scope.json");
const industries = withJson(INDUSTRIES, readJson("industries.json"));
const caseStudies = withJson(CASE_STUDIES, readJson("case-studies.json"));
const posts = withJson(BLOG_POSTS, readJson("blog-posts.json"));
const products = withJson(PRODUCTS, readJson("products.json"));
const serviceDetails = readJson("service-details.json");
const industryDetails = readJson("industry-details.json");
const about = readJson("about.json");
const business = readJson("business.json");

const ESTABLISHED = about.milestones.items.find((m) => /Founded/i.test(m.title))?.year || "2020";
const categories = [...new Set(products.map((p) => p.category))];
const byCategory = {};
for (const p of products) (byCategory[p.category] ||= []).push(p);
const localePaths = LOCALES.filter((l) => l !== "en").map((l) => (l === "zh-CN" ? "zh-cn" : l));

const HISTORY = `Founder Shekhar Sharma has worked hands-on with steam turbines since ${FOUNDER_ENGINEERING_YEAR} (${YEARS_IN_BUSINESS}+ years of engineering experience); he started an independent turbine maintenance partnership in ${BUSINESS_OPERATING_YEAR}, and Keshav Enterprises was formally established in ${ESTABLISHED}.`;

// ═══════════════════════════════════════════════════════════
// llms.txt — concise index, per llmstxt.org convention
// ═══════════════════════════════════════════════════════════
const llms = `# Keshav Enterprises

> ${business.schema.description} Based in Shamli, Uttar Pradesh, India. 24×7 emergency breakdown response. ${HISTORY}

Keshav Enterprises serves steam turbines from 5 kW to 60 MW (both back-pressure and condensing types, single or multi-stage, horizontal or vertical) across ${industries.length} industry sectors: ${industries.map((i) => i.title).join(", ")}. The engineering team includes ex-OEM specialists from ${OEMS.join(", ")}. More than ${OVERHAULS_COMPLETED} overhauls completed.

## Company

- [About](${SITE}/about): Company history, timeline, team, OEM expertise, and export credentials (IEC registered, GST ${CONTACT_INFO.gst}, MSME ${CONTACT_INFO.msme}).
- [Contact](${SITE}/contact): Phone, email, address, office hours, and RFQ form. Phones: ${CONTACT_INFO.phones.join(", ")}. Email: ${CONTACT_INFO.email}.
- [Downloads](${SITE}/downloads): Free technical checklists, datasheets, and RFQ templates.

## Services (${services.length})

${services.map((s) => `- [${s.title}](${SITE}/services/${s.slug}): ${s.desc}`).join("\n")}

## Industries Served (${industries.length})

${industries.map((i) => `- [${i.title}](${SITE}/industries/${i.slug}): ${i.desc}`).join("\n")}

## Product Catalogue (${products.length} products in ${categories.length} categories)

Full catalogue: ${SITE}/products

${Object.entries(byCategory)
  .map(
    ([cat, items]) =>
      `### ${cat} (${items.length})\n${items.map((p) => `- [${p.title}](${SITE}/products/${p.slug})`).join("\n")}`,
  )
  .join("\n\n")}

## Projects & Case Studies (${caseStudies.length})

Full list: ${SITE}/projects

${caseStudies.map((cs) => `- [${cs.title}](${SITE}/projects/${cs.id})`).join("\n")}

## Engineering Blog (${posts.length})

Full list: ${SITE}/blog

${posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug})`).join("\n")}

## Languages & Sitemap

English is served at the site root. Translated versions of the same pages live under: ${localePaths.map((l) => `/${l}`).join(", ")}.
Sitemap: ${SITE}/sitemap-index.xml

## Other

- [Privacy Policy](${SITE}/privacy-policy)
- [Terms of Service](${SITE}/terms-of-service)
`;

fs.writeFileSync(path.join(OUT_DIR, "llms.txt"), llms);

// ═══════════════════════════════════════════════════════════
// llms-full.txt — complete content dump
// ═══════════════════════════════════════════════════════════
const sections = [];

sections.push(`# Keshav Enterprises: Full Content Index

This file contains the complete text content of keshavturbotech.com for AI/LLM consumption, per the llms-full.txt convention (llmstxt.org). For a shorter overview, see /llms.txt.

Company: Keshav Enterprises, ${CONTACT_INFO.address}
History: ${HISTORY}
Scale: ${services.length} services, ${industries.length} industries, ${products.length} products in ${categories.length} categories, ${caseStudies.length} case studies, ${posts.length} blog articles, more than ${OVERHAULS_COMPLETED} overhauls completed
Turbine range: 5 kW to 60 MW
GST: ${CONTACT_INFO.gst} | MSME/Udyam: ${CONTACT_INFO.msme} | IEC: ${CONTACT_INFO.iec}
Phone: ${CONTACT_INFO.phones.join(", ")}
Email: ${CONTACT_INFO.email}, ${CONTACT_INFO.infoEmail}
OEM coverage: ${OEMS.join(", ")}
Languages: English (root) plus ${localePaths.map((l) => `/${l}`).join(", ")}
Sitemap: ${SITE}/sitemap-index.xml
`);

sections.push(`\n\n## SERVICES (${services.length})\n`);
for (const s of services) {
  const d = serviceDetails[s.id] || SERVICE_DETAIL_DATA[s.id] || {};
  const scope = serviceScope[s.id];
  sections.push(`### ${s.title}
URL: ${SITE}/services/${s.slug}
Tagline: ${d.tagline || ""}
${scope ? `Scope: ${scope.scope} | Typical turnaround: ${scope.turnaround}\n` : ""}
${s.desc}

Overview: ${d.overview || ""}

Why our engineers: ${d.whyUs || ""}

Key figures: ${(d.keyStats || []).map((k) => `${years(k.value)} ${k.label}`).join("; ")}

What we deliver:
${(s.details || []).map((x) => "- " + x).join("\n")}

OEM expertise: ${(s.oems || []).join(", ")}
`);
}

sections.push(`\n\n## INDUSTRIES SERVED (${industries.length})\n`);
for (const i of industries) {
  const d = industryDetails[i.id] || INDUSTRY_DETAILS[i.id] || {};
  sections.push(`### ${i.title}
URL: ${SITE}/industries/${i.slug}
Turbine coverage: ${i.turbines}

${i.desc}

${d.overview || ""}

Key applications:
${(i.useCases || []).map((x) => "- " + x).join("\n")}

Key facts:
${(d.keyFacts || []).map((x) => "- " + years(x)).join("\n")}

Key challenges addressed:
${(d.challenges || []).map((c) => `- ${c.title}: ${c.desc}`).join("\n")}
`);
}

sections.push(
  `\n\n## PRODUCT CATALOGUE (${products.length} products in ${categories.length} categories)\n`,
);
for (const [cat, items] of Object.entries(byCategory)) {
  sections.push(`### ${cat} (${items.length} products)\n`);
  for (const p of items) {
    const avail = p.availability ? ` Availability: ${p.availability.label}, lead time ${p.availability.leadTime}.` : "";
    sections.push(`- **${p.title}** (${SITE}/products/${p.slug}) [SKU ${p.sku}]: ${p.desc}${avail}`);
  }
  sections.push("");
}

sections.push(`\n\n## PROJECTS & CASE STUDIES (${caseStudies.length})\n`);
for (const cs of caseStudies) {
  sections.push(`### ${cs.title}
URL: ${SITE}/projects/${cs.id}
Industry: ${cs.industry} | Category: ${cs.category} | Year: ${cs.year} | Duration: ${cs.duration} | Client: ${cs.client}

Scope: ${cs.scope}

Challenge: ${cs.challenge}

Solution: ${cs.solution}

Measured outcomes:
${cs.outcomes.map((o) => "- " + o).join("\n")}
`);
}

sections.push(`\n\n## ENGINEERING BLOG (${posts.length})\n`);
for (const post of posts) {
  sections.push(`### ${post.title}
URL: ${SITE}/blog/${post.slug}
Published: ${post.date} | Read time: ${post.readTime} | Tags: ${post.tags.join(", ")}

${post.excerpt}
`);
  for (const block of post.content) {
    if (block.type === "h2") sections.push(`#### ${block.text}`);
    else if (block.type === "p") sections.push(block.text);
    else if (block.type === "list") sections.push((block.items || []).map((i) => "- " + i).join("\n"));
    else if (block.type === "cta") sections.push(`> ${block.text}`);
  }
  sections.push("");
}

fs.writeFileSync(path.join(OUT_DIR, "llms-full.txt"), sections.join("\n"));

console.log(
  `✓ Generated public/llms.txt and public/llms-full.txt (${products.length} products, ${categories.length} categories, ${services.length} services, ${industries.length} industries, ${caseStudies.length} case studies, ${posts.length} posts).`,
);
