// src/hooks/useCurrency.js
// Ported from useCurrency()/useFmtPrice() in App.jsx (line ~7723).
// useSyncExternalStore is the correct primitive here: it lets several
// independently-hydrated islands (Navbar, ProductsGrid, ProductDetailInteractive)
// all subscribe to the one module-level currencyStore singleton without
// needing a shared React tree or Context provider across island boundaries.
import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  subscribeCurrency,
  getCurrencySnapshot,
  selectCurrency,
  ensureRatesLoaded,
  ensureAutoDetect,
} from "../lib/currencyStore";
import { formatPrice as formatPriceWithRates } from "../data/currency";

export function useCurrency() {
  const { code, rates, detectedAuto } = useSyncExternalStore(
    subscribeCurrency,
    getCurrencySnapshot,
    getCurrencySnapshot,
  );

  useEffect(() => {
    ensureRatesLoaded();
    ensureAutoDetect();
  }, []);

  return { code, rates, detectedAuto, select: selectCurrency };
}

// Returns a formatter bound to the live selected currency + live rates.
// Usage: const fmt = useFmtPrice(); then fmt(1500) → "$17.93" or "₹1.5K"
export function useFmtPrice() {
  const { code, rates } = useCurrency();
  return useCallback((inrAmount) => formatPriceWithRates(inrAmount, code, rates), [code, rates]);
}
