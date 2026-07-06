export type CatalogLocale = "en" | "zh";
export type CatalogRegion = "global" | "US" | "CN" | "EU" | "UK" | "JP" | "IN";
export type CatalogKind =
  | "ai_api"
  | "ai_subscription"
  | "consumer_subscription"
  | "developer_subscription";
export type PriceStatus = "published" | "not_published" | "needs_review";
export type CatalogCurrency = "USD" | "CNY" | "EUR" | "GBP" | "JPY" | "INR";
export type BillingPeriod = "month" | "year" | "one_time";

export type LocalizedText = {
  en: string;
  zh: string;
};

export type CatalogPrice = {
  id: string;
  kind: CatalogKind;
  label: LocalizedText;
  region: CatalogRegion;
  status: PriceStatus;
  amount: number | null;
  currency: CatalogCurrency | null;
  billingPeriod: BillingPeriod | null;
  unit: string | null;
  rawText: string;
  sourceUrl: string;
  sourceLabel: string;
  lastCheckedAt: string;
  confidence: "official" | "needs_review";
};

export type CatalogProduct = {
  slug: string;
  name: string;
  displayName: LocalizedText;
  category: CatalogKind;
  websiteUrl: string;
  pricingUrl: string;
  regions: CatalogRegion[];
  prices: CatalogPrice[];
};

export const catalogRegions = ["global", "US", "CN", "EU", "UK", "JP", "IN"] as const;
export const catalogKinds = [
  "ai_api",
  "ai_subscription",
  "consumer_subscription",
  "developer_subscription"
] as const;

const checkedAt = "2026-07-06";

type CatalogPriceInput = Omit<CatalogPrice, "id" | "lastCheckedAt" | "sourceUrl"> & {
  id?: string;
  sourceUrl?: string;
};

type CatalogProductInput = Omit<CatalogProduct, "prices"> &
  (
    | {
        price: CatalogPriceInput;
        prices?: never;
      }
    | {
        price?: never;
        prices: CatalogPriceInput[];
      }
  );

function catalogProduct(input: CatalogProductInput): CatalogProduct {
  const prices: CatalogPriceInput[] =
    "prices" in input && input.prices ? input.prices : [input.price];

  return {
    slug: input.slug,
    name: input.name,
    displayName: input.displayName,
    category: input.category,
    websiteUrl: input.websiteUrl,
    pricingUrl: input.pricingUrl,
    regions: input.regions,
    prices: prices.map((price, index) => ({
      id: price.id ?? (index === 0 ? "primary" : `price-${index + 1}`),
      kind: price.kind,
      label: price.label,
      region: price.region,
      status: price.status,
      amount: price.amount,
      currency: price.currency,
      billingPeriod: price.billingPeriod,
      unit: price.unit,
      rawText: price.rawText,
      sourceUrl: price.sourceUrl ?? input.pricingUrl,
      sourceLabel: price.sourceLabel,
      lastCheckedAt: checkedAt,
      confidence: price.confidence
    }))
  };
}

