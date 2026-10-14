export const API_URL = import.meta.env.VITE_API_URL ?? "/api";
export const CURRENCY = import.meta.env.VITE_CURRENCY ?? "INR";
export const LOCALE = import.meta.env.VITE_LOCALE ?? "en-IN";

const formatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
});

export const formatPrice = (value) => formatter.format(value);
