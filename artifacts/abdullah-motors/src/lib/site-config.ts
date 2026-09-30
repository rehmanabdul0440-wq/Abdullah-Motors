export const siteConfig = {
  name: "Abdullah Motors",
  description:
    "Explore available vehicles, book a test drive, and contact the Abdullah Motors team.",
  locale: "en-IN",
  currency: "INR",
  contact: {
    phone: "",
    email: "",
    address: "",
    hours: "",
  },
} as const;

export function formatPrice(value: number): string {
  return new Intl.NumberFormat(siteConfig.locale, {
    style: "currency",
    currency: siteConfig.currency,
    maximumFractionDigits: 0,
  }).format(value);
}