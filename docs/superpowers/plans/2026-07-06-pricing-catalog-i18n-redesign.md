# Pricing Catalog I18n Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved方案 B: a curated official pricing catalog for major AI providers and subscription platforms, with bilingual UI, expanded seed products, source-aware catalog display, overlap fixes, and frontend polish.

**Architecture:** Keep curated official pricing separate from crawler-generated snapshots. Add typed static catalog data and pure selector helpers, then render catalog references on the home and product pages while preserving crawler sections. Use lightweight query-param i18n (`?lang=en|zh`) with shared dictionaries and locale-aware links.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma seed data, Vitest, Playwright/browser QA.

---

## File Structure

- Create `src/config/pricing-catalog.ts`: typed curated catalog data and exported constants for regions, kinds, statuses, and products.
- Create `src/config/pricing-catalog.test.ts`: validates catalog shape, unique ids, source metadata, and no fake zero prices.
- Create `src/lib/catalog/filters.ts`: pure helpers to filter catalog rows by query, region, and kind; derive representative prices; format region labels.
- Create `src/lib/catalog/filters.test.ts`: TDD coverage for search, region filter, kind filter, representative price selection, and not-published handling.
- Create `src/lib/i18n.ts`: `Locale`, dictionary, locale parsing, and locale-aware href helper.
- Create `src/lib/i18n.test.ts`: TDD coverage for locale parsing and href preservation.
- Modify `src/config/seed-products.ts`: expand default tracked products using catalog identities without duplicating existing slugs.
- Modify `src/app/layout.tsx`: parse locale, set `<html lang>`, add language switcher, reduce header overlap risk.
- Modify `src/app/page.tsx`: add pricing directory filters and table/list, apply bilingual copy, keep existing search/change/crawl surfaces.
- Modify `src/app/products/[slug]/page.tsx`: show official catalog references separately from crawler plans; apply bilingual copy for touched sections.
- Modify `src/app/globals.css`: responsive table wrappers, icon shrink fixes, badge wrapping, polished visual tokens.
- Modify `Continued.md`: record catalog/i18n/UI progress and latest verification evidence.
- Modify `README.md` and `README.zh-CN.md` in Task 8 when the curated catalog becomes user-visible.

Do not stage or modify the current working-tree `AGENTS.md`. Do not stage unrelated `package-lock.json` changes unless a dependency change is intentionally made and verified.

## Official Source Research Rules

- Use only official pricing, API billing, help-center, or regional subscription pages as primary sources.
- Browse at implementation time because prices are temporally unstable.
- Every catalog product must have at least one official source URL.
- Every price row must include `sourceUrl`, `sourceLabel`, `lastCheckedAt`, and `confidence`.
- If a price is unclear, region-locked, login-gated, or not published, record `status: "needs_review"` or `status: "not_published"` instead of inventing a value.
- Do not convert currencies unless the vendor publishes the converted price.

---

### Task 1: Catalog Types And Validation Tests

**Files:**
- Create: `src/config/pricing-catalog.test.ts`
- Create: `src/config/pricing-catalog.ts`

- [ ] **Step 1: Write failing catalog validation tests**

