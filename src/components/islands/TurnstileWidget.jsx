// src/components/islands/TurnstileWidget.jsx
// Ported from App.jsx (line ~9189). Renders nothing if no site key is
// configured (PUBLIC_TURNSTILE_SITE_KEY empty in .env) — forms work without
// bot protection in that case, same fallback behavior as the original.
import { useEffect, useRef } from "react";

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "";

export default function TurnstileWidget({ onVerify, onExpire, widgetId }) {
  const containerRef = useRef(null);
  const renderIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !containerRef.current) return;

    const render = () => {
      if (!containerRef.current || !window.turnstile) return;
      if (renderIdRef.current != null) return;
      renderIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (...args) => onVerifyRef.current?.(...args),
        "expired-callback": (...args) => onExpireRef.current?.(...args),
        theme: "light",
        size: "normal",
      });
    };

    if (window.turnstile) {
      render();
    } else {
      // Inject the Turnstile script once, then poll for it to be ready.
      if (!document.getElementById("cf-turnstile-script")) {
        const s = document.createElement("script");
        s.id = "cf-turnstile-script";
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
      }
      const t = setInterval(() => {
        if (window.turnstile) {
          clearInterval(t);
          render();
        }
      }, 100);
      return () => {
        clearInterval(t);
        if (renderIdRef.current != null && window.turnstile) {
          window.turnstile.remove(renderIdRef.current);
          renderIdRef.current = null;
        }
      };
    }

    return () => {
      if (renderIdRef.current != null && window.turnstile) {
        window.turnstile.remove(renderIdRef.current);
        renderIdRef.current = null;
      }
    };
  }, [widgetId]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={containerRef} className="mt-3" />;
}
