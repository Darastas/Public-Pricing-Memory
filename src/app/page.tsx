import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Clock3,
  Search,
  Server,
  Sparkles
} from "lucide-react";
import { ProductSubmitForm } from "@/components/product-submit-form";
import { catalogKinds, catalogProducts, catalogRegions, type CatalogKind, type CatalogRegion } from "@/config/pricing-catalog";
import { seedProducts } from "@/config/seed-products";
import {
  filterCatalogProducts,
  getRegionLabel,
  getRepresentativePrice,
  type CatalogKindFilter
} from "@/lib/catalog/filters";
import { serializePricingPlan } from "@/lib/api/serialize";
import { dictionary, getLocale, withLocaleHref, type Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPrice, severityLabel } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

type HomeSearchParams = {
  q?: string | string[];
  lang?: string | string[];
  kind?: string | string[];
  region?: string | string[];
};

export default async function Home({
  searchParams
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const rawSearchParams = await searchParams;
  const locale = getLocale(rawSearchParams);
  const t = dictionary[locale];
  const query = firstParam(rawSearchParams.q)?.trim();
  const catalogKind = parseCatalogKind(firstParam(rawSearchParams.kind));
  const catalogRegion = parseCatalogRegion(firstParam(rawSearchParams.region));
  const catalogRows = filterCatalogProducts(catalogProducts, {
    kind: catalogKind,
    region: catalogRegion,
    query: query ?? ""
  });
  const { products, changes, crawlJobs, databaseError } = await loadHomeData(query);
  const trackedCount = products.length;
  const latestChange = changes[0];
  const failedJobs = crawlJobs.filter((job) => job.status === "failed").length;

  return (
    <main>
      <section className="shell grid gap-5 py-7 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-[820] leading-tight sm:text-4xl">
                {t.heroTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {t.heroDetail}
              </p>
            </div>
            <span className="badge">
              <Sparkles size={14} />
              deterministic diff
            </span>
          </div>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row" action="/">
            <input name="lang" type="hidden" value={locale} />
            <label className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={17}
              />
              <input
                className="field field-with-leading-icon"
                defaultValue={query ?? ""}
                name="q"
                placeholder={t.searchPlaceholder}
              />
            </label>
            <button className="button button-primary" type="submit">
              <Search size={16} />
              {t.search}
            </button>
          </form>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric icon={<Server size={17} />} label={t.trackedProducts} value={trackedCount} />
            <Metric icon={<Activity size={17} />} label={t.recentEvents} value={changes.length} />
            <Metric icon={<CircleAlert size={17} />} label={t.recentCrawlFailures} value={failedJobs} />
          </div>
        </div>

        <aside className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-[780]">{t.submittedUrl}</h2>
            <span className="badge">local/admin</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {t.submittedUrlDetail}
          </p>
          <div className="mt-5">
            <ProductSubmitForm locale={locale} />
          </div>
        </aside>
      </section>

      {databaseError ? (
        <section className="shell pb-5">
          <div className="rounded-[8px] border border-[rgba(168,102,20,0.25)] bg-[rgba(168,102,20,0.08)] p-4 text-sm text-[var(--amber)]">
            {t.databaseUnavailableSeed} {databaseError}
          </div>
        </section>
      ) : null}

      <section className="shell pb-8" id="catalog">
        <div className="panel overflow-hidden">
          <div className="catalog-heading border-b border-[var(--border)] p-5 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-[800]">{t.pricingDirectory}</h2>
                <span className="badge severity-low">
                  <BadgeCheck size={14} />
                  {t.verifiedCatalog}
                </span>
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                {t.pricingDirectoryDetail}
              </p>
            </div>
            <form className="catalog-filter-form" action="/">
              <input name="lang" type="hidden" value={locale} />
              <label>
                <span>{t.category}</span>
                <select className="field" defaultValue={catalogKind} name="kind">
                  <option value="all">{t.allCategories}</option>
                  {catalogKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {catalogKindLabel(kind, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t.region}</span>
                <select className="field" defaultValue={catalogRegion} name="region">
                  {catalogRegions.map((region) => (
                    <option key={region} value={region}>
                      {region === "global" ? t.allRegions : getRegionLabel(region, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t.searchCatalog}</span>
                <input
                  className="field"
                  defaultValue={query ?? ""}
                  name="q"
                  placeholder={t.searchPlaceholder}
                />
              </label>
              <button className="button button-primary" type="submit">
                <Search size={16} />
                {t.search}
              </button>
            </form>
          </div>
          <div className="table-wrap">
            <table className="data-table catalog-table">
              <thead>
                <tr>
                  <th>{t.product}</th>
                  <th>{t.category}</th>
                  <th>{t.region}</th>
                  <th>{t.price}</th>
                  <th>{t.officialSourceStatus}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {catalogRows.length ? (
                  catalogRows.map((product) => {
                    const price = getRepresentativePrice(product);
                    return (
                      <tr key={product.slug}>
                        <td>
                          <Link
                            className="font-[760] hover:text-[var(--accent)]"
                            href={withLocaleHref(`/products/${product.slug}`, locale)}
                          >
                            {product.displayName[locale]}
                          </Link>
                          <div className="mt-1 text-xs font-semibold text-[var(--muted)]">
                            {product.name}
                          </div>
                        </td>
                        <td>
                          <span className="badge">{catalogKindLabel(product.category, locale)}</span>
                        </td>
                        <td>
                          <div className="badge-row max-w-[280px]">
                            {product.regions.map((region) => (
                              <span className="badge" key={region}>
                                {getRegionLabel(region, locale)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="max-w-[320px] text-sm font-semibold">
                          {price?.rawText ?? "-"}
                          {price?.label ? (
                            <span className="mt-1 block text-xs font-medium text-[var(--muted)]">
                              {price.label[locale]}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          {price ? (
                            <a
                              className={`badge ${statusClass(price.status)}`}
                              href={price.sourceUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {priceStatusLabel(price.status, locale)}
                            </a>
                          ) : null}
                          {price ? (
                            <div className="mt-1 text-xs text-[var(--muted)]">
                              {price.sourceLabel} · {price.lastCheckedAt}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <Link
                            className="button button-secondary"
                            href={withLocaleHref(`/products/${product.slug}`, locale)}
                          >
                            {t.open}
                            <ArrowRight size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState title={t.noCatalogMatches} detail={t.seedProductsInstruction} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="shell grid gap-5 pb-8 lg:grid-cols-[0.95fr_1.05fr]" id="changes">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-[800]">{t.recentPriceMemory}</h2>
            {latestChange ? (
              <span className={`badge severity-${latestChange.severity}`}>
                {severityLabel(latestChange.severity)}
              </span>
            ) : null}
          </div>
          <div className="timeline-line mt-5 grid gap-4">
            {changes.length ? (
              changes.map((change) => (
                <Link
                  className="grid grid-cols-[22px_1fr] gap-3 rounded-[8px] p-2 hover:bg-[var(--surface-subtle)]"
                  href={withLocaleHref(`/products/${change.product.slug}`, locale)}
                  key={change.id}
                >
                  <span
                    className={`mt-1 h-5 w-5 rounded-full border-4 border-white shadow ${severityDotClass(change.severity)}`}
                  />
                  <span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{change.title}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {change.product.name}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                      {change.summary}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-[var(--muted)]">
                      {formatDateTime(change.detectedAt)}
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState title={t.noChangesYet} detail={t.seedProductsInstruction} />
            )}
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-[800]">{t.crawlStatus}</h2>
            <span className="badge">
              <Clock3 size={14} />
              {t.latestRuns}
            </span>
          </div>
          <div className="table-wrap mt-5 rounded-[8px] border border-[var(--border)]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.product}</th>
                  <th>{t.status}</th>
                  <th>{t.started}</th>
                  <th>{t.message}</th>
                </tr>
              </thead>
              <tbody>
                {crawlJobs.length ? (
                  crawlJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="font-semibold">{job.product.name}</td>
                      <td>
                        <span
                          className={`badge ${
                            job.status === "failed"
                              ? "severity-high"
                              : job.status === "succeeded"
                                ? "severity-low"
                                : "severity-medium"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="text-sm text-[var(--muted)]">
                        {formatDateTime(job.startedAt ?? job.createdAt)}
                      </td>
                      <td className="max-w-[280px] text-sm text-[var(--muted)]">
                        {job.errorMessage ?? t.noErrorRecorded}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState title={t.noCrawlJobs} detail={t.runCrawlInstruction} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="shell pb-12" id="products">
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-[800]">{t.trackedProducts}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {t.trackedProductsDetail}
              </p>
            </div>
            <Link className="button button-secondary" href={withLocaleHref("/admin", locale)}>
              {t.admin}
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.product}</th>
                  <th>{t.currentPlans}</th>
                  <th>{t.latestSnapshot}</th>
                  <th>{t.changes}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.length ? (
                  products.map((product) => {
                    const latestSnapshot = product.snapshots[0];
                    const plans =
                      latestSnapshot?.pricingPlans.map(serializePricingPlan) ?? [];
                    return (
                      <tr key={product.id}>
                        <td>
                          <Link
                            className="font-[760] hover:text-[var(--accent)]"
                            href={withLocaleHref(`/products/${product.slug}`, locale)}
                          >
                            {product.name}
                          </Link>
                          <div className="mt-1 text-xs font-semibold text-[var(--muted)]">
                            {product.category} · {product.status}
                          </div>
                        </td>
                        <td>
                          <div className="badge-row max-w-[360px]">
                            {plans.length ? (
                              plans.slice(0, 4).map((plan, planIndex) => (
                                <span className="badge" key={plan.id ?? `${product.id}-${plan.name}-${planIndex}`}>
                                  {plan.name}: {formatPrice(plan)}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-[var(--muted)]">
                                {t.noPlansExtracted}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {latestSnapshot ? (
                            <span>
                              <span className="block text-sm font-semibold">
                                {latestSnapshot.extractionStatus}
                              </span>
                              <span className="text-xs text-[var(--muted)]">
                                {formatDateTime(latestSnapshot.fetchedAt)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm text-[var(--muted)]">{t.neverCrawled}</span>
                          )}
                        </td>
                        <td className="font-semibold">{product._count.changes}</td>
                        <td>
                          <Link
                            className="button button-secondary"
                            href={withLocaleHref(`/products/${product.slug}`, locale)}
                          >
                            {t.open}
                            <ArrowRight size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title={query ? t.noMatchingProducts : t.noProductsYet}
                        detail={t.seedProductsInstruction}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="subtle-panel p-4">
      <div className="flex items-center gap-2 text-[var(--muted)]">
        {icon}
        <span className="text-xs font-bold uppercase">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-[820]">{value}</div>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[var(--border)] p-5">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseCatalogKind(value: string | undefined): CatalogKindFilter {
  if (value && (catalogKinds as readonly string[]).includes(value)) {
    return value as CatalogKind;
  }

  return "all";
}

function parseCatalogRegion(value: string | undefined): CatalogRegion {
  if (value && (catalogRegions as readonly string[]).includes(value)) {
    return value as CatalogRegion;
  }

  return "global";
}

function catalogKindLabel(kind: CatalogKind, locale: Locale): string {
  const t = dictionary[locale];
  const labels: Record<CatalogKind, string> = {
    ai_api: t.aiApi,
    ai_subscription: t.aiSubscriptions,
    consumer_subscription: t.consumerSubscriptions,
    developer_subscription: t.developerSubscriptions
  };

  return labels[kind];
}

function priceStatusLabel(status: string, locale: Locale): string {
  const t = dictionary[locale];
  if (status === "published") return t.published;
  if (status === "not_published") return t.notPublished;
  return t.needsReview;
}

function statusClass(status: string): string {
  if (status === "published") return "severity-low";
  if (status === "not_published") return "severity-medium";
  return "severity-medium";
}

function severityDotClass(severity: string): string {
  if (severity === "high") return "bg-[var(--red)]";
  if (severity === "medium") return "bg-[var(--amber)]";
  return "bg-[var(--green)]";
}

async function loadHomeData(query: string | undefined) {
  try {
    const [products, changes, crawlJobs] = await Promise.all([
      prisma.product.findMany({
        where: query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { slug: { contains: query, mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } }
              ]
            }
          : undefined,
        orderBy: [{ status: "asc" }, { name: "asc" }],
        include: {
          snapshots: {
            orderBy: { fetchedAt: "desc" },
            take: 1,
            include: { pricingPlans: { orderBy: { name: "asc" } } }
          },
          changes: {
            orderBy: { detectedAt: "desc" },
            take: 1
          },
          _count: {
            select: { snapshots: true, changes: true }
          }
        }
      }),
      prisma.changeEvent.findMany({
        orderBy: { detectedAt: "desc" },
        take: 8,
        include: {
          product: {
            select: { slug: true, name: true, category: true }
          }
        }
      }),
      prisma.crawlJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          product: {
            select: { slug: true, name: true }
          }
        }
      })
    ]);

    return { products, changes, crawlJobs, databaseError: null };
  } catch (error) {
    const filteredProducts = seedProducts.filter((product) => {
      if (!query) return true;
      const lower = query.toLowerCase();
      return [product.name, product.slug, product.category].some((value) =>
        value.toLowerCase().includes(lower)
      );
    });

    return {
      products: filteredProducts.map((product) => ({
        id: product.slug,
        slug: product.slug,
        name: product.name,
        websiteUrl: product.websiteUrl,
        pricingUrl: product.pricingUrl,
        category: product.category,
        status: "active",
        createdAt: new Date(0),
        updatedAt: new Date(0),
        snapshots: [],
        changes: [],
        _count: { snapshots: 0, changes: 0 }
      })),
      changes: [],
      crawlJobs: [],
      databaseError: databaseUnavailableMessage(error)
    };
  }
}

function databaseUnavailableMessage(error: unknown): string {
  if (error instanceof Error && /Can't reach database server|P1001/i.test(error.message)) {
    return "Unable to reach the configured PostgreSQL database.";
  }
  return "Unable to load database-backed records.";
}
