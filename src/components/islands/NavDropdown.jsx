// src/components/islands/NavDropdown.jsx
// Full port of the original Services/Products/Industries dropdown from
// App.jsx (line ~10587). Navigation is driven entirely by each item's
// precomputed `href` (see NAV_*_MENU in Navbar.jsx) — Products items point
// to /products?category=..., Services/Industries items point to their
// detail pages — so this component no longer needs to know the difference.
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

export default function NavDropdown({
  label,
  items,
  basePath,
  scrolled,
  isActive,
  navigate,
  onClose,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      clearTimeout(timerRef.current);
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(timerRef.current);
    setOpen(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  }, []);

  const handleItemClick = useCallback(
    (item) => {
      setOpen(false);
      onClose?.();
      navigate(item.href ?? basePath);
    },
    [navigate, basePath, onClose],
  );

  const active = isActive(basePath);

  return (
    <nav
      className="relative"
      ref={ref}
      aria-label={label}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => {
          navigate(basePath);
          onClose?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((p) => !p);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        // FIX (UX audit — nav label readability): see Navbar.jsx for context.
        className={`relative flex items-center gap-0.5 px-2 py-1.5 text-[13px] xl:text-[14px] font-bold uppercase tracking-wide transition-all duration-200 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 group whitespace-nowrap ${
          active
            ? scrolled
              ? "text-blue-600"
              : "text-white"
            : scrolled
              ? "text-slate-600 hover:text-slate-900"
              : "text-slate-300 hover:text-white"
        }`}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
        <span
          className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full origin-center transition-transform duration-300 ${active ? "scale-x-75 bg-blue-500" : "scale-x-0 group-hover:scale-x-50 bg-blue-400/60"}`}
          aria-hidden="true"
        />
      </button>

      {open && items?.length > 0 && (
        // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- hover-reveal wrapper; children are real, focusable <a>/<button> elements
        <div
          role="menu"
          aria-label={`${label} menu`}
          className={`absolute top-[calc(100%+10px)] left-0 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-200 py-1 ${label === "Industries" ? "min-w-[16rem]" : "min-w-55"}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => handleItemClick(item)}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 group/item"
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover/item:bg-blue-600 shrink-0 transition-colors"
                aria-hidden="true"
              />
              {item.label}
              {item.isDetail && (
                <ChevronRight
                  className="w-3 h-3 ml-auto text-slate-300 group-hover/item:text-blue-400 transition-colors shrink-0"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                navigate(basePath);
                setOpen(false);
                onClose?.();
              }}
              className="w-full text-left px-4 py-2 text-xs font-black text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 uppercase tracking-wider flex items-center gap-1"
            >
              View all {label}
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
