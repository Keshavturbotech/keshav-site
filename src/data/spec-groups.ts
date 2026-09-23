// src/data/spec-groups.ts
// Ported verbatim from SPEC_GROUPS + groupSpecsByTab in App.jsx (line ~13739).
// Categorizes a product's flat specs object into tabs (Dimensions/Performance/
// Materials/Standards + a synthetic 'General' catch-all) via keyword matching
// against each spec key name.

export interface SpecGroup {
  id: string;
  label: string;
  keywords: string[];
}

export const SPEC_GROUPS: SpecGroup[] = [
  {
    id: "dimensions",
    label: "Dimensions",
    // Keys that describe physical size, geometry, form-factor
    keywords: [
      "dimension",
      "size",
      "length",
      "width",
      "height",
      "diameter",
      "bore",
      "od ",
      "id ",
      "wall",
      "thickness",
      "weight",
      "gauge",
      "profile",
      "cross-section",
      "frame",
      "cage",
      "pitch",
      "depth",
      "clearance",
      "tolerance",
      "range",
      "sizing",
      "model —",
      "nominal",
      "thread",
      "pocket",
      "pleat",
      "bag ",
      "roll ",
      "section",
      "shape",
      "slot",
      "mesh range",
      "mesh / perforation",
      "perforation",
      "wire",
      "ply",
      "corrugation",
      "arch",
      "ring number",
      "ring spacing",
      "split ring",
      "blade thickness",
      "blade root",
      "blade type",
      "bellow design",
      "air gap",
      "probe gap",
      "axial displacement",
      "axial movement",
      "lateral movement",
      "angular misalignment",
      "radial",
      "displacement range",
      "movement",
      "stroke",
      "travel",
      // Added: physical connection/mounting specs were falling through to
      // the "General" catch-all — see audit finding on spec-key coverage.
      "connection",
      "mount",
      "port ",
      "coil connector",
      "bearing type",
      "shaft type",
      "spool centre",
      "top plate",
      "root attachment",
      "joint type",
      "end fitting",
      "end design",
      "ends ",
    ],
  },
  {
    id: "performance",
    label: "Performance",
    // Keys that describe operating limits, flow, pressure, temp, speed, efficiency
    keywords: [
      "flow",
      "pressure",
      "temperature",
      "speed",
      "capacity",
      "power",
      "rating",
      "efficiency",
      "accuracy",
      "sensitivity",
      "response",
      "turndown",
      "duty",
      "load",
      "torque",
      "frequency",
      "viscosity",
      "collapse",
      "fatigue",
      "life",
      "service life",
      "operating",
      "working pressure",
      "working temp",
      "max pressure",
      "max temp",
      "max speed",
      "max operating",
      "inlet",
      "delivery",
      "output",
      "input signal",
      "output signal",
      "electrical output",
      "signal",
      "voltage",
      "current",
      "resistance",
      "vrrm",
      "vf ",
      "tj ",
      "tc ",
      "ifsm",
      "ifav",
      "alarm",
      "trip",
      "set pressure",
      "setpoint",
      "dp ",
      "differential",
      "static deflection",
      "spring rate",
      "natural frequency",
      "vibration",
      "beta rating",
      "absolute rating",
      "filtration rating",
      "filtration fineness",
      "filtration grade",
      "filtration accuracy",
      "filtration efficiency",
      "micron",
      "cleanliness",
      "particle capture",
      "separation",
      "rejection",
      "oil outlet",
      "residual",
      "adsorption",
      "carbon bed",
      "dust holding",
      "initial resistance",
      "final resistance",
      "pressure drop",
      "hydrodynamic",
      "bladder efficiency",
      "piston efficiency",
      "system recovery",
      "tds rejection",
      // Added: short-form temperature keys ("Ambient Temp", "Max Case Temp
      // (Tc)") and other operating-behavior specs weren't matching the full
      // word "temperature" — see audit finding on spec-key coverage.
      "temp",
      "blowdown",
      "bypass",
      "venturi",
      "spray water",
      "seat leakage",
      "proportional",
      "measurement",
      "linear velocity",
      "flash point",
      "thermal conductivity",
      "reset",
      "erosion protection",
      "lubrication",
      "monitoring",
    ],
  },
  {
    id: "materials",
    label: "Materials",
    // Keys that describe what the part is made of
    keywords: [
      "material",
      "alloy",
      "grade",
      "moc",
      "metal",
      "babbitt",
      "carbon",
      "graphite",
      "rubber",
      "compound",
      "ptfe",
      "epdm",
      "nitrile",
      "viton",
      "neoprene",
      "hnbr",
      "ss ",
      "ms ",
      "steel",
      "cast iron",
      "bronze",
      "titanium",
      "inconel",
      "incoloy",
      "hastelloy",
      "duplex",
      "hardox",
      "ceramic",
      "fiberglass",
      "nomex",
      "bladder material",
      "filter media",
      "media ",
      "seal ",
      "seals",
      "end cap",
      "body ",
      "head ",
      "shell ",
      "tube ",
      "retainer",
      "core/",
      "inner ring",
      "outer ring",
      "braid",
      "liner",
      "sleeve",
      "winding",
      "filler",
      "mica",
      "glass type",
      "mesh material",
      "cage material",
      "basket internal",
      "bowl material",
      "disc material",
      "seat/",
      "plug material",
      "trim",
      "diaphragm",
      "pleat support",
      "reinforcement",
      "backing",
      "surface finish",
      "surface hardness",
      "surface treatment",
      "heat treatment",
      "hardness",
      "wetted",
      "hub material",
      "rotor material",
      "gear material",
      "white metal",
      "carbon grade",
      // Added: fabrication/build-up descriptions were falling through to
      // "General" — see audit finding on spec-key coverage.
      "construction",
      "erosion",
      "internals",
      "outer cover",
      "inner tube",
      "sealing",
      "shaft sealing",
    ],
  },
  {
    id: "standards",
    label: "Standards",
    // Keys that describe compliance, certifications, testing, documentation
    keywords: [
      "standard",
      "compliance",
      "certifi",
      "approval",
      "atex",
      "sil ",
      "api ",
      "asme",
      "iso ",
      "ibr",
      "pmi",
      "rtd",
      "iec",
      "en ",
      "astm",
      "din ",
      "bs ",
      "is ",
      "nema",
      "ul ",
      "ce ",
      "ped",
      "test",
      "inspection",
      "documentation",
      "material certificate",
      "quality",
      "verification",
      "calibration",
      "hsn code",
      "design code",
      "design basis",
      "design compliance",
      "flange standard",
      "thread standard",
      "mounting standard",
      "oem approvals",
      "oem compatible",
      "oem interchangeable",
      "compatible turbine",
      "compatible makes",
      "compatible brands",
      "compatible housings",
      "compatible fluids",
      "element compat",
      "turbine compat",
      "oem turbine",
      "domestic fit",
      "interchangeable",
      "equivalent",
      "cross-reference",
      "part number",
      "hsn",
      "ip rating",
      "hazardous area",
      "explosion proof",
      "atex rating",
      "fail-safe",
      "cip/sip",
      "oil-free",
      "fire-retardant",
      // Added: "OEM Compatibility"/"Compatible OEMs" etc. weren't matching
      // "oem compatible" — "compatibility" doesn't contain "compatible" as a
      // substring — see audit finding on spec-key coverage.
      "compatib",
      "manufacturer",
      "makes supplied",
      "housing series",
      "oem ",
      "dcs ",
    ],
  },
  {
    id: "application",
    label: "Application & Compatibility",
    // Keys that describe where/how the part is used and what it fits —
    // added because "Application", "Type", "Industries", "Service", etc.
    // (141+ spec entries across the catalog) had no home and were landing
    // in the generic "General" tab — see audit finding on spec-key coverage.
    keywords: [
      "application",
      "industr",
      "service",
      "typical use",
      "typical medium",
      "utility media",
      "type",
      "configuration",
      "style",
      "variant",
      "function",
      "governor model",
      "pall series",
      "brand",
      "product type",
      "filtration type",
      "case style",
      "design focus",
      "design priority",
      "primary benefit",
      "key advantage",
      "key feature",
      "advantage",
      "engineering",
      "process",
      "operation mode",
      "coupling principle",
    ],
  },
];

