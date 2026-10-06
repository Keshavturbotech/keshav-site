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
