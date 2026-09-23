// src/hooks/useURLFilters.js
//
// Bidirectionally syncs a set of filter/pagination values with the URL query
// string, via history.replaceState, for any client island that filters a
// list and links out to full-navigation detail pages (products, projects,
// blog posts, ...).
//
// Why this exists: without it, filter/page state lives only in React state,
// so a full-page navigation to a detail page followed by browser Back
// remounts the island from scratch and silently resets every filter and the
// current page. Persisting to the URL is what makes Back actually restore
// the view the user was looking at.
//
// Design choices, and the trade-offs they exist to avoid:
//
//  - Uses history.replaceState, never pushState. This keeps the URL for the
//    *current* view up to date without creating a new history entry on
//    every keystroke or page click — otherwise Back would have to be
//    pressed once per filter/page change before it did anything useful,
//    which is worse than the bug this fixes.
//
//  - Only fields marked `debounce: true` (free-text search boxes, numeric
//    price inputs) delay their URL write (350ms, trailing). Discrete
//    actions — clicking a page number, a category chip, a sort option —
//    write immediately. This is decided per *change*, not per field
//    statically: if a debounced field and a discrete field change in the
//    same update (e.g. typing resets the page to 1), the write is
//    immediate. Debouncing discrete actions too would risk a stale URL if
//    the user clicks a page number and then immediately clicks a product
//    before the timer fires — exactly the bug this hook exists to prevent.
//
//  - Any pending debounced write is flushed synchronously on the
//    `pagehide` event, which fires reliably for normal same-tab
//    navigations (clicking a product/post/case-study link), not just tab
//    close. This closes the remaining gap: type a search term, click a
//    result before the debounce timer fires, and the URL is still written
//    before the browser navigates away — so Back restores the real state
//    instead of a stale one.
//
//  - Initial state is read from the URL exactly once (first render, via a
//    lazy computation), not in a mount effect — reading it in an effect
//    means it lands one tick after first paint and after any other mount
//    effect has already run, which is what silently broke a prior version
//    of this fix (a "reset page on filter change" effect firing on mount
//    stomped the just-restored page number).
//
// schema: Array<{
//   key: string,                 // key in the values object passed to sync()
//   param: string,               // URL query param name
//   default: any,                // fallback when the param is absent/invalid
//   parse: (raw: string) => any, // URL string -> state value
//   serialize: (value: any) => string | null | "" | undefined, // state -> URL string ("" / null / undefined omits the param)
//   debounce?: boolean,
// }>
//
// Pass a module-level (or otherwise stable) array as `schema` — it's read
// once for the initial value and otherwise only used inside stable
// callbacks, but isn't itself tracked as a dependency, so a schema that
// changes identity across renders won't be picked up.
import { useCallback, useEffect, useMemo, useRef } from "react";

const DEBOUNCE_MS = 350;

export function useURLFilters(schema) {
  const initial = useMemo(() => {
    if (typeof window === "undefined") {
      return Object.fromEntries(schema.map((f) => [f.key, f.default]));
    }
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(
      schema.map((f) => {
        const raw = params.get(f.param);
        if (raw === null) return [f.key, f.default];
        try {
          const parsed = f.parse(raw);
          return [f.key, parsed === undefined || parsed === null || Number.isNaN(parsed) ? f.default : parsed];
        } catch {
          return [f.key, f.default];
        }
      }),
    );
    // Intentionally run once: this seeds initial React state from the URL
    // on first render only, same contract as a useState lazy initializer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latestValuesRef = useRef(null);
  const prevValuesRef = useRef(null);
  const timerRef = useRef(null);

  const writeNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const values = latestValuesRef.current;
    if (!values || typeof window === "undefined") return;
    const params = new URLSearchParams();
    schema.forEach((f) => {
      const s = f.serialize(values[f.key]);
      if (s !== null && s !== undefined && s !== "") params.set(f.param, String(s));
    });
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    const current = window.location.pathname + window.location.search;
    if (newUrl !== current) window.history.replaceState(null, "", newUrl);
    // schema is expected stable for the component's lifetime; see note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flush a pending debounced write before the page is actually left, so a
  // same-tab navigation can never carry a stale URL for Back to restore.
  useEffect(() => {
    window.addEventListener("pagehide", writeNow);
    return () => {
      window.removeEventListener("pagehide", writeNow);
      writeNow();
    };
  }, [writeNow]);

  // Call with the current value of every field on every render where any of
  // them changed (typically from a single effect with all of them in its
  // dependency array). Decides immediate vs. debounced per-call, based on
  // which fields actually changed since the previous call.
  const sync = useCallback(
    (values) => {
      latestValuesRef.current = values;
      const prev = prevValuesRef.current;
      prevValuesRef.current = values;

      const changedKeys = prev
        ? schema.filter((f) => values[f.key] !== prev[f.key])
        : []; // first call (mount): nothing "changed" — just canonicalize the URL now

      const onlyDebouncedFieldsChanged =
        changedKeys.length > 0 && changedKeys.every((f) => f.debounce);

      if (onlyDebouncedFieldsChanged) {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(writeNow, DEBOUNCE_MS);
      } else {
        writeNow();
      }
    },
    [writeNow],
  );

  return { initial, sync };
}
