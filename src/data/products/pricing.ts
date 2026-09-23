// src/data/products/pricing.ts
// Extracted verbatim from src/data/products.ts (Part 2 of the products.ts split).
// CATEGORY_PRICE_BANDS, CATEGORY_AVAILABILITY, PRODUCT_PRICE_MAP — copied
// exactly, same names/shapes/values. The merge/fallback logic that consumes
// these (PRODUCT_PRICE_MAP -> CATEGORY_PRICE_BANDS -> null, and
// CATEGORY_AVAILABILITY) still lives in products.ts and is unchanged.

import type { PriceRange, Availability } from "../products";

export const CATEGORY_PRICE_BANDS: Record<string, PriceRange> = {
  "Industrial Filtration": {
    min: 850,
    max: 45000,
    unit: "per element",
    note: "Standard grades; custom media on request",
  },
  "Industrial Strainers": {
    min: 1200,
    max: 75000,
    unit: "per piece",
    note: "Carbon steel to SS316L; size-dependent",
  },
  "Expansion Joints": {
    min: 500,
    max: 28000,
    unit: "per piece",
    note: "NB 25–300 mm; EPDM / Neoprene / PTFE-lined",
  },
  "Turbine Spares": {
    min: 8000,
    max: 500000,
    unit: "per part",
    note: "Small wear parts to precision-machined rotors",
  },
  "HVAC, Ducting & Air Filtration": {
    min: 270,
    max: 12000,
    unit: "per filter",
    note: "G3 panel to HEPA H14; custom dimensions",
  },
  "Valves, Gaskets & Steam System Products": {
    min: 400,
    max: 60000,
    unit: "per piece",
    note: "Gaskets and packing to steam traps and safety relief valves",
  },
  "Flexible Hoses & Assemblies": {
    min: 350,
    max: 18000,
    unit: "per assembly",
    note: "Per metre / per assembly; end-fitting inclusive",
  },
  "Industrial Rubber Products": {
    min: 400,
    max: 25000,
    unit: "per piece",
    note: "Gaskets, mounts, bellows; hardness/compound-dependent",
  },
  "Electronic Equipments": {
    min: 3500,
    max: 120000,
    unit: "per unit",
    note: "Sensors, controllers, instrumentation",
  },
  "Hydraulic Components": {
    min: 575,
    max: 35000,
    unit: "per piece",
    note: "Hose assemblies to manifold blocks",
  },
};

// ─── CATEGORY AVAILABILITY ───────────────────────────────────────────────────
export const CATEGORY_AVAILABILITY: Record<string, Availability> = {
  "Industrial Filtration": {
    label: "Ex-Stock",
    color: "green",
    leadTime: "Ex-stock to 1 week",
  },
  "Industrial Strainers": {
    label: "Ex-Stock",
    color: "green",
    leadTime: "Ex-stock to 1 week",
  },
  "Expansion Joints": {
    label: "In Stock",
    color: "green",
    leadTime: "1–2 weeks",
  },
  "Turbine Spares": {
    label: "Made to Order",
    color: "amber",
    leadTime: "2–6 weeks",
  },
  "HVAC, Ducting & Air Filtration": {
    label: "Ex-Stock",
    color: "green",
    leadTime: "Ex-stock to 1 week",
  },
  "Valves, Gaskets & Steam System Products": {
    label: "Made to Order",
    color: "amber",
    leadTime: "1–4 weeks",
  },
  "Flexible Hoses & Assemblies": {
    label: "In Stock",
    color: "green",
    leadTime: "1–3 weeks",
  },
  "Industrial Rubber Products": {
    label: "In Stock",
    color: "green",
    leadTime: "1–3 weeks",
  },
  "Electronic Equipments": {
    label: "On Request",
    color: "amber",
    leadTime: "1–4 weeks",
  },
  "Hydraulic Components": {
    label: "In Stock",
    color: "green",
    leadTime: "1–3 weeks",
  },
};

