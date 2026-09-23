// src/lib/useFocusTrap.js
// Traps Tab/Shift+Tab focus cycling inside a modal/dialog while it's open, and
// restores focus to whatever triggered it once it closes. Used by
// ReportIssueModal and ExitIntentReviewPopup — both are `role="dialog"
// aria-modal="true"` but previously had nothing stopping a keyboard user from
// tabbing straight past the modal into the page behind it.
import { useEffect } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null, // skip hidden elements (display:none ancestors)
  );
}

/**
 * @param {React.RefObject<HTMLElement>} containerRef - the dialog element to trap focus within
 * @param {boolean} active - whether the trap is currently engaged (e.g. the modal is open)
 */
export function useFocusTrap(containerRef, active) {
  useEffect(() => {
    if (!active) return;

    const previouslyFocused = document.activeElement;

    const onKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable(containerRef.current);
      if (focusable.length === 0) {
        // Nothing focusable inside — keep focus pinned on the container itself.
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (e.shiftKey) {
        if (current === first || !containerRef.current?.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last || !containerRef.current?.contains(current)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore focus to whatever opened the modal, if it's still in the document.
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef]);
}
