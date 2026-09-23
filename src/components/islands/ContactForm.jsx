// src/components/islands/ContactForm.jsx
// Ported from ContactPage in App.jsx (line ~24030). Reads ?service= and
// ?details= from the URL on mount to prefill inquiry type and message
// (replaces the original's ke:prefillContact CustomEvent system, which
// existed because the old app was a single-page hash router keeping all
// pages mounted — with real Astro routes, prefill can just travel as URL
// params instead).
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Mail, Shield, User, MessageCircle } from "lucide-react";
import { CONTACT_INFO } from "../../data/site-config";
import { COUNTRY_CODES, DEFAULT_COUNTRY_DIAL } from "../../data/countryCodes";
import {
  checkFormRateLimit,
  sanitiseField,
  sanitiseForWhatsApp,
  waMsg,
} from "../../lib/formHelpers";
import { isOfficeHoursNow } from "../../lib/officeHours";
import TurnstileWidget from "./TurnstileWidget.jsx";

const WEB3FORMS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY ?? "";
const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // matches the "max 10 MB per file" copy below the input

// IST calculation lives in lib/officeHours.ts, shared with
// OfficeHoursPill.jsx and ContactOfficeStatus.jsx — drives the live
// emerald/amber response-time bar above the submit button. Labels come
// from the localized `content.officeStatus` prop; only the boolean and
// which key to read is decided here.
function getOfficeStatus(content) {
  const inHours = isOfficeHoursNow();
  return inHours
    ? { isOfficeHours: true, label: content.officeStatus.online }
    : { isOfficeHours: false, label: content.officeStatus.offline };
}

// Icon scaffolding only — matched positionally to content.riskReversal
// (same order as the original hardcoded array). Title/sub copy now comes
// from the localized content prop.
const RISK_REVERSAL_ICONS = [CheckCircle2, Shield, User, CheckCircle2];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";
const labelCls = "block text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest";