Create `src/config/pricing-catalog.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { catalogProducts, catalogRegions, catalogKinds } from "./pricing-catalog";

describe("pricing catalog data", () => {
  it("defines the first-pass regions and catalog kinds", () => {
    expect(catalogRegions).toEqual(["global", "US", "CN", "EU", "UK", "JP", "IN"]);
    expect(catalogKinds).toEqual([
      "ai_api",
      "ai_subscription",
      "consumer_subscription",
      "developer_subscription"
    ]);
  });

  it("uses unique product slugs and price ids", () => {
    const slugs = catalogProducts.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    const priceIds = catalogProducts.flatMap((product) =>
      product.prices.map((price) => `${product.slug}:${price.id}`)
    );
    expect(new Set(priceIds).size).toBe(priceIds.length);
  });

  it("includes source metadata for every product and price row", () => {
    for (const product of catalogProducts) {
      expect(product.pricingUrl).toMatch(/^https:\/\//);
      expect(() => new URL(product.pricingUrl)).not.toThrow();
      expect(product.prices.length).toBeGreaterThan(0);

      for (const price of product.prices) {
        expect(() => new URL(price.sourceUrl)).not.toThrow();
        expect(price.sourceUrl).toMatch(/^https:\/\//);
        expect(price.sourceLabel.length).toBeGreaterThan(2);
        expect(price.lastCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(["official", "needs_review"]).toContain(price.confidence);
      }
    }
  });

  it("does not represent unpublished prices as fake zero values", () => {
    for (const price of catalogProducts.flatMap((product) => product.prices)) {
      if (price.status === "not_published") {
        expect(price.amount).toBeNull();
        expect(price.currency).toBeNull();
      }

      if (price.status === "published") {
        expect(price.amount !== null || price.rawText.trim().length > 0).toBe(true);
      }
    }
  });

  it("covers the approved first-pass product set", () => {
    expect(catalogProducts.map((product) => product.slug)).toEqual(
      expect.arrayContaining([
        "openai",
        "anthropic",
        "deepseek",
        "zhipu-glm",
        "kimi",
        "google-gemini",
        "xai",
        "mistral",
        "cohere",
        "together-ai",
        "groq",
        "perplexity",
        "baidu-qianfan",
        "alibaba-tongyi",
        "tencent-hunyuan",
        "iflytek-spark",
        "minimax",
        "01-ai",
        "stepfun",
        "siliconflow",
        "spotify",
        "youtube-premium",
        "netflix",
        "disney-plus",
        "apple-one",
        "amazon-prime",
        "notion",
        "github",
        "cursor",
        "chatgpt",
        "claude"
      ])
    );
  });
});
```

- [ ] **Step 2: Run test to verify red**

Run:

```bash
npm run test -- src/config/pricing-catalog.test.ts
```

Expected: FAIL because `src/config/pricing-catalog.ts` does not exist.

- [ ] **Step 3: Implement catalog types and first data skeleton**

Create `src/config/pricing-catalog.ts` with exported types, constants, and initial product records. Before filling price values, browse official sources and record official URLs. Use `status: "needs_review"` for rows that cannot be verified during the pass.

Minimum implementation shape:

```ts
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

export const catalogProducts: CatalogProduct[] = [];
```

Do not commit the empty array. Before Step 4, browse official source URLs for every approved product and replace the empty array with source-backed product records. Use `needs_review` price rows where exact prices are not verified yet.

- [ ] **Step 4: Run test to verify green**

Run:

