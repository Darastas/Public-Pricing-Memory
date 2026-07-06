import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CircleAlert,
  Clock3,
  Search,
  Server,
  Sparkles
} from "lucide-react";
import { ProductSubmitForm } from "@/components/product-submit-form";
import { serializePricingPlan } from "@/lib/api/serialize";
import { seedProducts } from "@/config/seed-products";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPrice, severityLabel } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();
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
                Searchable memory for public pricing pages.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Track SaaS, API, AI tool, and developer product price pages with
                reproducible snapshots, extracted plans, and visible change events.
              </p>
            </div>
            <span className="badge">
              <Sparkles size={14} />
              deterministic diff
            </span>
          </div>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row" action="/">
            <label className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={17}
              />
              <input
                className="field pl-10"
                defaultValue={query ?? ""}
                name="q"
                placeholder="Search products, categories, or slugs"
              />
            </label>
            <button className="button button-primary" type="submit">
              <Search size={16} />
              Search
            </button>
          </form>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric icon={<Server size={17} />} label="Tracked products" value={trackedCount} />
            <Metric
              icon={<Activity size={17} />}
              label="Recent events"
              value={changes.length}
            />
            <Metric
              icon={<CircleAlert size={17} />}
              label="Recent crawl failures"
              value={failedJobs}
            />
          </div>
        </div>

        <aside className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-[780]">Submit a pricing URL</h2>
            <span className="badge">local/admin</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Add a product to the archive and trigger crawls from the admin surface.
          </p>
          <div className="mt-5">
            <ProductSubmitForm />
          </div>
        </aside>
      </section>

      {databaseError ? (
        <section className="shell pb-5">
          <div className="rounded-[8px] border border-[rgba(168,102,20,0.25)] bg-[rgba(168,102,20,0.08)] p-4 text-sm text-[var(--amber)]">
            Database unavailable: showing configured seed products only. {databaseError}
          </div>
        </section>
      ) : null}

      <section className="shell grid gap-5 pb-8 lg:grid-cols-[0.95fr_1.05fr]" id="changes">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-[800]">Recent price memory</h2>
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
                  href={`/products/${change.product.slug}`}
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
              <EmptyState title="No changes yet" detail="Seed products, run a crawl, then changes will appear here." />
            )}
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-[800]">Recent crawl status</h2>
            <span className="badge">
              <Clock3 size={14} />
              last runs
            </span>
          </div>
          <div className="mt-5 overflow-hidden rounded-[8px] border border-[var(--border)]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Message</th>
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
                        {job.errorMessage ?? "No error recorded"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState title="No crawl jobs" detail="Manual and scheduled crawls will be listed here." />
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
              <h2 className="text-xl font-[800]">Tracked products</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Current plan extraction, latest snapshot state, and change count.
              </p>
            </div>
            <Link className="button button-secondary" href="/admin">
              Admin
              <ArrowRight size={16} />
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Current plans</th>
                <th>Latest snapshot</th>
                <th>Changes</th>
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
                          href={`/products/${product.slug}`}
                        >
                          {product.name}
                        </Link>
                        <div className="mt-1 text-xs font-semibold text-[var(--muted)]">
                          {product.category} · {product.status}
                        </div>
                      </td>
                      <td>
                        <div className="flex max-w-[360px] flex-wrap gap-2">
                          {plans.length ? (
                            plans.slice(0, 4).map((plan) => (
                              <span className="badge" key={plan.name}>
                                {plan.name}: {formatPrice(plan)}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-[var(--muted)]">
                              No plans extracted
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
                          <span className="text-sm text-[var(--muted)]">Never crawled</span>
                        )}
                      </td>
                      <td className="font-semibold">{product._count.changes}</td>
                      <td>
                        <Link className="button button-secondary" href={`/products/${product.slug}`}>
                          Open
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
                      title={query ? "No matching products" : "No products yet"}
                      detail="Seed the initial products or submit a new pricing URL."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
