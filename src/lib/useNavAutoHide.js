// src/lib/useNavAutoHide.js
// Tracks the same "hide on scroll-down, reveal on scroll-up or near-top"
// state that the fixed Navbar uses for itself. Extracted so any other
// fixed/sticky element — e.g. ProjectsFilter's sticky filter bar, which
// sits directly under the navbar — can react to the navbar's *actual*
// current visibility instead of assuming it always occupies a constant
// h-16 (64px) at the top of the viewport. Before this was shared, the
// filter bar stayed pinned at a hardcoded `top: 4rem` even while the
// navbar had scrolled itself off-screen, leaving a dead gap (or visual
// overlap glitch) above the filter bar during a scroll gesture.
//
// Mirrors Navbar.jsx's own listener exactly (100px reveal threshold,
// 350ms settle-to-visible timeout) — keep the two in sync if either ever
// changes, or better, have Navbar.jsx itself call this hook (it does, see
// Navbar.jsx) so there is only one copy of these numbers.
import { useEffect, useRef, useState } from "react";

/**
 * @param {{ forceVisible?: boolean }} [options] - set true while e.g. a
 *   mobile menu or search overlay owned by the caller is open, so the
 *   tracked element doesn't hide itself out from under an open panel.
 * @returns {{ scrolled: boolean, isVisible: boolean }}
 */
export function useNavAutoHide({ forceVisible = false } = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const forceVisibleRef = useRef(forceVisible);

  useEffect(() => {
    forceVisibleRef.current = forceVisible;
  }, [forceVisible]);

  useEffect(() => {
    let scrollTimeout;
    let lastScrollY = window.scrollY;
    let ticking = false;
    const measure = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      lastScrollY = currentScrollY;
      setScrolled(currentScrollY > 20);
      if (currentScrollY < 100 || forceVisibleRef.current) {
        setIsVisible(true);
      } else if (scrollingDown) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsVisible(true), 350);
      ticking = false;
    };
    // rAF-batched — see BackToTopButton.jsx / Navbar.jsx for the same fix
    // and the forced-reflow-insight audit note this responds to.
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return { scrolled, isVisible };
}
