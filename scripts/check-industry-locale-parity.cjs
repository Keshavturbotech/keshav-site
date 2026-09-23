#!/usr/bin/env node
// scripts/check-industry-locale-parity.cjs
//
// Why this exists:
// src/pages/industries/[slug].astro links each industry-page product tile
// to its real product page by looking up INDUSTRY_PRODUCT_IDS using the
// ENGLISH product name at a given array index — not the localized display
// name, because INDUSTRY_PRODUCT_IDS (data/industry-details.ts) is keyed
// in English only. That only works if every locale's
// industry-details.json has the exact same `products` array length, in
// the exact same order, for every industry (ind_1, ind_2, ...) as the
// English source. If a locale's array is ever reordered, or gets an item
// added/removed independently of English, the index-based lookup will
// silently pair a translated product with the wrong English name — and
// therefore either the wrong product page or the generic catalog
// fallback, with no error at runtime.
//
// This script catches that at build time instead of leaving it to be
// (maybe) noticed on a translated page in production.
//
// Run: node scripts/check-industry-locale-parity.cjs
// Wired into `npm run build` via the `prebuild` script in package.json.

const fs = require("fs");
const path = require("path");

const I18N_DIR = path.join(__dirname, "..", "src", "i18n");
const SOURCE_LOCALE = "en";

function loadIndustryDetails(locale) {
  const file = path.join(I18N_DIR, locale, "industry-details.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function main() {
  const enData = loadIndustryDetails(SOURCE_LOCALE);
  if (!enData) {
    console.error(`✗ Could not find src/i18n/${SOURCE_LOCALE}/industry-details.json`);
    process.exit(1);
  }

  const locales = fs
    .readdirSync(I18N_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((loc) => loc !== SOURCE_LOCALE);

  const industryKeys = Object.keys(enData);
  let hadError = false;

  for (const locale of locales) {
    const localeData = loadIndustryDetails(locale);
    if (!localeData) {
      console.error(`✗ [${locale}] missing industry-details.json`);
      hadError = true;
      continue;
    }

    for (const indKey of industryKeys) {
      const enProducts = enData[indKey]?.products ?? [];
      const localeProducts = localeData[indKey]?.products ?? [];

      if (!localeData[indKey]) {
        console.error(`✗ [${locale}] missing industry key "${indKey}"`);
        hadError = true;
        continue;
      }

      if (enProducts.length !== localeProducts.length) {
        console.error(
          `✗ [${locale}] ${indKey}.products length mismatch: ` +
            `en has ${enProducts.length}, ${locale} has ${localeProducts.length}. ` +
            `The English-name-based product link lookup in [slug].astro will ` +
            `misalign for this industry until the arrays match (same order, same length).`,
        );
        hadError = true;
        continue;
      }

      // Same length isn't sufficient on its own if features/name are
      // missing on an entry (would silently no-op that tile's link).
      localeProducts.forEach((p, i) => {
        if (!p || typeof p.name !== "string" || !p.name.trim()) {
          console.error(
            `✗ [${locale}] ${indKey}.products[${i}] is missing a "name" field.`,
          );
          hadError = true;
        }
      });
    }
  }

  if (hadError) {
    console.error(
      "\nindustry-details.json locale parity check FAILED. Fix the mismatches above " +
        "before building — otherwise some non-English industry pages will link " +
        "products to the wrong page (or fall back to the generic catalog link) " +
        "without any visible error.\n",
    );
    process.exit(1);
  }

  console.log(
    `✓ industry-details.json parity OK across ${locales.length} locale(s) ` +
      `(${industryKeys.length} industries checked).`,
  );
}

main();
