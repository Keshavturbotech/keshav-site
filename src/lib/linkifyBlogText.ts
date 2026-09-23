// src/lib/linkifyBlogText.ts
// Ported from App.jsx (line ~18601). Auto-links the first mention of certain
// keywords/phrases in blog body text to the relevant service or product page.
//
// CHANGE FROM ORIGINAL: the original returned React elements with
// onClick={() => navigate(group)} (needed because the old app was a
// client-side hash router with no real URLs). This version returns plain
// data — an array of {text} | {text, href} parts — since Astro renders
// server-side; the caller maps this array to real <a href> tags directly in
// the template. Same regex, same phrase list, same "longest phrase wins,
// only first mention per group gets linked" behavior.
// FIX: original pointed at "/service/srv_X" (singular) — updated to
// "/services/srv_X" (plural) to match this migration's consistent routing
// (see README note on the Industries routing decision — same reasoning).
// FIX: service URLs now use the readable `slug` field (e.g.
// /services/turbine-erection-and-commissioning) instead of the internal
// `srv_X` id, matching the [slug].astro routing used by services/products/
// industries. Resolved from SERVICES at module load so this file never
// hardcodes a slug that could drift from the title it's derived from.
import { SERVICES } from "../data/services";
import { localizedPath } from "./localeMeta";

const svcSlug = (id: string): string => SERVICES.find((s) => s.id === id)?.slug ?? id;

interface LinkTarget {
  phrase: string;
  group: string;
}

const BLOG_LINK_TARGETS: LinkTarget[] = [
  { phrase: "lube oil flushing", group: `/services/${svcSlug("srv_5")}` },
  { phrase: "reverse-engineered", group: `/services/${svcSlug("srv_3")}` },
  { phrase: "reverse engineering", group: `/services/${svcSlug("srv_3")}` },
  { phrase: "reverse engineer", group: `/services/${svcSlug("srv_3")}` },
  { phrase: "turbine overhauling", group: `/services/${svcSlug("srv_2")}` },
  { phrase: "overhauling", group: `/services/${svcSlug("srv_2")}` },
  { phrase: "dynamic balancing", group: `/services/${svcSlug("srv_4")}` },
  { phrase: "coupling alignment", group: `/services/${svcSlug("srv_6")}` },
  { phrase: "laser alignment", group: `/services/${svcSlug("srv_6")}` },
  { phrase: "misalignment", group: `/services/${svcSlug("srv_6")}` },
  { phrase: "troubleshooting", group: `/services/${svcSlug("srv_7")}` },
  { phrase: "turbine erection", group: `/services/${svcSlug("srv_1")}` },
  { phrase: "sand blasting", group: `/services/${svcSlug("srv_8")}` },
  { phrase: "sandblasting", group: `/services/${svcSlug("srv_8")}` },
  { phrase: "abrasive blasting", group: `/services/${svcSlug("srv_8")}` },
  { phrase: "lube oil filter elements", group: "/products" },
  { phrase: "filter elements", group: "/products" },
  { phrase: "dust collector filter bags", group: "/products" },
  { phrase: "filter bags", group: "/products" },
  { phrase: "dust collector", group: "/products" },
  { phrase: "air filtration", group: "/products" },
  { phrase: "filtration", group: "/products" },
  { phrase: "hvac", group: "/products" },
].sort((a, b) => b.phrase.length - a.phrase.length); // longest phrase wins (e.g. "turbine overhauling" before "overhauling")

const BLOG_LINK_REGEX = new RegExp(
  `\\b(${BLOG_LINK_TARGETS.map((t) => t.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi",
);
const BLOG_LINK_BY_PHRASE = new Map(
  BLOG_LINK_TARGETS.map((t) => [t.phrase.toLowerCase(), t.group]),
);

export type LinkifiedPart = { text: string; href?: string };

/**
 * Splits `text` into parts, marking the FIRST occurrence of each distinct
 * target `group` with an `href`. `usedGroups` must be a single Set created
 * once per article render and threaded through every call for that article,
 * so "only the first mention" holds across the whole post, not just one
 * paragraph.
 *
 * FIXED: `group` values in BLOG_LINK_TARGETS are locale-agnostic canonical
 * paths (by design, so this table never needs per-locale duplication) — but
 * this function used to hand that raw path straight back as `href` with no
 * locale prefix. On English posts this was invisible (no prefix needed
 * anyway), but any translated post whose text still contains one of these
 * keywords verbatim — e.g. "HVAC" is commonly kept in Latin script inside
 * otherwise-Hindi/Arabic/etc. technical text — would silently generate an
 * unprefixed link straight back to English. `locale` must now be passed
 * through from the calling page and is applied here, once, at the only
 * place hrefs are actually produced.
 */
export function linkifyBlogText(
  text: string,
  usedGroups: Set<string>,
  locale: string,
): LinkifiedPart[] {
  if (typeof text !== "string" || !text) return [{ text: text ?? "" }];
  const parts = text.split(BLOG_LINK_REGEX);
  if (parts.length === 1) return [{ text }];
  return parts
    .filter((part) => part !== "")
    .map((part) => {
      const group = BLOG_LINK_BY_PHRASE.get(part.toLowerCase());
      if (!group || usedGroups.has(group)) return { text: part };
      usedGroups.add(group);
      return { text: part, href: localizedPath(locale, group) };
    });
}
