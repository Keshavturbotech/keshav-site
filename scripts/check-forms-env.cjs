#!/usr/bin/env node
// scripts/check-forms-env.cjs
// Runs before `npm run build`. PUBLIC_* values are inlined into the JS at
// BUILD time, so a missing PUBLIC_WEB3FORMS_KEY on the host means every form
// ships dead: the RFQ/contact form shows "Form not configured", the review
// forms are rejected by Web3Forms, and the downloads gate lets people through
// without emailing you their details. .env is gitignored, so a git-based
// deploy (Cloudflare Pages) never sees it unless the variable is also set in
// the host's dashboard.
//
// On a CI/hosting build we FAIL the build so this can't ship silently; on a
// local build we only warn.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
let key = process.env.PUBLIC_WEB3FORMS_KEY || "";
if (!key) {
  try {
    const env = fs.readFileSync(path.join(root, ".env"), "utf8");
    const m = env.match(/^PUBLIC_WEB3FORMS_KEY=(.*)$/m);
    if (m) key = m[1].trim();
  } catch {
    /* no .env file */
  }
}

const onHost = Boolean(process.env.CF_PAGES || process.env.CI || process.env.NETLIFY || process.env.VERCEL);
const looksValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);

if (!key || !looksValid) {
  const why = !key ? "is NOT set" : "does not look like a Web3Forms access key (expected a UUID)";
  const msg =
    `\n✖ PUBLIC_WEB3FORMS_KEY ${why}.\n` +
    "  Contact, RFQ, review and download forms will not work in this build.\n" +
    "  Fix: set PUBLIC_WEB3FORMS_KEY in your host's environment variables\n" +
    "  (Cloudflare Pages → Settings → Variables and Secrets, for BOTH Production and\n" +
    "  Preview), then redeploy — it is baked in at build time.\n";
  if (onHost) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
}

// Every document listed on /downloads must physically exist in /public.
const dl = fs.readFileSync(path.join(root, "src", "data", "downloads.ts"), "utf8");
const files = [...dl.matchAll(/file:\s*"([^"]+)"/g)].map((m) => m[1]);
const missing = files.filter((f) => !fs.existsSync(path.join(root, "public", f)));
if (missing.length) {
  console.warn(
    `\n⚠ ${missing.length} of ${files.length} downloadable files are missing from /public:\n` +
      missing.map((f) => "   - public/" + f).join("\n") +
      "\n  Visitors will be told the document is being updated instead of getting a 404.\n",
  );
}
