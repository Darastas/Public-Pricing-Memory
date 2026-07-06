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

const PRICE_UNIT_PATTERN =
  "month|mo|year|yr|1m\\s+tokens?|m\\s+tokens?|million\\s+tokens?|mtok|hour|hr";

const SYMBOL_PRICE_PATTERN = new RegExp(
  `([$€£¥])\\s*([\\d,]+(?:\\.\\d+)?)\\s*(?:(?:\\/\\s*|\\s+per\\s+)(${PRICE_UNIT_PATTERN})|(?:每\\s*(月|年)|每月|每年))?`,
  "gi"
);

const CNY_SUFFIX_PRICE_PATTERN = new RegExp(
  `([\\d,]+(?:\\.\\d+)?)\\s*(?:元|人民币)\\s*(?:(?:\\/\\s*|每\\s*)?(${PRICE_UNIT_PATTERN}|月|年|百万\\s*tokens?|百万tokens))?`,
  "gi"
);

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

  if (planStarts.length === 0) {
    return extractPricedSectionPlans(lines);
  }

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
  for (const match of text.matchAll(SYMBOL_PRICE_PATTERN)) {
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

  for (const match of text.matchAll(CNY_SUFFIX_PRICE_PATTERN)) {
    const [, amountText, unitText] = match;
    const amount = Number(amountText.replace(/,/g, ""));
    if (!Number.isFinite(amount)) {
      continue;
    }

    mentions.push({
      raw: match[0].trim(),
      amount,
      currency: "CNY",
      period: periodFromText(unitText ?? match[0])
    });
  }

  return mentions;
}

function extractPricedSectionPlans(lines: string[]): ExtractedPricingPlan[] {
  const plans: ExtractedPricingPlan[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (extractPriceMentions(line).length === 0) {
      continue;
    }

    const nameMatch =
      findInlinePricedSectionName(line, index) ??
      findNearestPricedSectionName(lines, index);
    if (!nameMatch || seen.has(nameMatch.name)) {
      continue;
    }

    const end = findNextSectionBoundary(lines, index + 1);
    plans.push(buildPlan(nameMatch.name, lines.slice(index, end)));
    seen.add(nameMatch.name);
  }

  return plans;
}

function findNearestPricedSectionName(
  lines: string[],
  priceLineIndex: number
): { name: string; index: number } | null {
  const start = Math.max(0, priceLineIndex - 4);

  for (let index = priceLineIndex - 1; index >= start; index -= 1) {
    const candidate = cleanSectionHeading(lines[index]);
    if (candidate) {
      return { name: candidate, index };
    }
  }

  for (let index = priceLineIndex - 1; index >= start; index -= 1) {
    const candidate = cleanPlanCandidate(lines[index]);
    if (candidate) {
      return { name: candidate, index };
    }
  }

  return null;
}

function findInlinePricedSectionName(
  line: string,
  index: number
): { name: string; index: number } | null {
  const quotedName = line.match(/["'`]([^"'`,]{2,80})["'`]\s*,/);
  const candidate = quotedName ? cleanPlanCandidate(quotedName[1]) : null;

  return candidate ? { name: candidate, index } : null;
}

function findNextSectionBoundary(lines: string[], startIndex: number): number {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (cleanSectionHeading(lines[index])) {
      return index;
    }
  }

  return lines.length;
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

function cleanSectionHeading(line: string): string | null {
  if (!/^#{1,6}\s+\S/.test(line)) {
    return null;
  }

  return cleanPlanCandidate(line.replace(/^#{1,6}\s+/, ""));
}

function cleanPlanCandidate(line: string): string | null {
  const normalized = line
    .trim()
    .replace(/^[-*]\s+/, "")
    .replace(/[:：]$/, "");

  if (!normalized || extractPriceMentions(normalized).length > 0) {
    return null;
  }

  if (/^(pricing|price|input|output|cache hit|cache miss|tokens?|api)$/i.test(normalized)) {
    return null;
  }

  if (normalized.length > 80) {
    return null;
  }

  return normalized;
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
