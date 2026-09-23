// src/components/islands/DownloadsGrid.jsx
// Ported from DownloadsPage + DownloadGateModal in App.jsx (line ~26296, ~26390).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, FileText, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { DOWNLOADS, DOWNLOAD_CATEGORIES } from "../../data/downloads";
import { checkFormRateLimit, sanitiseField } from "../../lib/formHelpers";
import { useFocusTrap } from "../../lib/useFocusTrap";

const WEB3FORMS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY ?? "";
const DL_SESSION_KEY = "ke_dl_gated";

function getSessionGated() {
  try {
    return JSON.parse(sessionStorage.getItem(DL_SESSION_KEY) || "[]");
  } catch {
    return [];
  }
}
function markSessionGated(id) {
  try {
    const existing = getSessionGated();
    if (!existing.includes(id))
      sessionStorage.setItem(DL_SESSION_KEY, JSON.stringify([...existing, id]));
  } catch {
    /* session storage blocked */
  }
}

function GateModal({ item, onClose, onSuccess }) {
  const modalRef = useRef(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("idle");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape" && status !== "loading") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose, status]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useFocusTrap(modalRef, true);

  const clearErr = (field) => {
    setErrors((p) => {
      if (!p[field]) return p;
      const n = { ...p };
      delete n[field];
      return n;
    });
    if (status === "error") {
      setStatus("idle");
      setSubmitError("");
    }
  };

  const validate = useCallback(() => {
    const e = {};
    if (!name.trim()) e.name = "Your name is required";
    if (!company.trim()) e.company = "Company name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Valid email address required";
    if (phone.trim() && phone.replace(/\D/g, "").length < 10)
      e.phone = "Enter a valid phone number, or leave it blank";
    return e;
  }, [name, company, email, phone]);

  const handleSubmit = useCallback(async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setSubmitError("");
    setStatus("loading");

    // Open the destination tab synchronously, still inside the click's user-
    // gesture window, before any `await` runs. Calling window.open() after an
    // async fetch resolves is no longer treated as user-initiated and gets
    // silently blocked by popup blockers (Safari especially) — same class of
    // bug fixed in ContactForm's WhatsApp button.
    const fileWindow = window.open("", "_blank", "noopener");

    if (!checkFormRateLimit("ke_dl_ts", 10, 3_600_000)) {
      fileWindow?.close();
      setSubmitError("Too many submissions. Please wait before trying again.");
      setStatus("error");
      return;
    }
    if (!WEB3FORMS_KEY) {
      markSessionGated(item.id);
      setStatus("success");
      onSuccess(item, fileWindow);
      return;
    }
    try {
      const fd = new FormData();
      fd.append("access_key", WEB3FORMS_KEY);
      fd.append("botcheck", "");
      fd.append("subject", `New Download — ${sanitiseField(item.title)}`);
      fd.append("from_name", "Keshav Enterprises Website");
      fd.append("Name", sanitiseField(name));
      fd.append("Company", sanitiseField(company));
      fd.append("Email", sanitiseField(email));
      fd.append("Phone", sanitiseField(phone) || "Not provided");
      if (city.trim()) fd.append("City", sanitiseField(city));
      fd.append("File", `${sanitiseField(item.title)} (${item.fileType})`);
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Submission failed");
      markSessionGated(item.id);
      setStatus("success");
      onSuccess(item, fileWindow);
    } catch (err) {
      fileWindow?.close();
      setSubmitError(err?.message || "Submission failed. Please try again.");
      setStatus("error");
    }
  }, [name, company, email, phone, city, item, onSuccess, validate]);

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-1";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dl-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="bg-navy-800 px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 bg-blue-600/30 border border-blue-500/40 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-blue-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">
                {item.category} · {item.fileType} · {item.fileSize}
              </p>
              <h2 id="dl-modal-title" className="text-white font-black text-base leading-snug">
                {item.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {isSuccess ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-black text-navy-800 mb-2">Your download is ready</h3>
            <p className="text-slate-500 text-sm mb-6">Opening in a new tab now…</p>
            <button
              type="button"
              onClick={onClose}
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-slate-500 text-sm font-medium mb-5">
              Enter your details to access this document — free, no spam.
            </p>
            {submitError && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />{" "}
                {submitError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="dl-name" className={labelCls}>
                  Name *
                </label>
                <input
                  id="dl-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearErr("name");
                  }}
                  aria-invalid={errors.name ? "true" : undefined}
                  aria-describedby={errors.name ? "dl-name-error" : undefined}
                  className={inputCls}
                />
                {errors.name && (
                  <p id="dl-name-error" className="mt-1 text-xs font-bold text-red-700">
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="dl-company" className={labelCls}>
                  Company *
                </label>
                <input
                  id="dl-company"
                  type="text"
                  autoComplete="organization"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    clearErr("company");
                  }}
                  aria-invalid={errors.company ? "true" : undefined}
                  aria-describedby={errors.company ? "dl-company-error" : undefined}
                  className={inputCls}
                />
                {errors.company && (
                  <p id="dl-company-error" className="mt-1 text-xs font-bold text-red-700">
                    {errors.company}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="dl-email" className={labelCls}>
                  Email *
                </label>
                <input
                  id="dl-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearErr("email");
                  }}
                  aria-invalid={errors.email ? "true" : undefined}
                  aria-describedby={errors.email ? "dl-email-error" : undefined}
                  className={inputCls}
                />
                {errors.email && (
                  <p id="dl-email-error" className="mt-1 text-xs font-bold text-red-700">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dl-phone" className={labelCls}>
                    Phone
                  </label>
                  <input
                    id="dl-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearErr("phone");
                    }}
                    aria-invalid={errors.phone ? "true" : undefined}
                    aria-describedby={errors.phone ? "dl-phone-error" : undefined}
                    className={inputCls}
                  />
                  {errors.phone && (
                    <p id="dl-phone-error" className="mt-1 text-xs font-bold text-red-700">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="dl-city" className={labelCls}>
                    City
                  </label>
                  <input
                    id="dl-city"
                    type="text"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-3.5 rounded-xl text-sm tracking-tight transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  "Preparing download…"
                ) : (
                  <>
                    <Download className="w-4 h-4" aria-hidden="true" /> Get Free Download
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-500">
                No spam. Unsubscribe anytime.{" "}
                <a href="/privacy-policy" className="underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DownloadsGrid() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [gateItem, setGateItem] = useState(null);
  const [sessionGated, setSessionGated] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    setSessionGated(getSessionGated());
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return DOWNLOADS.filter((d) => {
      if (activeCategory !== "All" && d.category !== activeCategory) return false;
      if (q) {
        const hay = [d.title, d.desc, d.category, ...d.tags].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activeCategory, q]);

  const hasFilters = activeCategory !== "All" || q !== "";
  const clearAll = () => {
    setActiveCategory("All");
    setQuery("");
    searchRef.current?.focus();
  };

  const handleDownload = useCallback(
    (item) => {
      if (sessionGated.includes(item.id)) {
        window.open(`/${item.file}`, "_blank", "noopener");
        return;
      }
      setGateItem(item);
    },
    [sessionGated],
  );

  const handleGateSuccess = useCallback((item, fileWindow) => {
    if (fileWindow && !fileWindow.closed) {
      fileWindow.location.href = `/${item.file}`;
    } else {
      // Fallback in case the pre-opened window reference is unavailable —
      // still likely to be blocked, but better than doing nothing.
      window.open(`/${item.file}`, "_blank", "noopener");
    }
    setSessionGated((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
  }, []);

  return (
    <>
      {/* Search box — rendered inside dark hero */}
      <div className="w-full max-w-2xl relative">
        <label htmlFor="dl-search" className="sr-only">
          Search downloads
        </label>
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={searchRef}
          id="dl-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search checklists, datasheets…"
          autoComplete="off"
          spellCheck="false"
          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 rounded-xl pl-12 pr-12 py-4 text-base font-medium focus:outline-none focus:bg-white/20 focus:border-blue-400 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="bg-slate-50 -mx-4 sm:-mx-6 lg:-mx-8 mt-10 pt-10 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <fieldset className="mb-10 flex flex-wrap items-center gap-2 border-0 p-0 m-0 min-w-0">
            <legend className="sr-only">Filter by category</legend>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest mr-1 shrink-0">
              Category:
            </span>
            {DOWNLOAD_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                className={`px-4 py-1.5 rounded-full text-sm font-black transition-all ${activeCategory === cat ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-700"}`}
              >
                {cat}
              </button>
            ))}
            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="ml-1 text-xs font-black text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
              >
                Clear all
              </button>
            )}
          </fieldset>

          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-medium text-slate-500" aria-live="polite">
              {filtered.length === 0
                ? "No documents match your search"
                : `${filtered.length} document${filtered.length === 1 ? "" : "s"} available`}
            </p>
            {hasFilters && filtered.length > 0 && (
              <p className="text-xs text-slate-500">Filtered from {DOWNLOADS.length} total</p>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" aria-hidden="true" />
              </div>
              <h3 className="font-black text-slate-800 text-lg mb-2">No documents found</h3>
              <button
                type="button"
                onClick={clearAll}
                className="text-blue-600 font-bold text-sm hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((d) => (
                <div
                  key={d.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col"
                >
                  {d.featured && (
                    <span className="self-start mb-3 bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm leading-snug">{d.title}</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                        {d.category} · {d.fileType} · {d.fileSize}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed mb-4 flex-1">{d.desc}</p>
                  <button
                    type="button"
                    onClick={() => handleDownload(d)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-lg text-xs tracking-tight transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" /> Download {d.fileType}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {gateItem && (
        <GateModal
          item={gateItem}
          onClose={() => setGateItem(null)}
          onSuccess={handleGateSuccess}
        />
      )}
    </>
  );
}
