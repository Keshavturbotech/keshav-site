// src/data/service-details.ts
// Ported verbatim from SERVICE_DETAIL_DATA in App.jsx (line ~19522).
// Pure data — no JSX/icon refs, fully serializable.
import { YEARS_IN_BUSINESS } from "./site-config";

export interface ServiceDetailStat {
  value: string;
  label: string;
}
export interface ServiceDetailProcedure {
  step: string;
  title: string;
  desc: string;
  iconName?: string;
  /**
   * Optional photo for this process step — a bare filename (e.g.
   * "step-rotor-balancing.webp"), resolved from public/ exactly like the
   * page's hero `service.image` (see services.ts). Omit for steps with no
   * photo; hasLocalImage() in [slug].astro gates rendering either way, so a
   * filename referenced here before the file actually exists on disk is
   * safe — it just doesn't render anything, same as a missing hero image.
   */
  image?: string;
  /**
   * Accessibility text for `image`. Defaults to `title` when omitted (the
   * step title is usually already a fair description of the photo), so
   * this only needs setting when the image shows something more specific
   * than the step title conveys.
   */
  imageAlt?: string;
}
export interface ServiceDetailImage {
  /** Bare filename (e.g. "turbine-erection-site-1.webp"), resolved from
   * src/assets/products/ or public/ exactly like the page's hero image. */
  file: string;
  /** Accessibility / caption text shown under the photo. */
  caption?: string;
}
export interface ServiceDetail {
  tagline: string;
  accentColor: string;
  keyStats: ServiceDetailStat[];
  whyUs: string;
  overview: string;
  procedures: ServiceDetailProcedure[];
  /**
   * Plain, unordered set of photos for this service page — not tied to any
   * particular step. Add as many or as few as you have real photos for;
   * add[i] is skipped automatically if its file isn't on disk yet.
   */
  images?: ServiceDetailImage[];
  [key: string]: unknown;
}

