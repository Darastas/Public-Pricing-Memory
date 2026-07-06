import { catalogProducts } from "./pricing-catalog";

export type SeedProduct = {
  slug: string;
  name: string;
  websiteUrl: string;
  pricingUrl: string;
  category: string;
};

const baseSeedProducts: SeedProduct[] = [
  {
    slug: "openai",
    name: "OpenAI",
    websiteUrl: "https://openai.com",
    pricingUrl: "https://openai.com/api/pricing/",
    category: "AI API"
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    websiteUrl: "https://www.anthropic.com",
    pricingUrl: "https://www.anthropic.com/pricing",
    category: "AI API"
  },
  {
    slug: "github",
    name: "GitHub",
    websiteUrl: "https://github.com",
    pricingUrl: "https://github.com/pricing",
    category: "Developer Platform"
  },
  {
    slug: "vercel",
    name: "Vercel",
    websiteUrl: "https://vercel.com",
    pricingUrl: "https://vercel.com/pricing",
    category: "Deployment"
  },
  {
    slug: "supabase",
    name: "Supabase",
    websiteUrl: "https://supabase.com",
    pricingUrl: "https://supabase.com/pricing",
    category: "Database"
  },
  {
    slug: "cursor",
    name: "Cursor",
    websiteUrl: "https://cursor.com",
    pricingUrl: "https://cursor.com/pricing",
    category: "AI Coding"
  },
  {
    slug: "notion",
    name: "Notion",
    websiteUrl: "https://www.notion.com",
    pricingUrl: "https://www.notion.com/pricing",
    category: "Productivity"
  },
  {
    slug: "slack",
    name: "Slack",
    websiteUrl: "https://slack.com",
    pricingUrl: "https://slack.com/pricing",
    category: "Collaboration"
  }
];

const catalogSeedProducts: SeedProduct[] = catalogProducts.map((product) => ({
  slug: product.slug,
  name: product.name,
  websiteUrl: product.websiteUrl,
  pricingUrl: product.pricingUrl,
  category: seedCategoryFor(product.category)
}));

export const seedProducts: SeedProduct[] = mergeSeedProducts([
  ...baseSeedProducts,
  ...catalogSeedProducts
]);

function mergeSeedProducts(products: SeedProduct[]): SeedProduct[] {
  const bySlug = new Map<string, SeedProduct>();

  for (const product of products) {
    if (!bySlug.has(product.slug)) {
      bySlug.set(product.slug, product);
    }
  }

  return Array.from(bySlug.values());
}

function seedCategoryFor(category: string): string {
  if (category === "ai_api") return "AI API";
  if (category === "ai_subscription") return "AI Subscription";
  if (category === "consumer_subscription") return "Consumer Subscription";
  if (category === "developer_subscription") return "Developer Platform";
  return category;
}