```bash
npm run test -- src/config/pricing-catalog.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Stage only:

```bash
git add -- src/config/pricing-catalog.ts src/config/pricing-catalog.test.ts
git commit -m "加入官方价格目录数据模型"
```

---

### Task 2: Official Source Price Pass

**Files:**
- Modify: `src/config/pricing-catalog.ts`
- Modify: `src/config/pricing-catalog.test.ts`
- Modify: `Continued.md`

- [ ] **Step 1: Browse official AI provider pricing pages**

Use official sources only. Gather current source URLs and prices for at least:

```text
OpenAI, Anthropic, DeepSeek, 智谱 GLM, Kimi, Google Gemini, xAI, Mistral,
Cohere, Together AI, Groq, Perplexity, 百度千帆, 阿里通义, 腾讯混元,
讯飞星火, MiniMax, 零一万物, 阶跃星辰, 硅基流动
```

For each provider:

- API pricing if published.
- Subscription pricing if published.
- `needs_review` when official information is ambiguous or access-limited.

- [ ] **Step 2: Browse official subscription platform pricing pages**

Use official sources only. Gather current source URLs and prices for:

```text
Spotify, YouTube Premium, Netflix, Disney+, Apple One, Amazon Prime,
Notion, GitHub, Cursor, ChatGPT, Claude
```

For regional prices, only record vendor-published values. Use `not_published` where not visible.

- [ ] **Step 3: Update catalog data**

For each official price, add rows like:

```ts
{
  id: "api-gpt-4o-mini-input",
  kind: "ai_api",
  label: {
    en: "GPT-4o mini input tokens",
    zh: "GPT-4o mini 输入 tokens"
  },
  region: "global",
  status: "published",
  amount: 0.15,
  currency: "USD",
  billingPeriod: null,
  unit: "1M input tokens",
  rawText: "$0.15 / 1M input tokens",
  sourceUrl: "https://openai.com/api/pricing/",
  sourceLabel: "OpenAI API pricing",
  lastCheckedAt: "2026-07-06",
  confidence: "official"
}
```

If official data is unavailable:

```ts
{
  id: "subscription-in-not-published",
  kind: "consumer_subscription",
  label: {
    en: "Individual plan in India",
    zh: "印度个人套餐"
  },
  region: "IN",
  status: "not_published",
  amount: null,
  currency: null,
  billingPeriod: null,
  unit: null,
  rawText: "Not published on the official page reviewed.",
  sourceUrl: "https://openai.com/api/pricing/",
  sourceLabel: "OpenAI API pricing",
  lastCheckedAt: "2026-07-06",
  confidence: "needs_review"
}
```

- [ ] **Step 4: Run catalog tests**

Run:

```bash
npm run test -- src/config/pricing-catalog.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Stage only:

```bash
git add -- src/config/pricing-catalog.ts src/config/pricing-catalog.test.ts Continued.md
git commit -m "补充官方价格目录首批数据"
```

---

### Task 3: Catalog Filtering Helpers

**Files:**
- Create: `src/lib/catalog/filters.test.ts`
- Create: `src/lib/catalog/filters.ts`

- [ ] **Step 1: Write failing filter tests**

Create `src/lib/catalog/filters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/config/pricing-catalog";
import {
  filterCatalogProducts,
  getRepresentativePrice,
  getRegionLabel
} from "./filters";

const products: CatalogProduct[] = [
  {
    slug: "openai",
    name: "OpenAI",
    displayName: { en: "OpenAI", zh: "OpenAI" },
    category: "ai_api",
    websiteUrl: "https://openai.com",
    pricingUrl: "https://openai.com/api/pricing/",
    regions: ["global"],
    prices: [
      {
        id: "api",
        kind: "ai_api",
        label: { en: "API", zh: "API" },
        region: "global",
        status: "published",
        amount: 1,
        currency: "USD",
        billingPeriod: null,
        unit: "1M tokens",
        rawText: "$1 / 1M tokens",
        sourceUrl: "https://openai.com/api/pricing/",
        sourceLabel: "OpenAI API pricing",
        lastCheckedAt: "2026-07-06",
        confidence: "official"
      }
    ]
  },
  {
    slug: "spotify",
    name: "Spotify",
    displayName: { en: "Spotify", zh: "Spotify" },
    category: "consumer_subscription",
    websiteUrl: "https://www.spotify.com",
    pricingUrl: "https://www.spotify.com/premium/",
    regions: ["US"],
    prices: [
      {
        id: "individual-us",
        kind: "consumer_subscription",
        label: { en: "Individual", zh: "个人" },
        region: "US",
        status: "published",
        amount: 11.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$11.99 / month",
        sourceUrl: "https://www.spotify.com/us/premium/",
        sourceLabel: "Spotify Premium US",
        lastCheckedAt: "2026-07-06",
        confidence: "official"
      }
    ]
  }
];

describe("catalog filters", () => {
  it("filters by kind, region, and text query", () => {
    expect(
      filterCatalogProducts(products, {
        kind: "consumer_subscription",
        region: "US",
        query: "spot"
      }).map((product) => product.slug)
    ).toEqual(["spotify"]);
  });

  it("matches global prices for any region filter", () => {
    expect(
      filterCatalogProducts(products, {
        kind: "all",
        region: "CN",
        query: "open"
      }).map((product) => product.slug)
    ).toEqual(["openai"]);
  });

  it("selects a published representative price before review rows", () => {
    expect(getRepresentativePrice(products[0])?.rawText).toBe("$1 / 1M tokens");
  });

  it("localizes region labels", () => {
    expect(getRegionLabel("US", "en")).toBe("United States");
    expect(getRegionLabel("US", "zh")).toBe("美国");
  });
});
```

