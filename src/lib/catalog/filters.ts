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
