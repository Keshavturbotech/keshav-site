// src/data/services.ts
// Ported verbatim from the SERVICES array in App.jsx.
// Icons are stored as STRING NAMES (not component refs) so this file stays
// a plain serializable data module usable from both .astro and .jsx files.
// Resolve the actual lucide-react component where you render it, e.g.:
//   import * as Icons from "lucide-react";
//   const Icon = Icons[service.iconName];

export const SERVICE_ICON_NAMES: Record<string, string> = {
  srv_1: "Cog",
  srv_2: "Wrench",
  srv_3: "Hexagon",
  srv_4: "Activity",
  srv_5: "Droplets",
  srv_6: "Target",
  srv_7: "Search",
  srv_8: "Sparkles",
};

export interface Service {
  id: string;
  slug: string;
  image: string;
  title: string;
  desc: string;
  details: string[];
  oems: string[];
}

const RAW_SERVICES: Omit<Service, "slug">[] = [
  {
    id: "srv_1",
    image: "service-turbine-erection.webp",
    title: "Turbine Erection & Commissioning",
    desc: "Expert erection and commissioning for steam turbines, pumps, compressors, fans, condensers, EOT cranes, and steam/water/air pipeline work. Includes complete OEM coordination and documentation.",
    details: [
      "Steam turbines, pumps, compressors, fans, condensers",
      "EOT cranes, steel structure & pipe line work",
      "Construction supervision to OEM specs & applicable standards",
      "Coordination with OEM throughout all phases",
      "Complete documentation for handover to operations",
      "Development & execution of pre-commissioning procedures",
      "Assist with start-up and fine tuning to operational needs",
    ],
    oems: ["Triveni", "Siemens", "BHEL", "Belliss India", "Maxwatt"],
  },
  {
    id: "srv_2",
    image: "service-overhauling.webp",
    title: "Turnkey Overhauling & Maintenance",
    desc: "Executed by ex-OEM engineers from Triveni, Siemens, BHEL, Belliss, and more. Includes pre-shutdown planning, on-site condition reporting, comprehensive spares management, and 24x7 emergency troubleshooting.",
    details: [
      "Pre-shutdown planning with detailed scope of rotating equipment",
      "Onsite inspection of stocked spare parts with shortfall reports",
      "Ex-OEM engineers: Triveni, Belliss, Maxwatt, Man Turbo, BHEL, Siemens, KKK, ABB",
      "All clearances, gaps and sizes measured and recorded",
      "Condition report with recommendations for each component",
      "Turnkey basis: tools, tackles, consumables & manpower provided",
      "24x7 emergency response with engineers at multiple locations",
    ],
    oems: ["Triveni", "Belliss India", "Maxwatt", "Man Turbo", "BHEL", "Siemens", "KKK", "ABB"],
  },
  {
    id: "srv_3",
    image: "service-reverse-engineering.webp",
    title: "Precision Reverse Engineering",
    desc: "PMI-verified reverse engineering using 3D laser scanners, CMM, and copying lathes for turbines from 5 kW to 60 MW. Generate full manufacturing drawings with tolerances, concentricity, pre/post heat treatment specs.",
    details: [
      "3D Laser Scanner, CMM & Coordinate Measuring Machine at site/workshop",
      "PMI testing for exact identification of material composition",
      "Copying lathe for precision dimensional replication",
      "Engineering drawings with tolerances, finish, parallelity, concentricity",
      "Pre/post heat treatment specifications included",
      "Rough machining, pre-final and final machining drawings",
      "Covers turbines from 5 kW to 60 MW (Back Pressure or Condensing)",
      "Single/Multi stage, Drive or Power, Horizontal or Vertical",
    ],
    oems: ["Triveni", "Siemens", "BHEL", "All Makes"],
  },
  {
    id: "srv_4",
    image: "service-dynamic-balancing.webp",
    title: "Dynamic Balancing & Rotor Machining",
    desc: "Precision rotor machining (grinding, polishing, journal undersizing) at our workshop lathes, plus ISO/API standard dynamic balancing from 50 to 2000 kg with full compliance reporting.",
    details: [
      "Journal grinding & polishing with minimum undersizing technique",
      "Labyrinth portion machining on precision lathes",
      "Rotor set concentric at all portions before machining",
      "Dynamic balancing 50-2000 kg to ISO/API standards",
      "Balancing machines with latest vibration monitoring systems",
      "Mechanical and electrical run-out identification pre-installation",
      "Comprehensive balancing report documenting ISO/API compliance",
    ],
    oems: ["All Turbine Makes"],
  },
  {
    id: "srv_5",
    image: "service-lube-oil-flushing.webp",
    title: "Lube Oil Flushing",
    desc: "ISO-compliant flushing using purpose-built mobile centrifuge filter systems. Achieves maximum cleanliness and de-watering following construction or during scheduled maintenance.",
    details: [
      "Purpose-built mobile centrifuge filter system",
      "Targets system cleanliness per ISO 4406:99 standards",
      "Oil sampling and reporting undertaken per ISO standards",
      "Effective for post-construction and scheduled maintenance",
      "Superior de-watering and contamination removal",
      "Solid particle removal from 4 to 25 microns",
      "System flow rates handled up to 6,000 l/min",
    ],
    oems: ["All Systems"],
  },
  {
    id: "srv_6",
    image: "service-machine-alignment.webp",
    title: "Machine Alignment",
    desc: "Expert machine alignment using latest technology to eliminate misalignment, one of the primary causes of equipment failure. Covers turbines, gearboxes, pumps, fans, alternators, and induction generators.",
    details: [
      "Turbine to gearbox & gearbox to mill gearbox alignment",
      "Fan, pump, alternator, induction generator alignment",
      "Machine levelling & pipe strain measurements on any frame size",
      "Fiberizor, shredder alignment",
      "Latest alignment technology for highest standards",
      "Detailed alignment reporting with exact results",
      "Covers any size machine frame in any location",
    ],
    oems: ["All Makes"],
  },
  {
    id: "srv_7",
    image: "service-troubleshooting.webp",
    title: "Troubleshooting Service",
    desc: "Rapid on-site fault diagnosis for steam turbines experiencing vibration, bearing failure, governor instability, steam leakage, oil contamination, or unexpected trips. Ex-OEM engineers deploy with full diagnostic instrumentation for root-cause identification and corrective action.",
    details: [
      "High vibration: imbalance, misalignment, bearing wear, rub diagnosis",
      "Governor hunting, speed instability & overspeed trip investigation",
      "Bearing oil contamination: carbon ring seal & lube system analysis",
      "Steam gland leakage: labyrinth seal, packing & gland steam pressure issues",
      "Blade fouling, erosion & steam path efficiency loss analysis",
      "Unexpected trip investigation: oil pressure, temperature & control system faults",
      "24x7 emergency deployment across India with all diagnostic equipment",
    ],
    oems: ["Triveni", "Siemens", "BHEL", "Belliss India", "Maxwatt", "Man Turbo", "KKK", "ABB"],
  },
  {
    id: "srv_8",
    image: "service-sand-blasting.webp",
    title: "Sand Blasting & Surface Preparation",
    desc: "Controlled abrasive blasting for turbine rotors, casings, and components, removing rust, scale, and old coatings ahead of inspection, reverse engineering, or recoating without damaging critical machined surfaces.",
    details: [
      "Rotor, casing, blade & diaphragm surface cleaning before inspection or NDT",
      "Media selection (garnet, aluminium oxide, glass bead) matched to substrate & surface finish",
      "Masking and protection of machined journals, seal lands & threaded surfaces",
      "Surface preparation to SSPC/NACE standards ahead of painting or recoating",
      "Rust, scale & carbon deposit removal from steam path components",
      "Dust-contained blasting booth & portable on-site blasting equipment",
      "Profile (anchor pattern) verification for coating adhesion",
    ],
    oems: ["All Makes"],
  },
];

// ─── SLUGS (readable /services/<slug> URLs instead of /services/srv_1) ──────
// Kept as a separate field from `id` — `id` stays the stable internal key
// used by SERVICE_DETAIL_DATA, SVC_SCOPE_MAP, SVC_CATEGORY_MAP, and the
// contact-form inquiry-type mapping; `slug` is purely the public-facing URL
// segment, derived from the service title. Same pattern as products.ts /
// industries.ts.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function assignUniqueSlugs(services: (typeof RAW_SERVICES)[0][]): Map<string, string> {
  const slugById = new Map<string, string>();
  const seen = new Map<string, number>();
  for (const s of services) {
    const base = slugify(s.title) || s.id;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    // First service with a given title keeps the clean slug; any later
    // collision gets a numeric suffix so URLs never overlap.
    slugById.set(s.id, count === 0 ? base : `${base}-${count + 1}`);
  }
  return slugById;
}
const SERVICE_SLUGS = assignUniqueSlugs(RAW_SERVICES);

export const SERVICES: Service[] = RAW_SERVICES.map((s) => ({
  ...s,
  slug: SERVICE_SLUGS.get(s.id)!,
}));
