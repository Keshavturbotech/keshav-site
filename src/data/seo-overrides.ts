// src/data/seo-overrides.ts
// Hand-written English <title> / meta description for pages whose on-page
// headline or intro is too long for a SERP snippet (titles <= 60 chars,
// descriptions <= 155, complete phrases). Keyed by locale-agnostic path.
// Used by Layout.astro for the English locale only; other locales keep
// their own strings and the automatic clause-safe truncation in lib/seo.ts.
// Page H1s and body copy are NOT affected.
export const SEO_OVERRIDES: Record<string, { title?: string; description?: string }> = {
  // Case studies
  "/projects/cs_01": {
    title: "Triveni 5 MW Turbine Overhaul & Rotor Balancing",
    description: "Overhaul of a Triveni 5 MW back-pressure turbine: rotor removal, bearing replacement, seal machining, ISO 1940 G2.5 balancing and lube oil flushing.",
  },
  "/projects/cs_02": { title: "Siemens SST-200 Disc Reverse Engineering Case Study" },
  "/projects/cs_03": { title: "Maxwatt 3.5 MW Turbine Erection & Commissioning" },
  "/projects/cs_04": { title: "BHEL 15 MW Turbine Post-Overhaul Lube Oil Flush" },
  "/projects/cs_05": { title: "KKK Compressor Train Laser Alignment Case Study" },
  "/projects/cs_06": {
    title: "Cement Mill Fan Rotor Balancing & Journal Machining",
    description: "Workshop dynamic balancing of a 680 kg cement mill ID fan rotor, with journal machining, carried out for a cement plant.",
  },
  "/projects/cs_07": {
    title: "Belliss & Morcom Bearing Failure: Emergency Response",
    description: "Emergency response to a Belliss & Morcom turbine bearing failure in crushing season: diagnosis, replacement babbitt bearing manufacture and fit.",
  },
  "/projects/cs_08": { title: "BHEL 3 MW Turbine High-Vibration Root-Cause Fix" },

  // Blog posts
  "/blog/steam-turbine-overhauling-checklist": {
    title: "Steam Turbine Overhauling Checklist for Plant Engineers",
    description: "A practical, step-by-step steam turbine overhauling checklist: pre-shutdown planning, inspection protocols and clearance recording.",
  },
  "/blog/lube-oil-contamination-turbine-bearings": { title: "How Lube Oil Contamination Destroys Turbine Bearings" },
  "/blog/reverse-engineering-turbine-spares-india": { title: "Reverse Engineering Turbine Spares in India" },
  "/blog/belliss-morcom-turbine-common-faults-india": { title: "Belliss & Morcom Turbine Common Faults: Field Guide" },
  "/blog/iso-4406-lube-oil-cleanliness-guide": { title: "How to Read an ISO 4406 Lube Oil Cleanliness Report" },
  "/blog/hvac-air-filter-selection-guide-industrial": { title: "Industrial HVAC Air Filter Selection Guide: F5 to F9" },
  "/blog/pulse-jet-dust-collector-filter-bag-selection": {
    title: "Pulse-Jet Dust Collector Filter Bag Selection Guide",
    description: "How to choose pulse-jet baghouse filter bag media, temperature rating and surface treatment for Indian plants, with anti-static guidance.",
  },
  "/blog/vibration-probe-sensor-selection-guide-turbines-gearboxes-motors": { title: "Vibration Probe & Sensor Selection for Turbines" },

  // Services
  "/services/dynamic-balancing-and-rotor-machining": {
    description: "Dynamic balancing of turbine rotors up to 2,000 kg, with precision grinding, polishing and journal machining at our workshop.",
  },
  "/services/troubleshooting-service": {
    description: "Rapid on-site fault diagnosis for steam turbines with vibration, bearing failure, governor instability, steam leakage or oil contamination.",
  },
  "/services/sand-blasting-and-surface-preparation": {
    description: "Controlled abrasive blasting of turbine rotors, casings and components to remove rust, scale and old coatings before inspection or coating.",
  },

  // Industries
  "/industries/petrochemical-and-refineries": {
    description: "API-grade filtration, explosion-proof instrumentation and turbine services for refineries and petrochemical plants running in hazardous areas.",
  },

  // Products whose own description is one long sentence
  "/products/triveni-replacement-turbine-lube-oil-filter-elements": {
    description: "OEM-compatible lube oil filter elements for Triveni steam turbines, from 4 GPM to 140 GPM, in glass fiber, SS wire mesh and polyester media.",
  },
  "/products/tank-breather-filter-elements-nbf-series": {
    description: "Glass fiber breather filter elements, dimensionally compatible with Eaton 01.NBF, blocking airborne contamination and moisture in oil reservoirs.",
  },
  "/products/ring-reinforced-metallic-expansion-joint": {
    description: "High-pressure metallic expansion joint with external equalizing rings between convolutions to prevent squirm and improve pressure stability.",
  },
  "/products/angular-hinged-gimbal-expansion-joint": {
    description: "Pin-restrained hinged or gimbal angular expansion joint for controlled rotation in one or two planes while resisting pressure thrust loads.",
  },
  "/products/metallic-vibration-absorber": {
    description: "Short-length metallic bellows assembly for vibration isolation at rotating equipment connections, reducing vibration and structure-borne noise.",
  },
  "/products/steam-crossover-piping-bellows": {
    description: "Large-diameter metallic bellows for turbine crossover and reheater piping where high temperature and differential casing growth govern design.",
  },
  "/products/rectangular-expansion-joint": {
    description: "Rectangular or square-profile expansion joint for duct systems, compensating thermal growth and vibration where circular bellows do not suit.",
  },
  "/products/cryogenic-lng-lpg-expansion-joint": {
    description: "Cryogenic-rated metallic expansion joint for very low-temperature liquefied gas service, keeping ductility and sealing under thermal contraction.",
  },
  "/products/octagonal-profile-expansion-joint": {
    description: "Octagonal bellows expansion joint, stronger than circular profiles, absorbing thermal expansion and vibration in industrial piping and ducts.",
  },
  "/products/thick-wall-heavy-duty-expansion-joint": {
    description: "Reinforced thick-wall expansion joint for extreme pressure, high temperature and heavy mechanical stress, with minimal deformation.",
  },
  "/products/magnetic-pickup-sensor-woodward": {
    description: "Woodward variable reluctance magnetic speed pickup (MPU) for shaft speed feedback to governors and digital turbine control systems.",
  },
  "/products/rtd-and-sensors-for-power-plants-and-steam-turbines": {
    description: "RTDs, thermocouples and process sensors for turbine bearing, lube oil, steam and exhaust gas temperature monitoring.",
  },
  "/products/semikron-skn240-16-rectifier-diode": {
    description: "SEMIKRON SKN240/16 stud-mount rectifier diode for alternator AVR excitation circuits and turbine-generator rectifier bridges: 240 A, 1600 V.",
  },
  "/products/steam-turbine-blades-moving-and-stationary": {
    description: "Reverse-engineered steam turbine blades, moving and stationary, in 13% Cr steel, 316L SS, Incoloy and titanium for Indian turbine makes.",
  },
  "/products/complete-shaft-seal-kit-carbon-ring-gland-assembly": {
    description: "Complete shaft seal kit in one supply: carbon/graphite gland rings, housing, springs, steam piping connections and fasteners.",
  },
  "/products/hydraulic-accumulators-bladder-and-piston-type": {
    description: "Bladder and piston hydraulic accumulators for energy storage, pulsation dampening and emergency actuation in turbine trip circuits and ESV systems.",
  },
  "/products/safety-relief-valves-srv-psv-spring-loaded": {
    description: "Spring-loaded safety relief valves (SRV/PSV) for boilers, vessels and steam piping, to API 526, ASME Section I and VIII; IBR certification available.",
  },
  "/products/ring-joint-gaskets-rtj-oval-and-octagonal-asme-b16-20": {
    description: "Solid metallic RTJ ring joint gaskets, oval and octagonal, to ASME B16.20 for Class 150 to 2500 flanges and API 6A, 6B and 6BX.",
  },
  "/products/magnetic-filter-separator-assembly": {
    description: "Inline and off-line magnetic filter assemblies using neodymium or ferrite rods to remove ferrous wear particles from lube oil and hydraulic circuits.",
  },
  "/products/pressure-reducing-valve-prv-and-prds-station": {
    description: "Pressure reducing valves (PRV) and PRDS stations that condition boiler steam to the pressure and temperature turbine auxiliaries and processes need.",
  },
  "/products/hvac-metallic-mesh-pre-filter": {
    description: "Washable, reusable aluminium or stainless metallic mesh pre-filters for AHUs and industrial ventilation, catching coarse dust before fine filters.",
  },
  "/products/wound-filter-media-rolls": {
    description: "Bulk filter media on rolls in polyester, polypropylene, glass fibre, carbon composite and aluminium mesh, grades G1 to G4, for cut-to-size panels.",
  },
  "/products/dp-and-temperature-switches-turbine-lube-oil-monitoring": {
    description: "Differential pressure and temperature switches for lube oil filter housings, duplex changeover panels and heat exchangers; flag blockage before bypass.",
  },
  "/products/leaf-springs-for-turbine-labyrinth-gland-seals": {
    description: "Precision leaf springs that preload retractable labyrinth gland seal segments, in spring steel or Inconel X-750 for high-temperature stages.",
  },
  "/products/steam-turbine-silencers": {
    title: "Steam Turbine Silencers | Vent & Exhaust Noise Control",
    description: "Steam vent, exhaust and safety valve silencers for steam turbines, sized to your flow, pressure and dB(A) target. Carbon steel or stainless, made to order.",
  },
  "/products/cenlub-replacement-filter-elements": {
    description: "Replacement filter elements for Cenlub lubrication systems, oil circulation skids and API 614 lube oil consoles, built to original dimensions.",
  },
  "/products/eaton-replacement-filter-elements": {
    description: "Replacement filter elements dimensionally matched to the Eaton (Internormen) hydraulic and lubrication range, for steam turbine and compressor skids.",
  },
  "/products/epe-replacement-filter-elements": {
    description: "Replacement filter elements matched to EPE (Eppensteiner) series for steam turbine lube oil, control oil and hydraulic circuits, dimensionally identical to the original.",
  },
};
