import { ExternalLink } from "lucide-react";
import { catalogProducts, type PriceStatus } from "@/config/pricing-catalog";
import { getRegionLabel } from "@/lib/catalog/filters";
import { dictionary, type Locale } from "@/lib/i18n";

type CatalogPriceListProps = {
  productSlug: string;
  locale: Locale;
};

export function CatalogPriceList({ productSlug, locale }: CatalogPriceListProps) {
  const product = catalogProducts.find((item) => item.slug === productSlug);
  const t = dictionary[locale];

  if (!product) {
    return (
      <section className="mt-5 panel p-5 sm:p-6">
        <h2 className="text-xl font-[800]">{t.officialPricingReferences}</h2>
        <div className="mt-4 rounded-[8px] border border-dashed border-[var(--border)] p-5">
          <p className="font-semibold">{t.noCatalogMatches}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {locale === "zh"
              ? "这个产品暂时没有人工维护的官方价格参考。"
              : "This product does not have a curated official pricing reference yet."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-5 panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-[800]">{t.officialPricingReferences}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {locale === "zh"
              ? "人工维护的官方来源参考，不会写入 crawler 快照。"
              : "Curated official source references, kept separate from crawler snapshots."}
          </p>
        </div>
        <a
          className="button button-secondary"
          href={product.pricingUrl}
          rel="noreferrer"
          target="_blank"
        >
          {t.source}
          <ExternalLink size={15} />
        </a>
      </div>
      <div className="table-wrap">
        <table className="data-table catalog-reference-table">
          <thead>
            <tr>
              <th>{t.price}</th>
              <th>{t.region}</th>
              <th>{t.status}</th>
              <th>{t.source}</th>
            </tr>
          </thead>
          <tbody>
            {product.prices.map((price) => (
              <tr key={price.id}>
                <td className="max-w-[360px]">
                  <div className="font-semibold">{price.label[locale]}</div>
                  <div className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    {price.rawText}
                  </div>
                </td>
                <td>
                  <span className="badge">{getRegionLabel(price.region, locale)}</span>
                </td>
                <td>
                  <span className={`badge ${statusClass(price.status)}`}>
                    {statusLabel(price.status, locale)}
                  </span>
                </td>
                <td className="max-w-[320px] text-sm text-[var(--muted)]">
                  <a
                    className="inline-flex items-center gap-2 font-semibold text-[var(--text)] hover:text-[var(--accent)]"
                    href={price.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {price.sourceLabel}
                    <ExternalLink size={14} />
                  </a>
                  <div className="mt-1">{price.lastCheckedAt}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function statusLabel(status: PriceStatus, locale: Locale): string {
  const t = dictionary[locale];
  if (status === "published") return t.published;
  if (status === "not_published") return t.notPublished;
  return t.needsReview;
}

function statusClass(status: PriceStatus): string {
  if (status === "published") return "severity-low";
  return "severity-medium";
}
