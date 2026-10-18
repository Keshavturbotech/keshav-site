#!/usr/bin/env node
/**
 * Fails if any WhatsApp link would not open the +91 number.
 *  - src/data/site-config.ts: CONTACT_INFO.whatsapp must resolve to digits starting with 91
 *  - src/**: literal wa.me/<digits> links must start with 91
 *  - dist/**.html (if a build exists): every wa.me/<digits> must start with 91
 * Usage: node scripts/check-whatsapp-links.cjs [--dist]
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const problems = [];

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") walk(p, exts, out); }
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

const cfg = fs.readFileSync(path.join(root, "src/data/site-config.ts"), "utf8");
const cc = (cfg.match(/WHATSAPP_COUNTRY_CODE\s*=\s*"(\d+)"/) || [])[1];
const local = (cfg.match(/WHATSAPP_LOCAL_NUMBER\s*=\s*"(\d+)"/) || [])[1];
if (cc !== "91" || !local) problems.push("site-config.ts: WHATSAPP_COUNTRY_CODE must be \"91\" and WHATSAPP_LOCAL_NUMBER set");
if (!/whatsapp:\s*`\$\{WHATSAPP_COUNTRY_CODE\}\$\{WHATSAPP_LOCAL_NUMBER\}`/.test(cfg)) problems.push("site-config.ts: CONTACT_INFO.whatsapp must be built from the two constants");

const re = /wa\.me\/(\+?\d+)/g;
const files = walk(path.join(root, "src"), [".ts", ".tsx", ".js", ".jsx", ".astro", ".json"]);
if (process.argv.includes("--dist")) files.push(...walk(path.join(root, "dist"), [".html"]));
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  let m;
  while ((m = re.exec(s))) {
    if (!m[1].startsWith("91")) problems.push(`${path.relative(root, f)}: wa.me/${m[1]} (missing country code 91)`);
  }
}
if (problems.length) {
  console.error("\u2717 WhatsApp link check failed:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`\u2713 WhatsApp links OK (${files.length} files scanned)`);
