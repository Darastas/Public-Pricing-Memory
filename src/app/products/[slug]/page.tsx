import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  GitCompareArrows,
  History,
  Layers,
  Link as LinkIcon
} from "lucide-react";
import { serializePricingPlan } from "@/lib/api/serialize";
import { seedProducts } from "@/config/seed-products";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPrice, severityLabel } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { product, databaseError } = await loadProduct(slug);

  if (!product) {
    notFound();
  }

  const [latestSnapshot, previousSnapshot] = product.snapshots;
  const currentPlans = latestSnapshot?.pricingPlans.map(serializePricingPlan) ?? [];
  const compareHref =
    latestSnapshot && previousSnapshot
      ? `/products/${product.slug}/compare?from=${previousSnapshot.id}&to=${latestSnapshot.id}`
      : null;

  return (
    <main className="shell py-7">
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-[820] leading-tight">{product.name}</h1>
              <span className="badge">{product.status}</span>
              <span className="badge">{product.category}</span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
              <a className="inline-flex items-center gap-2 hover:text-[var(--accent)]" href={product.websiteUrl}>
                <ExternalLink size={15} />
                {product.websiteUrl}
              </a>
              <a className="inline-flex items-center gap-2 hover:text-[var(--accent)]" href={product.pricingUrl}>
                <LinkIcon size={15} />
                {product.pricingUrl}
              </a>
            </div>
          </div>
          <div className="grid min-w-[240px] gap-2">
            <StatusLine label="Latest crawl" value={formatDateTime(latestSnapshot?.fetchedAt)} />
            <StatusLine
              label="Extraction"
              value={latestSnapshot?.extractionStatus ?? "not crawled"}
            />
            <StatusLine
              label="HTTP status"
              value={latestSnapshot?.httpStatus?.toString() ?? "none"}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {compareHref ? (
            <Link className="button button-primary" href={compareHref}>
              <GitCompareArrows size={16} />
              Compare latest
            </Link>
          ) : null}
          {latestSnapshot ? (
            <Link className="button button-secondary" href={`/api/snapshots/${latestSnapshot.id}`}>
              <FileText size={16} />
              Raw snapshot JSON
            </Link>
          ) : null}
          <Link className="button button-secondary" href="/admin">
            Trigger crawl
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {databaseError ? (
        <section className="mt-5 rounded-[8px] border border-[rgba(168,102,20,0.25)] bg-[rgba(168,102,20,0.08)] p-4 text-sm text-[var(--amber)]">
          Database unavailable: showing seed product metadata without snapshots.
          {` ${databaseError}`}
        </section>
      ) : null}

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-[800]">Current plans</h2>
            <span className="badge">
              <Layers size={14} />
              {currentPlans.length} detected
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {currentPlans.length ? (
              currentPlans.map((plan) => (
                <article className="subtle-panel p-4" key={plan.name}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-[780]">{plan.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {plan.isFreeTier ? "Free tier detected" : "Paid or custom tier"}
                      </p>
                    </div>
                    <span className="text-xl font-[820]">{formatPrice(plan)}</span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
                    {(plan.limits.length ? plan.limits : plan.features).slice(0, 4).map((line) => (
                      <p className="rounded-[7px] bg-white px-3 py-2" key={line}>
                        {line}
                      </p>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="No plans extracted" detail="Run a successful crawl to populate current plans." />
            )}
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-[800]">Change timeline</h2>
            <span className="badge">
              <History size={14} />
              {product.changes.length} events
            </span>
          </div>
          <div className="timeline-line mt-5 grid gap-4">
            {product.changes.length ? (
              product.changes.map((change) => (
                <div className="grid grid-cols-[22px_1fr] gap-3 rounded-[8px] p-2" key={change.id}>
                  <span className={`mt-1 h-5 w-5 rounded-full border-4 border-white shadow ${severityDotClass(change.severity)}`} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{change.title}</h3>
                      <span className={`badge severity-${change.severity}`}>
                        {severityLabel(change.severity)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {change.summary}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                      {formatDateTime(change.detectedAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No change events" detail="The first crawl will create a baseline event." />
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-[800]">Historical snapshots</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Each row keeps normalized text, extracted plans, and raw HTML when stored.
            </p>
          </div>
          {compareHref ? (
            <Link className="button button-secondary" href={compareHref}>
              Compare newest pair
              <GitCompareArrows size={16} />
            </Link>
          ) : null}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Fetched</th>
              <th>Status</th>
              <th>Hash</th>
              <th>Plans</th>
              <th>Raw text</th>
            </tr>
          </thead>
          <tbody>
            {product.snapshots.length ? (
              product.snapshots.map((snapshot) => (
                <tr key={snapshot.id}>
                  <td className="text-sm text-[var(--muted)]">
                    {formatDateTime(snapshot.fetchedAt)}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        snapshot.extractionStatus === "failed"
                          ? "severity-high"
                          : snapshot.extractionStatus === "unchanged"
                            ? "severity-medium"
                            : "severity-low"
                      }`}
                    >
                      {snapshot.extractionStatus}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-[var(--muted)]">
                    {snapshot.contentHash.slice(0, 12)}
                  </td>
                  <td className="font-semibold">{snapshot.pricingPlans.length}</td>
                  <td>
                    <Link className="button button-secondary" href={`/api/snapshots/${snapshot.id}`}>
                      <FileText size={15} />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="No snapshots yet" detail="Trigger a crawl from the admin page." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {latestSnapshot ? (
        <section className="mt-5 panel p-5 sm:p-6">
          <h2 className="text-xl font-[800]">Normalized text preview</h2>
          <pre className="mt-4 max-h-[360px] overflow-auto rounded-[8px] border border-[var(--border)] bg-[#111816] p-4 text-xs leading-6 text-[#d9e7e1]">
            {latestSnapshot.normalizedText || "No normalized text available."}
          </pre>
        </section>
      ) : null}
    </main>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="subtle-panel flex items-center justify-between gap-4 px-3 py-2">
      <span className="text-xs font-bold uppercase text-[var(--muted)]">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
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

async function loadProduct(slug: string) {
  try {
    return {
      product: await prisma.product.findUnique({
        where: { slug },
        include: {
          snapshots: {
            orderBy: { fetchedAt: "desc" },
            take: 30,
            include: {
              pricingPlans: { orderBy: { name: "asc" } }
            }
          },
          changes: {
            orderBy: { detectedAt: "desc" },
            take: 80
          },
          crawlJobs: {
            orderBy: { createdAt: "desc" },
            take: 8
          }
        }
      }),
      databaseError: null
    };
  } catch (error) {
    const seedProduct = seedProducts.find((product) => product.slug === slug);
    return {
      product: seedProduct
        ? {
            id: seedProduct.slug,
            slug: seedProduct.slug,
            name: seedProduct.name,
            websiteUrl: seedProduct.websiteUrl,
            pricingUrl: seedProduct.pricingUrl,
            category: seedProduct.category,
            status: "active",
            createdAt: new Date(0),
            updatedAt: new Date(0),
            snapshots: [],
            changes: [],
            crawlJobs: []
          }
        : null,
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
