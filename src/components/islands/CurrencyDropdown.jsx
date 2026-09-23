// src/components/islands/CurrencyDropdown.jsx
// Ported from CurrencyDropdown in App.jsx (line ~7753) — simplified to a
// plain absolutely-positioned panel (matching the OEM/Sort dropdown style
// already used on the Products page) instead of the original's portal.
// FIXED: this control — and currency-aware pricing generally — was entirely
// missing from the Astro migration; product prices were hardcoded to INR.
//
// "glass-light" translucency (bg-white/10 / bg-white/20 + backdrop-blur-sm)
// below is only for use over dark hero/photo backgrounds, never body copy —
// see Navbar.jsx for the full translucency convention notes.
import { useEffect, useRef, useState } from "react";
import { ChevronDown, CheckCircle2, Globe, Info } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "../../data/currency";
import { useCurrency } from "../../hooks/useCurrency";

export default function CurrencyDropdown({ dark = false }) {
  const { code, select, detectedAuto } = useCurrency();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const cur = SUPPORTED_CURRENCIES.find((c) => c.code === code);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        // FIXED: the button's visible text is the currency code (e.g. "INR"),
        // but the aria-label only spelled out the full name ("Indian Rupee")
        // — since aria-label replaces the accessible name entirely, the
        // visible text was no longer "inside" it (axe:
        // label-content-name-mismatch). Including the code keeps the label
        // just as descriptive while containing what's actually on screen.
        aria-label={`Currency: ${cur?.code ?? code} — ${cur?.name ?? code}. Click to change.`}
        title={detectedAuto ? `Auto-detected: ${cur?.name}` : cur?.name}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 ${
          dark
            ? "bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            : "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300 shadow-md"
        }`}
      >
        <span aria-hidden="true">{cur?.flag}</span>
        <span>{cur?.code}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select currency"
          className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 flex flex-col overflow-hidden"
        >
          <div className="px-4 pt-3.5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-b from-slate-50 to-white">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">
              Select currency
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {SUPPORTED_CURRENCIES.length}
            </span>
          </div>

          {detectedAuto && (
            <div className="mx-3 mt-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-1.5 shrink-0">
              <Globe className="w-3 h-3 text-blue-500 shrink-0" aria-hidden="true" />
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">
                Auto-detected from your region
              </span>
            </div>
          )}

          <div
            className="overflow-y-auto overflow-x-hidden py-1.5"
            style={{ maxHeight: "min(320px, 60vh)" }}
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                role="option"
                aria-selected={c.code === code}
                onClick={() => {
                  select(c.code);
                  setOpen(false);
                }}
                className={`group relative w-[calc(100%-0.75rem)] flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 mx-1.5 my-0.5 rounded-xl text-sm text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${c.code === code ? "bg-blue-50/80" : "hover:bg-slate-50"}`}
              >
                {c.code === code && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-blue-600"
                    aria-hidden="true"
                  />
                )}
                <span className="text-base leading-none" aria-hidden="true">
                  {c.flag}
                </span>
                <span
                  className={`shrink-0 text-[11px] font-extrabold tracking-wide px-1.5 py-0.5 rounded-md ${c.code === code ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}
                >
                  {c.code}
                </span>
                <span className="flex flex-col min-w-0 leading-tight">
                  <span
                    className={`text-xs truncate ${c.code === code ? "text-blue-900 font-bold" : "text-slate-600 font-medium"}`}
                  >
                    {c.name}
                  </span>
                  {c.nativeName && c.nativeName !== c.name && (
                    <span className="text-slate-600 text-[10px] truncate">{c.nativeName}</span>
                  )}
                </span>
                {c.code === code && (
                  <CheckCircle2
                    className="w-4 h-4 ml-auto shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 shrink-0 flex items-start gap-1.5">
            <Info className="w-3 h-3 text-slate-400 shrink-0 mt-[1px]" aria-hidden="true" />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Prices converted from INR at live market rates. Actual invoice will be in INR.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
