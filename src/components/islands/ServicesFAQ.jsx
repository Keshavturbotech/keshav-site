// src/components/islands/ServicesFAQ.jsx — ported from App.jsx ServicesPageFAQ (line ~19169)
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { CONTACT_INFO } from "../../data/site-config";

const SVC_FAQ_ITEMS = [
  {
    q: "What turbine makes do you overhaul?",
    a: "We service all major makes: Triveni, Siemens, BHEL, Belliss & Morcom, Maxwatt, Man Turbo, Chola Turbo, DLF-Skoda, KKK, and ABB — covering turbines from 5 kW to 60 MW, both back-pressure and condensing types.",
  },
  {
    q: "What is typically included in a turnkey overhaul?",
    a: "Our turnkey scope includes pre-shutdown planning, on-site spare parts inspection, complete disassembly, dimensional measurement of all critical clearances, condition reporting, parts replacement, rotor balancing, reassembly, alignment, and run-up. All tools, tackles, consumables, and manpower are included. A full condition report with documented clearances is handed over at completion.",
  },
  {
    q: "How fast can you respond to a breakdown emergency?",
    a: "Our engineers are stationed at multiple locations across India. For North India (UP, Haryana, Punjab, Rajasthan), typical site arrival is 4–12 hours from your call. We operate 24×7 with no answering service — you speak to a qualified engineer.",
  },
  {
    q: "What is your process for reverse-engineering an obsolete part?",
    a: "We use 3D laser scanning, CMM coordinate measurement, and PMI material testing to capture exact OEM dimensions and material composition. We then generate manufacturing drawings with tolerances, surface finish, and heat treatment specs. Typical turnaround for most components is 3–6 weeks from receipt of sample or drawing.",
  },
  {
    q: "Can you provide a typical project timeline and pricing estimate?",
    a: "A planned annual overhaul on a 5–15 MW turbine typically takes 7–14 days on-site with a team of 4–6 engineers. Pricing depends on turbine make, scope of work, and parts required — contact us for a detailed quotation. Emergency breakdown support starts with a 24-hour site assessment.",
  },
  {
    q: "Do you provide documentation I can submit to my management or insurer?",
    a: "Yes — every job includes a full condition report with photographic evidence, measured clearances, balancing reports (ISO/API compliance), PMI material certificates for reverse-engineered parts, and an ISO 4406 cleanliness certificate for oil flushing jobs. All documentation is formatted for management and insurance submission.",
  },
];

export default function ServicesFAQ() {
  const [open, setOpen] = useState(null);
  const waHref = `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent("Hello KESHAV ENTERPRISES, I have a question about your services.")}`;
  return (
    <section
      className="bg-white border-t border-slate-100 py-16 md:py-20"
      aria-labelledby="svc-faq-heading"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-blue-600 font-black text-xs uppercase tracking-widest mb-2">
            Common Questions
          </p>
          <h2 id="svc-faq-heading" className="text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="w-16 h-1.5 bg-blue-600 rounded-full mx-auto mt-4" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          {SVC_FAQ_ITEMS.map((item, i) => (
            <div key={item.q} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-controls={`svc-faq-panel-${i}`}
                id={`svc-faq-button-${i}`}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
              >
                <span className="font-black text-slate-900 text-sm pr-4 leading-snug">
                  {item.q}
                </span>
                <ChevronRight
                  className={`w-5 h-5 text-blue-500 shrink-0 transition-transform duration-200 ${open === i ? "rotate-90" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {open === i && (
                <div
                  id={`svc-faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`svc-faq-button-${i}`}
                  className="px-6 pb-5 pt-1 bg-slate-50 border-t border-slate-100"
                >
                  <p className="text-slate-600 font-medium text-sm leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mt-8 font-medium">
          Have a specific question?{" "}
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-bold hover:underline focus:outline-none focus-visible:underline"
          >
            Ask us on WhatsApp →
          </a>
        </p>
      </div>
    </section>
  );
}