- [ ] **Step 2: Run test to verify red**

Run:

```bash
npm run test -- src/lib/catalog/filters.test.ts
```

Expected: FAIL because `src/lib/catalog/filters.ts` does not exist.

- [ ] **Step 3: Implement filter helpers**

Create `src/lib/catalog/filters.ts`:

```ts
import type {
  CatalogKind,
  CatalogLocale,
  CatalogPrice,
  CatalogProduct,
  CatalogRegion
} from "@/config/pricing-catalog";

export type CatalogKindFilter = CatalogKind | "all";

export type CatalogFilters = {
  kind: CatalogKindFilter;
  region: CatalogRegion;
  query: string;
};

export function filterCatalogProducts(
  products: CatalogProduct[],
  filters: CatalogFilters
): CatalogProduct[] {
  const query = filters.query.trim().toLowerCase();

  return products.filter((product) => {
    if (filters.kind !== "all" && product.category !== filters.kind) {
      return false;
    }

    if (!matchesRegion(product, filters.region)) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      product.slug,
      product.name,
      product.displayName.en,
      product.displayName.zh,
      ...product.prices.flatMap((price) => [
        price.label.en,
        price.label.zh,
        price.rawText
      ])
    ].some((value) => value.toLowerCase().includes(query));
  });
}

export function getRepresentativePrice(product: CatalogProduct): CatalogPrice | null {
  return (
    product.prices.find((price) => price.status === "published") ??
    product.prices.find((price) => price.status === "needs_review") ??
    product.prices[0] ??
    null
  );
}

export function getRegionLabel(region: CatalogRegion, locale: CatalogLocale): string {
  const labels: Record<CatalogRegion, Record<CatalogLocale, string>> = {
    global: { en: "Global", zh: "全球" },
    US: { en: "United States", zh: "美国" },
    CN: { en: "China", zh: "中国" },
    EU: { en: "European Union", zh: "欧盟" },
    UK: { en: "United Kingdom", zh: "英国" },
    JP: { en: "Japan", zh: "日本" },
    IN: { en: "India", zh: "印度" }
  };

  return labels[region][locale];
}

function matchesRegion(product: CatalogProduct, region: CatalogRegion): boolean {
  if (region === "global") {
    return true;
  }

  return product.regions.includes(region) || product.regions.includes("global");
}
```

- [ ] **Step 4: Run tests to verify green**

Run:

```bash
npm run test -- src/lib/catalog/filters.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add -- src/lib/catalog/filters.ts src/lib/catalog/filters.test.ts
git commit -m "加入价格目录筛选工具"
```

---

### Task 4: Lightweight I18n Helpers

**Files:**
- Create: `src/lib/i18n.test.ts`
- Create: `src/lib/i18n.ts`

- [ ] **Step 1: Write failing i18n tests**

