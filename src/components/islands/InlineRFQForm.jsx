// src/components/islands/InlineRFQForm.jsx
// Ported from App.jsx (line ~13317). Compact collapsible quote-request form
// used on product detail pages — separate from ContactForm.jsx (the full
// contact page form) since this one is scoped to a single product and opens
// by default (it's the primary on-page conversion action).
import { useCallback, useState } from "react";
import { Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import { checkFormRateLimit, sanitiseField } from "../../lib/formHelpers";
import TurnstileWidget from "./TurnstileWidget.jsx";

const WEB3FORMS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY ?? "";
const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "";
// Matches the "max 10 MB per file" copy below the input — same limit as
// ContactForm.jsx, whose file-attach field this is ported from.
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";
const labelCls = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-1";

export default function InlineRFQForm({ productTitle, contactHref = "/contact" }) {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [qty, setQty] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const reset = useCallback(() => {
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setQty("");
    setMessage("");
    setStatus("idle");
    setErrMsg("");
    const fi = document.getElementById("rfq-files");
    if (fi) fi.value = "";
  }, []);

  const clearErr = () => {
    if (status === "error" || errMsg) {
      setStatus("idle");
      setErrMsg("");
    }
  };

  const handleSubmit = useCallback(async () => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!name.trim()) {
      setErrMsg("Name is required.");
      return;
    }
    if (!emailOk) {
      setErrMsg("Please enter a valid email address.");
      return;
    }
    const fileInput = document.getElementById("rfq-files");
    const oversized = Array.from(fileInput?.files ?? []).find(
      (f) => f.size > MAX_ATTACHMENT_BYTES,
    );
    if (oversized) {
      setErrMsg(`"${oversized.name}" is over the 10 MB limit — please attach a smaller file`);
      return;
    }
    if (!checkFormRateLimit("ke_rfq_ts", 5, 3_600_000)) {
      setErrMsg("Too many submissions. Please wait an hour before trying again.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErrMsg("Please complete the security check.");
      return;
    }
    setStatus("sending");
    setErrMsg("");
    if (!WEB3FORMS_KEY) {
      setErrMsg("Form not configured — please contact us directly via WhatsApp or phone.");
      setStatus("error");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("access_key", WEB3FORMS_KEY);
      fd.append("botcheck", "");
      if (turnstileToken) fd.append("cf-turnstile-response", turnstileToken);
      fd.append("from_name", "Keshav Enterprises Website");
      fd.append("Product", sanitiseField(productTitle));
      fd.append("Name", sanitiseField(name));
      fd.append("Company", sanitiseField(company));
      fd.append("Email", sanitiseField(email));
      fd.append("Phone", sanitiseField(phone));
      fd.append("Quantity", sanitiseField(qty));
      fd.append("Message", sanitiseField(message, 1000));
      const fileInput = document.getElementById("rfq-files");
      if (fileInput?.files?.length > 0) fd.append("attachment", fileInput.files[0]);
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Submission failed");
      setStatus("success");
    } catch (err) {
      setErrMsg(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }, [name, company, email, phone, qty, message, productTitle, turnstileToken]);

  return (
    <div className="mt-5 border-2 border-blue-100 rounded-2xl overflow-hidden bg-blue-50/40">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) reset();
        }}
        aria-expanded={open}
        aria-controls="rfq-form-body"
        className="w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
      >
        <span className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
          <span className="font-black text-slate-800 text-sm tracking-tight">
            Request a Quote by Email
          </span>
          <span className="hidden sm:inline text-xs text-slate-500 font-medium">
            — no WhatsApp needed
          </span>
        </span>
        <svg
          aria-hidden="true"
          className={`w-4 h-4 text-blue-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div id="rfq-form-body" className="px-5 pb-5 pt-1 border-t border-blue-100">
          {/*
            FIX (UX audit — two lead forms, no explanation): nothing told a
            visitor why this form exists separately from the main Contact
            page, which could read as redundant or make them unsure which
            one "really" reaches the team. One line makes the split
            explicit: this one is scoped and fast for the part they're
            already looking at; Contact is for anything broader.
          */}
          {status !== "success" && (
            <p className="text-xs text-slate-500 font-medium mb-3">
              Scoped to this part for a fast reply. For general inquiries, use our{" "}
              <a href={contactHref} className="text-blue-600 font-bold hover:underline">
                Contact page
              </a>{" "}
              instead.
            </p>
          )}
          {status === "success" ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" aria-hidden="true" />
              <p className="font-black text-slate-800 text-base">Quote request sent!</p>
              <p className="text-sm text-slate-500">We&apos;ll get back to you within 1 business day.</p>
              <button
                type="button"
                onClick={reset}
                className="mt-2 text-blue-600 text-sm font-bold hover:underline"
              >
                Send another request
              </button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rfq-name" className={labelCls}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="rfq-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearErr();
                  }}
                  placeholder="Your name"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="rfq-company" className={labelCls}>
                  Company
                </label>
                <input
                  id="rfq-company"
                  type="text"
                  autoComplete="organization"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    clearErr();
                  }}
                  placeholder="Company name"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="rfq-email" className={labelCls}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="rfq-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearErr();
                  }}
                  placeholder="you@company.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="rfq-phone" className={labelCls}>
                  Phone
                </label>
                <input
                  id="rfq-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearErr();
                  }}
                  placeholder="Country code + number, e.g. +91 98000 00000"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="rfq-qty" className={labelCls}>
                  Quantity / Requirement
                </label>
                <input
                  id="rfq-qty"
                  type="text"
                  autoComplete="off"
                  value={qty}
                  onChange={(e) => {
                    setQty(e.target.value);
                    clearErr();
                  }}
                  placeholder="e.g. 10 units, DN 50, SS 316…"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="rfq-message" className={labelCls}>
                  Additional Details
                </label>
                <textarea
                  id="rfq-message"
                  rows={3}
                  maxLength={1000}
                  autoComplete="off"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    clearErr();
                  }}
                  placeholder="Application, pressure rating, delivery location, or any other specs…"
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="rfq-files" className={labelCls}>
                  Attach Drawing / Worn-Part Photo (optional)
                </label>
                <p className="text-xs text-slate-500 font-medium mb-1.5">
                  PDF, DWG, DXF, JPG, PNG — max 10 MB per file. Helps us quote faster.
                </p>
                <input
                  id="rfq-files"
                  type="file"
                  multiple
                  accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
                  onChange={clearErr}
                  className={`${inputCls} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-blue-600`}
                />
              </div>
              {errMsg && (
                <div
                  role="alert"
                  className="sm:col-span-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700 font-semibold flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {errMsg}
                </div>
              )}
              <div className="sm:col-span-2">
                <TurnstileWidget
                  widgetId="rfq"
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken("")}
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={status === "sending"}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-3.5 rounded-xl text-sm tracking-tight transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {status === "sending" ? (
                    "Sending…"
                  ) : (
                    <>
                      <Mail className="w-4 h-4" aria-hidden="true" /> Send Quote Request
                    </>
                  )}
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-500">
                  We respond within 1 business day · No spam ·{" "}
                  <a
                    href="/privacy-policy"
                    className="underline underline-offset-2 hover:text-slate-700"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
