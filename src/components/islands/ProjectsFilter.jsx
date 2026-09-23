// src/components/islands/ProjectsFilter.jsx
// Ported from ProjectGalleryPage in App.jsx (line ~25391). One island since
// search/filter/pagination share tightly-coupled state.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { localizedPath } from "../../lib/localeMeta";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle2,
  Briefcase,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { CONTACT_INFO } from "../../data/site-config";
import { useURLFilters } from "../../hooks/useURLFilters.js";
import SkeletonImage from "./SkeletonImage.jsx";

const PAGE_SIZE = 9;

// `caseStudies` is resolved server-side (per-locale, via getLocalizedList in
// the parent .astro page) and passed in as a prop — not imported from
// src/data or src/lib/i18n here, same rule as every other client island in
// this i18n rollout (see ProductsGrid.jsx).
/**
 * @param {{ caseStudies?: Array<Record<string, any>>, locale?: string }} props
 */
export default function ProjectsFilter({ caseStudies: CASE_STUDIES = [], locale = "en" }) {
  // Filters + page round-trip through the URL (see ProductsGrid.jsx for the
  // same fix and useURLFilters.js for why the split between debounced and
  // immediate fields matters) — this is what makes Back, after opening a
  // case study, restore the page/category/industry/search you had instead
  // of resetting to page 1 with no filters.
  const filterSchema = useMemo(
    () => [
      { key: "category", param: "category", default: "All", parse: (raw) => raw, serialize: (v) => (v !== "All" ? v : "") },
      { key: "industry", param: "industry", default: "All", parse: (raw) => raw, serialize: (v) => (v !== "All" ? v : "") },
      { key: "search", param: "search", default: "", parse: (raw) => raw, serialize: (v) => v || "", debounce: true },
      {
        key: "page",
        param: "page",
        default: 1,
        parse: (raw) => {
          const n = parseInt(raw, 10);
          return Number.isFinite(n) && n > 0 ? n : 1;
        },
        serialize: (v) => (v > 1 ? String(v) : ""),
      },
    ],
    [],
  );
  const { initial, sync } = useURLFilters(filterSchema);

  const [activeCategory, setActiveCategory] = useState(initial.category);
  const [activeIndustry, setActiveIndustry] = useState(initial.industry);
  const [searchQuery, setSearchQuery] = useState(initial.search);
  const [currentPage, setCurrentPage] = useState(initial.page);
  const searchRef = useRef(null);
  const gridTopRef = useRef(null);

  const categories = useMemo(
    () => ["All", ...new Set(CASE_STUDIES.map((c) => c.category))],
    [CASE_STUDIES],
  );
  const industries = useMemo(
    () => ["All", ...new Set(CASE_STUDIES.map((c) => c.industry))],
    [CASE_STUDIES],
  );

  const setCat = (v) => {
    setActiveCategory(v);
    setCurrentPage(1);
  };
  const setInd = (v) => {
    setActiveIndustry(v);
    setCurrentPage(1);
  };
  const setSearch = (v) => {
    setSearchQuery(v);
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CASE_STUDIES.filter((c) => {
      if (activeCategory !== "All" && c.category !== activeCategory) return false;
      if (activeIndustry !== "All" && c.industry !== activeIndustry) return false;
      if (q) {
        const hay = [
          c.title,
          c.scope,
          c.challenge,
          c.solution,
          c.industry,
          c.category,
          ...(c.tags || []),
          ...(c.outcomes || []),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [CASE_STUDIES, activeCategory, activeIndustry, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;

  // Clamp a page restored from the URL that's now out of range (e.g. a
  // shared link had page=5 but the case-study list has since shrunk).
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // Keep the URL in sync with the current filters + page.
  useEffect(() => {
    sync({ category: activeCategory, industry: activeIndustry, search: searchQuery, page: currentPage });
  }, [sync, activeCategory, activeIndustry, searchQuery, currentPage]);

  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const goPage = useCallback((n) => {
    setCurrentPage(n);
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const hasFilters = activeCategory !== "All" || activeIndustry !== "All" || searchQuery !== "";
  const clearAll = () => {
    setActiveCategory("All");
    setActiveIndustry("All");
    setSearchQuery("");
    setCurrentPage(1);
    searchRef.current?.focus();
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
    .reduce((acc, n, idx, arr) => {
      if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…");
      acc.push(n);
      return acc;
    }, []);

  return (
    <>
      {/* Search box (rendered in hero area) */}
      <div className="mt-8 w-full max-w-2xl relative">
        <label htmlFor="projects-search" className="sr-only">
          Search case studies
        </label>
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={searchRef}
          id="projects-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by turbine type, industry, or service…"
          autoComplete="off"
          spellCheck="false"
          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 rounded-xl pl-12 pr-12 py-4 text-base font-medium focus:outline-none focus:bg-white/20 focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Filters bar + grid — own light background, independent of the dark hero this island is nested in */}
      <div className="bg-slate-50 text-inherit -mx-4 sm:-mx-6 lg:-mx-8 mt-10">
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-wrap gap-2 items-center">
              <fieldset
                className="flex flex-wrap gap-2 items-center border-0 p-0 m-0 min-w-0"
                aria-label="Filter by service"
              >
                <legend className="sr-only">Filter by service</legend>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest mr-1 shrink-0">
                  Service:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCat(cat)}
                    aria-pressed={activeCategory === cat}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeCategory === cat ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {cat}
                  </button>
                ))}
              </fieldset>
              <fieldset
                className="flex flex-wrap gap-2 items-center border-0 p-0 m-0 min-w-0"
                aria-label="Filter by industry"
              >
                <legend className="sr-only">Filter by industry</legend>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest mr-1 ml-3 shrink-0">
                  Industry:
                </span>
                {industries.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => setInd(ind)}
                    aria-pressed={activeIndustry === ind}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeIndustry === ind ? "bg-slate-800 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {ind}
                  </button>
                ))}
              </fieldset>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-2 text-xs font-black text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Result count — announced for screen-reader users, matches the pattern
            used by ProductsGrid and BlogFilter elsewhere on the site. */}
        {hasFilters && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 -mb-6">
            <p className="text-sm text-slate-500 font-medium" aria-live="polite">
              {filtered.length === 0
                ? "No case studies match your filters."
                : `${filtered.length} case stud${filtered.length === 1 ? "y" : "ies"} found`}
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {filtered.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Briefcase className="w-8 h-8 text-slate-300" aria-hidden="true" />
              </div>
              <h3 className="font-black text-slate-800 text-lg mb-2">
                No projects match these filters
              </h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Try clearing the filters below, or contact us — we have completed jobs across many
                more industries and service types.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-blue-700 transition-all"
                >
                  Clear Filters
                </button>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black text-sm hover:border-blue-400 hover:text-blue-700 transition-all"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" /> Ask About a Job
                </a>
              </div>
            </div>
          ) : (
            <div ref={gridTopRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((cs) => (
                <article
                  key={cs.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 flex flex-col group"
                >
                  <div className="h-44 bg-[#0A192F] relative overflow-hidden shrink-0">
                    {cs.image && (
                      <SkeletonImage
                        src={`/${cs.image}`}
                        alt=""
                        ariaHidden
                        width="800"
                        height="500"
                        wrapperClassName="absolute inset-0"
                        skeletonClassName="bg-[#152B50]"
                        className="absolute inset-0 w-full h-full object-cover group-hover:opacity-75"
                        loadedClassName="opacity-60"
                        unloadedClassName="opacity-0"
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-[#0A192F]/90 via-[#0A192F]/10 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                      <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {cs.category}
                      </span>
                      <span className="bg-white/10 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-white/20">
                        {cs.industry}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-black text-sm leading-snug line-clamp-2">
                        {cs.title}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex gap-4 mb-3 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                        {cs.year}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                        {cs.duration}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-3 flex-1">
                      {cs.scope}
                    </p>
                    {cs.outcomes[0] && (
                      <div className="mt-3 flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <p className="text-emerald-800 text-xs font-semibold leading-snug">
                          {cs.outcomes[0]}
                        </p>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {cs.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <a
                      href={localizedPath(locale, `/projects/${cs.id}`)}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                    >
                      Read Case Study
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => goPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              {pageNumbers.map((item, idx) =>
                item === "…" ? (
                  <span
                    key={`e-${idx}`}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 font-bold text-sm"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => goPage(item)}
                    aria-current={item === currentPage ? "page" : undefined}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all ${item === currentPage ? "bg-blue-600 text-white shadow-md" : "border border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600"}`}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => goPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="mt-16 bg-slate-900 rounded-2xl p-8 md:p-10 text-white text-center">
            <p className="text-blue-400 font-black text-xs uppercase tracking-widest mb-3">
              Have a similar challenge?
            </p>
            <h2 className="text-2xl font-black tracking-tight mb-3">
              Talk to Our Engineers Directly
            </h2>
            <p className="text-slate-300 font-medium mb-8 max-w-lg mx-auto text-sm leading-relaxed">
              Describe your turbine make, site conditions, and shutdown window — our ex-OEM
              engineers will give you a straight answer on scope and timeline.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/contact"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-black text-sm transition-colors shadow-lg"
              >
                Get a Free Quote <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </a>
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent("Hello KESHAV ENTERPRISES, I reviewed your case studies and would like to discuss a similar requirement.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-transparent border-2 border-white/30 hover:border-white/60 text-white px-6 py-3 rounded-xl font-black text-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> Or WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