// ─── PER-PRODUCT PRICE MAP ───────────────────────────────────────────────────
export const PRODUCT_PRICE_MAP: Record<string, PriceRange> = {
  // ── INDUSTRIAL FILTRATION ──
  prod_f1: {
    min: 1500,
    max: 8500,
    unit: "per element",
    note: "Triveni 8–120 GPM; microfelt / SS wire mesh media",
  },
  prod_f2: {
    min: 2500,
    max: 12000,
    unit: "per element",
    note: "Siemens control & lube oil types; 850–1800 LPM",
  },
  prod_f3: {
    min: 900,
    max: 6000,
    unit: "per element",
    note: "CEP centrifugal SS wire mesh; standard bore sizes",
  },
  prod_f4: {
    min: 850,
    max: 3500,
    unit: "per element",
    note: "NBF series tank breather; 10–40 micron rating",
  },
  prod_f5: {
    min: 750,
    max: 4500,
    unit: "per element",
    note: "AS/TS suction strainer; 100–250 mesh options",
  },
  prod_f6: {
    min: 2200,
    max: 9500,
    unit: "per element",
    note: "WSNR offline water-absorbing; saturated indicator",
  },
  prod_f7: {
    min: 3500,
    max: 18000,
    unit: "per element",
    note: "PTFE hydrophobic; 0.2–1 µm for gas/air service",
  },
  prod_f8: {
    min: 1100,
    max: 7500,
    unit: "per element",
    note: "Return-line 10–25 µm; standard ISO 4406 cleanliness",
  },
  prod_f9: {
    min: 18000,
    max: 85000,
    unit: "per assembly",
    note: "Duplex control-oil housing + elements; CS/SS body",
  },
  prod_f10: {
    min: 22000,
    max: 120000,
    unit: "per housing",
    note: "Fabricated SS/CS duplex housing; custom flow rates",
  },
  prod_f12: {
    min: 1200,
    max: 6500,
    unit: "per element",
    note: "Standard industrial oil filter elements",
  },
  prod_f13: {
    min: 900,
    max: 4500,
    unit: "per element",
    note: "Industrial filtration elements",
  },
  prod_f14: {
    min: 1500,
    max: 8000,
    unit: "per element",
    note: "Specialty filter elements",
  },
  prod_f15: {
    min: 2500,
    max: 14000,
    unit: "per element",
    note: "Wedge wire; SS 304/316; 25–500 µm slot width",
  },
  prod_f16: {
    min: 1800,
    max: 7500,
    unit: "per element",
    note: "Concrete pump; high-pressure steel bowl",
  },
  prod_f17: {
    min: 1200,
    max: 6000,
    unit: "per cartridge",
    note: "Spunbond / cellulose / polyester; OD 325 mm std",
  },
  prod_f18: {
    min: 2200,
    max: 9000,
    unit: "per cartridge",
    note: "Pleated flange-type; PTFE / polyester / cellulose",
  },
  prod_f19: {
    min: 3500,
    max: 15000,
    unit: "per unit",
    note: "Oil vapour extractor; coalescing media",
  },
  prod_f20: {
    min: 2800,
    max: 12000,
    unit: "per element",
    note: "HYDAC replacement; cross-referenced by part no.",
  },
  prod_f21: {
    min: 3200,
    max: 14000,
    unit: "per element",
    note: "Pall replacement; BT/HC/HY series",
  },
  prod_f22: {
    min: 1000,
    max: 5500,
    unit: "per element",
    note: "Bhagwati replacement oil filters",
  },
  prod_f23: {
    min: 1800,
    max: 8500,
    unit: "per element",
    note: "Air-oil separator; coalescer / screw compressor",
  },
  prod_f_bhel: {
    min: 2200,
    max: 11000,
    unit: "per element",
    note: "BHEL lube oil; OEM cross matched",
  },
  prod_f_htc: {
    min: 1800,
    max: 9000,
    unit: "per element",
    note: "HTC (Hangzhou Turbine) filter elements",
  },
  prod_f_hp1: {
    min: 12000,
    max: 55000,
    unit: "per housing",
    note: "High-pressure single cartridge; up to 350 bar",
  },
  prod_f_mag1: {
    min: 8500,
    max: 38000,
    unit: "per assembly",
    note: "Magnetic separator; Nd/Fe/B magnet bars; lube oil",
  },
  prod_f_cenlub: {
    min: 900,
    max: 9500,
    unit: "per element",
    note: "Cenlub lube console & circulation system elements",
  },
  prod_f_eaton: {
    min: 1500,
    max: 14000,
    unit: "per element",
    note: "Eaton / Internormen 01.E, 01.NL, 01.NR series",
  },
  prod_f_epe: {
    min: 1200,
    max: 12000,
    unit: "per element",
    note: "EPE / Eppensteiner 1. & 2. series elements",
  },

  // ── INDUSTRIAL STRAINERS ──
  prod_st1: {
    min: 2999,
    max: 35000,
    unit: "per piece",
    note: "CS/MS simplex basket DN25–300; ANSI 150–600#",
  },
  prod_st2: {
    min: 7000,
    max: 75000,
    unit: "per piece",
    note: "Duplex basket with changeover valve; CS/SS",
  },
  prod_st3: {
    min: 1200,
    max: 12000,
    unit: "per piece",
    note: "Conical strainer DN15–200; SS wire mesh 40–100 mesh",
  },
  prod_st4: {
    min: 1500,
    max: 18000,
    unit: "per piece",
    note: "Y-type flanged/threaded; CS/SS/CI; PN10–PN40",
  },
  prod_st5: {
    min: 3500,
    max: 28000,
    unit: "per piece",
    note: "Pot/bucket strainer DN50–400; heavy-gauge SS basket",
  },
  prod_st5b: {
    min: 800,
    max: 6500,
    unit: "per element",
    note: "Replacement basket elements; SS 304/316; custom mesh",
  },
  prod_st6: {
    min: 2500,
    max: 14000,
    unit: "per element",
    note: "Notch wire SS; precision slot 50–500 µm",
  },

  // ── EXPANSION JOINTS ──
  prod_e1: {
    min: 1500,
    max: 28000,
    unit: "per piece",
    note: "SS bellows NB 25–300; PN10–PN40; EJMA standard",
  },
  prod_e1b: {
    min: 2000,
    max: 32000,
    unit: "per piece",
    note: "Axial EJ; single/multi-ply; flanged or welded",
  },
  prod_e2: {
    min: 2000,
    max: 18000,
    unit: "per piece",
    note: "Double arch rubber NB 25–250; EPDM/neoprene/PTFE",
  },
  prod_e3: {
    min: 500,
    max: 8000,
    unit: "per piece",
    note: "Single arch rubber NB 15–200; standard EPDM",
  },
  prod_e3b: {
    min: 800,
    max: 12000,
    unit: "per piece",
    note: "Wide arch bellow; larger movement absorption",
  },
  prod_e3c: {
    min: 4500,
    max: 35000,
    unit: "per piece",
    note: "Heat exchanger bellows; TEMA type; SS/Inconel",
  },
  prod_e4: {
    min: 5500,
    max: 45000,
    unit: "per piece",
    note: "Universal metallic EJ; two bellows + spool",
  },
  prod_e5: {
    min: 1200,
    max: 14000,
    unit: "per piece",
    note: "Non-metallic fabric EJ; glass/ceramic/silica cloth",
  },
  prod_e6: {
    min: 8000,
    max: 65000,
    unit: "per piece",
    note: "Pressure balanced EJ; in-line or elbow type",
  },
  prod_e7: {
    min: 6000,
    max: 42000,
    unit: "per piece",
    note: "Ring reinforced metallic; lateral/angular movement",
  },
  prod_e9: {
    min: 5000,
    max: 38000,
    unit: "per piece",
    note: "Lateral metallic EJ; high lateral offset",
  },
  prod_e10: {
    min: 7000,
    max: 55000,
    unit: "per piece",
    note: "Angular hinged/gimbal; single/double hinge",
  },
  prod_e11: {
    min: 3500,
    max: 22000,
    unit: "per piece",
    note: "Metallic vibration absorber; SS/Monel/Inconel",
  },
  prod_e13: {
    min: 15000,
    max: 120000,
    unit: "per piece",
    note: "Steam crossover piping bellows; high-temp alloy",
  },
  prod_e17: {
    min: 6000,
    max: 40000,
    unit: "per piece",
    note: "Expansion joint for high offset/movement",
  },
  prod_e18: {
    min: 4000,
    max: 28000,
    unit: "per piece",
    note: "Expansion joint; DN range 50–400 mm",
  },
  prod_e21: {
    min: 2500,
    max: 18000,
    unit: "per piece",
    note: "Rubber expansion joint; industrial grade",
  },
  prod_e26: {
    min: 5000,
    max: 38000,
    unit: "per piece",
    note: "Compensator bellow; duct application",
  },
  prod_e27: {
    min: 4000,
    max: 28000,
    unit: "per piece",
    note: "Pipe expansion joint; weld end type",
  },
  prod_e29: {
    min: 10000,
    max: 80000,
    unit: "per piece",
    note: "Butterfly/louvre/guillotine damper; manual or motorized",
  },
  prod_e30: {
    min: 12000,
    max: 95000,
    unit: "per piece",
    note: "Flanged dismantling joint; MS/SS; ANSI/PN connections",
  },
  prod_e31: {
    min: 3500,
    max: 25000,
    unit: "per piece",
    note: "Custom fabricated MS/SS ductwork; welded or flanged",
  },

  // ── TURBINE SPARES ──
  prod_ts1: {
    min: 5000,
    max: 35000,
    unit: "per set",
    note: "Carbon ring gland assembly; standard turbine sizes",
  },
  prod_ts2: {
    min: 8000,
    max: 65000,
    unit: "per bearing",
    note: "White metal / babbitt bearing; rebabbitted or new",
  },
  prod_ts3: {
    min: 12000,
    max: 95000,
    unit: "per piece",
    note: "Rotor shaft; precision machined alloy steel",
  },
  prod_ts4: {
    min: 3500,
    max: 22000,
    unit: "per set",
    note: "Labyrinth seals / sealing fins; standard grades",
  },
  prod_ts5: {
    min: 1500,
    max: 12000,
    unit: "per piece",
    note: "Coupling bolts / studs; alloy steel",
  },
  prod_ts6: {
    min: 4500,
    max: 28000,
    unit: "per set",
    note: "Servomotor seal kits; NBR/Viton seals",
  },
  prod_ts7: {
    min: 2000,
    max: 15000,
    unit: "per piece",
    note: "Nozzle / nozzle segment; investment cast",
  },
  prod_ts8: {
    min: 8000,
    max: 60000,
    unit: "per set",
    note: "Moving & stationary blades; stainless alloy",
  },
  prod_ts9: {
    min: 6000,
    max: 45000,
    unit: "per piece",
    note: "Gear wheel / pinion; case hardened",
  },
  prod_ts10: {
    min: 3000,
    max: 20000,
    unit: "per piece",
    note: "Thrust collar / thrust pad; precision babbitt",
  },
  prod_ts11: {
    min: 2500,
    max: 18000,
    unit: "per piece",
    note: "Diaphragm; stage diaphragm cast / fabricated",
  },
  prod_ts12: {
    min: 1200,
    max: 8500,
    unit: "per set",
    note: "Carbon rings; standard OEM-compatible dimensions",
  },
  prod_ts13: {
    min: 4000,
    max: 25000,
    unit: "per piece",
    note: "Oil gland / steam gland assembly",
  },
  prod_ts14: {
    min: 5500,
    max: 38000,
    unit: "per piece",
    note: "Valve cone / spindle / ESV spares",
  },
  prod_ts15: {
    min: 3500,
    max: 24000,
    unit: "per set",
    note: "Yoke / power cylinder / servomotor spares",
  },
  prod_ts16: {
    min: 1000,
    max: 8000,
    unit: "per kg",
    note: "Caulking wire; 21CrMoV / X22 alloy steel",
  },
  prod_ts17: {
    min: 2500,
    max: 16000,
    unit: "per piece",
    note: "Bearing pedestal; CI/MS fabricated",
  },
  prod_ts18: {
    min: 1800,
    max: 12000,
    unit: "per piece",
    note: "Base frame / sole plate; structural steel",
  },
  prod_ts19: {
    min: 3000,
    max: 20000,
    unit: "per piece",
    note: "Spiral conveyor screw; alloy steel",
  },
  prod_ts20: {
    min: 2500,
    max: 15000,
    unit: "per piece",
    note: "Nylon sleeve for gear coupling; standard sizes",
  },
  prod_ts21: {
    min: 8500,
    max: 55000,
    unit: "per piece",
    note: "KTR BoWex gear coupling; curved-tooth design",
  },
  prod_ts22: {
    min: 800,
    max: 5500,
    unit: "per set",
    note: "Shear pins turbine coupling; alloy steel",
  },
  prod_ts23: {
    min: 18000,
    max: 120000,
    unit: "per pump",
    note: "Dowty hydraulic oil pump; MOP/AOP/EOP types",
  },
  prod_ts_blades: {
    min: 8000,
    max: 120000,
    unit: "per set",
    note: "Moving & stationary; 410SS/12Cr alloy; stage-matched",
  },
  prod_ts_gov_cards: {
    min: 9000,
    max: 250000,
    unit: "per unit",
    note: "Woodward 505/723/2300/EGB; PCB & control assemblies",
  },
  prod_ts_shaft_seal_kit: {
    min: 5000,
    max: 35000,
    unit: "per kit",
    note: "Complete carbon ring gland kit; OEM-match dimensions",
  },
  prod_ts_rebabbitting: {
    min: 8000,
    max: 65000,
    unit: "per bearing",
    note: "Bearing rebabbitting service; Babbitt B-83/B-23",
  },
  prod_ts_lube_oil_cooler: {
    min: 25000,
    max: 180000,
    unit: "per unit",
    note: "Shell & tube / plate type; ASME / TEMA standard",
  },
  prod_ts_pressure_instruments: {
    min: 3500,
    max: 28000,
    unit: "per piece",
    note: "Bourdon gauges, transmitters, switches; ATEX",
  },
  prod_ts_prv: {
    min: 18000,
    max: 200000,
    unit: "per station",
    note: "PRDS station; single/twin element; DN25–150",
  },
  prod_ts_overspeed: {
    min: 12000,
    max: 95000,
    unit: "per unit",
    note: "Mechanical & electro-hydraulic trip; API 670 class",
  },
  prod_ts_dp_switch: {
    min: 3500,
    max: 22000,
    unit: "per piece",
    note: "DP & temp switches; SS wetted parts; IP65/67",
  },
  prod_ts_labyrinth_leaf_spring: {
    min: 1500,
    max: 12000,
    unit: "per segment",
    note: "Spring steel or Inconel X-750; set of 4–8 per gland",
  },

  // ── HVAC & AIR FILTRATION ──
  prod_af1: {
    min: 1200,
    max: 8500,
    unit: "per filter",
    note: "Multi-pocket bag G3–F9; synthetic / polyester media",
  },
  prod_af2: {
    min: 2500,
    max: 12000,
    unit: "per filter",
    note: "Activated carbon vent filter; recirculating type",
  },
  prod_af3: {
    min: 300,
    max: 2800,
    unit: "per filter",
    note: "Metallic mesh pre-filter; GI/SS; cleanable & reusable",
  },
  prod_af4: {
    min: 899,
    max: 5500,
    unit: "per filter",
    note: "Pleated panel filter G3–G4; cardboard / metal frame",
  },
  prod_af5: {
    min: 2200,
    max: 14000,
    unit: "per piece",
    note: "Pulse-jet bag + pleated cartridge; polyester/PPS/PTFE",
  },
  prod_af6: {
    min: 280,
    max: 3500,
    unit: "per metre",
    note: "Wound filter media rolls; G2–G4; various widths",
  },

  // ── FLEXIBLE HOSES & ASSEMBLIES ──
  prod_h1: {
    min: 350,
    max: 4500,
    unit: "per assembly",
    note: "SS corrugated hose; DN6–DN50; end fitting inclusive",
  },
  prod_h1b: {
    min: 500,
    max: 6000,
    unit: "per assembly",
    note: "Armoured SS flexible hose; high-pressure rated",
  },
  prod_h1c: {
    min: 800,
    max: 8500,
    unit: "per assembly",
    note: "PTFE-lined SS hose; chemical resistance grade",
  },
  prod_h2: {
    min: 1200,
    max: 12000,
    unit: "per assembly",
    note: "Hydraulic hose assembly; SAE 100R1–R17 series",
  },
  prod_h3: {
    min: 600,
    max: 5500,
    unit: "per assembly",
    note: "Industrial hose assembly; water/air/steam",
  },
  prod_h4: {
    min: 900,
    max: 9000,
    unit: "per assembly",
    note: "High-pressure hose assembly; >350 bar rated",
  },
  prod_h5: {
    min: 1500,
    max: 15000,
    unit: "per assembly",
    note: "Steam hose assembly; EPDM; 8–18 bar pressure",
  },
  prod_h6: {
    min: 700,
    max: 6500,
    unit: "per assembly",
    note: "Chemical hose assembly; PTFE inner tube",
  },
  prod_h7: {
    min: 1100,
    max: 10000,
    unit: "per assembly",
    note: "Oil hose assembly; NBR/Viton lined",
  },

  // ── INDUSTRIAL RUBBER PRODUCTS ──
  prod_r1: {
    min: 400,
    max: 8500,
    unit: "per piece",
    note: "Custom extruded rubber profiles & seals; EPDM/neoprene/nitrile",
  },

  // ── ELECTRONIC EQUIPMENTS ──
  prod_ee1: {
    min: 3500,
    max: 22000,
    unit: "per piece",
    note: "Speed sensor / proximity switch; inductive/hall-effect",
  },
  prod_ee2: {
    min: 5500,
    max: 45000,
    unit: "per piece",
    note: "Vibration sensor / monitoring instrument",
  },
  prod_ee3: {
    min: 8000,
    max: 65000,
    unit: "per piece",
    note: "Temperature transmitter / thermocouple assembly",
  },
  prod_ee4: {
    min: 12000,
    max: 85000,
    unit: "per piece",
    note: "Flow meter / flow transmitter; industrial grade",
  },
  prod_ee5: {
    min: 6500,
    max: 55000,
    unit: "per piece",
    note: "Pressure transmitter / gauge; 4–20 mA output",
  },
  prod_ee6: {
    min: 15000,
    max: 120000,
    unit: "per panel",
    note: "Control panel / relay module; DIN rail assembly",
  },

  // ── HYDRAULIC COMPONENTS ──
  prod_hv1: {
    min: 1600,
    max: 18000,
    unit: "per piece",
    note: "Directional control valve; D03/D05/cetop; Yuken/Bosch type",
  },
  prod_hv2: {
    min: 8500,
    max: 75000,
    unit: "per piece",
    note: "Bladder/piston accumulator 0.75–50 L; 350 bar rated",
  },

  // ── MISC TURBINE / SEALING ──
  prod_gp1: {
    min: 450,
    max: 4500,
    unit: "per kg",
    note: "Graphite / PTFE / PTFE-graphite braided gland packing",
  },
  prod_srv1: {
    min: 3000,
    max: 85000,
    unit: "per valve",
    note: 'Spring-loaded SRV; API 526; 15–600# flanged; 1"–10"',
  },
  prod_trap1: {
    min: 2200,
    max: 18000,
    unit: "per piece",
    note: "Thermodynamic / F&T / inverted bucket; DN15–50",
  },
  prod_gk1: {
    min: 50,
    max: 3500,
    unit: "per piece",
    note: "SWG ASME B16.20; SS304 winding + graphite filler",
  },
  prod_gk2: {
    min: 120,
    max: 4500,
    unit: "per piece",
    note: "RTJ oval/octagonal; soft iron / 316SS; API 6A",
  },
};
