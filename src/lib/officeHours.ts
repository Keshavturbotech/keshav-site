// src/lib/officeHours.ts
// Single source of truth for the "are we in business hours right now" check
// (Mon–Sat, 9 AM–7 PM IST). Ported from useOfficeHours() in App.jsx (line
// ~23994). This calculation was previously duplicated verbatim across
// OfficeHoursPill.jsx, ContactOfficeStatus.jsx, and ContactForm.jsx — three
// copies of the same timezone math where the original had one. Each
// consumer still owns its own display text/styling; only the underlying
// boolean lives here now.

export function isOfficeHoursNow(): boolean {
  const now = new Date();
  // IST = UTC + 330 minutes
  const istMs = now.getTime() + (330 + now.getTimezoneOffset()) * 60_000;
  const ist = new Date(istMs);
  const day = ist.getDay(); // 0=Sun … 6=Sat
  const h = ist.getHours();
  return day >= 1 && day <= 6 && h >= 9 && h < 19;
}