export const SERVICE_DETAIL_DATA: Record<string, ServiceDetail> = {
  srv_1: {
    tagline: "OEM-Coordinated Erection from First Foundation Bolt to First Steam",
    accentColor: "#2563eb",
  images: [
    { file: "turbine-erection-and-commissioning-gallery-1.webp" },
    { file: "turbine-erection-and-commissioning-gallery-2.webp" },
    { file: "turbine-erection-and-commissioning-gallery-3.webp" },
    { file: "turbine-erection-and-commissioning-gallery-4.webp" },
    { file: "turbine-erection-and-commissioning-gallery-5.webp" },
    { file: "turbine-erection-and-commissioning-gallery-6.webp" },
    { file: "turbine-erection-and-commissioning-gallery-7.webp" },
    { file: "turbine-erection-and-commissioning-gallery-8.webp" },
    { file: "turbine-erection-and-commissioning-gallery-9.webp" },
    { file: "turbine-erection-and-commissioning-gallery-10.webp" },
    { file: "turbine-erection-and-commissioning-gallery-11.webp" },
    { file: "turbine-erection-and-commissioning-gallery-12.webp" },
  ],
    keyStats: [
      { value: "10+", label: "OEM Makes Commissioned" },
      { value: "5kW–60MW", label: "Power Range Handled" },
      { value: "100%", label: "OEM-Spec Documentation" },
      { value: "24×7", label: "Site Support Available" },
    ],
    whyUs:
      "A single clearance set wrong during erection can destroy a bearing within hours of first steam. Our ex-OEM field engineers have personally commissioned the same machine types you're installing, and they know exactly what the OEM specification means in practice, not just on paper.",
    overview:
      "Turbine erection and commissioning is the most critical phase of any power plant or industrial project. Errors during erection (incorrect alignment, improper clearances, wrong torques) compound into expensive failures within the first year of operation. Keshav Enterprises brings ex-OEM field engineers who have commissioned Triveni, Siemens, BHEL, Belliss, and Maxwatt turbines across power plants, sugar mills, paper mills, and process industries. Every hold point is witnessed, every clearance is recorded, and every safety system is proof-tested before steam is admitted. Our documentation package meets client, insurer, and OEM handover requirements.",
    procedures: [
      {
        step: "01",
        title: "Pre-Erection Engineering Review",
        iconName: "BookOpen",
        desc: "Detailed review of OEM erection manual, GA drawings, P&IDs, and civil foundation drawings. Identification of all hold points, witness points, and documentation requirements before first equipment lift. Erection sequence and critical path agreed with client project team.",
        image: "test-step-image.webp",
      },
      {
        step: "02",
        title: "Foundation & Baseplate Preparation",
        iconName: "Layers",
        desc: "Precision levelling and grouting of turbine baseplate to within 0.05 mm/m. Chock machining and installation. Foundation bolt tensioning to OEM-specified torques using calibrated hydraulic wrenches. Epoxy grout preparation, pouring, and cure monitoring with temperature logging.",
      },
      {
        step: "03",
        title: "Equipment Setting & Rough Alignment",
        iconName: "Target",
        desc: "Precision positioning of turbine casing, gearbox, and driven equipment on baseplates. Rough shaft alignment using dial gauges and laser equipment to within 0.1 mm before coupling fit. Soft foot check and correction at all machine feet before final alignment.",
      },
      {
        step: "04",
        title: "Internal Assembly & Clearance Setting",
        iconName: "Cog",
        desc: "Rotor drop measurement, gland clearance setting (radial and axial), labyrinth seal fit, thrust bearing installation, and journal bearing clearance setting. All clearances recorded against OEM specification in the site clearance register. Rotor end float measured and confirmed within OEM limits.",
      },
      {
        step: "05",
        title: "Piping & Auxiliary Systems Connection",
        iconName: "Activity",
        desc: "Steam inlet, exhaust, extraction, and drain piping connections with correct pipe support and spring hangers. Nozzle loads verified within OEM limits, with pipe strain eliminated before final connection. Lube oil, control oil, gland steam, and instrumentation piping completed and leak-tested.",
      },
      {
        step: "06",
        title: "Pre-Commissioning Checks & Flushing",
        iconName: "Droplets",
        desc: "Lube oil system flush to ISO 4406 cleanliness standard, confirmed by particle count. Control and trip system functional checks. Safety system proof tests performed and documented: over-speed trip, low oil pressure trip, high bearing temperature trip, emergency stop valve operation.",
      },
      {
        step: "07",
        title: "First Fire, Run-Up & Commissioning",
        iconName: "Zap",
        desc: "Controlled first start with listening test at slow roll. Speed run-up in defined stages with continuous vibration and bearing temperature monitoring. Governor response and dead-band testing. Over-speed trip test at 110% rated speed. Load acceptance testing and full-load operational handover with commissioning report.",
      },
    ],
    tools: [
      {
        name: "Laser Shaft Alignment",
        detail: "Pruftechnik Rotalign Pro / SKF TKSA series",
        iconName: "Target",
      },
      {
        name: "Vibration Analyser",
        detail: "Real-time FFT, 8-channel data acquisition",
        iconName: "Activity",
      },
      {
        name: "Precision Dial Gauges",
        detail: "0.001 mm resolution, CMM-grade",
        iconName: "Cog",
      },
      {
        name: "Hydraulic Torque Wrenches",
        detail: "Calibrated torque multipliers for foundation bolts",
        iconName: "Wrench",
      },
      {
        name: "Borescope",
        detail: "Rigid & flexible for internal inspection",
        iconName: "Search",
      },
      {
        name: "Thermocouple Loggers",
        detail: "Multi-point thermal survey during first run",
        iconName: "TrendingUp",
      },
      {
        name: "Ultrasonic Flow Meters",
        detail: "Pipeline commissioning flow verification",
        iconName: "Droplets",
      },
    ],
    standards: [
      {
        code: "ASME PTC 6",
        desc: "Steam Turbines Performance Test Code",
        body: "ASME",
      },
      {
        code: "ISO 10816 / 20816",
        desc: "Mechanical vibration limits for rotating machinery",
        body: "ISO",
      },
      {
        code: "API 670",
        desc: "Machinery protection: over-speed and vibration trips",
        body: "API",
      },
      {
        code: "API 686",
        desc: "Recommended practice for machinery installation",
        body: "API",
      },
      {
        code: "IS 3639",
        desc: "Foundation bolt and anchor standards",
        body: "BIS",
      },
      {
        code: "OEM Manuals",
        desc: "Triveni, Siemens, BHEL, Belliss, Maxwatt erection procedures",
        body: "OEM",
      },
    ],
  },
  srv_2: {
    tagline: "Turnkey Shutdown Planning to Zero-Defect Restart",
    accentColor: "#0891b2",
  images: [
    { file: "turnkey-overhauling-and-maintenance-gallery-1.webp" },
    { file: "turnkey-overhauling-and-maintenance-gallery-2.webp" },
    { file: "turnkey-overhauling-and-maintenance-gallery-3.webp" },
    { file: "turnkey-overhauling-and-maintenance-gallery-4.webp" },
    { file: "turnkey-overhauling-and-maintenance-gallery-5.webp" },
    { file: "turnkey-overhauling-and-maintenance-gallery-6.webp" },
    { file: "turnkey-overhauling-and-maintenance-gallery-7.webp" },
    { file: "turnkey-overhauling-and-maintenance-gallery-8.webp" },
    { file: "turnkey-overhauling-and-maintenance-gallery-9.webp" },
    { file: "turnkey-overhauling-and-maintenance-gallery-10.webp" },
    { file: "turnkey-overhauling-and-maintenance-gallery-11.webp" },
    { file: "turnkey-overhauling-and-maintenance-gallery-12.webp" },
  ],
    keyStats: [
      { value: "8+", label: "OEM Makes Overhauled" },
      { value: `${YEARS_IN_BUSINESS}+`, label: "Years Field Experience" },
      { value: "0.001mm", label: "Clearance Resolution" },
      { value: "24×7", label: "Emergency Response" },
    ],
    whyUs:
      "A poorly executed overhaul is worse than no overhaul: it introduces new clearance errors, contamination, and re-assembly faults. Our engineers were trained by the OEMs. They know what tolerances actually mean at operating temperature and speed, not just what they say in the manual.",
    overview:
      "Turbine overhauling is not a maintenance activity: it is a precision engineering intervention. Keshav Enterprises deploys ex-OEM engineers from Triveni, Siemens, BHEL, Belliss, Maxwatt, Man Turbo, KKK, and ABB to execute turnkey overhauls with the same discipline and documentation standards as the original manufacturer. Every overhaul begins 4–6 weeks before shutdown with scope finalisation, spares pre-inspection, and manpower mobilisation planning. Every component is measured before disassembly, during strip-down, and after reassembly. A written condition report, clearance register, and photographic record is produced for every overhaul, creating a baseline for the next outage.",
    procedures: [
      {
        step: "01",
        title: "Pre-Shutdown Planning & Scope Finalization",
        iconName: "BookOpen",
        desc: "Review of previous overhaul records, operational data, vibration history, and performance trends 4–6 weeks before shutdown. Definition of scope, critical spares list, consumables list, and manpower mobilisation plan. Pre-shutdown inspection of stocked spare parts with shortfall report issued to client.",
      },
      {
        step: "02",
        title: "Site Mobilization & Tooling Setup",
        iconName: "Wrench",
        desc: "Full overhaul tool kit deployed: hydraulic jacks, precision chain blocks, rotor handling slings, dedicated measurement instruments, lapping tools, and the complete overhaul documentation package. Tool condition checks and instrument calibration verification before work begins.",
      },
      {
        step: "03",
        title: "Disassembly & Initial Inspection",
        iconName: "Search",
        desc: "Controlled disassembly with all pre-disassembly measurements recorded: bearing clearances, shaft runout, gland clearances, coupling alignment, and rotor end float. Every component photographed. Condition noted against OEM specification before cleaning.",
      },
      {
        step: "04",
        title: "Component Inspection & Condition Reporting",
        iconName: "Activity",
        desc: "Visual, dimensional, and NDT inspection of rotor, blades, bearings, glands, casing, all valves, and coupling. Crack detection using dye penetrant or magnetic particle methods on critical components. Written condition report with specific recommendation for each component: replace, repair, or reuse with justification.",
      },
      {
        step: "05",
        title: "Component Repair & Spare Part Installation",
        iconName: "Cog",
        desc: "Babbitt re-metalling and precision machining of journal bearings, labyrinth seal replacement, blade inspection and selective replacement, journal polishing (Ra 0.4 μm), casing joint face lapping, gland packing replacement, and valve seat lapping to blue-match standard.",
      },
      {
        step: "06",
        title: "Reassembly & Clearance Setting",
        iconName: "Target",
        desc: "Precise reassembly with all clearances set and recorded against OEM specification: journal bearing clearances (diametral and axial), labyrinth seal radial and axial clearances, gland clearances, coupling alignment, and rotor end float. All readings entered in the clearance register and compared against previous overhaul baseline.",
      },
      {
        step: "07",
        title: "Recommissioning & Handover",
        iconName: "Zap",
        desc: "Post-overhaul lube oil system recommissioning flush to ISO 4406. Safety system proof test: over-speed trip, low oil pressure trip, emergency stop valve. Monitored start-up with vibration and bearing temperature trending. Written clearance for full load with complete overhaul documentation package handed to client.",
      },
    ],
    tools: [
      {
        name: "Precision Dial & Bore Gauges",
        detail: "0.001 mm resolution clearance measurement",
        iconName: "Target",
      },
      {
        name: "Laser Shaft Alignment",
        detail: "Final coupling alignment verification",
        iconName: "Activity",
      },
      {
        name: "Portable Balancing Machine",
        detail: "In-situ rotor trim balancing",
        iconName: "Cog",
      },
      {
        name: "Babbitt Casting Equipment",
        detail: "Centrifugal casting for bearing re-metalling",
        iconName: "Factory",
      },
      {
        name: "Surface Lapping Plates",
        detail: "All grades for valve seats and casing faces",
        iconName: "Layers",
      },
      {
        name: "Ultrasonic Thickness Gauge",
        detail: "Casing wall erosion measurement",
        iconName: "Search",
      },
      {
        name: "8-Channel Vibration Analyser",
        detail: "Real-time FFT during monitored restart",
        iconName: "TrendingUp",
      },
    ],
    standards: [
      {
        code: "API 614",
        desc: "Lubrication, shaft sealing, and oil-control systems",
        body: "API",
      },
      {
        code: "API 670",
        desc: "Vibration and over-speed protection systems",
        body: "API",
      },
      {
        code: "ISO 1940",
        desc: "Dynamic balancing quality grades for rotating components",
        body: "ISO",
      },
      {
        code: "ASME B31.1",
        desc: "Power piping for steam connections",
        body: "ASME",
      },
      {
        code: "ISO 9001",
        desc: "Quality management system for overhaul documentation",
        body: "ISO",
      },
      {
        code: "OEM Manuals",
        desc: "Triveni, Siemens, BHEL, Belliss, Man Turbo, KKK, ABB",
        body: "OEM",
      },
    ],
  },
  srv_3: {
    tagline: "3D Scanning to Production Drawing: Eliminating OEM Dependency",
    accentColor: "#7c3aed",
  images: [
    { file: "precision-reverse-engineering-gallery-1.webp" },
    { file: "precision-reverse-engineering-gallery-2.webp" },
    { file: "precision-reverse-engineering-gallery-3.webp" },
    { file: "precision-reverse-engineering-gallery-4.webp" },
    { file: "precision-reverse-engineering-gallery-5.webp" },
    { file: "precision-reverse-engineering-gallery-6.webp" },
    { file: "precision-reverse-engineering-gallery-7.webp" },
    { file: "precision-reverse-engineering-gallery-8.webp" },
    { file: "precision-reverse-engineering-gallery-9.webp" },
    { file: "precision-reverse-engineering-gallery-10.webp" },
    { file: "precision-reverse-engineering-gallery-11.webp" },
    { file: "precision-reverse-engineering-gallery-12.webp" },
  ],
    keyStats: [
      { value: "5kW–60MW", label: "Turbine Range Covered" },
      { value: "0.001mm", label: "CMM Measurement Resolution" },
      { value: "100%", label: "PMI Material Verified" },
      { value: "GD&T", label: "Full Tolerance Drawings" },
    ],
    whyUs:
      "When an OEM stops supporting a machine, a simple worn rotor or broken diaphragm can force a plant shutdown for months. Our reverse engineering process recreates the exact material, geometry, and heat treatment specification, with full manufacturing drawings, so any competent machine shop can manufacture the part.",
    overview:
      "When OEM drawings are unavailable, the OEM is no longer active, or lead times are measured in years, Keshav Enterprises can reverse-engineer any turbine component from 5 kW to 60 MW to a full production-ready drawing set. Our process uses 3D laser scanners, CMM coordinate measuring machines, and XRF PMI material identification (the same tools used by major OEM engineering teams) to generate complete manufacturing drawings with all tolerances, surface finishes, heat treatment sequences, and material specifications. We have successfully reverse-engineered rotors, diaphragms, nozzle blocks, labyrinth seals, bearings, governors, and steam path components for Triveni, Siemens, BHEL, DLF-Skoda, Belliss, and Maxwatt turbines.",
    procedures: [
      {
        step: "01",
        title: "Component Receipt & Initial Assessment",
        iconName: "Search",
        desc: "Safe receipt of the worn or original reference component. Initial visual inspection, cleaning, and comprehensive photography. Assessment of damage, wear zones, and critical measurement surfaces to determine the optimal measurement strategy and datum scheme before any measurement begins.",
      },
      {
        step: "02",
        title: "PMI Material Identification",
        iconName: "Shield",
        desc: "Positive Material Identification using XRF (X-ray fluorescence) analyser on multiple locations to identify exact alloy composition. Hardness testing (Rockwell, Brinell, Vickers) to determine heat treatment condition. Material grade confirmed and matched to nearest current standard before measurement begins, with no guessing on alloy.",
      },
      {
        step: "03",
        title: "3D Laser Scanning & CMM Measurement",
        iconName: "Hexagon",
        desc: "Full 3D scan of component exterior using portable laser scanner: point cloud accuracy to 0.05 mm. Critical internal dimensions and tolerances (bore, keyway, spline, thread form, pitch, and lead) measured on CMM with 0.001 mm resolution. Datum scheme established from functional bearing surfaces.",
      },
      {
        step: "04",
        title: "Engineering Drawing Generation",
        iconName: "BookOpen",
        desc: "CAD model developed from scan data and CMM measurements. Full 2D manufacturing drawing produced with: all linear and angular dimensions, GD&T tolerances (concentricity, cylindricity, parallelism, roundness, runout), surface finish callouts (Ra values in μm), thread form and class standards, and a complete datum reference frame.",
      },
      {
        step: "05",
        title: "Heat Treatment & Surface Treatment Specification",
        iconName: "Zap",
        desc: "Full machining sequence defined: pre-machining stress relief, rough machining, normalising or hardening, pre-final and final machining stages. Heat treatment conditions specified with temperature (°C), soak time, quench medium, and target hardness. Surface treatment specs: nitriding depth, case hardness, carburising, or hard chrome plating as required.",
      },
      {
        step: "06",
        title: "Material Procurement & Manufacturing",
        iconName: "Factory",
        desc: "Material procured against PMI-identified specification with EN 10204 Type 3.1 mill certificate. CNC machining executed through each defined stage with in-process dimensional inspection at each stage. All inspection data recorded in a manufacturing data pack.",
      },
      {
        step: "07",
        title: "Final Inspection & Delivery",
        iconName: "CheckCircle2",
        desc: "Complete dimensional inspection report against the engineering drawing. PMI re-verification on the finished component confirms correct alloy was used throughout. Surface finish measurement. Hardness testing on critical surfaces. Full traceability documentation pack supplied with every component.",
      },
    ],
    tools: [
      {
        name: "3D Laser Scanner",
        detail: "Faro Focus / Creaform HandySCAN: 0.05 mm accuracy",
        iconName: "Hexagon",
      },
      {
        name: "CMM: Coordinate Measuring Machine",
        detail: "Bridge type & portable arm, 0.001 mm resolution",
        iconName: "Target",
      },
      {
        name: "XRF PMI Analyser",
        detail: "Olympus Vanta: alloy identification on-site",
        iconName: "Search",
      },
      {
        name: "Hardness Tester",
        detail: "Rockwell, Brinell, Vickers: heat treatment verification",
        iconName: "Shield",
      },
      {
        name: "Profilometer",
        detail: "Surface roughness tester: Ra 0.001 μm resolution",
        iconName: "Activity",
      },
      {
        name: "Copying Lathe",
        detail: "Digital readout for rotational component replication",
        iconName: "Cog",
      },
      {
        name: "CAD Software",
        detail: "SolidWorks / AutoCAD: GD&T drawing generation",
        iconName: "BookOpen",
      },
    ],
    standards: [
      {
        code: "ISO 1101",
        desc: "Geometrical tolerancing (GD&T) for drawings",
        body: "ISO",
      },
      {
        code: "ISO 286",
        desc: "Limits and fits system for shafts and bores",
        body: "ISO",
      },
      {
        code: "ISO 1302",
        desc: "Surface texture indication on engineering drawings",
        body: "ISO",
      },
      {
        code: "EN 10204",
        desc: "Material traceability certificates (Type 3.1)",
        body: "EN",
      },
      {
        code: "ASTM E1417",
        desc: "PMI and NDT testing standards",
        body: "ASTM",
      },
      {
        code: "OEM Specification",
        desc: "Matched to original OEM material and tolerance intent",
        body: "OEM",
      },
    ],
  },
  srv_4: {
    tagline: "ISO-Grade Balancing: Because Rotor Forces Grow With the Square of Speed",
    accentColor: "#d97706",
  images: [
    { file: "dynamic-balancing-and-rotor-machining-gallery-1.webp" },
    { file: "dynamic-balancing-and-rotor-machining-gallery-2.webp" },
    { file: "dynamic-balancing-and-rotor-machining-gallery-3.webp" },
    { file: "dynamic-balancing-and-rotor-machining-gallery-4.webp" },
    { file: "dynamic-balancing-and-rotor-machining-gallery-5.webp" },
    { file: "dynamic-balancing-and-rotor-machining-gallery-6.webp" },
    { file: "dynamic-balancing-and-rotor-machining-gallery-7.webp" },
    { file: "dynamic-balancing-and-rotor-machining-gallery-8.webp" },
    { file: "dynamic-balancing-and-rotor-machining-gallery-9.webp" },
    { file: "dynamic-balancing-and-rotor-machining-gallery-10.webp" },
    { file: "dynamic-balancing-and-rotor-machining-gallery-11.webp" },
    { file: "dynamic-balancing-and-rotor-machining-gallery-12.webp" },
  ],
    keyStats: [
      { value: "50–2000kg", label: "Rotor Capacity" },
      { value: "G1.0", label: "Balance Grade Achievable" },
      { value: "0.001mm", label: "Dial Gauge Resolution" },
      { value: "ISO/API", label: "Certified Standards" },
    ],
    whyUs:
      "A rotor at 3,000 RPM generates 100× more imbalance force than at 300 RPM. The same residual imbalance that is invisible at slow speed will destroy a bearing at full speed. We balance to ISO 1940 Grade G1.0 where required, not just 'good enough'.",
    overview:
      "Rotor imbalance is one of the most common and most preventable causes of turbine bearing failure, seal damage, and shortened rotor life. Keshav Enterprises performs precision journal machining and ISO 1940 / API 670 dynamic balancing for rotors from 50 kg to 2,000 kg at our dedicated workshop facility. The rotor is first machined to restore geometric integrity (round journals, concentric labyrinth lands, correct surface finish) before balancing. This sequence matters: balancing a geometrically distorted rotor merely masks the problem. Our balancing reports document initial unbalance, correction planes, mass corrections, residual unbalance, and the ISO balance grade achieved, providing full traceability for your maintenance records.",
    procedures: [
      {
        step: "01",
        title: "Rotor Receipt & Initial Measurement",
        iconName: "Search",
        desc: "Rotor received and cleaned. Initial mechanical runout measured using precision dial gauges at all journals, coupling fits, and labyrinth lands on a precision static stand. Electrical runout checked. All diameters measured and recorded versus OEM specification: out-of-round, taper, and journal undersizing documented.",
      },
      {
        step: "02",
        title: "Journal Condition Assessment",
        iconName: "Activity",
        desc: "Surface finish measured using profilometer at 3 positions around each journal circumference. Visual inspection for scoring, Babbitt transfer, corrosion pitting, and wear patterns. Hardness checked. Minimum material removal calculated to restore geometry and finish within OEM limits.",
      },
      {
        step: "03",
        title: "Journal Grinding & Polishing",
        iconName: "Cog",
        desc: "Precision cylindrical grinding of journals on CNC grinding machine: roundness restored to 0.005 mm max, taper to 0.005 mm per 100 mm max. Ground surface polished to Ra 0.4 μm (OEM bearing surface specification) using precision polishing lathe. Absolute minimum material removed to preserve shaft life.",
      },
      {
        step: "04",
        title: "Labyrinth & Gland Portion Machining",
        iconName: "Hexagon",
        desc: "Re-machining of labyrinth seal lands, gland areas, balance disc faces, and coupling fits on precision CNC lathes. All surfaces set concentric to journal datum before machining using a 4-jaw chuck and dial gauge zeroing, essential to maintain rotor geometric integrity and avoid introducing new runout.",
      },
      {
        step: "05",
        title: "Dynamic Balancing: Two-Plane Correction",
        iconName: "Target",
        desc: "Rotor mounted in hard-bearing dynamic balancing machine. Initial unbalance measured simultaneously in two correction planes (coupling end and governor/impeller end). Trial masses applied and removed. Balancing iterations repeated until residual unbalance in each plane meets ISO 1940 / API 670 grade specified for this rotor service.",
      },
      {
        step: "06",
        title: "Post-Balance Runout Check",
        iconName: "TrendingUp",
        desc: "Mechanical and electrical runout re-measured post-balancing at all journal positions. Comparison against pre-balance baseline confirms improvement from machining and balancing. Any residual runout exceeding OEM limits is investigated: if caused by bent shaft, straightening or replacement is recommended.",
      },
      {
        step: "07",
        title: "Documentation & Dispatch",
        iconName: "BookOpen",
        desc: "Complete balancing report issued: initial unbalance (g·mm), correction plane locations, correction masses applied, final residual unbalance in each plane, balance grade achieved (G1.0, G2.5, G6.3), and all runout measurements. PMI certificate and hardness test results attached. Rotor packed and dispatched with documentation.",
      },
    ],
    tools: [
      {
        name: "Hard-Bearing Balancing Machine",
        detail: "50–2,000 kg, 100–10,000 RPM capacity",
        iconName: "Activity",
      },
      {
        name: "CNC Cylindrical Grinding Machine",
        detail: "Precision dressing system, 0.001 mm control",
        iconName: "Cog",
      },
      {
        name: "Precision Polishing Lathe",
        detail: "Microfinish to Ra 0.4 μm journal surface",
        iconName: "Hexagon",
      },
      {
        name: "Profilometer",
        detail: "Surface roughness: Ra 0.001 μm resolution",
        iconName: "TrendingUp",
      },
      {
        name: "Precision Dial Gauges",
        detail: "0.001 mm: runout and diameter measurement",
        iconName: "Target",
      },
      {
        name: "Portable Balancing Analyser",
        detail: "In-situ field balancing capability",
        iconName: "Search",
      },
      {
        name: "Digital Stroboscope",
        detail: "Phase angle measurement for balancing corrections",
        iconName: "Zap",
      },
    ],
    standards: [
      {
        code: "ISO 1940-1",
        desc: "Balance quality requirements for rigid rotors",
        body: "ISO",
      },
      {
        code: "ISO 21940",
        desc: "Mechanical vibration: rotor balancing vocabulary and procedures",
        body: "ISO",
      },
      {
        code: "API 670",
        desc: "Vibration, axial-position, and bearing temperature monitoring",
        body: "API",
      },
      {
        code: "API 612",
        desc: "Special-purpose steam turbines: balancing requirements",
        body: "API",
      },
      {
        code: "ISO 1101",
        desc: "Geometrical tolerancing applied to machining drawings",
        body: "ISO",
      },
      {
        code: "OEM Specification",
        desc: "Triveni, Siemens, BHEL, Man Turbo, KKK balance grades",
        body: "OEM",
      },
    ],
  },
  srv_5: {
    tagline: "ISO 4406 Cleanliness Class 16/14/11: Certified Before Oil-In",
    accentColor: "#0284c7",
  images: [
    { file: "lube-oil-flushing-gallery-1.webp" },
    { file: "lube-oil-flushing-gallery-2.webp" },
    { file: "lube-oil-flushing-gallery-3.webp" },
    { file: "lube-oil-flushing-gallery-4.webp" },
    { file: "lube-oil-flushing-gallery-5.webp" },
    { file: "lube-oil-flushing-gallery-6.webp" },
    { file: "lube-oil-flushing-gallery-7.webp" },
    { file: "lube-oil-flushing-gallery-8.webp" },
    { file: "lube-oil-flushing-gallery-9.webp" },
    { file: "lube-oil-flushing-gallery-10.webp" },
    { file: "lube-oil-flushing-gallery-11.webp" },
    { file: "lube-oil-flushing-gallery-12.webp" },
  ],
    keyStats: [
      { value: "16/14/11", label: "ISO 4406 Target Class" },
      { value: "6,000 L/min", label: "Max System Flow Rate" },
      { value: "3μm", label: "Final Filtration Rating" },
      { value: "100%", label: "Lab-Certified Particle Count" },
    ],
    whyUs:
      "New and recently overhauled turbines are destroyed by construction debris (weld slag, pipe scale, sand, and metal swarf) within hours of first startup. Oil flushing is not optional: it is the single most cost-effective insurance against a catastrophic bearing failure on a brand-new overhaul.",
    overview:
      "Lube oil system contamination is the primary cause of bearing failures in new and recently overhauled turbines. Construction debris entering the lube oil system during installation or overhaul can destroy bearings and journal surfaces within hours of startup. Keshav Enterprises performs professional lube oil flushing using purpose-built mobile centrifuge filter systems to achieve ISO 4406:99 cleanliness class 16/14/11 (the minimum standard for steam turbine bearing lubrication). Our process is fully documented: oil sample results at every stage, progressive filter upgrade records, and a final laboratory-certified particle count certificate are provided before the system is handed back for oil-in.",
    procedures: [
      {
        step: "01",
        title: "System Survey & Flushing Plan",
        iconName: "Search",
        desc: "Review of system P&ID, oil volume, pipe bore sizes, heat exchanger configuration, and bearing housing layout. Development of flushing flow path using hydraulic calculations to achieve turbulent flow (Reynolds number above 4,000) in every pipe section. Temporary bypass spools and blind flanges identified and designed where required.",
      },
      {
        step: "02",
        title: "Temporary Flushing Circuit Installation",
        iconName: "Wrench",
        desc: "Installation of temporary bypass pipework around bearings, control valves, instrumentation, and other sensitive equipment that must not see flush debris. Connection of mobile flushing unit. Installation of temporary wire mesh target strainers at flush return points for debris monitoring.",
      },
      {
        step: "03",
        title: "Initial Flush: High Flow Rate",
        iconName: "Droplets",
        desc: "System charged with flushing oil (or process oil if compatible). Flushing pump operated at maximum achievable flow rate for maximum turbulence. Oil temperature thermally cycled between 30°C and 70°C at 30-minute intervals, because thermal cycling stresses pipe walls and dislodges adhered scale and debris. Target strainers inspected and cleaned at each interval.",
      },
      {
        step: "04",
        title: "Contamination Monitoring & Particle Count",
        iconName: "Activity",
        desc: "Oil samples drawn per ISO 4021 clean sample extraction procedure at each stage. Particle count measured using automatic particle counter per ISO 11500, reporting counts at ≥4μm, ≥6μm, ≥14μm, and ≥21μm. Results plotted on a cleanliness progress chart against the ISO 4406 target class.",
      },
      {
        step: "05",
        title: "Progressive Filter Upgrade",
        iconName: "Layers",
        desc: "As gross contamination is removed, filter element micron rating progressively reduced through stages: 25μm → 10μm → 6μm → 3μm absolute. Centrifuge de-watering unit operated continuously throughout flushing to remove free and emulsified water. Karl Fischer water content tested to confirm de-watering effectiveness.",
      },
      {
        step: "06",
        title: "Final Acceptance Particle Count",
        iconName: "CheckCircle2",
        desc: "Minimum three consecutive clean oil samples drawn at intervals must all achieve the target ISO 4406 class 16/14/11. Final samples submitted to accredited laboratory for independent verification. Written certificate of oil cleanliness (signed, stamped, and traceable to the laboratory) issued to client.",
      },
      {
        step: "07",
        title: "System Restoration & Oil Fill",
        iconName: "Zap",
        desc: "All temporary bypass spools and blind flanges removed. All bearings, sensitive instruments, and critical equipment reconnected. System refilled with filtered, new process oil passed through a 3μm absolute filter during filling. Final particle count on system oil after fill confirms target maintained. System handed over for startup.",
      },
    ],
    tools: [
      {
        name: "Mobile Centrifuge Filter Unit",
        detail: "Up to 6,000 L/min system flow rates",
        iconName: "Droplets",
      },
      {
        name: "Automatic Particle Counter",
        detail: "ISO 11500 compliant: online real-time monitoring",
        iconName: "Activity",
      },
      {
        name: "Karl Fischer Titrator",
        detail: "Free water content measurement in lube oil",
        iconName: "Layers",
      },
      {
        name: "Oil Sampling Kit",
        detail: "ISO 4021 clean extraction from pressurised lines",
        iconName: "Search",
      },
      {
        name: "Oil Heater",
        detail: "Thermal cycling: 30°C to 70°C for debris dislodging",
        iconName: "Zap",
      },
      {
        name: "Target Strainer Set",
        detail: "25, 10, 3μm mesh for stage debris monitoring",
        iconName: "Filter",
      },
      {
        name: "Bypass Spool Set",
        detail: "Custom fabricated bypass spools and blind flanges",
        iconName: "Wrench",
      },
    ],
    standards: [
      {
        code: "ISO 4406:99",
        desc: "Hydraulic fluid cleanliness classification: target 16/14/11",
        body: "ISO",
      },
      {
        code: "ISO 11500",
        desc: "Particle count determination using automatic methods",
        body: "ISO",
      },
      {
        code: "ISO 4021",
        desc: "Hydraulic fluid contamination analysis and sampling",
        body: "ISO",
      },
      {
        code: "API 614",
        desc: "Lubrication, shaft sealing, and oil-control systems",
        body: "API",
      },
      {
        code: "ASTM D6304",
        desc: "Karl Fischer water content measurement in lubricating oils",
        body: "ASTM",
      },
      {
        code: "OEM Specification",
        desc: "Triveni, Siemens, BHEL, Man Turbo lube oil cleanliness requirements",
        body: "OEM",
      },
    ],
  },
  srv_6: {
    tagline: "Laser-Precision Alignment: Eliminating the #1 Cause of Bearing Failure",
    accentColor: "#059669",
  images: [
    { file: "machine-alignment-gallery-1.webp" },
    { file: "machine-alignment-gallery-2.webp" },
    { file: "machine-alignment-gallery-3.webp" },
    { file: "machine-alignment-gallery-4.webp" },
    { file: "machine-alignment-gallery-5.webp" },
    { file: "machine-alignment-gallery-6.webp" },
    { file: "machine-alignment-gallery-7.webp" },
    { file: "machine-alignment-gallery-8.webp" },
    { file: "machine-alignment-gallery-9.webp" },
    { file: "machine-alignment-gallery-10.webp" },
    { file: "machine-alignment-gallery-11.webp" },
    { file: "machine-alignment-gallery-12.webp" },
  ],
    keyStats: [
      { value: "0.05mm", label: "Alignment Tolerance Achieved" },
      { value: "50%", label: "Bearing Failures From Misalignment" },
      { value: "80%", label: "Bearing Life Lost at 0.05mm Offset" },
      { value: "Any Size", label: "Machine Frame Covered" },
    ],
    whyUs:
      "Misalignment as small as 0.05 mm at the coupling can reduce bearing life by 80% and generate forces that propagate through seals, couplings, and the entire drivetrain. Laser alignment takes hours. A bearing failure takes weeks and costs far more. We align hot, not just cold.",
    overview:
      "Shaft misalignment is responsible for up to 50% of all rotating equipment bearing failures in Indian industry. Even misalignments invisible to the naked eye generate enormous cyclic forces on bearings, seals, and couplings at operating speed. Keshav Enterprises performs precision laser shaft alignment using Pruftechnik and SKF systems for turbines, gearboxes, pumps, fans, alternators, and induction generators of any frame size. Critically, we calculate and apply hot alignment offsets: the cold alignment is deliberately set to account for thermal growth, so the machine runs straight at operating temperature. Our alignment reports show before/after readings, shim history, and final values against OEM tolerance.",
    procedures: [
      {
        step: "01",
        title: "Pre-Alignment Checks",
        iconName: "Search",
        desc: "Verification of soft foot condition (machine frame distortion when bolts are tightened) using precision dial gauges at all feet: 0.05 mm or less required before alignment proceeds. Pipe strain measurement to identify forces imposed on machine nozzles by connected pipework. Bearing clearance check and thermal growth calculation from OEM data or site measurements.",
      },
      {
        step: "02",
        title: "Laser Alignment System Setup",
        iconName: "Target",
        desc: "Mounting of laser transmitter and receiver heads on shafts using precision magnetic brackets. System zeroed and shaft rotation tolerance verified. All relevant dimensions entered into alignment software: coupling diameter, hub-to-hub shaft separation, and measurement distance. Bracket sag compensation verified and applied.",
      },
      {
        step: "03",
        title: "Initial Misalignment Measurement",
        iconName: "Activity",
        desc: "Shafts rotated through the measurement arc (three positions: 12, 3, and 9 o'clock). Software calculates actual misalignment: angular misalignment (mrad) and offset (mm) at the coupling face, and the required correction at each machine foot in the vertical and horizontal planes simultaneously.",
      },
      {
        step: "04",
        title: "Shim & Jackscrew Correction",
        iconName: "Layers",
        desc: "Calculated shim corrections applied to the stationary machine feet. Stainless steel precision shims installed or removed in the correct configuration to correct vertical misalignment. Horizontal correction made using alignment jackscrews at machine feet with the laser still active for real-time feedback during correction.",
      },
      {
        step: "05",
        title: "Hot Alignment Compensation",
        iconName: "Zap",
        desc: "Thermal growth of machine casing from cold to operating temperature calculated from OEM thermal growth data or measured using DBSE (distance between shaft ends) monitoring and thermal imaging. Cold alignment target deliberately offset so the machine achieves the correct hot running alignment at full load and temperature.",
      },
      {
        step: "06",
        title: "Final Measurement & Tolerance Verification",
        iconName: "CheckCircle2",
        desc: "Final laser measurement confirms alignment within OEM tolerance, typically: angular misalignment 0.05 mrad max, offset 0.05 mm max at coupling. All four feet re-checked for soft foot 0.05 mm or less. Coupling bolts torqued to OEM specification using calibrated digital torque wrench.",
      },
      {
        step: "07",
        title: "Alignment Report & Bolt Torque",
        iconName: "BookOpen",
        desc: "Detailed alignment report generated by the laser system software: pre-alignment readings, shim changes at each foot, correction vectors applied, and final achieved values against OEM tolerance. Foundation bolt torques recorded. Report signed and issued, forming part of the maintenance record baseline for future alignments.",
      },
    ],
    tools: [
      {
        name: "Pruftechnik Rotalign Pro",
        detail: "OPTALIGN series: wireless laser alignment",
        iconName: "Target",
      },
      {
        name: "SKF TKSA 71",
        detail: "Wireless laser alignment with app-based reporting",
        iconName: "Activity",
      },
      {
        name: "Precision Dial Gauges",
        detail: "Soft foot measurement: 0.001 mm resolution",
        iconName: "Cog",
      },
      {
        name: "SS Precision Shim Sets",
        detail: "0.025 to 3.0 mm in 0.025 mm increments",
        iconName: "Layers",
      },
      {
        name: "Digital Torque Wrenches",
        detail: "Coupling and foundation bolt torquing",
        iconName: "Wrench",
      },
      {
        name: "Vibration Analyser",
        detail: "Pre and post alignment vibration comparison",
        iconName: "TrendingUp",
      },
      {
        name: "Thermal Imaging Camera",
        detail: "Hot bearing and coupling temperature survey",
        iconName: "Zap",
      },
    ],
    standards: [
      {
        code: "ISO 10816-3 / 20816-3",
        desc: "Vibration severity evaluation for machines >15 kW",
        body: "ISO",
      },
      {
        code: "API 686",
        desc: "Recommended practice for machinery installation and alignment",
        body: "API",
      },
      {
        code: "ASME B31.3",
        desc: "Process piping nozzle load limits at machine connections",
        body: "ASME",
      },
      {
        code: "ISO 1940",
        desc: "Residual imbalance limits post-alignment correction",
        body: "ISO",
      },
      {
        code: "API 612",
        desc: "Special-purpose steam turbines: alignment requirements",
        body: "API",
      },
      {
        code: "OEM Tolerance",
        desc: "Triveni, Siemens, BHEL, Belliss, Man Turbo, KKK alignment specs",
        body: "OEM",
      },
    ],
  },
  srv_7: {
    tagline: "Root Cause Found. Corrective Action Deployed. Turbine Back Online.",
    accentColor: "#dc2626",
  images: [
    { file: "troubleshooting-service-gallery-1.webp" },
    { file: "troubleshooting-service-gallery-2.webp" },
    { file: "troubleshooting-service-gallery-3.webp" },
    { file: "troubleshooting-service-gallery-4.webp" },
    { file: "troubleshooting-service-gallery-5.webp" },
    { file: "troubleshooting-service-gallery-6.webp" },
    { file: "troubleshooting-service-gallery-7.webp" },
    { file: "troubleshooting-service-gallery-8.webp" },
    { file: "troubleshooting-service-gallery-9.webp" },
    { file: "troubleshooting-service-gallery-10.webp" },
    { file: "troubleshooting-service-gallery-11.webp" },
    { file: "troubleshooting-service-gallery-12.webp" },
  ],
    keyStats: [
      { value: "24×7", label: "Emergency Deployment" },
      { value: "10+", label: "OEM Makes Diagnosed" },
      { value: "FFT+Thermal", label: "Dual Diagnostic Method" },
      { value: "48hr", label: "Post-Repair Trend Monitoring" },
    ],
    whyUs:
      "A misdiagnosed fault repaired without finding its root cause will fail again, often sooner than the first time. We do not guess. We measure, analyse the spectrum, strip only what the data tells us to strip, confirm the root cause physically, and fix it with the same team that found it.",
    overview:
      "Unplanned turbine trips and unexplained performance degradation cost industrial plants millions in lost production every year. Keshav Enterprises deploys ex-OEM troubleshooting engineers with full diagnostic instrumentation to identify, document, and rectify the precise root cause of any steam turbine fault, from high vibration and bearing failure to governor instability, oil contamination, and steam leakage. We cover all turbine makes from 5 kW to 60 MW across the full spectrum of India's process and power industries. Our methodology is systematic: online measurement first, physical inspection targeted by the data, root cause confirmed in writing, and corrective action executed by the same team that diagnosed the fault.",
    procedures: [
      {
        step: "01",
        title: "Emergency Mobilisation & Site Data Collection",
        iconName: "Zap",
        desc: "24×7 response deployment to site with full diagnostic kit. Collection of all available operational data: vibration history, DCS trip logs, oil analysis reports, bearing temperature trends, steam condition logs, and maintenance records. Interview of operations and maintenance personnel who witnessed the fault event.",
      },
      {
        step: "02",
        title: "Baseline Vibration & Performance Measurement",
        iconName: "Activity",
        desc: "Online vibration measurement at all bearing housings: overall vibration level (mm/s RMS), real-time FFT spectrum analysis, 1X and 2X amplitude and phase angle, sub-synchronous and high-frequency components. Steam inlet/exhaust pressure, temperature, and flow benchmarked against design duty. Bearing temperatures mapped using thermal imaging camera.",
      },
      {
        step: "03",
        title: "Fault Signature Identification & Hypothesis",
        iconName: "Search",
        desc: "Analysis of vibration spectrum, phase data, bearing temperature map, and oil sample results to build the fault signature. Each potential root cause systematically mapped against measured evidence: imbalance (dominant 1X), misalignment (dominant 2X), bearing wear (sub-synchronous or bearing defect frequencies), rub (sub-harmonics, high 1X), looseness (multiple harmonics), or steam path fouling (thermal bow).",
      },
      {
        step: "04",
        title: "Targeted Strip-Down & Physical Inspection",
        iconName: "Wrench",
        desc: "Minimum-invasive disassembly targeting only the suspected fault zone, not a full strip unless data demands it. Physical measurement of bearing clearances, shaft runout, coupling alignment, gland seal clearances, and labyrinth seal fits compared against OEM specification. All findings photographed and dimensionally documented.",
      },
      {
        step: "05",
        title: "Root Cause Confirmation & Written RCA Report",
        iconName: "BookOpen",
        desc: "Formal root cause analysis (RCA) report combining on-machine data, strip-down measurements, and OEM specification comparison. Root cause classified and confirmed in writing. Contributing factors identified. Corrective action plan with priority ranking, parts required, estimated downtime, and recommended preventive measures issued to client before work begins.",
      },
      {
        step: "06",
        title: "Corrective Action Execution",
        iconName: "Cog",
        desc: "Direct execution of the corrective action by the same troubleshooting team: rotor re-balancing, bearing replacement and clearance setting, laser alignment correction, gland seal and labyrinth packing replacement, lube oil system flush to ISO 4406, governor overhaul and calibration, or control system calibration. All corrective work documented against OEM specification.",
      },
      {
        step: "07",
        title: "Post-Repair Commissioning & 48-Hour Trend Monitoring",
        iconName: "TrendingUp",
        desc: "Monitored restart with continuous vibration and bearing temperature data logging during speed run-up. Post-repair vibration levels compared against pre-fault baseline and OEM acceptance limits (ISO 10816-3). 48-hour continuous trend monitoring at full load before written clearance report issued and turbine returned to unattended operation.",
      },
    ],
    tools: [
      {
        name: "Multi-Channel Vibration Analyser",
        detail: "Real-time FFT: CSI 2140 / SKF Microlog class",
        iconName: "Activity",
      },
      {
        name: "Proximity Probes",
        detail: "Eddy current shaft vibration: API 670 standard",
        iconName: "TrendingUp",
      },
      {
        name: "Thermal Imaging Camera",
        detail: "FLIR / Testo: bearing and steam path thermal survey",
        iconName: "Zap",
      },
      {
        name: "Stroboscope + Phase Reference",
        detail: "1X amplitude and phase angle measurement",
        iconName: "Search",
      },
      {
        name: "Portable Oil Particle Counter",
        detail: "ISO 11500: lube oil contamination on-site",
        iconName: "Droplets",
      },
      {
        name: "Borescope",
        detail: "Rigid & flexible: blade inspection without full strip",
        iconName: "Hexagon",
      },
      {
        name: "XRF PMI Analyser",
        detail: "Alloy identification of failed components",
        iconName: "Shield",
      },
      {
        name: "Laser Shaft Alignment System",
        detail: "Coupling and bearing alignment confirmation",
        iconName: "Target",
      },
      {
        name: "Karl Fischer Titrator",
        detail: "Free water content in lube oil: contamination check",
        iconName: "Layers",
      },
      {
        name: "Governor Calibration Equipment",
        detail: "Speed reference and control system instruments",
        iconName: "Cog",
      },
    ],
    standards: [
      {
        code: "ISO 10816-3 / 20816-3",
        desc: "Vibration severity limits for industrial machines >15 kW",
        body: "ISO",
      },
      {
        code: "API 670",
        desc: "Machinery protection: vibration, axial position, temperature",
        body: "API",
      },
      {
        code: "API 612",
        desc: "Special-purpose steam turbines for petroleum and chemical service",
        body: "API",
      },
      {
        code: "ISO 4406:99",
        desc: "Lube oil cleanliness classification",
        body: "ISO",
      },
      {
        code: "ASME PTC 6",
        desc: "Steam turbine performance test code for efficiency benchmarking",
        body: "ASME",
      },
      {
        code: "ISO 14224",
        desc: "Reliability and maintenance data collection for equipment",
        body: "ISO",
      },
      {
        code: "OEM Manuals",
        desc: "Triveni, Siemens, BHEL, Belliss, Man Turbo, KKK, ABB",
        body: "OEM",
      },
    ],
    faultMatrix: [
      {
        symptom: "High vibration: 1X dominant",
        causes: [
          "Rotor imbalance (residual or deposit-induced)",
          "Rotor bow (thermal or mechanical)",
          "Excessive bearing clearance",
        ],
        action: "Dynamic balancing, rotor inspection, bearing replacement",
      },
      {
        symptom: "High vibration: 2X dominant",
        causes: [
          "Shaft misalignment (angular or offset)",
          "Coupling fault",
          "Casing distortion / pipe strain",
        ],
        action: "Laser alignment, coupling inspection, pipe strain measurement",
      },
      {
        symptom: "Sub-synchronous vibration",
        causes: [
          "Oil whirl / oil whip in journal bearings",
          "Rub-induced instability",
          "Loose bearing fit",
        ],
        action:
          "Bearing clearance reset, lube oil pressure/viscosity check, rub clearance inspection",
      },
      {
        symptom: "High-frequency vibration (>3X)",
        causes: [
          "Blade fouling or erosion",
          "Looseness in foundation or bearing cap",
          "Gear mesh fault (gearbox)",
        ],
        action: "Blade inspection (borescope), bearing cap torque check, gearbox inspection",
      },
      {
        symptom: "Bearing oil contamination / water in oil",
        causes: [
          "Carbon ring gland seal wear",
          "Gland steam pressure too high",
          "Condensate ingress via exhaust",
        ],
        action: "Carbon ring replacement, gland steam pressure reset, lube oil system flush",
      },
      {
        symptom: "Steam gland leakage",
        causes: [
          "Labyrinth seal wear (excessive clearance)",
          "Gland packing worn or damaged",
          "Gland steam pressure incorrectly set",
        ],
        action:
          "Labyrinth seal replacement, gland packing replacement, gland steam controller calibration",
      },
      {
        symptom: "Governor hunting / speed instability",
        causes: [
          "Governor linkage wear or sticktion",
          "Dirty oil / sludge in PG-PL governor",
          "Compensation needle valve maladjustment",
        ],
        action:
          "Governor linkage overhaul, governor oil flush and refill, needle valve re-calibration",
      },
      {
        symptom: "Low lube oil pressure trip",
        causes: [
          "Oil pump wear",
          "Oil cooler fouling / high oil temperature",
          "Pressure relief valve stuck open",
          "Low oil level or cavitation",
        ],
        action: "Oil pump inspection, cooler cleaning, PRV inspection, oil level and system check",
      },
      {
        symptom: "Overspeed trip: spurious or actual",
        causes: [
          "Trip pin wear or incorrect setting",
          "Governor valve passing steam",
          "Actuator or control oil fault",
        ],
        action:
          "Trip pin inspection and re-setting, governor valve seat inspection, control system check",
      },
      {
        symptom: "Power output / efficiency loss",
        causes: [
          "Blade fouling (steam purity / attemperating water contamination)",
          "Seal strip wear (increased steam bypass)",
          "Nozzle erosion or blockage",
        ],
        action: "Borescope inspection, seal strip replacement, nozzle inspection and cleaning",
      },
    ],
  },
  srv_8: {
    tagline: "Precision Abrasive Blasting: Clean Metal Without Compromising Critical Tolerances",
    accentColor: "#ea580c",
  images: [
    { file: "sand-blasting-and-surface-preparation-gallery-1.webp" },
    { file: "sand-blasting-and-surface-preparation-gallery-2.webp" },
    { file: "sand-blasting-and-surface-preparation-gallery-3.webp" },
    { file: "sand-blasting-and-surface-preparation-gallery-4.webp" },
    { file: "sand-blasting-and-surface-preparation-gallery-5.webp" },
    { file: "sand-blasting-and-surface-preparation-gallery-6.webp" },
    { file: "sand-blasting-and-surface-preparation-gallery-7.webp" },
    { file: "sand-blasting-and-surface-preparation-gallery-8.webp" },
    { file: "sand-blasting-and-surface-preparation-gallery-9.webp" },
    { file: "sand-blasting-and-surface-preparation-gallery-10.webp" },
    { file: "sand-blasting-and-surface-preparation-gallery-11.webp" },
    { file: "sand-blasting-and-surface-preparation-gallery-12.webp" },
  ],
    keyStats: [
      { value: "4 Media Types", label: "Matched to Substrate" },
      { value: "SSPC/NACE", label: "Surface Prep Standards" },
      { value: "100%", label: "Critical Surfaces Masked" },
      { value: "Workshop/Site", label: "Flexible Deployment" },
    ],
    whyUs:
      "Aggressive or wrong-media blasting can round edges, roughen sealing faces, and destroy the exact tolerances your rotor was machined to. We mask every critical surface before blasting starts and match media grade to the substrate, so you get a clean, paint-ready surface without touching a single machined dimension.",
    overview:
      "Before any turbine rotor, casing, or component can be accurately inspected, reverse-engineered, NDT-tested, or recoated, its surface must be free of rust, scale, old paint, and carbon deposits, and that surface must be prepared without damaging the underlying machined geometry. Keshav Enterprises provides controlled abrasive blasting for turbine components using media selected to match the substrate and required finish: coarser media for structural steel and casings, and fine glass bead or walnut shell for delicate machined surfaces. Every journal, seal land, thread, and precision-machined feature is masked and protected before blasting begins. The result is a clean, uniformly profiled surface (verified against SSPC/NACE surface preparation standards) ready for accurate measurement, NDT, or recoating.",
    procedures: [
      {
        step: "01",
        title: "Component Assessment & Masking",
        iconName: "Search",
        desc: "Inspection of the component to identify all critical machined surfaces (journals, seal lands, threads, gasket faces) that must be protected from blast media. All such areas masked using purpose-made covers, tape, or fitted plugs before any blasting begins.",
      },
      {
        step: "02",
        title: "Media Selection",
        iconName: "Layers",
        desc: "Blast media selected to match substrate hardness and required surface profile: aluminium oxide or garnet for structural steel and casings, fine glass bead for delicate rotor surfaces and thin-wall components, walnut shell for the gentlest cleaning of precision parts.",
      },
      {
        step: "03",
        title: "Rust, Scale & Coating Removal",
        iconName: "Wrench",
        desc: "Controlled blasting at a pressure and standoff distance matched to the component removes rust, mill scale, old paint, and carbon deposits down to a uniform, contaminant-free surface, without introducing pitting, warping, or dimensional change.",
      },
      {
        step: "04",
        title: "Surface Profile Verification",
        iconName: "Activity",
        desc: "Anchor pattern (surface profile) measured using a profile comparator or replica tape to confirm the surface meets the SSPC-SP or NACE standard required for the follow-on coating or inspection process.",
      },
      {
        step: "05",
        title: "Dust & Debris Control",
        iconName: "Shield",
        desc: "Blasting carried out in a contained booth at our workshop, or using vacuum-recovery shrouded equipment on-site, to control dust and protect surrounding plant and personnel.",
      },
      {
        step: "06",
        title: "Final Inspection & Handover",
        iconName: "CheckCircle2",
        desc: "Masking removed, all protected surfaces re-checked against original dimensions, and the component visually inspected for uniform blast coverage before handover for measurement, NDT, coating, or reassembly.",
      },
    ],
    tools: [
      {
        name: "Portable Abrasive Blasting Unit",
        detail: "Pressure-pot type, on-site deployable",
        iconName: "Wrench",
      },
      {
        name: "Blast Media Range",
        detail: "Garnet, aluminium oxide, glass bead, walnut shell",
        iconName: "Layers",
      },
      {
        name: "Contained Blast Booth",
        detail: "Workshop dust-controlled cabinet blasting",
        iconName: "Shield",
      },
      {
        name: "Surface Profile Comparator",
        detail: "SSPC/NACE anchor pattern verification",
        iconName: "Search",
      },
      {
        name: "Vacuum Recovery Shroud",
        detail: "Dust-contained on-site blasting",
        iconName: "Filter",
      },
    ],
    standards: [
      {
        code: "SSPC-SP 6/10",
        desc: "Commercial & near-white metal blast cleaning",
        body: "SSPC",
      },
      {
        code: "NACE No.3/2",
        desc: "Surface preparation standards for coating",
        body: "NACE",
      },
      {
        code: "ISO 8501-1",
        desc: "Visual assessment of surface cleanliness",
        body: "ISO",
      },
      {
        code: "OEM Specification",
        desc: "Masking & media limits per OEM coating requirement",
        body: "OEM",
      },
    ],
  },
};

