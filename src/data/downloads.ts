// src/data/downloads.ts
// Ported verbatim from DOWNLOADS in App.jsx (line ~26296).
export interface DownloadItem {
  id: string;
  title: string;
  desc: string;
  category: string;
  tags: string[];
  fileSize: string;
  fileType: string;
  file: string;
  featured: boolean;
}

export const DOWNLOADS: DownloadItem[] = [
  {
    id: "dl_1",
    title: "Turbine Overhaul Checklist",
    desc: "Step-by-step checklist for major and minor turbine overhauls. Covers clearances, balancing, torque sign-off, and pre-commissioning checks.",
    category: "Maintenance",
    tags: ["Turbine", "Overhauling", "Checklist"],
    fileSize: "420 KB",
    fileType: "PDF",
    file: "turbine-overhaul-checklist.pdf",
    featured: true,
  },
  {
    id: "dl_2",
    title: "Filter Element Datasheet — Lube Oil",
    desc: "Technical ratings, differential pressure curves, and compatibility chart for all lube oil filter elements supplied by Keshav Enterprises.",
    category: "Datasheets",
    tags: ["Filtration", "Lube Oil", "Datasheet"],
    fileSize: "1.2 MB",
    fileType: "PDF",
    file: "filter-element-datasheet-lube-oil.pdf",
    featured: false,
  },
  {
    id: "dl_3",
    title: "Lube Oil Flushing Checklist",
    desc: "ISO-compliant flushing procedure checklist. Covers mobile centrifuge setup, oil sampling protocol, cleanliness verification, and sign-off.",
    category: "Maintenance",
    tags: ["Lube Oil", "Flushing", "ISO"],
    fileSize: "310 KB",
    fileType: "PDF",
    file: "lube-oil-flushing-checklist.pdf",
    featured: false,
  },
  {
    id: "dl_4",
    title: "Bearing Selection & Clearance Reference",
    desc: "Quick-reference guide for bearing selection, journal clearances, and radial/axial tolerances across common steam turbine makes.",
    category: "Technical Guides",
    tags: ["Bearings", "Clearances", "Reference"],
    fileSize: "680 KB",
    fileType: "PDF",
    file: "bearing-selection-clearance-reference.pdf",
    featured: false,
  },
  {
    id: "dl_5",
    title: "Turbine RFQ Template",
    desc: "Blank turbine specification sheet for requesting a repair or overhaul quote. Fill in your make, model, power, and service history.",
    category: "RFQ / Forms",
    tags: ["RFQ", "Template", "Quote"],
    fileSize: "185 KB",
    fileType: "XLSX",
    file: "turbine-rfq-template.xlsx",
    featured: true,
  },
  {
    id: "dl_6",
    title: "Keshav Enterprises Company Profile",
    desc: "Capabilities deck for procurement teams and plant managers. Covers services, OEM coverage, workshop equipment, and reference projects.",
    category: "Company",
    tags: ["Profile", "Capabilities", "Brochure"],
    fileSize: "3.4 MB",
    fileType: "PDF",
    file: "keshav-enterprises-company-profile.pdf",
    featured: false,
  },
];

export const DOWNLOAD_CATEGORIES: string[] = ["All", ...new Set(DOWNLOADS.map((d) => d.category))];
