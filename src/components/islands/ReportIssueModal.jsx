// src/components/islands/ReportIssueModal.jsx
// FIXED: entirely missing from the product detail page — caught via
// screenshot comparison. Full port of ReportIssueModal in App.jsx
// (line ~12546): 4-step wizard (issue type → details → contact → done),
// submits to the same Web3Forms endpoint as the site's other forms.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Flag,
  ImageOff,
  Package,
  Send,
  Wrench,
  X,
} from "lucide-react";
import { checkFormRateLimit, sanitiseField } from "../../lib/formHelpers";
import { useFocusTrap } from "../../lib/useFocusTrap";

const WEB3FORMS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY ?? "";

const ISSUE_TYPES = [
  {
    id: "wrong_info",
    label: "Incorrect Information",
    desc: "Specs, pricing, or description seem wrong",
    icon: AlertTriangle,
  },
  {
    id: "broken_image",
    label: "Image Not Loading",
    desc: "Photo is missing or broken",
    icon: ImageOff,
  },
  {
    id: "out_of_stock",
    label: "Availability Issue",
    desc: "Shows in stock but isn't available",
    icon: Package,
  },
  { id: "other", label: "Something Else", desc: "A different issue not listed here", icon: Wrench },
];

const SEVERITY_CONFIG = {
  wrong_info: { subject: "Incorrect Information Reported" },
  broken_image: { subject: "Broken Image Reported" },
  out_of_stock: { subject: "Availability Issue Reported" },
  other: { subject: "Issue Reported" },
};

export default function ReportIssueModal({ context, onClose }) {
  const [step, setStep] = useState(1);
  const [issueType, setIssueType] = useState(null);
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");
  const modalRef = useRef(null);
  useFocusTrap(modalRef, true); // this component only ever renders while the modal is open

  // BUGFIX: this used to be one effect keyed on [onClose, status]. Because
  // `status` changes on every step of the submit flow (idle → loading →
  // success/error), the whole effect tore down and re-ran each time —
  // toggling body.style.overflow off and back on, and re-stealing focus
  // to the modal container via modalRef.current?.focus() right as the
  // "success" step rendered, yanking focus (and a screen reader's
  // attention) away from wherever the user had actually landed. The
  // scroll lock and initial focus only need to happen once, on mount;
  // only the Escape handler needs to see the latest `status`.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && status !== "loading") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, status]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const goNext = useCallback(() => {
    if (step === 1 && !issueType) {
      setErrMsg("Please select an issue type.");
      return;
    }
    if (step === 2 && !details.trim()) {
      setErrMsg("Please describe the issue.");
      return;
    }
    setErrMsg("");
    setStep((s) => Math.min(s + 1, 4));
  }, [step, issueType, details]);
  const goBack = useCallback(() => {
    setErrMsg("");
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!checkFormRateLimit("ke_report_ts", 5, 3_600_000)) {
      setErrMsg("Too many reports submitted. Please wait an hour before trying again.");
      return;
    }
    setStatus("loading");
    setErrMsg("");
    if (!WEB3FORMS_KEY) {
      setStatus("done");
      setStep(4);
      return;
    }
    try {
      const fd = new FormData();
      fd.append("access_key", WEB3FORMS_KEY);
      fd.append("botcheck", "");
      fd.append(
        "subject",
        `${SEVERITY_CONFIG[issueType]?.subject || "Issue Reported"} — ${sanitiseField(context?.title || "")}`,
      );
      fd.append("from_name", "Keshav Enterprises Website — Issue Report");
      fd.append("Item", sanitiseField(context?.title || ""));
      fd.append("Item URL", typeof window !== "undefined" ? window.location.href : "");
      fd.append("Issue Type", ISSUE_TYPES.find((t) => t.id === issueType)?.label || issueType);
      fd.append("Details", sanitiseField(details, 1000));
      if (name.trim()) fd.append("Reporter Name", sanitiseField(name));
      if (email.trim()) fd.append("Reporter Email", sanitiseField(email));
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Submission failed");
      setStatus("done");
      setStep(4);
    } catch (err) {
      setErrMsg(err?.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }, [issueType, details, name, email, context]);

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={status !== "loading" ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="bg-slate-900 px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4 text-red-400" aria-hidden="true" />
            </div>
            <div>
              <h2 id="report-modal-title" className="text-white font-black text-base leading-snug">
                Report an Issue
              </h2>
              {context?.title && (
                <p className="text-slate-400 text-xs mt-0.5 truncate max-w-56">{context.title}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {step < 4 && (
          <div className="flex gap-1.5 px-6 pt-4" aria-hidden="true">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-blue-600" : "bg-slate-200"}`}
              />
            ))}
          </div>
        )}

        <div className="p-6">
          {errMsg && (
            <div
              role="alert"
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /> {errMsg}
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm font-bold text-slate-700 mb-4">What&apos;s the issue?</p>
              <div className="space-y-2">
                {ISSUE_TYPES.map((t) => {
                  const Icon = t.icon;
                  const selected = issueType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setIssueType(t.id)}
                      className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 mt-0.5 ${selected ? "text-blue-600" : "text-slate-400"}`}
                        aria-hidden="true"
                      />
                      <span>
                        <span className="block font-bold text-sm text-slate-900">{t.label}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">{t.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">Describe the issue</p>
              <textarea
                rows={5}
                maxLength={1000}
                value={details}
                onChange={(e) => {
                  setDetails(e.target.value);
                  setErrMsg("");
                }}
                placeholder="What did you notice? The more detail, the faster we can fix it."
                className={`${inputCls} resize-none`}
                // eslint-disable-next-line jsx-a11y/no-autofocus -- deliberate: this step mounts only once the modal (with its own focus trap) is already open, so it's moving focus within a dialog the user already opened, not stealing it on page load
                autoFocus
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm font-bold text-slate-700 mb-1">Your contact info (optional)</p>
              <p className="text-xs text-slate-500 mb-4">
                Only if you&apos;d like us to follow up once it&apos;s fixed.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputCls}
                  autoComplete="name"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputCls}
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Thanks for the report</h3>
              <p className="text-slate-500 text-sm mb-6">
                We&apos;ll review this and fix it as soon as possible.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="text-blue-600 font-bold text-sm hover:underline"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {step < 4 && (
          <div className="px-6 pb-6 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={status === "loading"}
                className="px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-slate-300 transition-all flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 bg-slate-900 hover:bg-blue-600 text-white font-black py-3 rounded-xl text-sm transition-all"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={status === "loading"}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  "Submitting…"
                ) : (
                  <>
                    <Send className="w-4 h-4" aria-hidden="true" /> Submit Report
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
