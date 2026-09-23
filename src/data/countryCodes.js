// src/data/countryCodes.js
// Curated list for the contact/RFQ phone country-code selector.
// India first (primary audience), then existing export markets
// (Nepal, Uganda), then other commonly-enquiring regions, then
// the rest alphabetically by country name. Not an exhaustive
// ISO list — trimmed to keep the dropdown usable.

export const COUNTRY_CODES = [
  { name: "India", iso: "IN", dial: "+91" },
  { name: "Nepal", iso: "NP", dial: "+977" },
  { name: "Uganda", iso: "UG", dial: "+256" },
  { name: "United Arab Emirates", iso: "AE", dial: "+971" },
  { name: "Saudi Arabia", iso: "SA", dial: "+966" },
  { name: "Qatar", iso: "QA", dial: "+974" },
  { name: "Oman", iso: "OM", dial: "+968" },
  { name: "Kuwait", iso: "KW", dial: "+965" },
  { name: "Bahrain", iso: "BH", dial: "+973" },
  { name: "Bangladesh", iso: "BD", dial: "+880" },
  { name: "Sri Lanka", iso: "LK", dial: "+94" },
  { name: "Pakistan", iso: "PK", dial: "+92" },
  { name: "Kenya", iso: "KE", dial: "+254" },
  { name: "Tanzania", iso: "TZ", dial: "+255" },
  { name: "Nigeria", iso: "NG", dial: "+234" },
  { name: "South Africa", iso: "ZA", dial: "+27" },
  { name: "Ghana", iso: "GH", dial: "+233" },
  { name: "Ethiopia", iso: "ET", dial: "+251" },
  { name: "Egypt", iso: "EG", dial: "+20" },
  { name: "Indonesia", iso: "ID", dial: "+62" },
  { name: "Malaysia", iso: "MY", dial: "+60" },
  { name: "Singapore", iso: "SG", dial: "+65" },
  { name: "Thailand", iso: "TH", dial: "+66" },
  { name: "Vietnam", iso: "VN", dial: "+84" },
  { name: "Philippines", iso: "PH", dial: "+63" },
  { name: "China", iso: "CN", dial: "+86" },
  { name: "Australia", iso: "AU", dial: "+61" },
  { name: "United Kingdom", iso: "GB", dial: "+44" },
  { name: "Germany", iso: "DE", dial: "+49" },
  { name: "France", iso: "FR", dial: "+33" },
  { name: "Netherlands", iso: "NL", dial: "+31" },
  { name: "Spain", iso: "ES", dial: "+34" },
  { name: "Italy", iso: "IT", dial: "+39" },
  { name: "Russia", iso: "RU", dial: "+7" },
  { name: "Turkey", iso: "TR", dial: "+90" },
  { name: "United States", iso: "US", dial: "+1" },
  { name: "Canada", iso: "CA", dial: "+1" },
  { name: "Brazil", iso: "BR", dial: "+55" },
];

export const DEFAULT_COUNTRY_DIAL = "+91";