export const SVC_SCOPE_MAP: Record<string, { scope: string; turnaround: string }> = {
  srv_1: { scope: "Turnkey", turnaround: "Project-based timeline" },
  srv_2: { scope: "Turnkey on-site", turnaround: "3–21 days typical" },
  srv_3: { scope: "Workshop & on-site", turnaround: "7–30 days" },
  srv_4: { scope: "Workshop", turnaround: "48–72 hrs standard" },
  srv_5: { scope: "On-site flushing", turnaround: "2–7 days" },
  srv_6: { scope: "On-site precision", turnaround: "1–3 days" },
  srv_7: { scope: "On-site diagnostic", turnaround: "Same day report" },
  srv_8: { scope: "Workshop & on-site", turnaround: "1–3 days" },
};

// Values are stable slugs matching CaseStudy.categorySlug in case-studies.ts
// (not the translatable display label) — see i18n Phase 2 corrections.
export const SVC_CATEGORY_MAP: Record<string, string> = {
  srv_1: "erection-and-commissioning",
  srv_2: "overhauling",
  srv_3: "reverse-engineering",
  srv_4: "dynamic-balancing",
  srv_5: "lube-oil-flushing",
  srv_6: "machine-alignment",
  srv_7: "troubleshooting",
  srv_8: "sand-blasting",
};
