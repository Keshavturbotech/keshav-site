/**
 * ExitIntentReviewPopup.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in exit-intent layer for Keshav Enterprises website.
 *
 * HOW TO USE IN App.jsx:
 *   1. Import this file:
 *        import ExitIntentReviewPopup from './ExitIntentReviewPopup';
 *        import KeshavReviewForm      from './KeshavEnterprises_ReviewForm_v3';
 *
 *   2. Inside your App() return, add the wrapper ONCE at the very end
 *      (just before the closing </div>):
 *        <ExitIntentReviewPopup ReviewForm={KeshavReviewForm} />
 *
 * EXPERT EXIT-INTENT LOGIC (multi-signal):
 *   • Desktop    — mouseleave toward the browser top chrome (cursor y < 20 px)
 *   • Mobile     — visibilitychange, but only after tab is hidden for > 8 s
 *                  (short WhatsApp checks are ignored — that's normal behaviour)
 *   • Inactivity — 8-minute idle timer reset on any user interaction
 *   • Scroll depth — ALL signals require the user to have scrolled ≥ 60 % of page
 *                    (popup never fires on a shallow bounce)
 *                    iOS momentum scroll now tracked via touchmove event
 *                    Division-by-zero guarded for short/non-scrollable pages
 *   • Rapid back-navigation — popstate fires faster than normal browsing
 *   • pagehide NOT used — fires on every SPA navigation, redundant noise
 *   • Smart suppression:
 *       – Never shows more than once per session (sessionStorage flag)
 *       – Never shows within 90 s of page load (let user settle)
 *       – Respects explicit "don't show again" choice (localStorage, 30 days)
 *       – Never shows on the contact page (App.jsx POPUP_EXCLUDED_PATHS)
 *       – Dismissed automatically after form submission
 *
 * RELIABILITY IMPROVEMENTS:
 *   • hiddenTimer stored in ref — cleared correctly on unmount (no leak)
 *   • mountedRef guards all async callbacks after component unmount
 *   • dismiss() animation guarded — won't setState after unmount
 *   • Web3Forms response body checked (data.success) not just HTTP status
 *   • console.debug gated behind NODE_ENV !== 'production'
 *   • submitted/inquiryOpen reset defensively on every open
 *
 * PROPS:
 *   ReviewForm  (required) — kept for API compatibility; not rendered in popup
 *   minTimeMs   (optional) — minimum ms before popup can fire (default 90000)
 *   idleMs      (optional) — inactivity ms before popup fires (default 480000)
 *   scrollPct   (optional) — scroll depth % required to unlock firing (default 60)
 *   navigate    (optional) — SPA router navigate fn; if provided, "Leave a full review"
 *                            uses it instead of mutating window.location.hash directly
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";

// InquiryPanel is exported from the v3 review form for inline use in the popup.
// Lazy-loaded: ReviewForm.jsx is a large module (full review form + its own
// helpers) that most visitors never need, since InquiryPanel only renders
// after someone actually clicks through from the teaser. A static import
// here pulled that whole chunk into this popup's own dependency chain,
// fetching it as soon as the popup hydrated (client:idle) instead of only
// when inquiryOpen actually becomes true — this was the deepest branch in
// the network dependency tree audit.
const InquiryPanel = lazy(() =>
  import("./ReviewForm.jsx").then((m) => ({ default: m.InquiryPanel })),
);
import { useFocusTrap } from "../../lib/useFocusTrap";
import {
  isAnyEngagementLayerActive,
  markEngagementLayerActive,
  clearEngagementLayerActive,
} from "../../lib/engagementLayerGate";

const ENGAGEMENT_LAYER = "exit-popup";

/* ── Constants ──────────────────────────────────────────────────── */
const SESSION_KEY = "ke_exit_shown_v1"; // shown this session?
const SUPPRESS_KEY = "ke_exit_suppress_v1"; // "don't show again" timestamp
const SUPPRESS_DAYS = 30; // days to honour that choice
const MOUSE_THRESH = 20; // px from top to trigger desktop

