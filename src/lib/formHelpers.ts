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