export default function ContactForm({ content }) {
  const [contactName, setContactName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryDial, setCountryDial] = useState(DEFAULT_COUNTRY_DIAL);
  const [iType, setIType] = useState("");
  const [turbineMake, setTurbineMake] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});
  const [turnstileToken, setTurnstileToken] = useState("");
  const [officeHours, setOfficeHours] = useState(() => getOfficeStatus(content));
  const refreshOfficeHours = useCallback(
    () => setOfficeHours(getOfficeStatus(content)),
    [content],
  );
  useEffect(() => {
    // BUGFIX: getOfficeStatus() also runs during Astro's server render, on
    // the server's clock. If the real hour/day boundary (9 AM/7 PM IST,
    // Mon-Sat) falls between server render and client hydration, the two
    // disagree — a hydration mismatch on the live response-time bar.
    // Re-syncing to the client's own clock right after mount (in addition
    // to the 60s interval below) closes that window instead of trusting
    // SSR's value.
    refreshOfficeHours();
    const id = setInterval(refreshOfficeHours, 60_000);
    return () => clearInterval(id);
  }, [refreshOfficeHours]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const svc = params.get("service");
    if (svc && content.inquiryTypes.includes(svc)) setIType(svc);
    else if (svc) setIType(content.inquiryTypes[content.inquiryTypes.length - 1]);
    const prefillDetails = params.get("details");
    if (prefillDetails) setDetails(prefillDetails.slice(0, 2000));
  }, []);

  const clearFieldErr = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (status === "error") {
      setStatus("idle");
      setSubmitError("");
    }
  };

  const resetForm = () => {
    setContactName("");
    setName("");
    setEmail("");
    setPhone("");
    setCountryDial(DEFAULT_COUNTRY_DIAL);
    setIType("");
    setTurbineMake("");
    setDetails("");
    setStatus("idle");
    setSubmitError("");
    setErrors({});
    const fi = document.getElementById("c-files");
    if (fi) fi.value = "";
  };

  const validate = () => {
    const e = {};
    if (!contactName.trim()) e.contactName = content.errors.yourName;
    if (!name.trim()) e.name = content.errors.companyName;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = content.errors.email;
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10)
      e.phone = content.errors.phone;
    if (!iType) e.iType = content.errors.inquiryType;
    if (!details.trim() || details.length < 20)
      e.details = content.errors.details;
    const fileInput = document.getElementById("c-files");
    const oversized = Array.from(fileInput?.files ?? []).find((f) => f.size > MAX_ATTACHMENT_BYTES);
    if (oversized)
      e.attachment = content.errors.attachmentTooLarge.replace("{filename}", oversized.name);
    return e;
  };

  const submitToWeb3Forms = async (openWhatsApp) => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      // Move focus/scroll to the first invalid field so errors aren't silently
      // missed further up the (often long, two-column) form.
      const firstField = document.getElementById(
        {
          contactName: "c-contactname",
          name: "c-company",
          email: "c-email",
          phone: "c-phone",
          iType: "c-itype",
          details: "c-details",
          attachment: "c-files",
        }[Object.keys(e)[0]],
      );
      firstField?.focus();
      firstField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setSubmitError("");
    setStatus("loading");

    // Popup blockers only allow window.open() during the original click's
    // call stack — once we `await` the fetch below, the browser no longer
    // treats a later window.open() as user-initiated and silently blocks it
    // (Safari in particular). Open a blank tab now, synchronously, and
    // point it at the WhatsApp URL once the submission succeeds.
    const waWindow = openWhatsApp ? window.open("", "_blank") : null;
    if (waWindow) waWindow.opener = null; // same effect as noopener, but keeps the reference

    if (!checkFormRateLimit("ke_contact_ts", 5, 3_600_000)) {
      waWindow?.close();
      setSubmitError(content.errors.rateLimited);
      setStatus("error");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      waWindow?.close();
      setSubmitError(content.errors.securityCheck);
      setStatus("error");
      return;
    }
    if (!WEB3FORMS_KEY) {
      waWindow?.close();
      setSubmitError(content.errors.notConfigured);
      setStatus("error");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("access_key", WEB3FORMS_KEY);
      fd.append("botcheck", "");
      if (turnstileToken) fd.append("cf-turnstile-response", turnstileToken);
      fd.append("subject", `New RFQ — ${sanitiseField(iType)} from ${sanitiseField(name)}`);
      fd.append("from_name", "Keshav Enterprises Website");
      fd.append("Contact Name", sanitiseField(contactName));
      fd.append("Company", sanitiseField(name));
      fd.append("Email", sanitiseField(email));
      fd.append("Phone", sanitiseField(`${countryDial} ${phone}`.trim()));
      fd.append("Inquiry", sanitiseField(iType));
      fd.append("Details", sanitiseField(details, 2000));
      if (turbineMake.trim()) fd.append("Turbine Make / Model", sanitiseField(turbineMake));
      const fileInput = document.getElementById("c-files");
      if (fileInput?.files?.length > 0) fd.append("attachment", fileInput.files[0]);

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.success === false)
        throw new Error(data.message || "Web3Forms submission failed");

      if (openWhatsApp) {
        const msg = [
          "*New RFQ — Keshav Enterprises*",
          `Contact: ${sanitiseForWhatsApp(contactName)}`,
          `Company: ${sanitiseForWhatsApp(name)}`,
          `Email: ${sanitiseForWhatsApp(email)}`,
          `Phone: ${sanitiseForWhatsApp(`${countryDial} ${phone}`.trim())}`,
          `Type: ${sanitiseForWhatsApp(iType)}`,
          `Details: ${sanitiseForWhatsApp(details)}`,
        ].join("\n");
        if (waWindow) waWindow.location.href = waMsg(CONTACT_INFO.whatsapp, msg);
        else window.open(waMsg(CONTACT_INFO.whatsapp, msg), "_blank", "noopener");
      }
      setStatus("success");
    } catch (err) {
      waWindow?.close();
      setSubmitError(err?.message || content.errors.submissionFailedGeneric);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl shadow-sm overflow-hidden border border-emerald-200"
      >
        <div className="p-6 bg-emerald-50 text-emerald-800">
          <div className="flex items-center mb-4">
            <CheckCircle2 className="w-8 h-8 mr-4 text-emerald-500 shrink-0" aria-hidden="true" />
            <p className="font-black text-lg">{content.success.heading}</p>
          </div>
          <p className="text-emerald-700 font-semibold text-sm mt-1 mb-4">
            {content.success.bodyPrefix} <strong>{content.success.hours24}</strong>{" "}
            {content.success.bodyMid} <strong>{content.success.hour1}</strong>{" "}
            {content.success.bodySuffix}
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="text-emerald-700 underline text-sm font-bold hover:text-emerald-900 transition-colors"
          >
            {content.success.resendCta}
          </button>
        </div>
        <div className="bg-navy-800 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-slate-300 text-sm font-semibold leading-snug">
            <span className="text-blue-400 font-bold">{content.success.whileYouWaitLabel}</span>{" "}
            {content.success.whileYouWaitText}
          </p>
          <a
            href="/projects"
            className="shrink-0 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-black text-sm hover:bg-blue-700 transition-all flex items-center gap-2 group"
          >
            {content.success.viewCaseStudiesCta}
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {status === "error" && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-8 p-6 bg-red-50 border border-red-200 text-red-800 font-bold rounded-xl flex items-start shadow-sm text-base gap-4"
        >
          <AlertTriangle className="w-7 h-7 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {submitError && (
              <span className="block mb-1 text-sm font-bold text-red-700">{submitError}</span>
            )}
            {content.errors.submissionFailedBanner}{" "}
            <a
              href={`tel:${CONTACT_INFO.phones[0].replace(/\s/g, "")}`}
              className="underline hover:text-red-600 transition-colors"
            >
              {CONTACT_INFO.phones[0]}
            </a>{" "}
            ·{" "}
            <a
              href={waMsg(CONTACT_INFO.whatsapp, content.errors.whatsappFallbackPrefillMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-red-600 transition-colors"
            >
              {content.errors.whatsappFallback}
            </a>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <div>
          <label htmlFor="c-contactname" className={labelCls}>
            {content.labels.yourName} <span aria-hidden="true">*</span>
          </label>
          <input
            id="c-contactname"
            aria-invalid={errors.contactName ? "true" : undefined}
            aria-describedby={errors.contactName ? "c-contactname-error" : undefined}
            type="text"
            autoComplete="name"
            value={contactName}
            onChange={(e) => {
              setContactName(e.target.value);
              clearFieldErr("contactName");
            }}
            placeholder={content.placeholders.yourName}
            className={inputCls}
          />
          {errors.contactName && (
            <p id="c-contactname-error" className="mt-1.5 text-xs font-bold text-red-700">{errors.contactName}</p>
          )}
        </div>
        <div>
          <label htmlFor="c-company" className={labelCls}>
            {content.labels.companyName} <span aria-hidden="true">*</span>
          </label>
          <input
            id="c-company"
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? "c-company-error" : undefined}
            type="text"
            autoComplete="organization"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldErr("name");
            }}
            placeholder={content.placeholders.companyName}
            className={inputCls}
          />
          {errors.name && (
            <p id="c-company-error" className="mt-1.5 text-xs font-bold text-red-700">{errors.name}</p>
          )}
        </div>
        <div>
          <label htmlFor="c-email" className={labelCls}>
            {content.labels.email} <span aria-hidden="true">*</span>
          </label>
          <input
            id="c-email"
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? "c-email-error" : undefined}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldErr("email");
            }}
            placeholder={content.placeholders.email}
            className={inputCls}
          />
          {errors.email && (
            <p id="c-email-error" className="mt-1.5 text-xs font-bold text-red-700">{errors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="c-phone" className={labelCls}>
            {content.labels.phone} <span aria-hidden="true">*</span>
          </label>
          <div className="flex gap-2">
            <select
              id="c-phone-country"
              aria-label="Country code"
              value={countryDial}
              onChange={(e) => setCountryDial(e.target.value)}
              className={`${inputCls} shrink-0 px-2`}
              style={{ width: "6.5rem", flex: "0 0 auto" }}
            >
              {COUNTRY_CODES.map(({ name, iso, dial }) => (
                <option key={iso} value={dial} title={name}>
                  {dial} {iso}
                </option>
              ))}
            </select>
            <input
              id="c-phone"
              aria-invalid={errors.phone ? "true" : undefined}
              aria-describedby={errors.phone ? "c-phone-error" : undefined}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearFieldErr("phone");
              }}
              placeholder={content.placeholders.phone}
              className={`${inputCls} min-w-0`}
              style={{ flex: "1 1 0%" }}
            />
          </div>
          {errors.phone && (
            <p id="c-phone-error" className="mt-1.5 text-xs font-bold text-red-700">{errors.phone}</p>
          )}
        </div>
        <div>
          <label htmlFor="c-itype" className={labelCls}>
            {content.labels.inquiryType} <span aria-hidden="true">*</span>
          </label>
          <select
            id="c-itype"
            aria-invalid={errors.iType ? "true" : undefined}
            aria-describedby={errors.iType ? "c-itype-error" : undefined}
            value={iType}
            onChange={(e) => {
              setIType(e.target.value);
              clearFieldErr("iType");
            }}
            className={inputCls}
          >
            <option value="" disabled>
              {content.placeholders.inquiryTypeSelect}
            </option>
            {content.inquiryTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.iType && (
            <p id="c-itype-error" className="mt-1.5 text-xs font-bold text-red-700">{errors.iType}</p>
          )}
        </div>
        <div>
          <label htmlFor="c-turbine" className={labelCls}>
            {content.labels.turbineMakeModel}
          </label>
          <input
            id="c-turbine"
            type="text"
            value={turbineMake}
            onChange={(e) => setTurbineMake(e.target.value)}
            placeholder={content.placeholders.turbineMakeModel}
            className={inputCls}
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="c-details" className={labelCls}>
            {content.labels.details} <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="c-details"
            aria-invalid={errors.details ? "true" : undefined}
            aria-describedby={errors.details ? "c-details-error" : undefined}
            rows={5}
            maxLength={2000}
            value={details}
            onChange={(e) => {
              setDetails(e.target.value);
              clearFieldErr("details");
            }}
            placeholder={content.placeholders.details}
            className={`${inputCls} resize-none`}
          />
          {/* Live character counter — matches React's ke-char-count treatment */}
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span
              className={`text-xs font-bold ${details.length >= 20 ? "text-emerald-600" : details.length >= 10 ? "text-amber-600" : "text-slate-600"}`}
            >
              {details.length === 0
                ? content.charCounter.minRequired
                : details.length < 20
                  ? (20 - details.length === 1
                      ? content.charCounter.moreNeededOne
                      : content.charCounter.moreNeededMany
                    ).replace("{n}", String(20 - details.length))
                  : content.charCounter.looksGood}
            </span>
            <span className="text-xs font-bold text-slate-600">{details.length} / 2000</span>
          </div>
          {errors.details && (
            <p id="c-details-error" className="mt-1.5 text-xs font-bold text-red-700">{errors.details}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="c-files" className={labelCls}>
            {content.labels.attachments}
          </label>
          <p className="text-xs text-slate-500 font-medium mb-1.5">
            {content.attachmentsHelp}
          </p>
          <input
            id="c-files"
            aria-invalid={errors.attachment ? "true" : undefined}
            aria-describedby={errors.attachment ? "c-files-error" : undefined}
            type="file"
            multiple
            accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
            onChange={() => clearFieldErr("attachment")}
            className={`${inputCls} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-blue-600`}
          />
          {errors.attachment && (
            <p id="c-files-error" className="mt-1.5 text-xs font-bold text-red-700">{errors.attachment}</p>
          )}
        </div>
      </div>

      <TurnstileWidget
        widgetId="contact"
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken("")}
      />

      {/* Live response-time indicator — mirrors useOfficeHours() in App.jsx */}
      <div
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl mb-4 border text-sm font-semibold ${
          officeHours.isOfficeHours
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}
        role="status"
        aria-live="polite"
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${officeHours.isOfficeHours ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}
          aria-hidden="true"
        />
        {officeHours.label}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => submitToWeb3Forms(true)}
          disabled={status === "loading"}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 sm:py-5 rounded-xl text-sm tracking-tight transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center gap-3"
        >
          {status === "loading" ? (
            <>
              <span
                className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"
                aria-hidden="true"
              />
              <span className="font-black text-base">{content.buttons.sendingToEngineer}</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-6 h-6 shrink-0" aria-hidden="true" />
              <span className="flex flex-col items-center text-center leading-tight">
                <span className="font-black text-base sm:text-lg">{content.buttons.sendToEngineer}</span>
                <span className="font-semibold text-xs sm:text-sm text-blue-100 mt-0.5">
                  {content.buttons.sendToEngineerSub}
                </span>
              </span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => submitToWeb3Forms(false)}
          disabled={status === "loading"}
          className="w-full mt-4 bg-slate-900 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-sm tracking-tight transition-all flex flex-col sm:flex-row sm:items-baseline sm:justify-center sm:gap-2 items-center justify-center gap-0.5"
        >
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
            {status === "loading" ? content.buttons.sendingShort : content.buttons.submitWithDrawings}
          </span>
          <span className="font-medium text-xs text-slate-400">
            {content.buttons.submitWithDrawingsSub}
          </span>
        </button>
      </div>

      {/* Risk-reversal block — addresses the four real B2B buyer fears */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        {content.riskReversal.map(({ title, sub }, i) => {
          const Icon = RISK_REVERSAL_ICONS[i];
          return (
            <div key={title} className="flex gap-3 items-start">
              <Icon className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-slate-800 leading-snug">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-500">
        {content.footerNote.text}{" "}
        <a href="/privacy-policy" className="underline underline-offset-2 hover:text-slate-700">
          {content.footerNote.privacyPolicyLink}
        </a>
      </p>
    </div>
  );
}