/* ── Helpers ────────────────────────────────────────────────────── */
function isSuppressed() {
  try {
    const ts = localStorage.getItem(SUPPRESS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < SUPPRESS_DAYS * 864e5;
  } catch {
    return false;
  }
}

function markSuppressed() {
  try {
    localStorage.setItem(SUPPRESS_KEY, String(Date.now()));
  } catch {
    /* quota */
  }
}

function markShownThisSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
}

function wasShownThisSession() {
  try {
    return !!sessionStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}

/* ── Keyframe CSS — injected once at module load, not on every render ── */
if (typeof document !== "undefined") {
  const STYLE_ID = "ke-exit-intent-styles";
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      @keyframes ke-backdrop-in  { from { opacity: 0 } to { opacity: 1 } }
      @keyframes ke-backdrop-out { from { opacity: 1 } to { opacity: 0 } }
      @keyframes ke-panel-in     { from { opacity: 0; transform: translateY(10px) scale(.99) }
                                   to   { opacity: 1; transform: translateY(0)    scale(1)   } }
      @keyframes ke-panel-out    { from { opacity: 1; transform: translateY(0)    scale(1)   }
                                   to   { opacity: 0; transform: translateY(6px)  scale(.99) } }
      .ke-exit-close-btn:hover  { background: #f1f5f9 !important; color: #0f172a !important; }
      .ke-exit-later-btn:hover  { background: #f1f5f9 !important; }
      .ke-exit-suppress:hover   { opacity: .85; }
    `;
    document.head.appendChild(s);
  }
}

/* ── Component ──────────────────────────────────────────────────── */
export default function ExitIntentReviewPopup({
  minTimeMs = 90_000,
  idleMs = 480_000,
  scrollPct = 60,
  navigate = null, // SPA router — if provided, "full review" link uses it; static site links fall back to a plain href
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false); // for exit animation
  const [dontShow, setDontShow] = useState(false); // checkbox state
  const [submitted, setSubmitted] = useState(false); // form submitted
  const [inquiryOpen, setInquiryOpen] = useState(false); // inline inquiry panel
  // Ref mirror of dontShow — lets dismiss() always read the latest value
  // regardless of when the useCallback was last re-created.
  const dontShowRef = useRef(false);

  const mountedAt = useRef(Date.now());
  const firedRef = useRef(false); // single-fire gate
  const idleTimer = useRef(null);
  const overlayRef = useRef(null);
  const closeButtonRef = useRef(null);
  const scrollDepthRef = useRef(false); // true once user has scrolled ≥ scrollPct
  const hiddenTimerRef = useRef(null); // ref so cleanup can clear it on unmount
  const mountedRef = useRef(true); // guards async callbacks after unmount

  /* ── Unmount guard ────────────────────────────────────────────── */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ── Single-fire gate ─────────────────────────────────────────── */
  const tryFire = useCallback(
    (reason) => {
      if (firedRef.current) return; // already shown
      if (wasShownThisSession()) return; // shown earlier
      if (isSuppressed()) return; // user opted out
      if (Date.now() - mountedAt.current < minTimeMs) return; // too early
      if (!scrollDepthRef.current) return; // user hasn't scrolled far enough
      // FIX (UX audit — overlapping engagement layers): don't stack this on
      // top of the WhatsApp greeting bubble if it's currently showing.
      if (isAnyEngagementLayerActive(ENGAGEMENT_LAYER)) return;

      firedRef.current = true;
      markShownThisSession();
      markEngagementLayerActive(ENGAGEMENT_LAYER);
      if (import.meta.env.DEV) {
        console.debug("[ExitIntent] triggered via:", reason);
      }
      setSubmitted(false); // defensive reset — ensures clean state on every open
      setInquiryOpen(false);
      setOpen(true);

      // Move focus into the overlay for accessibility
      setTimeout(() => closeButtonRef.current?.focus(), 120);
    },
    [minTimeMs],
  );

  /* ── Idle timer ───────────────────────────────────────────────── */
  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => tryFire("idle"), idleMs);
  }, [tryFire, idleMs]);

  /* ── Close helpers ────────────────────────────────────────────── */
  const dismiss = useCallback(() => {
    if (!mountedRef.current) return;
    setClosing(true);
    clearEngagementLayerActive(ENGAGEMENT_LAYER);
    setTimeout(() => {
      if (!mountedRef.current) return;
      setOpen(false);
      setClosing(false);
    }, 320);
    if (dontShowRef.current) markSuppressed();
  }, []);

  const handleSubmitSuccess = useCallback(() => {
    setSubmitted(true);
    setTimeout(dismiss, 2200); // dismiss is stable (reads dontShow via ref)
  }, [dismiss]);

  /* ── Effect: attach all exit-intent signals ───────────────────── */
  useEffect(() => {
    /* Desktop: mouse leaves toward top chrome */
    const onMouseLeave = (e) => {
      if (e.clientY < MOUSE_THRESH) tryFire("mouseleave-top");
    };

    /* Mobile: tab hidden / home button / app switcher
     * Guard: only fire if the tab has been hidden for > 8 s.
     * A quick WhatsApp check typically returns in < 5 s — that's normal
     * behaviour, not exit intent. We start a timer on hide; cancel on show. */
    const HIDDEN_GRACE_MS = 8_000;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenTimerRef.current = setTimeout(
          () => tryFire("visibilitychange-prolonged"),
          HIDDEN_GRACE_MS,
        );
      } else {
        // User came back within the grace window — cancel
        clearTimeout(hiddenTimerRef.current);
      }
    };

    /* pagehide: intentionally NOT used as an exit-intent trigger.
     * It fires on every SPA navigation (popstate handles that) and
     * makes the page bfcache-ineligible if we do real work inside it.
     * App.jsx already registers an empty pagehide listener for bfcache. */

    /* Scroll depth — consolidated handler used by both scroll and touchmove.
     * Guards against division-by-zero on short pages where
     * scrollHeight === clientHeight (scrollable distance is 0).
     * rAF-batched: scrollHeight/clientHeight are layout-triggering reads,
     * so this coalesces repeated scroll/touchmove ticks into at most one
     * measurement per frame (see BackToTopButton.jsx for the same pattern). */
    let scrollDepthTicking = false;
    const measureScrollDepth = () => {
      scrollDepthTicking = false;
      if (scrollDepthRef.current) return;
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) return; // page not tall enough to scroll — skip
      const pct = (el.scrollTop / scrollable) * 100;
      if (pct >= scrollPct) {
        scrollDepthRef.current = true;
        // Don't fire immediately — wait for a later exit-intent signal
      }
    };
    const checkScrollDepth = () => {
      if (scrollDepthRef.current || scrollDepthTicking) return;
      scrollDepthTicking = true;
      requestAnimationFrame(measureScrollDepth);
    };

    /* Rapid back-navigation (popstate fires when history.back() is called).
     * tryFire already requires scrollDepthRef to be true, so no extra guard needed. */
    const onPopState = () => tryFire("back-navigation");

    /* Idle reset events */
    const IDLE_EVENTS = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    IDLE_EVENTS.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));
    resetIdle(); // start the clock

    /* Attach all signals */
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    // scroll covers desktop + Android; touchmove covers iOS momentum scroll
    window.addEventListener("scroll", checkScrollDepth, { passive: true });
    window.addEventListener("touchmove", checkScrollDepth, { passive: true });
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearTimeout(hiddenTimerRef.current);
      window.removeEventListener("scroll", checkScrollDepth);
      window.removeEventListener("touchmove", checkScrollDepth);
      window.removeEventListener("popstate", onPopState);
      IDLE_EVENTS.forEach((ev) => window.removeEventListener(ev, resetIdle));
      clearTimeout(idleTimer.current);
    };
  }, [tryFire, resetIdle, scrollPct]);

  /* ── Trap focus inside overlay while open ─────────────────────── */
  // NOTE: previously this recomputed the focusable-elements list once per
  // `open` toggle and never again, so it went stale the moment the panel's
  // contents changed shape (e.g. opening the inline inquiry form, switching
  // steps, or a validation error appearing/disappearing) — Tab could walk
  // focus onto an element that had since been removed, or skip newly-added
  // ones. useFocusTrap re-queries focusable descendants on every Tab press.
  useFocusTrap(overlayRef, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  /* ── Nothing to render ────────────────────────────────────────── */
  if (!open) return null;

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions --
          standard click-outside-to-dismiss overlay; the equivalent keyboard path is
          Escape (handled in the effect above) plus the visible Close button, not a
          key event on the backdrop itself. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ke-popup-title"
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) dismiss();
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "rgba(15,23,42,.45)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          animation: closing
            ? "ke-backdrop-out .32s ease forwards"
            : "ke-backdrop-in  .25s ease forwards",
        }}
      >
        {/* ── Panel ── */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 540,
            maxHeight: "92dvh",
            overflowY: "auto",
            borderRadius: 18,
            background: "#ffffff",
            boxShadow: "0 32px 80px rgba(0,0,0,.38), 0 0 0 1px rgba(0,0,0,.06)",
            animation: closing
              ? "ke-panel-out .32s cubic-bezier(.4,0,.2,1) forwards"
              : "ke-panel-in  .30s cubic-bezier(.22,1,.36,1) forwards",
          }}
        >
          {/* ── Attention banner ── */}
          {!submitted && (
            <div
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)",
                borderRadius: "18px 18px 0 0",
                padding: "22px 24px 18px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative rings */}
              <div
                style={{
                  position: "absolute",
                  right: -24,
                  top: -24,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,.18)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: -8,
                  top: -8,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,.12)",
                }}
              />

              {/* Calm label — no pulse dot */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {inquiryOpen && (
                  <button
                    type="button"
                    onClick={() => setInquiryOpen(false)}
                    aria-label="Back to feedback"
                    style={{
                      background: "rgba(255,255,255,.15)",
                      border: "1px solid rgba(255,255,255,.25)",
                      borderRadius: 6,
                      color: "#fff",
                      cursor: "pointer",
                      padding: "2px 10px 2px 6px",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "'Outfit', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    ← Back
                  </button>
                )}
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,.6)",
                  }}
                >
                  {inquiryOpen ? "Product Inquiry" : "Quick feedback"}
                </span>
              </div>

              <h2
                id="ke-popup-title"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 21,
                  fontWeight: 800,
                  color: "#ffffff",
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                {inquiryOpen ? (
                  <>
                    Inquire about our
                    <br />
                    <span style={{ color: "#bfdbfe" }}>products</span>
                  </>
                ) : (
                  <>
                    How was your experience
                    <br />
                    <span style={{ color: "#bfdbfe" }}>with Keshav Enterprises?</span>
                  </>
                )}
              </h2>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  color: "rgba(255,255,255,.75)",
                  margin: "8px 0 0",
                  lineHeight: 1.5,
                }}
              >
                {inquiryOpen
                  ? "Select products, add your requirements, and we'll respond with pricing & availability."
                  : "Your feedback takes 2 minutes and helps us serve you better. Rate our products, services, or report an issue."}
              </p>

              {/* Close button */}
              <button
                ref={closeButtonRef}
                type="button"
                onClick={dismiss}
                aria-label="Close feedback popup"
                className="ke-exit-close-btn"
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,.25)",
                  background: "rgba(255,255,255,.12)",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background .18s, color .18s",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 18,
                  fontWeight: 300,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* ── Form or Thank-you ── */}
          <div style={{ padding: submitted ? 32 : 0 }}>
            {submitted ? (
              /* Thank-you screen after submit */
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#f0fdf4",
                    border: "2px solid #bbf7d0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    fontSize: 28,
                  }}
                >
                  ✓
                </div>
                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "0 0 8px",
                  }}
                >
                  Thank you!
                </h3>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    color: "#64748b",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Your review has been submitted. We truly appreciate
                  <br />
                  you taking the time to share your experience.
                </p>
              </div>
            ) : /*
             * Lightweight teaser — just a star rating + optional one-liner.
             * Keeps the popup under 30 s to interact with. On submit we show
             * the thank-you screen; a "Leave a full review" link opens the
             * review form page directly for users who want to say more.
             */
            inquiryOpen ? (
              <Suspense
                fallback={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 160,
                      color: "#94a3b8",
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                    }}
                  >
                    Loading…
                  </div>
                }
              >
                <InquiryPanel
                  prefill={{}}
                  onBack={() => setInquiryOpen(false)}
                  onSubmitSuccess={handleSubmitSuccess}
                />
              </Suspense>
            ) : (
              <PopupTeaserForm
                onSubmitSuccess={handleSubmitSuccess}
                onDismiss={dismiss}
                navigate={navigate}
                onInquiry={() => setInquiryOpen(true)}
              />
            )}
          </div>

          {/* ── "Don't show again" footer ── */}
          {!submitted && (
            <div
              style={{
                padding: "10px 20px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid #f1f5f9",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <label
                className="ke-exit-suppress"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  userSelect: "none",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 11.5,
                  color: "#94a3b8",
                  transition: "opacity .15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={dontShow}
                  onChange={(e) => {
                    setDontShow(e.target.checked);
                    dontShowRef.current = e.target.checked;
                  }}
                  style={{ accentColor: "#1d4ed8", width: 13, height: 13 }}
                />
                Don&apos;t show this again for 30 days
              </label>

              <button
                type="button"
                onClick={dismiss}
                className="ke-exit-later-btn"
                style={{
                  background: "none",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "5px 14px",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "background .15s",
                }}
              >
                Maybe later
              </button>
            </div>
          )}
        </div>
        {/* /panel */}
      </div>
      {/* /backdrop */}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PopupTeaserForm
   Lightweight 2-field form: star rating + optional one-liner comment.
   Submits to Web3Forms (same key as the full review form).
   A "Leave a full review" link navigates to the /review page for
   users who want to say more — keeps the popup itself friction-free.
   ───────────────────────────────────────────────────────────────── */
const STARS = [1, 2, 3, 4, 5];
const STAR_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];
// Same key used across the site (ContactForm, InlineRFQForm, ReviewForm) — safe to share (tied to email, not a password)
const WEB3FORMS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY || "YOUR_WEB3FORMS_KEY_HERE";

if (import.meta.env.DEV && WEB3FORMS_KEY === "YOUR_WEB3FORMS_KEY_HERE") {
  console.warn(
    "[ExitIntentReviewPopup] WEB3FORMS_KEY is still a placeholder. " +
      "Get a free key at https://web3forms.com and replace it before deploying.",
  );
}

function PopupTeaserForm({ onSubmitSuccess, onDismiss, navigate, onInquiry }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const active = hovered || rating;

  const handleSubmit = useCallback(async () => {
    if (!rating) {
      setError("Please select a star rating.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const body = new FormData();
      body.append("access_key", WEB3FORMS_KEY);
      body.append("subject", `Keshav Enterprises — Quick popup rating: ${rating}/5`);
      body.append("rating", String(rating));
      body.append("comment", comment.trim() || "(none)");
      body.append("source", "exit-intent-popup");
      const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body });
      const data = await res.json();
      // Web3Forms returns HTTP 200 even on failure — must check data.success
      if (!res.ok || !data.success) throw new Error(data.message || "Submission failed");
      onSubmitSuccess();
    } catch {
      setError("Submission failed — please try again.");
    } finally {
      setBusy(false);
    }
  }, [rating, comment, onSubmitSuccess]);

  const ff = "'Outfit', sans-serif";

  return (
    <div style={{ padding: "20px 24px 4px" }}>
      {/* Star radio group — native <input type="radio"> gives arrow-key navigation
          and correct screen reader semantics for free. Visually hidden inputs +
          styled SVG labels provide the custom star appearance. */}
      <fieldset style={{ border: "none", padding: 0, margin: "0 0 6px" }}>
        <legend
          style={{
            display: "block",
            fontFamily: ff,
            fontSize: 11.5,
            fontWeight: 700,
            color: "#64748b",
            marginBottom: 10,
            textAlign: "center",
            width: "100%",
          }}
        >
          Overall experience{" "}
          <span aria-hidden="true" style={{ color: "#ef4444" }}>
            *
          </span>
          <span className="sr-only"> (required)</span>
        </legend>
        <div
          style={{ display: "flex", justifyContent: "center", gap: 4 }}
          onMouseLeave={() => setHovered(0)}
        >
          {STARS.map((n) => (
            <label
              key={n}
              aria-label={`${n} star${n > 1 ? "s" : ""} — ${STAR_LABELS[n - 1]}`}
              style={{
                cursor: "pointer",
                transition: "transform .12s",
                transform: active >= n ? "scale(1.18)" : "scale(1)",
                display: "inline-flex",
              }}
              onMouseEnter={() => setHovered(n)}
            >
              <input
                type="radio"
                name="ke-popup-rating"
                value={n}
                checked={rating === n}
                onChange={() => {
                  setRating(n);
                  setError("");
                }}
                required
                style={{
                  // Visually hidden but still in the a11y tree and keyboard-focusable.
                  // clip+overflow hides it; border:0+padding:0 prevent any layout bleed.
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clip: "rect(0,0,0,0)",
                  whiteSpace: "nowrap",
                  border: 0,
                  padding: 0,
                  margin: 0,
                }}
              />
              <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
                  fill={active >= n ? "#f59e0b" : "#e2e8f0"}
                  stroke={active >= n ? "#d97706" : "#cbd5e1"}
                  strokeWidth="1"
                />
              </svg>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Star label */}
      <p
        style={{
          fontFamily: ff,
          fontSize: 12,
          color: "#64748b",
          textAlign: "center",
          margin: "0 0 14px",
          minHeight: 18,
          transition: "opacity .15s",
          opacity: active ? 1 : 0,
        }}
      >
        {active ? STAR_LABELS[active - 1] : ""}
      </p>

      {/* Optional comment */}
      <textarea
        placeholder="Anything specific to share? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={280}
        rows={2}
        aria-label="Optional comment"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "9px 12px",
          borderRadius: 8,
          border: "1.5px solid #e2e8f0",
          fontFamily: ff,
          fontSize: 13,
          color: "#0f172a",
          background: "#f8fafc",
          resize: "none",
          outline: "none",
          lineHeight: 1.5,
          marginBottom: error ? 6 : 14,
        }}
      />

      {/* Inline error */}
      {error && (
        <p
          role="alert"
          style={{
            fontFamily: ff,
            fontSize: 12,
            color: "#ef4444",
            margin: "0 0 10px",
          }}
        >
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy}
        style={{
          width: "100%",
          padding: "11px 0",
          borderRadius: 9,
          background: rating ? "#1d4ed8" : "#94a3b8",
          color: "#ffffff",
          border: "none",
          cursor: rating ? "pointer" : "default",
          fontFamily: ff,
          fontSize: 14,
          fontWeight: 700,
          transition: "background .2s, opacity .2s",
          opacity: busy ? 0.7 : 1,
          marginBottom: 12,
        }}
      >
        {busy ? "Sending…" : "Send feedback"}
      </button>

      {/* Full-form link */}
      <p
        style={{
          fontFamily: ff,
          fontSize: 12,
          color: "#94a3b8",
          textAlign: "center",
          margin: "0 0 4px",
        }}
      >
        Want to say more?{" "}
        <a
          href="/review"
          style={{ color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}
          onClick={(e) => {
            e.preventDefault();
            // Dismiss the popup first so it doesn't sit on top of the review page.
            // Then navigate via the SPA router if available, falling back to a real URL.
            onDismiss?.();
            if (navigate) navigate("/review");
            else window.location.assign("/review");
          }}
        >
          Leave a full review
        </a>
      </p>

      {/* Inquiry shortcut */}
      <div style={{ padding: "8px 0 6px", borderTop: "1px solid #f1f5f9", marginTop: 8 }}>
        <button
          type="button"
          onClick={onInquiry}
          style={{
            width: "100%",
            padding: "9px 0",
            borderRadius: 9,
            background: "#f0fdf4",
            border: "1.5px solid #bbf7d0",
            color: "#15803d",
            cursor: "pointer",
            fontFamily: ff,
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "background .18s",
          }}
        >
          🛒 Inquire about our Products
        </button>
        <p
          style={{
            fontFamily: ff,
            fontSize: 11,
            color: "#94a3b8",
            textAlign: "center",
            margin: "5px 0 0",
          }}
        >
          Get pricing &amp; availability for any of our products
        </p>
      </div>
    </div>
  );
}