Create `src/lib/i18n.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dictionary, getLocale, withLocaleHref } from "./i18n";

describe("i18n helpers", () => {
  it("defaults to English and accepts Chinese", () => {
    expect(getLocale({})).toBe("en");
    expect(getLocale({ lang: "zh" })).toBe("zh");
    expect(getLocale({ lang: "fr" })).toBe("en");
  });

  it("uses the first lang value when search params provide an array", () => {
    expect(getLocale({ lang: ["zh", "en"] })).toBe("zh");
  });

  it("adds or replaces the lang query param", () => {
    expect(withLocaleHref("/products/openai", "zh")).toBe("/products/openai?lang=zh");
    expect(withLocaleHref("/?q=openai&lang=en", "zh")).toBe("/?q=openai&lang=zh");
  });

  it("contains core bilingual labels", () => {
    expect(dictionary.en.pricingDirectory).toBe("Pricing directory");
    expect(dictionary.zh.pricingDirectory).toBe("价格目录");
  });
});
```

- [ ] **Step 2: Run test to verify red**

Run:

```bash
npm run test -- src/lib/i18n.test.ts
```

Expected: FAIL because `src/lib/i18n.ts` does not exist.

- [ ] **Step 3: Implement i18n helpers**

Create `src/lib/i18n.ts` with `Locale`, `getLocale`, `withLocaleHref`, and `dictionary`. Keep dictionary keys flat and only cover touched UI strings.

- [ ] **Step 4: Run tests to verify green**

Run:

```bash
npm run test -- src/lib/i18n.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add -- src/lib/i18n.ts src/lib/i18n.test.ts
git commit -m "加入中英文界面文案工具"
```

---

### Task 5: Seed Product Expansion

**Files:**
- Modify: `src/config/seed-products.ts`
- Create or modify: `src/config/seed-products.test.ts`

- [ ] **Step 1: Write failing seed coverage test**

Create `src/config/seed-products.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { catalogProducts } from "./pricing-catalog";
import { seedProducts } from "./seed-products";

describe("seed products", () => {
  it("includes every catalog product as a tracked product", () => {
    const seedSlugs = new Set(seedProducts.map((product) => product.slug));

    for (const product of catalogProducts) {
      expect(seedSlugs.has(product.slug), product.slug).toBe(true);
    }
  });

  it("keeps seed product slugs unique", () => {
    const slugs = seedProducts.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
```

- [ ] **Step 2: Run test to verify red**

Run:

```bash
npm run test -- src/config/seed-products.test.ts
```

Expected: FAIL because new catalog products are not all in `seedProducts`.

- [ ] **Step 3: Extend seed products**

Modify `src/config/seed-products.ts` to derive extra seed rows from `catalogProducts` or to explicitly include all catalog products. Preserve existing slugs and categories.

- [ ] **Step 4: Run tests to verify green**

Run:

```bash
npm run test -- src/config/seed-products.test.ts src/config/pricing-catalog.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 5**

```bash
git add -- src/config/seed-products.ts src/config/seed-products.test.ts
git commit -m "扩展默认追踪产品列表"
```

---

### Task 6: Home Page Catalog UI And Visual Polish

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/language-switcher.tsx`

- [ ] **Step 1: Confirm pure tests cover the page data path**

Run the helper tests that cover the page data path:

```bash
npm run test -- src/lib/catalog/filters.test.ts src/lib/i18n.test.ts
```

Expected: PASS before changing the page.

- [ ] **Step 2: Implement header language switcher**

Modify `src/app/layout.tsx` to parse locale using Next.js async `searchParams` only if the layout can access it. If not practical in root layout, render language links that work from `href="/?lang=..."` and preserve locale in page-level links. Keep header badges from overlapping by hiding them at narrower breakpoints.

- [ ] **Step 3: Add home catalog section**

Modify `src/app/page.tsx`:

- Parse `lang`, `kind`, `region`, and `q` from `searchParams`.
- Use `getLocale`, `dictionary`, `filterCatalogProducts`, `getRepresentativePrice`, and `getRegionLabel`.
- Render category and region filters as GET form controls.
- Render a dense catalog table/list with source status and product links.
- Keep existing recent changes and crawl status sections below.

- [ ] **Step 4: Polish responsive CSS**

Modify `src/app/globals.css`:

