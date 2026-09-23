// src/components/islands/MoreDropdown.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function MoreDropdown({ links, scrolled, isActive, handleNav }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
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

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="menu"
        aria-expanded={open}
        // FIX (UX audit — nav label readability): see Navbar.jsx for context.
        className={`flex items-center gap-0.5 px-2 py-1.5 text-[13px] xl:text-[14px] font-bold uppercase tracking-wide rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${scrolled ? "text-slate-600 hover:text-slate-900" : "text-slate-300 hover:text-white"}`}
      >
        More
        <ChevronDown
          aria-hidden="true"
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute top-full right-0 pt-2 w-44 z-50">
          <ul
            role="menu"
            aria-label="More"
            className="bg-white rounded-xl shadow-2xl border border-slate-200 py-2"
          >
            {links.map((link) => (
              <li key={link.name} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    handleNav(link.path);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${isActive(link.path) ? "text-blue-600" : "text-slate-700 hover:bg-blue-50 hover:text-blue-600"}`}
                >
                  {link.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
