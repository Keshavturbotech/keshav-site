#!/usr/bin/env node
// scripts/generate-llms-txt.cjs
// Regenerates public/llms.txt and public/llms-full.txt from the site's real
// data files (services, products, industries, case studies, blog posts).
// Run this whenever you add/edit content: `npm run generate:llms`
// (Also worth wiring into your CI/build step so these never go stale.)

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
  FOUNDED_YEAR,
} = require("../src/data/site-config.ts");
const fs = require("fs");
const path = require("path");

const SITE = "https://www.keshavturbotech.com";
const OUT_DIR = path.join(__dirname, "..", "public");

// ═══════════════════════════════════════════════════════════
// llms.txt — concise index, per llmstxt.org convention
// ═══════════════════════════════════════════════════════════
const llms = `# Keshav Enterprises

> Ex-OEM steam turbine engineers providing overhauling, reverse engineering, dynamic balancing, lube oil flushing, machine alignment, and OEM-compatible industrial spares. ${YEARS_IN_BUSINESS}+ years in business (since ${FOUNDED_YEAR}), based in Shamli, Uttar Pradesh, India. 24×7 emergency breakdown response.

Keshav Enterprises serves steam turbines from 5 kW to 60 MW (both back-pressure and condensing types, single or multi-stage, horizontal or vertical) across power generation, sugar mills, paper mills, oil & gas, petrochemical, agro/food processing, and cement/steel industries. The engineering team includes ex-OEM specialists from ${OEMS.join(", ")}.

## Company

- [About](${SITE}/about): Company history, timeline, team, OEM expertise, and export credentials (IEC registered, GST ${CONTACT_INFO.gst}, MSME ${CONTACT_INFO.msme}).
- [Contact](${SITE}/contact): Phone, email, address, office hours, and RFQ form. Phones: ${CONTACT_INFO.phones.join(", ")}. Email: ${CONTACT_INFO.email}.

## Services

${SERVICES.map((s) => `- [${s.title}](${SITE}/services/${s.slug}): ${s.desc}`).join("\n")}

## Industries Served

${INDUSTRIES.map((i) => `- [${i.title}](${SITE}/industries/${i.slug}): ${i.desc}`).join("\n")}

## Products

${PRODUCTS.length} total SKUs across multiple categories. Full catalog: ${SITE}/products
Categories: ${[...new Set(PRODUCTS.map((p) => p.category))].join(", ")}

## Projects & Case Studies

${CASE_STUDIES.length} documented field case studies with measured outcomes. Full list: ${SITE}/projects
${CASE_STUDIES.slice(0, 5)
  .map((cs) => `- [${cs.title}](${SITE}/projects/${cs.id})`)
  .join("\n")}

## Engineering Blog

${BLOG_POSTS.length} technical articles on turbine maintenance, filtration, and industrial engineering. Full list: ${SITE}/blog
${BLOG_POSTS.slice(0, 5)
  .map((p) => `- [${p.title}](${SITE}/blog/${p.slug})`)
  .join("\n")}

## Other

- [Downloads](${SITE}/downloads): Free technical checklists, datasheets, and RFQ templates.
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
Founded: ${FOUNDED_YEAR} (${YEARS_IN_BUSINESS}+ years in operation)
GST: ${CONTACT_INFO.gst} | MSME/Udyam: ${CONTACT_INFO.msme} | IEC: ${CONTACT_INFO.iec}
Phone: ${CONTACT_INFO.phones.join(", ")}
Email: ${CONTACT_INFO.email}, ${CONTACT_INFO.infoEmail}
OEM coverage: ${OEMS.join(", ")}
`);

sections.push("\n\n## SERVICES\n");
for (const s of SERVICES) {
  const d = SERVICE_DETAIL_DATA[s.id];
  sections.push(`### ${s.title}
URL: ${SITE}/services/${s.slug}
Tagline: ${d?.tagline || ""}

${s.desc}

Overview: ${d?.overview || ""}

Why our engineers: ${d?.whyUs || ""}

What we deliver:
${s.details.map((x) => "- " + x).join("\n")}

OEM expertise: ${(s.oems || []).join(", ")}
`);
}

sections.push("\n\n## INDUSTRIES SERVED\n");
for (const i of INDUSTRIES) {
  const d = INDUSTRY_DETAILS[i.id];
  sections.push(`### ${i.title}
URL: ${SITE}/industries/${i.slug}
Turbine coverage: ${i.turbines}

${i.desc}

${d?.overview || ""}

Key applications:
${i.useCases.map((x) => "- " + x).join("\n")}

Key challenges addressed:
${(d?.challenges || []).map((c) => `- ${c.title}: ${c.desc}`).join("\n")}
`);
}

sections.push(`\n\n## PRODUCTS (${PRODUCTS.length} total)\n`);
const byCategory = {};
for (const p of PRODUCTS) (byCategory[p.category] ||= []).push(p);
for (const [cat, items] of Object.entries(byCategory)) {
  sections.push(`### ${cat} (${items.length} products)\n`);
  for (const p of items) sections.push(`- **${p.title}** (${SITE}/products/${p.slug}): ${p.desc}`);
  sections.push("");
}

sections.push("\n\n## PROJECTS & CASE STUDIES\n");
for (const cs of CASE_STUDIES) {
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

sections.push("\n\n## ENGINEERING BLOG\n");
for (const post of BLOG_POSTS) {
  sections.push(`### ${post.title}
URL: ${SITE}/blog/${post.slug}
Published: ${post.date} | Read time: ${post.readTime} | Tags: ${post.tags.join(", ")}

${post.excerpt}
`);
  for (const block of post.content) {
    if (block.type === "h2") sections.push(`#### ${block.text}`);
    else if (block.type === "p") sections.push(block.text);
    else if (block.type === "list")
      sections.push((block.items || []).map((i) => "- " + i).join("\n"));
    else if (block.type === "cta") sections.push(`> ${block.text}`);
  }
  sections.push("");
}

fs.writeFileSync(path.join(OUT_DIR, "llms-full.txt"), sections.join("\n"));

console.log("✓ Generated public/llms.txt and public/llms-full.txt from current data files.");