export const catalogProducts: CatalogProduct[] = [
  catalogProduct({
    slug: "openai",
    name: "OpenAI",
    displayName: { en: "OpenAI", zh: "OpenAI" },
    category: "ai_api",
    websiteUrl: "https://openai.com",
    pricingUrl: "https://developers.openai.com/api/docs/pricing",
    regions: ["global"],
    prices: [
      {
        id: "api-gpt-5-5-standard-short",
        kind: "ai_api",
        label: { en: "GPT-5.5 standard, short context", zh: "GPT-5.5 标准短上下文" },
        region: "global",
        status: "published",
        amount: 5,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "$5.00 / 1M input tokens, $2.50 / 1M cached input tokens, $30.00 / 1M output tokens",
        sourceLabel: "OpenAI API pricing",
        confidence: "official"
      },
      {
        id: "api-gpt-5-5-standard-long",
        kind: "ai_api",
        label: { en: "GPT-5.5 standard, long context", zh: "GPT-5.5 标准长上下文" },
        region: "global",
        status: "published",
        amount: 7.5,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "$7.50 / 1M input tokens, $3.75 / 1M cached input tokens, $45.00 / 1M output tokens",
        sourceLabel: "OpenAI API pricing",
        confidence: "official"
      },
      {
        id: "api-gpt-5-4-standard-short",
        kind: "ai_api",
        label: { en: "GPT-5.4 standard, short context", zh: "GPT-5.4 标准短上下文" },
        region: "global",
        status: "published",
        amount: 1.25,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "$1.25 / 1M input tokens, $0.125 / 1M cached input tokens, $10.00 / 1M output tokens",
        sourceLabel: "OpenAI API pricing",
        confidence: "official"
      },
      {
        id: "api-gpt-5-4-standard-long",
        kind: "ai_api",
        label: { en: "GPT-5.4 standard, long context", zh: "GPT-5.4 标准长上下文" },
        region: "global",
        status: "published",
        amount: 2.5,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "$2.50 / 1M input tokens, $0.25 / 1M cached input tokens, $20.00 / 1M output tokens",
        sourceLabel: "OpenAI API pricing",
        confidence: "official"
      },
      {
        id: "api-gpt-5-4-mini-standard-short",
        kind: "ai_api",
        label: { en: "GPT-5.4 mini standard, short context", zh: "GPT-5.4 mini 标准短上下文" },
        region: "global",
        status: "published",
        amount: 0.75,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "$0.75 / 1M input tokens, $0.075 / 1M cached input tokens, $4.50 / 1M output tokens",
        sourceLabel: "OpenAI API pricing",
        confidence: "official"
      },
      {
        id: "api-gpt-5-4-mini-standard-long",
        kind: "ai_api",
        label: { en: "GPT-5.4 mini standard, long context", zh: "GPT-5.4 mini 标准长上下文" },
        region: "global",
        status: "published",
        amount: 1.5,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "$1.50 / 1M input tokens, $0.15 / 1M cached input tokens, $9.00 / 1M output tokens",
        sourceLabel: "OpenAI API pricing",
        confidence: "official"
      },
      {
        id: "api-gpt-5-4-nano-standard",
        kind: "ai_api",
        label: { en: "GPT-5.4 nano standard", zh: "GPT-5.4 nano 标准" },
        region: "global",
        status: "published",
        amount: 0.1,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "$0.10 / 1M input tokens, $0.01 / 1M cached input tokens, $0.40 / 1M output tokens",
        sourceLabel: "OpenAI API pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "anthropic",
    name: "Anthropic",
    displayName: { en: "Anthropic", zh: "Anthropic" },
    category: "ai_api",
    websiteUrl: "https://www.anthropic.com",
    pricingUrl: "https://www.anthropic.com/pricing",
    regions: ["global", "US"],
    prices: [
      {
        id: "api-fable-5",
        kind: "ai_api",
        label: { en: "Claude Fable 5 input", zh: "Claude Fable 5 输入" },
        region: "global",
        status: "published",
        amount: 10,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "$10 / MTok input, $50 / MTok output; prompt cache write $12.50, read $1",
        sourceLabel: "Anthropic pricing",
        confidence: "official"
      },
      {
        id: "api-opus-4-8",
        kind: "ai_api",
        label: { en: "Claude Opus 4.8 input", zh: "Claude Opus 4.8 输入" },
        region: "global",
        status: "published",
        amount: 5,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "$5 / MTok input, $25 / MTok output; prompt cache write $6.25, read $0.50",
        sourceLabel: "Anthropic pricing",
        confidence: "official"
      },
      {
        id: "api-sonnet-5",
        kind: "ai_api",
        label: { en: "Claude Sonnet 5 input", zh: "Claude Sonnet 5 输入" },
        region: "global",
        status: "published",
        amount: 2,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "$2 / MTok input, $10 / MTok output through August 31, 2026; $3 / $15 standard pricing thereafter",
        sourceLabel: "Anthropic pricing",
        confidence: "official"
      },
      {
        id: "api-haiku-4-5",
        kind: "ai_api",
        label: { en: "Claude Haiku 4.5 input", zh: "Claude Haiku 4.5 输入" },
        region: "global",
        status: "published",
        amount: 1,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "$1 / MTok input, $5 / MTok output; prompt cache write $1.25, read $0.10",
        sourceLabel: "Anthropic pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "deepseek",
    name: "DeepSeek",
    displayName: { en: "DeepSeek", zh: "DeepSeek" },
    category: "ai_api",
    websiteUrl: "https://www.deepseek.com",
    pricingUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    regions: ["global", "CN"],
    prices: [
      {
        id: "api-deepseek-v4-flash-cache-hit",
        kind: "ai_api",
        label: { en: "DeepSeek-V4-Flash input cache hit", zh: "DeepSeek-V4-Flash 输入缓存命中" },
        region: "global",
        status: "published",
        amount: 0.003625,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "$0.003625 / 1M cached input tokens, $0.014 / 1M output tokens",
        sourceLabel: "DeepSeek API pricing",
        confidence: "official"
      },
      {
        id: "api-deepseek-v4-flash-cache-miss",
        kind: "ai_api",
        label: { en: "DeepSeek-V4-Flash input cache miss", zh: "DeepSeek-V4-Flash 输入缓存未命中" },
        region: "global",
        status: "published",
        amount: 0.14,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "$0.14 / 1M input cache miss tokens, $0.28 / 1M output tokens",
        sourceLabel: "DeepSeek API pricing",
        confidence: "official"
      },
      {
        id: "api-deepseek-v4-pro-cache-hit",
        kind: "ai_api",
        label: { en: "DeepSeek-V4-Pro input cache hit", zh: "DeepSeek-V4-Pro 输入缓存命中" },
        region: "global",
        status: "published",
        amount: 0.0028,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "$0.0028 / 1M cached input tokens, $0.010 / 1M output tokens",
        sourceLabel: "DeepSeek API pricing",
        confidence: "official"
      },
      {
        id: "api-deepseek-v4-pro-cache-miss",
        kind: "ai_api",
        label: { en: "DeepSeek-V4-Pro input cache miss", zh: "DeepSeek-V4-Pro 输入缓存未命中" },
        region: "global",
        status: "published",
        amount: 0.435,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "$0.435 / 1M input cache miss tokens, $0.87 / 1M output tokens",
        sourceLabel: "DeepSeek API pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "zhipu-glm",
    name: "Zhipu GLM",
    displayName: { en: "Zhipu GLM", zh: "智谱 GLM" },
    category: "ai_api",
    websiteUrl: "https://bigmodel.cn",
    pricingUrl: "https://bigmodel.cn/pricing",
    regions: ["CN"],
    prices: [
      {
        id: "api-glm-5-1-air",
        kind: "ai_api",
        label: { en: "GLM-5.1-Air input", zh: "GLM-5.1-Air 输入" },
        region: "CN",
        status: "published",
        amount: 1,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "GLM-5.1-Air: ¥1 / 1M input tokens, ¥4 / 1M output tokens on the official pricing page.",
        sourceLabel: "Zhipu BigModel pricing",
        confidence: "official"
      },
      {
        id: "pricing-page-render-review",
        kind: "ai_api",
        label: { en: "Full GLM pricing table", zh: "GLM 完整价格表" },
        region: "CN",
        status: "needs_review",
        amount: null,
        currency: null,
        billingPeriod: null,
        unit: null,
        rawText:
          "Official pricing page was reachable but did not expose the full rendered table to static or Playwright extraction in this environment.",
        sourceLabel: "Zhipu BigModel pricing",
        confidence: "needs_review"
      },
      {
        id: "glm-coding-lite-package",
        kind: "ai_subscription",
        label: { en: "GLM Coding Lite package", zh: "GLM Coding Lite 套餐包" },
        region: "CN",
        status: "published",
        amount: 29.9,
        currency: "CNY",
        billingPeriod: "one_time",
        unit: "10M tokens / 3 months",
        rawText:
          "GLM-5.1 Lite package: ¥29.9 for 10M tokens valid for 3 months; official offer lists original price ¥120.",
        sourceUrl: "https://bigmodel.cn/special_area",
        sourceLabel: "Zhipu special offers",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "kimi",
    name: "Kimi",
    displayName: { en: "Kimi", zh: "Kimi" },
    category: "ai_api",
    websiteUrl: "https://www.moonshot.cn",
    pricingUrl: "https://platform.kimi.com/docs/pricing/chat-k27-code.md",
    regions: ["CN"],
    prices: [
      {
        id: "api-kimi-k2-7-code-cache-miss",
        kind: "ai_api",
        label: { en: "Kimi K2.7 Code input cache miss", zh: "Kimi K2.7 Code 输入缓存未命中" },
        region: "CN",
        status: "published",
        amount: 6.5,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "kimi-k2.7-code: ¥1.30 / 1M cached input tokens, ¥6.50 / 1M cache-miss input tokens, ¥27.00 / 1M output tokens",
        sourceUrl: "https://platform.kimi.com/docs/pricing/chat-k27-code.md",
        sourceLabel: "Kimi K2.7 Code pricing",
        confidence: "official"
      },
      {
        id: "api-kimi-k2-7-code-highspeed-cache-miss",
        kind: "ai_api",
        label: {
          en: "Kimi K2.7 Code HighSpeed input cache miss",
          zh: "Kimi K2.7 Code HighSpeed 输入缓存未命中"
        },
        region: "CN",
        status: "published",
        amount: 13,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "kimi-k2.7-code-highspeed: ¥2.60 / 1M cached input tokens, ¥13.00 / 1M cache-miss input tokens, ¥54.00 / 1M output tokens",
        sourceUrl: "https://platform.kimi.com/docs/pricing/chat-k27-code.md",
        sourceLabel: "Kimi K2.7 Code pricing",
        confidence: "official"
      },
      {
        id: "api-kimi-k2-6-cache-miss",
        kind: "ai_api",
        label: { en: "Kimi K2.6 input cache miss", zh: "Kimi K2.6 输入缓存未命中" },
        region: "CN",
        status: "published",
        amount: 6.5,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "kimi-k2.6: ¥1.10 / 1M cached input tokens, ¥6.50 / 1M cache-miss input tokens, ¥27.00 / 1M output tokens",
        sourceUrl: "https://platform.kimi.com/docs/pricing/chat-k26.md",
        sourceLabel: "Kimi K2.6 pricing",
        confidence: "official"
      },
      {
        id: "api-moonshot-v1-8k",
        kind: "ai_api",
        label: { en: "Moonshot V1 8K input", zh: "Moonshot V1 8K 输入" },
        region: "CN",
        status: "published",
        amount: 2,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "moonshot-v1-8k: ¥2.00 / 1M input tokens, ¥10.00 / 1M output tokens",
        sourceUrl: "https://platform.kimi.com/docs/pricing/chat-v1.md",
        sourceLabel: "Moonshot V1 pricing",
        confidence: "official"
      },
      {
        id: "api-moonshot-v1-32k",
        kind: "ai_api",
        label: { en: "Moonshot V1 32K input", zh: "Moonshot V1 32K 输入" },
        region: "CN",
        status: "published",
        amount: 5,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "moonshot-v1-32k: ¥5.00 / 1M input tokens, ¥20.00 / 1M output tokens",
        sourceUrl: "https://platform.kimi.com/docs/pricing/chat-v1.md",
        sourceLabel: "Moonshot V1 pricing",
        confidence: "official"
      },
      {
        id: "api-moonshot-v1-128k",
        kind: "ai_api",
        label: { en: "Moonshot V1 128K input", zh: "Moonshot V1 128K 输入" },
        region: "CN",
        status: "published",
        amount: 10,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "moonshot-v1-128k: ¥10.00 / 1M input tokens, ¥30.00 / 1M output tokens",
        sourceUrl: "https://platform.kimi.com/docs/pricing/chat-v1.md",
        sourceLabel: "Moonshot V1 pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "google-gemini",
    name: "Google Gemini",
    displayName: { en: "Google Gemini", zh: "Google Gemini" },
    category: "ai_api",
    websiteUrl: "https://ai.google.dev",
    pricingUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    regions: ["global", "US"],
    prices: [
      {
        id: "api-gemini-3-1-pro-preview-short",
        kind: "ai_api",
        label: { en: "Gemini 3.1 Pro Preview input", zh: "Gemini 3.1 Pro Preview 输入" },
        region: "global",
        status: "published",
        amount: 2,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "$2.00 / 1M input tokens, $12.00 / 1M output tokens for prompts <= 200k tokens",
        sourceLabel: "Gemini API pricing",
        confidence: "official"
      },
      {
        id: "api-gemini-3-0-flash-preview",
        kind: "ai_api",
        label: { en: "Gemini 3.0 Flash Preview input", zh: "Gemini 3.0 Flash Preview 输入" },
        region: "global",
        status: "published",
        amount: 0.5,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "$0.50 / 1M input tokens, $3.00 / 1M output tokens for prompts <= 200k tokens",
        sourceLabel: "Gemini API pricing",
        confidence: "official"
      },
      {
        id: "api-gemini-2-5-flash-lite",
        kind: "ai_api",
        label: { en: "Gemini 2.5 Flash-Lite input", zh: "Gemini 2.5 Flash-Lite 输入" },
        region: "global",
        status: "published",
        amount: 0.1,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "$0.10 / 1M input tokens, $0.40 / 1M output tokens for Gemini 2.5 Flash-Lite",
        sourceLabel: "Gemini API pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "xai",
    name: "xAI",
    displayName: { en: "xAI", zh: "xAI" },
    category: "ai_api",
    websiteUrl: "https://x.ai",
    pricingUrl: "https://docs.x.ai/docs/models",
    regions: ["global", "US"],
    prices: [
      {
        id: "api-grok-4-3",
        kind: "ai_api",
        label: { en: "Grok 4.3 input", zh: "Grok 4.3 输入" },
        region: "global",
        status: "published",
        amount: 1.25,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "$1.25 / 1M input tokens, $2.50 / 1M output tokens",
        sourceLabel: "xAI model documentation",
        confidence: "official"
      },
      {
        id: "api-grok-4-3-fast",
        kind: "ai_api",
        label: { en: "Grok 4.3 Fast input", zh: "Grok 4.3 Fast 输入" },
        region: "global",
        status: "published",
        amount: 2,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "$2.00 / 1M input tokens, $10.00 / 1M output tokens",
        sourceLabel: "xAI model documentation",
        confidence: "official"
      },
      {
        id: "api-grok-4-1-fast-non-reasoning",
        kind: "ai_api",
        label: { en: "Grok 4.1 Fast Non-Reasoning input", zh: "Grok 4.1 Fast Non-Reasoning 输入" },
        region: "global",
        status: "published",
        amount: 0.2,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "$0.20 / 1M input tokens, $0.50 / 1M output tokens",
        sourceLabel: "xAI model documentation",
        confidence: "official"
      },
      {
        id: "api-grok-4-1-fast-reasoning",
        kind: "ai_api",
        label: { en: "Grok 4.1 Fast Reasoning input", zh: "Grok 4.1 Fast Reasoning 输入" },
        region: "global",
        status: "published",
        amount: 0.2,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "$0.20 / 1M input tokens, $3.00 / 1M output tokens",
        sourceLabel: "xAI model documentation",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "mistral",
    name: "Mistral",
    displayName: { en: "Mistral", zh: "Mistral" },
    category: "ai_api",
    websiteUrl: "https://mistral.ai",
    pricingUrl: "https://mistral.ai/products/la-plateforme",
    regions: ["global", "EU"],
    price: {
      kind: "ai_api",
      label: { en: "Mistral Small", zh: "Mistral Small" },
      region: "global",
      status: "published",
      amount: 0.15,
      currency: "USD",
      billingPeriod: null,
      unit: "1M tokens",
      rawText: "$0.15 / 1M input tokens, $0.60 / 1M output tokens",
      sourceLabel: "Mistral La Plateforme pricing",
      confidence: "official"
    }
  }),
  catalogProduct({
    slug: "cohere",
    name: "Cohere",
    displayName: { en: "Cohere", zh: "Cohere" },
    category: "ai_api",
    websiteUrl: "https://cohere.com",
    pricingUrl: "https://cohere.com/pricing",
    regions: ["global", "US"],
    price: {
      kind: "ai_api",
      label: { en: "Command model input", zh: "Command 模型输入" },
      region: "global",
      status: "published",
      amount: 1,
      currency: "USD",
      billingPeriod: null,
      unit: "1M tokens",
      rawText: "$1 / 1M input tokens, $2 / 1M output tokens",
      sourceLabel: "Cohere pricing",
      confidence: "official"
    }
  }),
  catalogProduct({
    slug: "together-ai",
    name: "Together AI",
    displayName: { en: "Together AI", zh: "Together AI" },
    category: "ai_api",
    websiteUrl: "https://www.together.ai",
    pricingUrl: "https://www.together.ai/pricing",
    regions: ["global", "US"],
    prices: [
      {
        id: "api-deepseek-v4-pro",
        kind: "ai_api",
        label: { en: "DeepSeek V4 Pro input", zh: "DeepSeek V4 Pro 输入" },
        region: "global",
        status: "published",
        amount: 1.74,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "DeepSeek V4 Pro: $1.74 / 1M input tokens, $0.20 cached input, $3.48 output",
        sourceLabel: "Together AI pricing",
        confidence: "official"
      },
      {
        id: "api-kimi-k2-7-code",
        kind: "ai_api",
        label: { en: "Kimi K2.7 Code input", zh: "Kimi K2.7 Code 输入" },
        region: "global",
        status: "published",
        amount: 0.95,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "Kimi K2.7 Code: $0.95 / 1M input tokens, $0.19 cached input, $4.00 output",
        sourceLabel: "Together AI pricing",
        confidence: "official"
      },
      {
        id: "api-glm-5-2",
        kind: "ai_api",
        label: { en: "GLM-5.2 input", zh: "GLM-5.2 输入" },
        region: "global",
        status: "published",
        amount: 1.4,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "GLM-5.2: $1.40 / 1M input tokens, $0.26 cached input, $4.40 output",
        sourceLabel: "Together AI pricing",
        confidence: "official"
      },
      {
        id: "api-gpt-oss-120b",
        kind: "ai_api",
        label: { en: "GPT OSS 120B input", zh: "GPT OSS 120B 输入" },
        region: "global",
        status: "published",
        amount: 0.15,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "gpt-oss-120B: $0.15 / 1M input tokens, $0.60 output",
        sourceLabel: "Together AI pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "groq",
    name: "Groq",
    displayName: { en: "Groq", zh: "Groq" },
    category: "ai_api",
    websiteUrl: "https://groq.com",
    pricingUrl: "https://groq.com/pricing",
    regions: ["global", "US"],
    prices: [
      {
        id: "api-kimi-k2-instruct-0905",
        kind: "ai_api",
        label: { en: "Kimi K2 Instruct uncached input", zh: "Kimi K2 Instruct 未缓存输入" },
        region: "global",
        status: "published",
        amount: 1,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "moonshotai/kimi-k2-instruct-0905: $1.00 / 1M uncached input tokens, $0.50 cached input, $3.00 output",
        sourceLabel: "Groq pricing",
        confidence: "official"
      },
      {
        id: "api-gpt-oss-120b",
        kind: "ai_api",
        label: { en: "GPT OSS 120B input", zh: "GPT OSS 120B 输入" },
        region: "global",
        status: "published",
        amount: 0.15,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "openai/gpt-oss-120b: $0.15 / 1M uncached input tokens, $0.075 cached input, $0.60 output",
        sourceLabel: "Groq pricing",
        confidence: "official"
      },
      {
        id: "api-gpt-oss-20b",
        kind: "ai_api",
        label: { en: "GPT OSS 20B input", zh: "GPT OSS 20B 输入" },
        region: "global",
        status: "published",
        amount: 0.075,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "openai/gpt-oss-20b: $0.075 / 1M uncached input tokens, $0.0375 cached input, $0.30 output",
        sourceLabel: "Groq pricing",
        confidence: "official"
      },
      {
        id: "api-llama-3-1-8b-instant",
        kind: "ai_api",
        label: { en: "Llama 3.1 8B Instant input", zh: "Llama 3.1 8B Instant 输入" },
        region: "global",
        status: "published",
        amount: 0.05,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "Llama 3.1 8B Instant 128k: $0.05 / 1M input tokens, $0.08 / 1M output tokens",
        sourceLabel: "Groq pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "perplexity",
    name: "Perplexity",
    displayName: { en: "Perplexity", zh: "Perplexity" },
    category: "ai_api",
    websiteUrl: "https://www.perplexity.ai",
    pricingUrl: "https://docs.perplexity.ai/guides/pricing",
    regions: ["global", "US"],
    prices: [
      {
        id: "api-sonar",
        kind: "ai_api",
        label: { en: "Sonar input", zh: "Sonar 输入" },
        region: "global",
        status: "published",
        amount: 1,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "Sonar: $1 / 1M input tokens, $1 / 1M output tokens",
        sourceLabel: "Perplexity API pricing",
        confidence: "official"
      },
      {
        id: "api-sonar-pro",
        kind: "ai_api",
        label: { en: "Sonar Pro input", zh: "Sonar Pro 输入" },
        region: "global",
        status: "published",
        amount: 3,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "Sonar Pro: $3 / 1M input tokens, $15 / 1M output tokens",
        sourceLabel: "Perplexity API pricing",
        confidence: "official"
      },
      {
        id: "api-sonar-reasoning-pro",
        kind: "ai_api",
        label: { en: "Sonar Reasoning Pro input", zh: "Sonar Reasoning Pro 输入" },
        region: "global",
        status: "published",
        amount: 2,
        currency: "USD",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "Sonar Reasoning Pro: $2 / 1M input tokens, $8 / 1M output tokens",
        sourceLabel: "Perplexity API pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "baidu-qianfan",
    name: "Baidu Qianfan",
    displayName: { en: "Baidu Qianfan", zh: "百度千帆" },
    category: "ai_api",
    websiteUrl: "https://cloud.baidu.com/product/wenxinworkshop",
    pricingUrl: "https://cloud.baidu.com/doc/qianfan/s/wmh4sv6ya",
    regions: ["CN"],
    prices: [
      {
        id: "api-ernie-5-1-input",
        kind: "ai_api",
        label: { en: "ERNIE 5.1 input <= 32K", zh: "ERNIE 5.1 输入 <= 32K" },
        region: "CN",
        status: "published",
        amount: 0.004,
        currency: "CNY",
        billingPeriod: null,
        unit: "1K input tokens",
        rawText: "ERNIE 5.1 / ERNIE-5.1: input <= 32K at 0.004 yuan / 1K tokens",
        sourceLabel: "Baidu Qianfan model service pricing",
        confidence: "official"
      },
      {
        id: "api-ernie-4-5-turbo-input",
        kind: "ai_api",
        label: { en: "ERNIE 4.5 Turbo input", zh: "ERNIE 4.5 Turbo 输入" },
        region: "CN",
        status: "published",
        amount: 0.0008,
        currency: "CNY",
        billingPeriod: null,
        unit: "1K input tokens",
        rawText:
          "ERNIE-4.5-Turbo-128K/32K: input 0.0008 yuan / 1K tokens; official table also lists discounted/cache and output columns.",
        sourceLabel: "Baidu Qianfan model service pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "alibaba-tongyi",
    name: "Alibaba Tongyi",
    displayName: { en: "Alibaba Tongyi", zh: "阿里通义" },
    category: "ai_api",
    websiteUrl: "https://www.aliyun.com/product/bailian",
    pricingUrl: "https://help.aliyun.com/zh/model-studio/model-pricing",
    regions: ["CN"],
    prices: [
      {
        id: "api-qwen-turbo-input",
        kind: "ai_api",
        label: { en: "Qwen Turbo input", zh: "Qwen Turbo 输入" },
        region: "CN",
        status: "published",
        amount: 0.3,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "qwen-turbo: 0.3 yuan / 1M input tokens, 0.6 yuan / 1M output tokens",
        sourceLabel: "Alibaba Cloud Model Studio pricing",
        confidence: "official"
      },
      {
        id: "api-qwen-plus-input",
        kind: "ai_api",
        label: { en: "Qwen Plus input", zh: "Qwen Plus 输入" },
        region: "CN",
        status: "published",
        amount: 0.8,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "qwen-plus 0<Token<=128K: 0.8 yuan / 1M input tokens, 2 yuan output, 8 yuan thinking output",
        sourceLabel: "Alibaba Cloud Model Studio pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "tencent-hunyuan",
    name: "Tencent Hunyuan",
    displayName: { en: "Tencent Hunyuan", zh: "腾讯混元" },
    category: "ai_api",
    websiteUrl: "https://cloud.tencent.com/product/hunyuan",
    pricingUrl: "https://cloud.tencent.com/document/product/1729/97731",
    regions: ["CN"],
    prices: [
      {
        id: "api-hunyuan-a13b-input",
        kind: "ai_api",
        label: { en: "Hunyuan-a13b input", zh: "Hunyuan-a13b 输入" },
        region: "CN",
        status: "published",
        amount: 0.5,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "Hunyuan-a13b: input 0.5 yuan / 1M tokens, output 2 yuan / 1M tokens",
        sourceLabel: "Tencent Cloud Hunyuan pricing docs",
        confidence: "official"
      },
      {
        id: "api-hunyuan-role-latest-input",
        kind: "ai_api",
        label: { en: "Hunyuan-role-latest input", zh: "Hunyuan-role-latest 输入" },
        region: "CN",
        status: "published",
        amount: 2.4,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "Hunyuan-role-latest: input 2.4 yuan / 1M tokens, output 9.6 yuan / 1M tokens",
        sourceLabel: "Tencent Cloud Hunyuan pricing docs",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "iflytek-spark",
    name: "iFlytek Spark",
    displayName: { en: "iFlytek Spark", zh: "讯飞星火" },
    category: "ai_api",
    websiteUrl: "https://xinghuo.xfyun.cn",
    pricingUrl: "https://www.xfyun.cn/doc/spark",
    regions: ["CN"],
    price: {
      kind: "ai_api",
      label: { en: "Spark model API", zh: "星火模型 API" },
      region: "CN",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText:
        "Official Spark websocket docs list Lite/Pro/Max/Ultra model endpoints and token accounting, but the official service pricing page returned HTTP 500 and no public price table was available.",
      sourceLabel: "iFlytek Spark documentation",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "minimax",
    name: "MiniMax",
    displayName: { en: "MiniMax", zh: "MiniMax" },
    category: "ai_api",
    websiteUrl: "https://www.minimax.io",
    pricingUrl: "https://platform.minimaxi.com/docs/guides/pricing.md",
    regions: ["global", "CN"],
    prices: [
      {
        id: "speech-hd-plan-1-month",
        kind: "ai_subscription",
        label: { en: "HD speech package 1", zh: "HD 语音套餐一" },
        region: "CN",
        status: "published",
        amount: 630,
        currency: "CNY",
        billingPeriod: "month",
        unit: "2,000,000 characters",
        rawText:
          "HD speech package 1 discounted price ¥630 for 1 month; original ¥700; includes 2,000,000 characters",
        sourceLabel: "MiniMax voice package pricing",
        confidence: "official"
      },
      {
        id: "speech-hd-plan-2-quarter",
        kind: "ai_subscription",
        label: { en: "HD speech package 2", zh: "HD 语音套餐二" },
        region: "CN",
        status: "published",
        amount: 5950,
        currency: "CNY",
        billingPeriod: "one_time",
        unit: "20,000,000 characters / 3 months",
        rawText:
          "HD speech package 2 discounted price ¥5,950 for 3 months; original ¥7,000; includes 20,000,000 characters",
        sourceLabel: "MiniMax voice package pricing",
        confidence: "official"
      },
      {
        id: "llm-api-review",
        kind: "ai_api",
        label: { en: "MiniMax LLM API", zh: "MiniMax 大模型 API" },
        region: "global",
        status: "needs_review",
        amount: null,
        currency: null,
        billingPeriod: null,
        unit: null,
        rawText:
          "Official MiniMax docs expose voice package pricing publicly; the general LLM token pricing page did not expose a stable public table in static or rendered extraction.",
        sourceLabel: "MiniMax platform pricing",
        confidence: "needs_review"
      }
    ]
  }),
  catalogProduct({
    slug: "01-ai",
    name: "01.AI",
    displayName: { en: "01.AI", zh: "零一万物" },
    category: "ai_api",
    websiteUrl: "https://www.01.ai",
    pricingUrl: "https://www.01.ai/en",
    regions: ["global", "CN"],
    price: {
      kind: "ai_api",
      label: { en: "Yi model API", zh: "Yi 模型 API" },
      region: "global",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText:
        "Official 01.AI site and /pricing path returned brand/model copy without public API pricing; platform pricing docs endpoint was not available.",
      sourceLabel: "01.AI official site",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "stepfun",
    name: "StepFun",
    displayName: { en: "StepFun", zh: "阶跃星辰" },
    category: "ai_api",
    websiteUrl: "https://www.stepfun.com",
    pricingUrl: "https://platform.stepfun.com/docs/zh/step-plan/overview.md",
    regions: ["CN"],
    prices: [
      {
        id: "step-plan-flash-mini-monthly",
        kind: "ai_subscription",
        label: { en: "Step Plan Flash Mini", zh: "Step Plan Flash Mini" },
        region: "CN",
        status: "published",
        amount: 49,
        currency: "CNY",
        billingPeriod: "month",
        unit: "400M credits / month",
        rawText: "Flash Mini: ¥49 monthly, ¥129 quarterly, ¥456 yearly; 400M credits monthly",
        sourceLabel: "Step Plan overview",
        confidence: "official"
      },
      {
        id: "step-plan-flash-plus-monthly",
        kind: "ai_subscription",
        label: { en: "Step Plan Flash Plus", zh: "Step Plan Flash Plus" },
        region: "CN",
        status: "published",
        amount: 99,
        currency: "CNY",
        billingPeriod: "month",
        unit: "1600M credits / month",
        rawText: "Flash Plus: ¥99 monthly, ¥269 quarterly, ¥936 yearly; 1600M credits monthly",
        sourceLabel: "Step Plan overview",
        confidence: "official"
      },
      {
        id: "step-plan-flash-pro-monthly",
        kind: "ai_subscription",
        label: { en: "Step Plan Flash Pro", zh: "Step Plan Flash Pro" },
        region: "CN",
        status: "published",
        amount: 199,
        currency: "CNY",
        billingPeriod: "month",
        unit: "8000M credits / month",
        rawText: "Flash Pro: ¥199 monthly, ¥539 quarterly, ¥1860 yearly; 8000M credits monthly",
        sourceLabel: "Step Plan overview",
        confidence: "official"
      },
      {
        id: "step-plan-flash-max-monthly",
        kind: "ai_subscription",
        label: { en: "Step Plan Flash Max", zh: "Step Plan Flash Max" },
        region: "CN",
        status: "published",
        amount: 699,
        currency: "CNY",
        billingPeriod: "month",
        unit: "40000M credits / month",
        rawText: "Flash Max: ¥699 monthly, ¥1889 quarterly, ¥6666 yearly; 40000M credits monthly",
        sourceLabel: "Step Plan overview",
        confidence: "official"
      },
      {
        id: "standard-api-review",
        kind: "ai_api",
        label: { en: "Step standard API", zh: "阶跃标准 API" },
        region: "CN",
        status: "needs_review",
        amount: null,
        currency: null,
        billingPeriod: null,
        unit: null,
        rawText:
          "The former public /docs/pricing path returned 404; the official docs currently publish Step Plan subscription pricing, not a stable standard API token table.",
        sourceLabel: "StepFun platform docs",
        confidence: "needs_review"
      }
    ]
  }),
  catalogProduct({
    slug: "siliconflow",
    name: "SiliconFlow",
    displayName: { en: "SiliconFlow", zh: "硅基流动" },
    category: "ai_api",
    websiteUrl: "https://siliconflow.cn",
    pricingUrl: "https://siliconflow.cn/pricing",
    regions: ["CN", "global"],
    prices: [
      {
        id: "api-glm-5-2",
        kind: "ai_api",
        label: { en: "GLM-5.2 input", zh: "GLM-5.2 输入" },
        region: "CN",
        status: "published",
        amount: 6,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText: "GLM-5.2: ¥6 / 1M input tokens, ¥28 / 1M output tokens",
        sourceLabel: "SiliconFlow pricing",
        confidence: "official"
      },
      {
        id: "api-kimi-k2-7-code",
        kind: "ai_api",
        label: { en: "Kimi K2.7 Code input", zh: "Kimi K2.7 Code 输入" },
        region: "CN",
        status: "published",
        amount: 6.5,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "kimi-k2.7-code: ¥6.5 / 1M input tokens, ¥1.3 cached input, ¥27 output",
        sourceLabel: "SiliconFlow pricing",
        confidence: "official"
      },
      {
        id: "api-deepseek-v4-pro",
        kind: "ai_api",
        label: { en: "DeepSeek-V4-Pro input", zh: "DeepSeek-V4-Pro 输入" },
        region: "CN",
        status: "published",
        amount: 12,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "DeepSeek-V4-Pro: ¥12 / 1M input tokens, ¥0.10 cached input, ¥24 output",
        sourceLabel: "SiliconFlow pricing",
        confidence: "official"
      },
      {
        id: "api-deepseek-v4-flash",
        kind: "ai_api",
        label: { en: "DeepSeek-V4-Flash input", zh: "DeepSeek-V4-Flash 输入" },
        region: "CN",
        status: "published",
        amount: 1,
        currency: "CNY",
        billingPeriod: null,
        unit: "1M input tokens",
        rawText:
          "DeepSeek-V4-Flash: ¥1 / 1M input tokens, ¥0.02 cached input, ¥2 output",
        sourceLabel: "SiliconFlow pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "spotify",
    name: "Spotify",
    displayName: { en: "Spotify", zh: "Spotify" },
    category: "consumer_subscription",
    websiteUrl: "https://www.spotify.com",
    pricingUrl: "https://www.spotify.com/us/premium/",
    regions: ["US", "UK"],
    prices: [
      {
        id: "premium-individual-us",
        kind: "consumer_subscription",
        label: { en: "Premium Individual", zh: "Premium 个人版" },
        region: "US",
        status: "published",
        amount: 12.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$12.99 / month after promotional period",
        sourceLabel: "Spotify Premium US",
        confidence: "official"
      },
      {
        id: "premium-duo-us",
        kind: "consumer_subscription",
        label: { en: "Premium Duo", zh: "Premium 双人版" },
        region: "US",
        status: "published",
        amount: 18.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$18.99 / month after promotional period",
        sourceLabel: "Spotify Premium US",
        confidence: "official"
      },
      {
        id: "premium-family-us",
        kind: "consumer_subscription",
        label: { en: "Premium Family", zh: "Premium 家庭版" },
        region: "US",
        status: "published",
        amount: 21.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$21.99 / month after promotional period",
        sourceLabel: "Spotify Premium US",
        confidence: "official"
      },
      {
        id: "premium-student-us",
        kind: "consumer_subscription",
        label: { en: "Premium Student", zh: "Premium 学生版" },
        region: "US",
        status: "published",
        amount: 6.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$6.99 / month after promotional period",
        sourceLabel: "Spotify Premium US",
        confidence: "official"
      },
      {
        id: "premium-individual-uk",
        kind: "consumer_subscription",
        label: { en: "Premium Individual UK", zh: "Premium 个人版英国" },
        region: "UK",
        status: "published",
        amount: 12.99,
        currency: "GBP",
        billingPeriod: "month",
        unit: null,
        rawText: "£12.99 / month after promotional period",
        sourceUrl: "https://www.spotify.com/uk/premium/",
        sourceLabel: "Spotify Premium UK",
        confidence: "official"
      },
      {
        id: "premium-duo-uk",
        kind: "consumer_subscription",
        label: { en: "Premium Duo UK", zh: "Premium 双人版英国" },
        region: "UK",
        status: "published",
        amount: 17.99,
        currency: "GBP",
        billingPeriod: "month",
        unit: null,
        rawText: "£17.99 / month after promotional period",
        sourceUrl: "https://www.spotify.com/uk/premium/",
        sourceLabel: "Spotify Premium UK",
        confidence: "official"
      },
      {
        id: "premium-family-uk",
        kind: "consumer_subscription",
        label: { en: "Premium Family UK", zh: "Premium 家庭版英国" },
        region: "UK",
        status: "published",
        amount: 21.99,
        currency: "GBP",
        billingPeriod: "month",
        unit: null,
        rawText: "£21.99 / month after promotional period",
        sourceUrl: "https://www.spotify.com/uk/premium/",
        sourceLabel: "Spotify Premium UK",
        confidence: "official"
      },
      {
        id: "premium-student-uk",
        kind: "consumer_subscription",
        label: { en: "Premium Student UK", zh: "Premium 学生版英国" },
        region: "UK",
        status: "published",
        amount: 5.99,
        currency: "GBP",
        billingPeriod: "month",
        unit: null,
        rawText: "£5.99 / month after promotional period",
        sourceUrl: "https://www.spotify.com/uk/premium/",
        sourceLabel: "Spotify Premium UK",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "youtube-premium",
    name: "YouTube Premium",
    displayName: { en: "YouTube Premium", zh: "YouTube Premium" },
    category: "consumer_subscription",
    websiteUrl: "https://www.youtube.com",
    pricingUrl: "https://www.youtube.com/premium",
    regions: ["US", "IN", "JP"],
    prices: [
      {
        id: "premium-individual-us",
        kind: "consumer_subscription",
        label: { en: "Individual plan", zh: "个人套餐" },
        region: "US",
        status: "published",
        amount: 15.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$15.99 / month",
        sourceLabel: "YouTube Premium",
        confidence: "official"
      },
      {
        id: "premium-family-us",
        kind: "consumer_subscription",
        label: { en: "Family plan", zh: "家庭套餐" },
        region: "US",
        status: "published",
        amount: 26.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$26.99 / month",
        sourceLabel: "YouTube Premium",
        confidence: "official"
      },
      {
        id: "premium-student-us",
        kind: "consumer_subscription",
        label: { en: "Student plan", zh: "学生套餐" },
        region: "US",
        status: "published",
        amount: 8.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$8.99 / month",
        sourceLabel: "YouTube Premium",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "netflix",
    name: "Netflix",
    displayName: { en: "Netflix", zh: "Netflix" },
    category: "consumer_subscription",
    websiteUrl: "https://www.netflix.com",
    pricingUrl: "https://help.netflix.com/en/node/24926",
    regions: ["US", "UK", "JP", "IN"],
    prices: [
      {
        id: "standard-with-ads-us",
        kind: "consumer_subscription",
        label: { en: "Standard with ads", zh: "含广告标准套餐" },
        region: "US",
        status: "published",
        amount: 8.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$8.99 / month",
        sourceLabel: "Netflix plans and pricing help",
        confidence: "official"
      },
      {
        id: "standard-us",
        kind: "consumer_subscription",
        label: { en: "Standard", zh: "标准套餐" },
        region: "US",
        status: "published",
        amount: 19.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$19.99 / month",
        sourceLabel: "Netflix plans and pricing help",
        confidence: "official"
      },
      {
        id: "premium-us",
        kind: "consumer_subscription",
        label: { en: "Premium", zh: "高级套餐" },
        region: "US",
        status: "published",
        amount: 26.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$26.99 / month",
        sourceLabel: "Netflix plans and pricing help",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "disney-plus",
    name: "Disney+",
    displayName: { en: "Disney+", zh: "Disney+" },
    category: "consumer_subscription",
    websiteUrl: "https://www.disneyplus.com",
    pricingUrl: "https://help.disneyplus.com/article/disneyplus-price",
    regions: ["US", "UK", "EU", "JP"],
    prices: [
      {
        id: "with-ads-us",
        kind: "consumer_subscription",
        label: { en: "Disney+ with ads", zh: "Disney+ 含广告" },
        region: "US",
        status: "published",
        amount: 11.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$11.99 / month",
        sourceUrl: "https://www.disneyplus.com/welcome/disney-hulu-hbo-max-bundle",
        sourceLabel: "Disney+ plans",
        confidence: "official"
      },
      {
        id: "premium-us",
        kind: "consumer_subscription",
        label: { en: "Disney+ Premium", zh: "Disney+ 高级版" },
        region: "US",
        status: "published",
        amount: 18.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$18.99 / month or $189.99 / year",
        sourceUrl: "https://www.disneyplus.com/welcome/disney-hulu-hbo-max-bundle",
        sourceLabel: "Disney+ plans",
        confidence: "official"
      },
      {
        id: "disney-hulu-bundle-us",
        kind: "consumer_subscription",
        label: { en: "Disney+, Hulu Bundle", zh: "Disney+ 与 Hulu 捆绑包" },
        region: "US",
        status: "published",
        amount: 12.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$12.99 / month after promotional period",
        sourceUrl: "https://www.disneyplus.com/welcome/filter-plans",
        sourceLabel: "Disney+ bundle plans",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "apple-one",
    name: "Apple One",
    displayName: { en: "Apple One", zh: "Apple One" },
    category: "consumer_subscription",
    websiteUrl: "https://www.apple.com/apple-one/",
    pricingUrl: "https://www.apple.com/apple-one/",
    regions: ["US", "UK", "JP", "IN"],
    prices: [
      {
        id: "individual-us",
        kind: "consumer_subscription",
        label: { en: "Individual plan", zh: "个人套餐" },
        region: "US",
        status: "published",
        amount: 19.95,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$19.95 / month",
        sourceLabel: "Apple One",
        confidence: "official"
      },
      {
        id: "family-us",
        kind: "consumer_subscription",
        label: { en: "Family plan", zh: "家庭套餐" },
        region: "US",
        status: "published",
        amount: 25.95,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$25.95 / month",
        sourceLabel: "Apple One",
        confidence: "official"
      },
      {
        id: "premier-us",
        kind: "consumer_subscription",
        label: { en: "Premier plan", zh: "Premier 套餐" },
        region: "US",
        status: "published",
        amount: 37.95,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$37.95 / month",
        sourceLabel: "Apple One",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "amazon-prime",
    name: "Amazon Prime",
    displayName: { en: "Amazon Prime", zh: "Amazon Prime" },
    category: "consumer_subscription",
    websiteUrl: "https://www.amazon.com/amazonprime",
    pricingUrl: "https://www.amazon.com/amazonprime",
    regions: ["US", "UK", "JP", "IN"],
    prices: [
      {
        id: "prime-monthly-us",
        kind: "consumer_subscription",
        label: { en: "Prime monthly", zh: "Prime 月付" },
        region: "US",
        status: "published",
        amount: 14.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$14.99 / month after trial",
        sourceLabel: "Amazon Prime",
        confidence: "official"
      },
      {
        id: "prime-annual-us",
        kind: "consumer_subscription",
        label: { en: "Prime annual", zh: "Prime 年付" },
        region: "US",
        status: "published",
        amount: 139,
        currency: "USD",
        billingPeriod: "year",
        unit: null,
        rawText: "$139 / year after trial",
        sourceLabel: "Amazon Prime",
        confidence: "official"
      },
      {
        id: "prime-student-monthly-us",
        kind: "consumer_subscription",
        label: { en: "Prime Student monthly", zh: "Prime 学生月付" },
        region: "US",
        status: "published",
        amount: 7.49,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$7.49 / month after trial",
        sourceLabel: "Amazon Prime",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "notion",
    name: "Notion",
    displayName: { en: "Notion", zh: "Notion" },
    category: "developer_subscription",
    websiteUrl: "https://www.notion.com",
    pricingUrl: "https://www.notion.com/pricing",
    regions: ["global", "US"],
    prices: [
      {
        id: "plus-monthly",
        kind: "developer_subscription",
        label: { en: "Plus plan", zh: "Plus 套餐" },
        region: "global",
        status: "published",
        amount: 12,
        currency: "USD",
        billingPeriod: "month",
        unit: "per seat",
        rawText: "$12 / seat / month billed monthly",
        sourceLabel: "Notion pricing",
        confidence: "official"
      },
      {
        id: "business-monthly",
        kind: "developer_subscription",
        label: { en: "Business plan", zh: "Business 套餐" },
        region: "global",
        status: "published",
        amount: 24,
        currency: "USD",
        billingPeriod: "month",
        unit: "per seat",
        rawText: "$24 / seat / month billed monthly",
        sourceLabel: "Notion pricing",
        confidence: "official"
      },
      {
        id: "enterprise-contact-sales",
        kind: "developer_subscription",
        label: { en: "Enterprise plan", zh: "Enterprise 套餐" },
        region: "global",
        status: "needs_review",
        amount: null,
        currency: null,
        billingPeriod: null,
        unit: null,
        rawText: "Custom pricing; contact sales on the official pricing page.",
        sourceLabel: "Notion pricing",
        confidence: "needs_review"
      }
    ]
  }),
  catalogProduct({
    slug: "github",
    name: "GitHub",
    displayName: { en: "GitHub", zh: "GitHub" },
    category: "developer_subscription",
    websiteUrl: "https://github.com",
    pricingUrl: "https://github.com/pricing",
    regions: ["global", "US"],
    prices: [
      {
        id: "team-monthly",
        kind: "developer_subscription",
        label: { en: "Team plan", zh: "Team 套餐" },
        region: "global",
        status: "published",
        amount: 4,
        currency: "USD",
        billingPeriod: "month",
        unit: "per user",
        rawText: "$4 / user / month",
        sourceLabel: "GitHub pricing",
        confidence: "official"
      },
      {
        id: "enterprise-cloud-monthly",
        kind: "developer_subscription",
        label: { en: "Enterprise Cloud", zh: "Enterprise Cloud" },
        region: "global",
        status: "published",
        amount: 21,
        currency: "USD",
        billingPeriod: "month",
        unit: "per user",
        rawText: "$21 / user / month",
        sourceLabel: "GitHub pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "cursor",
    name: "Cursor",
    displayName: { en: "Cursor", zh: "Cursor" },
    category: "developer_subscription",
    websiteUrl: "https://cursor.com",
    pricingUrl: "https://cursor.com/pricing",
    regions: ["global", "US"],
    prices: [
      {
        id: "pro-monthly",
        kind: "developer_subscription",
        label: { en: "Pro plan", zh: "Pro 套餐" },
        region: "global",
        status: "published",
        amount: 20,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$20 / month",
        sourceLabel: "Cursor pricing",
        confidence: "official"
      },
      {
        id: "ultra-monthly",
        kind: "developer_subscription",
        label: { en: "Ultra plan", zh: "Ultra 套餐" },
        region: "global",
        status: "published",
        amount: 200,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$200 / month",
        sourceLabel: "Cursor pricing",
        confidence: "official"
      },
      {
        id: "teams-monthly",
        kind: "developer_subscription",
        label: { en: "Teams plan", zh: "Teams 套餐" },
        region: "global",
        status: "published",
        amount: 40,
        currency: "USD",
        billingPeriod: "month",
        unit: "per user",
        rawText: "$40 / user / month",
        sourceLabel: "Cursor pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "chatgpt",
    name: "ChatGPT",
    displayName: { en: "ChatGPT", zh: "ChatGPT" },
    category: "ai_subscription",
    websiteUrl: "https://chatgpt.com",
    pricingUrl: "https://openai.com/chatgpt/pricing/",
    regions: ["global", "US"],
    prices: [
      {
        id: "plus-monthly",
        kind: "ai_subscription",
        label: { en: "ChatGPT Plus", zh: "ChatGPT Plus" },
        region: "global",
        status: "published",
        amount: 20,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$20 / month",
        sourceLabel: "ChatGPT pricing",
        confidence: "official"
      },
      {
        id: "pro-monthly",
        kind: "ai_subscription",
        label: { en: "ChatGPT Pro", zh: "ChatGPT Pro" },
        region: "global",
        status: "published",
        amount: 200,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$200 / month",
        sourceLabel: "ChatGPT pricing",
        confidence: "official"
      },
      {
        id: "business-monthly",
        kind: "ai_subscription",
        label: { en: "ChatGPT Business", zh: "ChatGPT Business" },
        region: "global",
        status: "published",
        amount: 30,
        currency: "USD",
        billingPeriod: "month",
        unit: "per user",
        rawText: "$30 / user / month billed monthly",
        sourceLabel: "ChatGPT pricing",
        confidence: "official"
      }
    ]
  }),
  catalogProduct({
    slug: "claude",
    name: "Claude",
    displayName: { en: "Claude", zh: "Claude" },
    category: "ai_subscription",
    websiteUrl: "https://claude.ai",
    pricingUrl: "https://www.anthropic.com/pricing",
    regions: ["global", "US"],
    prices: [
      {
        id: "pro-monthly",
        kind: "ai_subscription",
        label: { en: "Claude Pro", zh: "Claude Pro" },
        region: "global",
        status: "published",
        amount: 20,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$20 / month",
        sourceLabel: "Anthropic pricing",
        confidence: "official"
      },
      {
        id: "max-monthly",
        kind: "ai_subscription",
        label: { en: "Claude Max", zh: "Claude Max" },
        region: "global",
        status: "published",
        amount: 100,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "From $100 / month",
        sourceLabel: "Anthropic pricing",
        confidence: "official"
      },
      {
        id: "team-monthly",
        kind: "ai_subscription",
        label: { en: "Claude Team", zh: "Claude Team" },
        region: "global",
        status: "published",
        amount: 30,
        currency: "USD",
        billingPeriod: "month",
        unit: "per member",
        rawText: "$30 / member / month billed monthly",
        sourceLabel: "Anthropic pricing",
        confidence: "official"
      }
    ]
  })
];
