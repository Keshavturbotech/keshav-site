// src/data/industries.ts
// Ported verbatim from INDUSTRIES array in App.jsx (line ~7962).
// Icon refs removed (Zap, Factory, etc.) — icon string names stored instead,
// resolved to lucide-react components at render time.

export interface Industry {
  id: string;
  slug: string;
  title: string;
  iconName: string; // lucide-react component name (replaces JSX Icon: Zap ref)
  color: string; // Tailwind gradient classes
  border: string; // Tailwind border class
  accent: string; // Tailwind text class
  image: string;
  desc: string;
  useCases: string[];
  turbines: string;
}

const RAW_INDUSTRIES: Omit<Industry, "slug">[] = [
  {
    id: "ind_1",
    title: "Power Generation",
    iconName: "Zap",
    color: "from-yellow-500/20 to-amber-600/10",
    border: "border-yellow-500/30",
    accent: "text-yellow-500",
    image: "industry-power-generation.webp",
    desc: "Supplying critical overhauling services and OEM-compatible spares to thermal power plants operating steam turbines from 5 MW to 60 MW. Our ex-OEM engineers ensure maximum plant availability.",
    useCases: [
      "Steam turbine major and minor overhauling",
      "Turbine erection and commissioning",
      "Lube oil system flushing per ISO 4406:99",
      "Rotor dynamic balancing and alignment",
      "Emergency stop valve manufacturing",
      "Filter elements and strainers supply",
      "HVAC pleated panel filters for control rooms & turbine halls",
    ],
    turbines: "5 MW – 60 MW",
  },
  {
    id: "ind_2",
    title: "Sugar Mills & Distilleries",
    iconName: "Factory",
    color: "from-green-500/20 to-emerald-600/10",
    border: "border-green-500/30",
    accent: "text-green-500",
    image: "industry-sugar-mills.webp",
    desc: "Serving India's sugar industry with specialized back-pressure steam turbine services. Scheduled overhauling during off-season and emergency breakdown support during crushing season.",
    useCases: [
      "Back-pressure turbine overhauling (inter-season)",
      "Triveni and Belliss turbine specialist services",
      "Carbon and graphite gland ring supply",
      "Labyrinth packing manufacturing",
      "Lube oil filtration products supply",
      "Emergency 24x7 breakdown support",
    ],
    turbines: "Triveni, Belliss & Morcom, Maxwatt",
  },
  {
    id: "ind_3",
    title: "Paper & Pulp Mills",
    iconName: "Layers",
    color: "from-blue-500/20 to-cyan-600/10",
    border: "border-blue-500/30",
    accent: "text-blue-500",
    image: "industry-paper-mills.webp",
    desc: "Paper mills operate steam turbines continuously and require precision maintenance to maintain uptime. We provide planned shutdown overhauling and critical spare components.",
    useCases: [
      "Continuous-operation turbine maintenance planning",
      "Duplex basket strainer supply for process lines",
      "Expansion joint and bellows supply",
      "Turbine spares manufacturing to OEM standards",
      "Machine alignment services",
      "Vibration monitoring equipment supply",
    ],
    turbines: "Siemens, BHEL, Triveni",
  },
  {
    id: "ind_4",
    title: "Oil & Gas Industries",
    iconName: "Droplets",
    color: "from-orange-500/20 to-red-600/10",
    border: "border-orange-500/30",
    accent: "text-orange-500",
    image: "industry-oil-gas.webp",
    desc: "Oil and gas facilities demand the highest standards of precision engineering for turbine-driven compressors and pumps. Our API-compliant products meet the stringent requirements of upstream and downstream facilities.",
    useCases: [
      "API 614-compliant lube oil filter elements",
      "API 670-compliant vibration monitoring probes",
      "PTFE-lined hose assemblies for chemical transfer",
      "High-pressure hydraulic rubber hose assemblies",
      "Babbitt bearing manufacturing for compressor trains",
      "Dynamic balancing per ISO 1940/API 670",
    ],
    turbines: "Siemens, Man Turbo, KKK, ABB",
  },
  {
    id: "ind_5",
    title: "Petrochemical & Refineries",
    iconName: "Activity",
    color: "from-purple-500/20 to-violet-600/10",
    border: "border-purple-500/30",
    accent: "text-purple-500",
    image: "industry-petrochemical.webp",
    desc: "Petrochemical and refinery turbines run continuously in hazardous environments, requiring API-grade filtration, explosion-proof instrumentation, and certified sealing products.",
    useCases: [
      "API 614 / 670 compliant filter and monitoring supply",
      "PTFE-lined expansion joints for chemical process lines",
      "Hydraulic hose assemblies for control systems",
      "Lube oil filter element supply for turbocompressors",
      "Turbine seal and gland packing supply",
      "Machine alignment for compressor and pump trains",
    ],
    turbines: "Siemens, Man Turbo, KKK",
  },
  {
    id: "ind_6",
    title: "Agro & Food Processing",
    iconName: "Wheat",
    color: "from-lime-500/20 to-green-600/10",
    border: "border-lime-500/30",
    accent: "text-lime-600",
    image: "industry-agro-food.webp",
    desc: "Agro-industrial facilities including rice mills, cotton gins, and food processing plants rely on back-pressure steam turbines for power and process steam. We provide cost-effective overhauling, spares, and fitration products.",
    useCases: [
      "Back-pressure turbine overhauling for rice mills and ginning factories",
      "Lube oil filter element supply for small packaged turbines",
      "Expansion joint supply for steam distribution lines",
      "Basket strainer elements for process water lines",
      "HVAC filters for food-grade production environments",
    ],
    turbines: "Triveni, Maxwatt, Chola Turbo",
  },
  {
    id: "ind_7",
    title: "Cement & Steel Plants",
    iconName: "Building2",
    color: "from-stone-500/20 to-slate-600/10",
    border: "border-stone-500/30",
    accent: "text-stone-500",
    image: "industry-cement-steel.webp",
    desc: "Cement and steel plants operate large multi-stage steam turbines and require high-reliability maintenance with minimum production disruption. We provide planned and emergency overhauling services.",
    useCases: [
      "Multi-stage steam turbine overhauling",
      "Rotor reverse engineering for obsolete spare parts",
      "Dynamic balancing to ISO G1.0 for high-speed rotors",
      "Duplex basket strainers and filter elements supply",
      "Lube oil flushing for high-volume reservoirs",
      "Machine alignment for large frame turbines",
    ],
    turbines: "BHEL, Siemens, Man Turbo",
  },
];

// ─── SLUGS (readable /industries/<slug> URLs instead of /industries/ind_1) ──
// Same pattern as data/products.ts — `id` stays the stable internal key used
// by INDUSTRY_DETAILS, IND_TESTIMONIALS, and INDUSTRY_PRODUCT_IDS; `slug` is
// purely the public-facing URL segment, derived from the industry title.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function assignUniqueSlugs(items: (typeof RAW_INDUSTRIES)[0][]): Map<string, string> {
  const slugById = new Map<string, string>();
  const seen = new Map<string, number>();
  for (const item of items) {
    const base = slugify(item.title) || item.id;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    slugById.set(item.id, count === 0 ? base : `${base}-${count + 1}`);
  }
  return slugById;
}
const INDUSTRY_SLUGS = assignUniqueSlugs(RAW_INDUSTRIES);

export const INDUSTRIES: Industry[] = RAW_INDUSTRIES.map((ind) => ({
  ...ind,
  slug: INDUSTRY_SLUGS.get(ind.id)!,
}));
