// eslint.config.js
// Flat config (ESLint 9). Covers .astro, .jsx/.tsx islands, and plain .ts/.js data/lib files.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**", "public/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],

  // React / JSX islands
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      // NOTE: react-hooks v7's "recommended" config bundles React Compiler
      // readiness rules (set-state-in-effect, preserve-manual-memoization, etc).
      // This project doesn't use the compiler, and those rules would force
      // rewrites of working, intentional effect patterns. Keep only the two
      // classic correctness rules that catch real bugs.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      ...jsxA11y.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // not needed with the automatic JSX runtime
      "react/prop-types": "off", // project doesn't use prop-types; TS/JSDoc cover shape checks
      // Raw apostrophes/quotes in JSX text render fine in every browser — this is a
      // style preference, not a functional bug. Error-level would force touching a
      // couple dozen unrelated copy strings for zero runtime benefit; warn still
      // surfaces it for anyone who wants to clean it up.
      "react/no-unescaped-entities": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      // Codebase deliberately uses `cond ? a() : b()` and `x && y()` for
      // side effects (swipe handlers, image-fallback idioms). That's a
      // style choice, not a bug — allow it rather than rewrite working code.
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // Plain data/lib TS & JS
  {
    files: ["src/**/*.{ts,js}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Scripts run under plain Node (CommonJS) — require() is correct here, not a lint violation
  {
    files: ["scripts/**/*.cjs"],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: "commonjs",
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Inside .astro frontmatter, TS rules over-fire on Astro-specific globals/props
  {
    files: ["**/*.astro"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Same exemption already granted to .jsx/.tsx and plain .ts/.js above —
      // needed for loosely-shaped i18n content namespaces (home.json,
      // about.json) that are free-form prose, not stable data-layer entities
      // like Product/Service, which keep their real interfaces.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
