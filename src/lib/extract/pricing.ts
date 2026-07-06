export type CurrencyCode = "USD" | "EUR" | "GBP" | "CNY";
export type BillingPeriod = "month" | "year";

export type PriceMention = {
  raw: string;
  amount: number;
  currency: CurrencyCode;
  period?: BillingPeriod;
};

export type ExtractedPricingPlan = {
  name: string;
  priceAmount: number | null;
  priceCurrency: CurrencyCode | null;
  billingPeriod: BillingPeriod | null;
  rawPriceText: string | null;
  features: string[];
  limits: string[];
  isFreeTier: boolean;
  metadata: {
    segment: string[];
    priceMentions: PriceMention[];
  };
};

const PLAN_NAMES = [
  "Free",
  "Hobby",
  "Plus",
  "Pro",
  "Team",
  "Business",
  "Scale",
  "Enterprise",
  "免费",
  "试用",
  "专业版",
  "团队版",
  "企业版"
];

const LIMIT_PATTERN =
  /(limit|limits|request|requests|token|tokens|seat|seats|storage|usage|credit|credits|included|请求数|调用量|存储|席位|包含|额度)/i;

const FEATURE_GATE_PATTERN =
  /(support|sso|audit|permission|role|feature|功能|权限|支持|日志|审计)/i;

const PRICE_PATTERN =
  /([$€£¥])\s*([\d,]+(?:\.\d+)?)\s*(?:(?:\/\s*|\s+per\s+)(month|mo|year|yr)|(?:每\s*(月|年)|每月|每年))?/gi;

export function extractPricingPlans(text: string): ExtractedPricingPlan[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const planStarts = lines
    .map((line, index) => ({ line, index, name: detectPlanName(line) }))
    .filter((entry): entry is { line: string; index: number; name: string } =>
      Boolean(entry.name)
    );

  const plans: ExtractedPricingPlan[] = [];

  for (let i = 0; i < planStarts.length; i += 1) {
    const start = planStarts[i];
    const end = planStarts[i + 1]?.index ?? lines.length;
    const segment = lines.slice(start.index + 1, end);
    plans.push(buildPlan(start.name, segment));
  }

  return plans;
}

export function extractPriceMentions(text: string): PriceMention[] {
  const mentions: PriceMention[] = [];
  for (const match of text.matchAll(PRICE_PATTERN)) {
    const [, symbol, amountText, englishPeriod, chinesePeriod] = match;
    const amount = Number(amountText.replace(/,/g, ""));
    if (!Number.isFinite(amount)) {
      continue;
    }

    mentions.push({
      raw: match[0].trim(),
      amount,
      currency: currencyFromSymbol(symbol),
      period: periodFromText(englishPeriod ?? chinesePeriod ?? match[0])
    });
  }

  return mentions;
}

function buildPlan(name: string, segment: string[]): ExtractedPricingPlan {
  const segmentText = segment.join("\n");
  const priceMentions = extractPriceMentions(segmentText);
  const primaryPrice = priceMentions[0];
  const customPriceLine =
    segment.find((line) => /custom pricing|contact us|联系我们|定制/i.test(line)) ??
    null;
  const isFreeTier =
    /^free$/i.test(name) ||
    name === "免费" ||
    /\bfree\b|免费|trial|试用/i.test(segmentText) ||
    primaryPrice?.amount === 0;

  return {
    name,
    priceAmount: primaryPrice?.amount ?? null,
    priceCurrency: primaryPrice?.currency ?? null,
    billingPeriod: primaryPrice?.period ?? null,
    rawPriceText: primaryPrice?.raw ?? customPriceLine,
    features: segment.filter((line) => FEATURE_GATE_PATTERN.test(line)),
    limits: segment.filter((line) => LIMIT_PATTERN.test(line)),
    isFreeTier,
    metadata: {
      segment,
      priceMentions
    }
  };
}

function detectPlanName(line: string): string | undefined {
  const normalized = line.trim().replace(/[:：]$/, "");
  return PLAN_NAMES.find((planName) => {
    if (/^[\u4e00-\u9fff]+$/.test(planName)) {
      return normalized === planName;
    }

    return normalized.toLowerCase() === planName.toLowerCase();
  });
}

function currencyFromSymbol(symbol: string): CurrencyCode {
  if (symbol === "€") return "EUR";
  if (symbol === "£") return "GBP";
  if (symbol === "¥") return "CNY";
  return "USD";
}

function periodFromText(text: string | undefined): BillingPeriod | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();
  if (lower.includes("year") || lower.includes("yr") || text.includes("年")) {
    return "year";
  }
  if (lower.includes("month") || lower.includes("mo") || text.includes("月")) {
    return "month";
  }
  return undefined;
}
