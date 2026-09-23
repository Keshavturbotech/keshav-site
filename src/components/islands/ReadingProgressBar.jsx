// src/components/islands/ReadingProgressBar.jsx — ported from BlogPostPage in App.jsx
import { useEffect, useState } from "react";

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    // rAF-batched: see BackToTopButton.jsx for why an unthrottled scroll
    // handler that reads layout (getBoundingClientRect) is a forced-reflow
    // hazard, especially on long article pages where this runs constantly.
    let ticking = false;
    const measure = () => {
      const el = document.getElementById("blog-article-body");
      ticking = false;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const winH = window.innerHeight;
      const scrolled = Math.max(0, winH - top);
      setProgress(Math.min(100, (scrolled / height) * 100));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className="fixed top-0 left-0 z-100 h-1 bg-blue-600 transition-all duration-150"
      style={{ width: `${progress}%` }}
      aria-hidden="true"
    />
  );
}
