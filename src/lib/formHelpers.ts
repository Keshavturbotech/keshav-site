// src/lib/formHelpers.ts
// Shared form utilities — ported from App.jsx (rate limiting, sanitisation, WhatsApp message builder).

export function checkFormRateLimit(storageKey: string, limit = 5, windowMs = 3_600_000): boolean {
  try {
    const now = Date.now();
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const recent = stored.filter((t: number) => now - t < windowMs);
    if (recent.length >= limit) return false;
    recent.push(now);
    localStorage.setItem(storageKey, JSON.stringify(recent));
    return true;
  } catch {
    return true; // localStorage blocked — allow submission
  }
}

// Strips HTML tags, injection chars, and WhatsApp markdown before sending to Web3Forms.
// `max` should match the field's UI maxLength (default 500 for short fields like
// name/email); long-form textareas must pass their own maxLength explicitly or
// user input silently gets cut off well before what the UI promised.
export function sanitiseField(s: unknown, max = 500): string {
  return String(s ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"'`]/g, "")
    .replace(/[*_~]/g, "")
    .trim()
    .slice(0, max);
}

// Lighter sanitiser for WhatsApp message bodies (strips markdown only).
export function sanitiseForWhatsApp(s: unknown): string {
  return String(s ?? "")
    .replace(/[*_~`]/g, "")
    .trim()
    .slice(0, 2000);
}

export function waMsg(whatsappNumber: string, text: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(String(text ?? "").slice(0, 1500))}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Web3Forms submit, hardened. Three failure modes made forms look "broken"
// with a confusing message (or silently):
//   1. A non-JSON reply (network/ad-blocker/proxy HTML page) made res.json()
//      throw "Unexpected token <" — shown raw to the visitor.
//   2. File attachments are a Web3Forms PRO feature. On a free key the whole
//      submission is rejected whenever the visitor attaches a file, so the
//      enquiry was lost. We now retry once WITHOUT the file and tell the
//      team to ask for it by email, so the lead always arrives.
//   3. fetch() rejecting ("Failed to fetch") surfaced as-is.
// Returns { attachmentDropped }. Throws Error(message) with a visitor-safe
// message on real failure.
export async function postWeb3Forms(
  fd: FormData,
): Promise<{ attachmentDropped: boolean }> {
  const send = async (body: FormData) => {
    let res: Response;
    try {
      res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
    } catch {
      throw new Error(
        "Could not reach the form service. Check your connection (or disable ad-blockers for this site) and try again, or contact us on WhatsApp.",
      );
    }
    let data: { success?: boolean; message?: string } | null = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data || data.success === false) {
      throw new Error(data?.message || "Submission failed. Please try again or contact us on WhatsApp.");
    }
  };

  try {
    await send(fd);
    return { attachmentDropped: false };
  } catch (err) {
    if (fd.has("attachment")) {
      const retry = new FormData();
      fd.forEach((value, key) => {
        if (key !== "attachment") retry.append(key, value);
      });
      const file = fd.get("attachment");
      retry.append(
        "Attachment note",
        `Visitor attached "${file instanceof File ? file.name : "a file"}" but it could not be sent (file uploads need a paid Web3Forms plan). Please ask them to email it.`,
      );
      await send(retry); // throws the real error if this fails too
      return { attachmentDropped: true };
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Email + phone validation shared by every form.
//
// Email: always trim first. Mobile keyboards append a trailing space after an
// autocomplete suggestion, and the old regex rejected "name@gmail.com " as
// invalid. The TLD must now be 2+ letters (the old pattern accepted "a@b.c").
export function isValidEmail(raw: unknown): boolean {
  const e = String(raw ?? "").trim();
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/.test(e) && !e.includes("..");
}

const EMAIL_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.in": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
};

/** Returns a corrected address when the domain looks like a common typo, else "". */
export function suggestEmail(raw: unknown): string {
  const e = String(raw ?? "").trim();
  const at = e.lastIndexOf("@");
  if (at < 1) return "";
  const fix = EMAIL_TYPOS[e.slice(at + 1).toLowerCase()];
  return fix ? `${e.slice(0, at)}@${fix}` : "";
}

export type PhoneCheck = { ok: boolean; e164: string; display: string; message: string };

/**
 * Validates a mobile number typed next to a country-code selector.
 * - Strips spaces/dashes/brackets, a leading trunk "0", and a pasted country
 *   code (so "+91 98765 43210", "09876543210" and "919876543210" all work).
 * - India (+91): exactly 10 digits starting 6-9 (Indian mobile numbering).
 * - Everywhere else: total digits incl. country code must fit E.164 (max 15)
 *   and the national part must be at least 6 digits. The old rule (10+ digits
 *   for everyone) wrongly rejected valid 8-9 digit numbers (Oman, UAE, Sri
 *   Lanka, Nepal landlines, etc.) — and this business exports.
 */
export function validatePhone(dial: string, raw: unknown): PhoneCheck {
  const bad = (message: string): PhoneCheck => ({ ok: false, e164: "", display: "", message });
  const cc = String(dial || "").replace(/\D/g, "");
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return bad("Mobile number is required");
  if (String(raw).trim().startsWith("+") && cc && digits.startsWith(cc)) digits = digits.slice(cc.length);
  else if (cc === "91" && digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");
  if (cc === "91") {
    if (!/^[6-9]\d{9}$/.test(digits))
      return bad("Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8 or 9)");
  } else {
    if (digits.length < 6) return bad("This number looks too short. Check the digits and country code");
    if (cc.length + digits.length > 15) return bad("This number looks too long. Check the digits and country code");
  }
  return { ok: true, e164: `+${cc}${digits}`, display: `${dial} ${digits}`.trim(), message: "" };
}
