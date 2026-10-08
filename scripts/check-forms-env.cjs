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
  // Diagnostics: names only, never values, so nothing secret reaches the log.
  const related = Object.keys(process.env).filter((k) => /WEB3|FORM|^PUBLIC_|TURNSTILE|GA4|CLARITY/i.test(k));
  const diag =
    `  Building: ${process.env.CF_PAGES_BRANCH ? "branch " + process.env.CF_PAGES_BRANCH : "unknown branch"}` +
    `${process.env.CF_PAGES ? " (Cloudflare Pages)" : ""}\n` +
    `  Related variable names this build can see: ${related.length ? related.join(", ") : "none"}\n` +
    (related.some((k) => /web3/i.test(k) && k !== "PUBLIC_WEB3FORMS_KEY")
      ? "  A Web3Forms variable exists under a different name: rename it to exactly PUBLIC_WEB3FORMS_KEY.\n"
      : "");
  if (process.env.ALLOW_MISSING_FORMS_KEY === "1") {
    console.warn(msg + diag + "  (ALLOW_MISSING_FORMS_KEY=1: continuing anyway)\n");
  } else if (onHost) {
    console.error(msg + diag);
    process.exit(1);
  } else {
    console.warn(msg);
  }
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

// Analytics IDs (optional, but a malformed one silently disables tracking).
// Names must be EXACTLY PUBLIC_GA4_ID and PUBLIC_CLARITY_ID and, like the
// form key, are baked in at build time — add/change them, then redeploy.
function readVar(name) {
  if (process.env[name]) return process.env[name].trim();
  try {
    const m = fs.readFileSync(path.join(root, ".env"), "utf8").match(new RegExp("^" + name + "=(.*)$", "m"));
    return m ? m[1].trim() : "";
  } catch {
    return "";
  }
}
const ga = readVar("PUBLIC_GA4_ID");
const clarity = readVar("PUBLIC_CLARITY_ID");
if (!ga) console.warn("\n⚠ PUBLIC_GA4_ID is not set in this build: Google Analytics will not load.\n");
else if (!/^G-[A-Z0-9]{6,}$/.test(ga))
  console.warn(`\n⚠ PUBLIC_GA4_ID "${ga}" is not a GA4 measurement ID (expected G-XXXXXXXXXX).\n`);
if (!clarity) console.warn("\n⚠ PUBLIC_CLARITY_ID is not set in this build: Microsoft Clarity will not load.\n");
else if (!/^[a-z0-9]{8,12}$/.test(clarity))
  console.warn(`\n⚠ PUBLIC_CLARITY_ID "${clarity}" does not look like a Clarity project ID (about 10 lowercase letters/digits).\n`);
