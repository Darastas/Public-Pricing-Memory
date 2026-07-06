export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "Never";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(date);
}

export function formatPrice(plan: {
  priceAmount: number | null;
  priceCurrency: string | null;
  billingPeriod: string | null;
  rawPriceText: string | null;
}): string {
  if (plan.rawPriceText) return plan.rawPriceText;
  if (plan.priceAmount === null) return "Custom";
  const currency = plan.priceCurrency ?? "USD";
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(plan.priceAmount);

  return plan.billingPeriod ? `${amount}/${plan.billingPeriod}` : amount;
}

export function severityLabel(severity: string): string {
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  return "Low";
}