- Add `.icon-shrink-none svg { flex-shrink: 0; }` or apply equivalent global button icon CSS.
- Improve `.badge` wrapping behavior.
- Add `.table-wrap` for horizontal scroll around dense catalog tables.
- Tune header/nav breakpoints so language switcher remains visible.

- [ ] **Step 5: Run focused checks**

Run:

```bash
npm run lint
npm run typecheck
npm run test
```

Expected: all pass.

- [ ] **Step 6: Commit Task 6**

```bash
git add -- src/app/page.tsx src/app/layout.tsx src/app/globals.css src/components/language-switcher.tsx
git commit -m "在首页加入价格目录和语言切换"
```

---

### Task 7: Product Page Official Pricing References

**Files:**
- Modify: `src/app/products/[slug]/page.tsx`
- Create: `src/components/catalog-price-list.tsx`

- [ ] **Step 1: Add a reusable catalog price renderer**

Create `src/components/catalog-price-list.tsx` with props:

```ts
type CatalogPriceListProps = {
  productSlug: string;
  locale: Locale;
};
```

Keep it server-compatible unless client interaction is required.

- [ ] **Step 2: Render official references separately from crawler plans**

Modify `src/app/products/[slug]/page.tsx`:

- Parse locale from search params.
- Look up `catalogProducts.find((product) => product.slug === slug)`.
- Add a section titled with `dictionary[locale].officialPricingReferences`.
- Render source URL, last checked date, price status, region, and raw text.
- Keep crawler "Current plans" section unchanged in meaning.

- [ ] **Step 3: Run checks**

Run:

```bash
npm run lint
npm run typecheck
npm run test
```

Expected: all pass.

- [ ] **Step 4: Commit Task 7**

```bash
git add -- src/app/products/[slug]/page.tsx src/components/catalog-price-list.tsx
git commit -m "在产品页展示官方价格参考"
```

---

### Task 8: Rendered QA And Final Verification

**Files:**
- Modify: `Continued.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`

- [ ] **Step 1: Start dev server**

Run:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3001
```

If port 3001 is occupied, choose the next free port and record it in the final report.

- [ ] **Step 2: Browser QA**

Use Browser plugin if available; otherwise use Playwright and record fallback reason.

Verify:

- `/` desktop: pricing directory visible, no header overlap, language switcher visible.
- `/?lang=zh` desktop: Chinese text visible.
- `/?kind=ai_api&region=CN&lang=zh` filters catalog rows without breaking layout.
- `/products/openai?lang=zh`: official pricing reference section visible separately from current plans.
- Mobile viewport: header, filters, badges, and catalog rows do not overlap.

- [ ] **Step 3: Full verification**

Run:

```bash
git diff --check
npm run lint
npm run typecheck
npm run test
npm run build
```

Expected:

- no whitespace errors
- lint exit 0
- typecheck exit 0
- all Vitest tests pass
- Next build exit 0

- [ ] **Step 4: Update docs**

Update `Continued.md` with:

- files changed
- source policy followed
- latest test counts
- browser QA URL and viewport evidence
- remaining limitations

Update both README files with a short explanation that the app has two pricing data sources: crawler snapshots and curated official catalog references.

- [ ] **Step 5: Final commit**

Stage only intentional files:

```bash
git add -- Continued.md README.md README.zh-CN.md
git commit -m "记录价格目录改版验证结果"
```

---

## Self-Review

Spec coverage:

- Curated catalog data layer: Tasks 1 and 2.
- Official source metadata and current price research: Task 2.
- Seed expansion: Task 5.
- Bilingual UI: Task 4 and Task 6.
- Home catalog section: Task 6.
- Product page official references: Task 7.
- Icon overlap and visual polish: Task 6 and Task 8.
- Tests and verification: Tasks 1, 3, 4, 5, and 8.

No task asks the implementer to write curated prices without official source research. No task writes curated prices into crawler snapshots. No task requires a database migration for the first pass.