export type GroupedSpecs = Record<string, [string, string][]>;

/**
 * Distribute spec entries into groups.
 * Entries matched by multiple group keywords go to the first matching group.
 * Unmatched entries go into a synthetic 'general' group.
 */
export function groupSpecsByTab(specs: Record<string, string | undefined>): GroupedSpecs {
  const result: GroupedSpecs = {};
  const assigned = new Set<string>();

  for (const grp of SPEC_GROUPS) {
    const matched: [string, string][] = [];
    for (const [k, v] of Object.entries(specs)) {
      if (assigned.has(k) || v == null) continue;
      const lk = k.toLowerCase();
      if (grp.keywords.some((kw) => lk.includes(kw))) {
        matched.push([k, v]);
        assigned.add(k);
      }
    }
    if (matched.length) result[grp.id] = matched;
  }

  const general = Object.entries(specs).filter(([k, v]) => !assigned.has(k) && v != null) as [
    string,
    string,
  ][];
  if (general.length) result.general = general;

  return result;
}

export function labelOfGroup(id: string): string {
  if (id === "general") return "General";
  return SPEC_GROUPS.find((g) => g.id === id)?.label ?? id;
}

// Lead time per category — ported from SpecsTable in App.jsx (line ~13931).
export function leadTimeForCategory(category: string): string {
  switch (category) {
    case "Turbine Spares":
      return "2–6 weeks (standard); custom 6–10 weeks";
    case "Expansion Joints":
      return "Stocked sizes: 1–2 weeks; custom DN: 3–5 weeks";
    case "Industrial Strainers":
      return "1–3 weeks (standard); custom 3–6 weeks";
    case "Industrial Rubber Products":
      return "1–3 weeks";
    case "Electronic Equipments":
      return "1–4 weeks (subject to availability)";
    case "Industrial Filtration":
      return "Stocked items: ex-stock to 1 week; custom: 2–4 weeks";
    case "HVAC, Ducting & Air Filtration":
      return "Standard grades: ex-stock to 1 week; custom sizes/special media: 2–4 weeks";
    case "Valves, Gaskets & Steam System Products":
      return "Stocked gaskets/packing: 1–2 weeks; custom valves/traps: 2–6 weeks";
    case "Flexible Hoses & Assemblies":
      return "Standard lengths: ex-stock to 1 week; custom length/end fittings: 1–3 weeks";
    case "Hydraulic Components":
      return "1–3 weeks (subject to availability)";
    default:
      return "Stocked / 2–4 weeks";
  }
}
