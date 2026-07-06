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

type CatalogProductInput = Omit<CatalogProduct, "prices"> & {
  price: Omit<CatalogPrice, "id" | "lastCheckedAt" | "sourceUrl"> & {
    id?: string;
    sourceUrl?: string;
  };
};

function catalogProduct(input: CatalogProductInput): CatalogProduct {
  return {
    slug: input.slug,
    name: input.name,
    displayName: input.displayName,
    category: input.category,
    websiteUrl: input.websiteUrl,
    pricingUrl: input.pricingUrl,
    regions: input.regions,
    prices: [
      {
        id: input.price.id ?? "primary",
        kind: input.price.kind,
        label: input.price.label,
        region: input.price.region,
        status: input.price.status,
        amount: input.price.amount,
        currency: input.price.currency,
        billingPeriod: input.price.billingPeriod,
        unit: input.price.unit,
        rawText: input.price.rawText,
        sourceUrl: input.price.sourceUrl ?? input.pricingUrl,
        sourceLabel: input.price.sourceLabel,
        lastCheckedAt: checkedAt,
        confidence: input.price.confidence
      }
    ]
  };
}

const officialReviewText =
  "Official pricing page reviewed; exact public price needs account, region, or model-specific review.";

export const catalogProducts: CatalogProduct[] = [
  catalogProduct({
    slug: "openai",
    name: "OpenAI",
    displayName: { en: "OpenAI", zh: "OpenAI" },
    category: "ai_api",
    websiteUrl: "https://openai.com",
    pricingUrl: "https://openai.com/api/pricing/",
    regions: ["global"],
    price: {
      kind: "ai_api",
      label: { en: "GPT-5.5 input", zh: "GPT-5.5 输入" },
      region: "global",
      status: "published",
      amount: 5,
      currency: "USD",
      billingPeriod: null,
      unit: "1M tokens",
      rawText: "$5.00 / 1M tokens",
      sourceLabel: "OpenAI API pricing",
      confidence: "official"
    }
  }),
  catalogProduct({
    slug: "anthropic",
    name: "Anthropic",
    displayName: { en: "Anthropic", zh: "Anthropic" },
    category: "ai_api",
    websiteUrl: "https://www.anthropic.com",
    pricingUrl: "https://www.anthropic.com/pricing",
    regions: ["global", "US"],
    price: {
      kind: "ai_api",
      label: { en: "Claude Sonnet 5 input", zh: "Claude Sonnet 5 输入" },
      region: "global",
      status: "published",
      amount: 2,
      currency: "USD",
      billingPeriod: null,
      unit: "1M tokens",
      rawText: "$2 / MTok input, $10 / MTok output through August 31, 2026",
      sourceLabel: "Anthropic pricing",
      confidence: "official"
    }
  }),
  catalogProduct({
    slug: "deepseek",
    name: "DeepSeek",
    displayName: { en: "DeepSeek", zh: "DeepSeek" },
    category: "ai_api",
    websiteUrl: "https://www.deepseek.com",
    pricingUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    regions: ["global", "CN"],
    price: {
      kind: "ai_api",
      label: { en: "DeepSeek Chat input cache miss", zh: "DeepSeek Chat 输入缓存未命中" },
      region: "global",
      status: "published",
      amount: 0.27,
      currency: "USD",
      billingPeriod: null,
      unit: "1M tokens",
      rawText: "$0.27 / 1M input tokens cache miss, $1.10 / 1M output tokens",
      sourceLabel: "DeepSeek API pricing",
      confidence: "official"
    }
  }),
  catalogProduct({
    slug: "zhipu-glm",
    name: "Zhipu GLM",
    displayName: { en: "Zhipu GLM", zh: "智谱 GLM" },
    category: "ai_api",
    websiteUrl: "https://bigmodel.cn",
    pricingUrl: "https://bigmodel.cn/pricing",
    regions: ["CN"],
    price: {
      kind: "ai_api",
      label: { en: "GLM API", zh: "GLM API" },
      region: "CN",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "Zhipu BigModel pricing",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "kimi",
    name: "Kimi",
    displayName: { en: "Kimi", zh: "Kimi" },
    category: "ai_api",
    websiteUrl: "https://www.moonshot.cn",
    pricingUrl: "https://platform.moonshot.cn/docs/pricing",
    regions: ["CN"],
    price: {
      kind: "ai_api",
      label: { en: "Kimi API", zh: "Kimi API" },
      region: "CN",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "Moonshot platform pricing",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "google-gemini",
    name: "Google Gemini",
    displayName: { en: "Google Gemini", zh: "Google Gemini" },
    category: "ai_api",
    websiteUrl: "https://ai.google.dev",
    pricingUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    regions: ["global", "US"],
    price: {
      kind: "ai_api",
      label: { en: "Gemini 3.1 Pro input", zh: "Gemini 3.1 Pro 输入" },
      region: "global",
      status: "published",
      amount: 1.25,
      currency: "USD",
      billingPeriod: null,
      unit: "1M tokens",
      rawText: "$1.25 / 1M input tokens, $10 / 1M output tokens for prompts <= 200k tokens",
      sourceLabel: "Gemini API pricing",
      confidence: "official"
    }
  }),
  catalogProduct({
    slug: "xai",
    name: "xAI",
    displayName: { en: "xAI", zh: "xAI" },
    category: "ai_api",
    websiteUrl: "https://x.ai",
    pricingUrl: "https://docs.x.ai/docs/models",
    regions: ["global", "US"],
    price: {
      kind: "ai_api",
      label: { en: "Grok model API", zh: "Grok 模型 API" },
      region: "global",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "xAI model documentation",
      confidence: "needs_review"
    }
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
    price: {
      kind: "ai_api",
      label: { en: "Serverless model pricing", zh: "Serverless 模型价格" },
      region: "global",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "Together AI pricing",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "groq",
    name: "Groq",
    displayName: { en: "Groq", zh: "Groq" },
    category: "ai_api",
    websiteUrl: "https://groq.com",
    pricingUrl: "https://groq.com/pricing",
    regions: ["global", "US"],
    price: {
      kind: "ai_api",
      label: { en: "Groq model API", zh: "Groq 模型 API" },
      region: "global",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "Groq pricing",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "perplexity",
    name: "Perplexity",
    displayName: { en: "Perplexity", zh: "Perplexity" },
    category: "ai_api",
    websiteUrl: "https://www.perplexity.ai",
    pricingUrl: "https://docs.perplexity.ai/guides/pricing",
    regions: ["global", "US"],
    price: {
      kind: "ai_api",
      label: { en: "Sonar API", zh: "Sonar API" },
      region: "global",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "Perplexity API pricing",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "baidu-qianfan",
    name: "Baidu Qianfan",
    displayName: { en: "Baidu Qianfan", zh: "百度千帆" },
    category: "ai_api",
    websiteUrl: "https://cloud.baidu.com/product/wenxinworkshop",
    pricingUrl: "https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html",
    regions: ["CN"],
    price: {
      kind: "ai_api",
      label: { en: "Qianfan model API", zh: "千帆模型 API" },
      region: "CN",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "Baidu Qianfan documentation",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "alibaba-tongyi",
    name: "Alibaba Tongyi",
    displayName: { en: "Alibaba Tongyi", zh: "阿里通义" },
    category: "ai_api",
    websiteUrl: "https://www.aliyun.com/product/bailian",
    pricingUrl: "https://help.aliyun.com/zh/model-studio/models",
    regions: ["CN"],
    price: {
      kind: "ai_api",
      label: { en: "Qwen model API", zh: "通义千问模型 API" },
      region: "CN",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "Alibaba Cloud Model Studio docs",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "tencent-hunyuan",
    name: "Tencent Hunyuan",
    displayName: { en: "Tencent Hunyuan", zh: "腾讯混元" },
    category: "ai_api",
    websiteUrl: "https://cloud.tencent.com/product/hunyuan",
    pricingUrl: "https://cloud.tencent.com/document/product/1729/97731",
    regions: ["CN"],
    price: {
      kind: "ai_api",
      label: { en: "Hunyuan model API", zh: "混元模型 API" },
      region: "CN",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "Tencent Cloud Hunyuan pricing docs",
      confidence: "needs_review"
    }
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
      rawText: officialReviewText,
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
    pricingUrl: "https://www.minimax.io/platform/document/price",
    regions: ["global", "CN"],
    price: {
      kind: "ai_api",
      label: { en: "MiniMax API", zh: "MiniMax API" },
      region: "global",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "MiniMax platform pricing",
      confidence: "needs_review"
    }
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
      rawText: officialReviewText,
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
    pricingUrl: "https://platform.stepfun.com/docs/pricing",
    regions: ["CN"],
    price: {
      kind: "ai_api",
      label: { en: "Step model API", zh: "Step 模型 API" },
      region: "CN",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "StepFun platform pricing",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "siliconflow",
    name: "SiliconFlow",
    displayName: { en: "SiliconFlow", zh: "硅基流动" },
    category: "ai_api",
    websiteUrl: "https://siliconflow.cn",
    pricingUrl: "https://docs.siliconflow.cn/docs/pricing",
    regions: ["CN", "global"],
    price: {
      kind: "ai_api",
      label: { en: "SiliconFlow model API", zh: "硅基流动模型 API" },
      region: "CN",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: null,
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "SiliconFlow pricing docs",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "spotify",
    name: "Spotify",
    displayName: { en: "Spotify", zh: "Spotify" },
    category: "consumer_subscription",
    websiteUrl: "https://www.spotify.com",
    pricingUrl: "https://www.spotify.com/us/premium/",
    regions: ["US"],
    price: {
      kind: "consumer_subscription",
      label: { en: "Premium Individual", zh: "Premium 个人版" },
      region: "US",
      status: "published",
      amount: 11.99,
      currency: "USD",
      billingPeriod: "month",
      unit: null,
      rawText: "$11.99 / month",
      sourceLabel: "Spotify Premium US",
      confidence: "official"
    }
  }),
  catalogProduct({
    slug: "youtube-premium",
    name: "YouTube Premium",
    displayName: { en: "YouTube Premium", zh: "YouTube Premium" },
    category: "consumer_subscription",
    websiteUrl: "https://www.youtube.com",
    pricingUrl: "https://www.youtube.com/premium",
    regions: ["US", "IN", "JP"],
    price: {
      kind: "consumer_subscription",
      label: { en: "Individual plan", zh: "个人套餐" },
      region: "US",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: "month",
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "YouTube Premium",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "netflix",
    name: "Netflix",
    displayName: { en: "Netflix", zh: "Netflix" },
    category: "consumer_subscription",
    websiteUrl: "https://www.netflix.com",
    pricingUrl: "https://help.netflix.com/en/node/24926",
    regions: ["US", "UK", "JP", "IN"],
    price: {
      kind: "consumer_subscription",
      label: { en: "Plan prices", zh: "会员套餐价格" },
      region: "US",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: "month",
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "Netflix plans and pricing help",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "disney-plus",
    name: "Disney+",
    displayName: { en: "Disney+", zh: "Disney+" },
    category: "consumer_subscription",
    websiteUrl: "https://www.disneyplus.com",
    pricingUrl: "https://help.disneyplus.com/article/disneyplus-price",
    regions: ["US", "UK", "EU", "JP"],
    price: {
      kind: "consumer_subscription",
      label: { en: "Disney+ plan prices", zh: "Disney+ 套餐价格" },
      region: "US",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: "month",
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "Disney+ pricing help",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "apple-one",
    name: "Apple One",
    displayName: { en: "Apple One", zh: "Apple One" },
    category: "consumer_subscription",
    websiteUrl: "https://www.apple.com/apple-one/",
    pricingUrl: "https://www.apple.com/apple-one/",
    regions: ["US", "UK", "JP", "IN"],
    price: {
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
    }
  }),
  catalogProduct({
    slug: "amazon-prime",
    name: "Amazon Prime",
    displayName: { en: "Amazon Prime", zh: "Amazon Prime" },
    category: "consumer_subscription",
    websiteUrl: "https://www.amazon.com/amazonprime",
    pricingUrl: "https://www.amazon.com/amazonprime",
    regions: ["US", "UK", "JP", "IN"],
    price: {
      kind: "consumer_subscription",
      label: { en: "Prime monthly", zh: "Prime 月付" },
      region: "US",
      status: "needs_review",
      amount: null,
      currency: null,
      billingPeriod: "month",
      unit: null,
      rawText: officialReviewText,
      sourceLabel: "Amazon Prime",
      confidence: "needs_review"
    }
  }),
  catalogProduct({
    slug: "notion",
    name: "Notion",
    displayName: { en: "Notion", zh: "Notion" },
    category: "developer_subscription",
    websiteUrl: "https://www.notion.com",
    pricingUrl: "https://www.notion.com/pricing",
    regions: ["global", "US"],
    price: {
      kind: "developer_subscription",
      label: { en: "Plus plan", zh: "Plus 套餐" },
      region: "global",
      status: "published",
      amount: 10,
      currency: "USD",
      billingPeriod: "month",
      unit: "per seat",
      rawText: "$10 / seat / month billed monthly",
      sourceLabel: "Notion pricing",
      confidence: "official"
    }
  }),
  catalogProduct({
    slug: "github",
    name: "GitHub",
    displayName: { en: "GitHub", zh: "GitHub" },
    category: "developer_subscription",
    websiteUrl: "https://github.com",
    pricingUrl: "https://github.com/pricing",
    regions: ["global", "US"],
    price: {
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
    }
  }),
  catalogProduct({
    slug: "cursor",
    name: "Cursor",
    displayName: { en: "Cursor", zh: "Cursor" },
    category: "developer_subscription",
    websiteUrl: "https://cursor.com",
    pricingUrl: "https://cursor.com/pricing",
    regions: ["global", "US"],
    price: {
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
    }
  }),
  catalogProduct({
    slug: "chatgpt",
    name: "ChatGPT",
    displayName: { en: "ChatGPT", zh: "ChatGPT" },
    category: "ai_subscription",
    websiteUrl: "https://chatgpt.com",
    pricingUrl: "https://openai.com/chatgpt/pricing/",
    regions: ["global", "US"],
    price: {
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
    }
  }),
  catalogProduct({
    slug: "claude",
    name: "Claude",
    displayName: { en: "Claude", zh: "Claude" },
    category: "ai_subscription",
    websiteUrl: "https://claude.ai",
    pricingUrl: "https://www.anthropic.com/pricing",
    regions: ["global", "US"],
    price: {
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
    }
  })
];
