export type CurrencyCode = "INR" | "USD";

const usdInrRate = Number(process.env.NEXT_PUBLIC_USD_INR_RATE ?? "83");

export const formatAmount = (majorAmount: number, currency: CurrencyCode): string =>
  new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(majorAmount);

export const formatPaise = (farePaise: number, currency: CurrencyCode): string => {
  const amount = farePaise / 100;
  if (currency === "INR") {
    return formatAmount(amount, currency);
  }

  return formatAmount(amount / (Number.isFinite(usdInrRate) && usdInrRate > 0 ? usdInrRate : 83), currency);
};

export const formatDateTime = (
  date: string | Date,
  locale = "en-IN",
): string => {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(parsedDate);
};
