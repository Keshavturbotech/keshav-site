// src/components/islands/BrandLogo.jsx
// FIXED: this was originally a simplified stub written from scratch during
// initial scaffolding rather than a full port — caught via screenshot
// comparison against the live site. Now matches App.jsx's real BrandLogo
// component (line ~9492) exactly: 3-line stacked layout (KESHAV /
// ENTERPRISES / "Quality & Assurance" in italic), not the 2-line
// "Keshav Enterprises / Turbine Engineering" this used to show.
//
// FIXED (locale bug): href was a hardcoded "/" — on a translated page (e.g.
// /hi/...) this silently sent every visitor who clicked the logo back to
// English. This component sits inside Navbar.jsx, i.e. on every single
// page, so this alone was one of the most-triggered instances of the bug.
import { localizedPath } from "../../lib/localeMeta";

export default function BrandLogo({ scrolled, locale = "en" }) {
  const nameCls = scrolled ? "text-[#0A192F]" : "text-white";
  const tagCls = scrolled ? "text-blue-500" : "text-white";
  const subCls = scrolled ? "text-slate-600" : "text-white/60";

  return (
    <a
      href={localizedPath(locale, "/")}
      className="flex items-center gap-3 shrink-0 group"
    >
      <img
        src="/keshav-logo.png"
        alt=""
        aria-hidden="true"
        width="44"
        height="44"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="w-11 h-11 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
      />
      <div className="flex flex-col text-left leading-none">
        <span
          className={`font-black uppercase tracking-[0.06em] text-[19px] lg:text-[21px] ${nameCls} transition-colors duration-200`}
        >
          KESHAV
        </span>
        <span
          className={`font-bold uppercase tracking-[0.14em] text-[12px] lg:text-[13px] mt-0.5 ${tagCls} transition-colors duration-200`}
        >
          ENTERPRISES
        </span>
        {/*
          MOBILE UX FIX: text-[8px] is well under comfortable mobile
          reading size. Bumped the base (mobile/tablet) size to 10px;
          lg:text-[9px] (desktop) is untouched, so this only changes
          screens below the `lg` breakpoint.
        */}
        <span
          className={`font-semibold tracking-[0.08em] text-[10px] lg:text-[9px] mt-0.5 uppercase italic ${subCls} transition-colors duration-200`}
        >
          Quality &amp; Assurance
        </span>
      </div>
    </a>
  );
}
