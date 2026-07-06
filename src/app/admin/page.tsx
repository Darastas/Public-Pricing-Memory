import Link from "next/link";
import { ArrowRight, LockKeyhole, TerminalSquare } from "lucide-react";
import { AdminActions } from "@/components/admin-actions";
import { seedProducts } from "@/config/seed-products";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { products, crawlJobs, databaseError } = await loadAdminData();

  return (
    <main className="shell py-7">
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <LockKeyhole size={18} />
              <span className="text-sm font-bold uppercase">Admin</span>
            </div>
            <h1 className="mt-2 text-3xl font-[820] leading-tight">
              Local operations and crawler control.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Write actions are protected by `ADMIN_TOKEN`; scheduled batches use
              `CRON_SECRET`. In production, missing tokens do not open dangerous writes.
            </p>
          </div>
          <Link className="button button-secondary" href="/">
            Public archive
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mt-5">
        <AdminActions
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug
          }))}
        />
      </section>

      {databaseError ? (
        <section className="mt-5 rounded-[8px] border border-[rgba(168,102,20,0.25)] bg-[rgba(168,102,20,0.08)] p-4 text-sm text-[var(--amber)]">
          Database unavailable: admin tables are showing configured seed products only.
          {` ${databaseError}`}
        </section>
      ) : null}

      <section className="mt-5 panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-[800]">Products</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Snapshot and change counts for all tracked products.
            </p>
          </div>
          <span className="badge">
            <TerminalSquare size={14} />
            {products.length} rows
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Status</th>
              <th>Latest snapshot</th>
              <th>Snapshots</th>
              <th>Changes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.length ? (
              products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <span className="font-semibold">{product.name}</span>
                    <span className="mt-1 block text-xs text-[var(--muted)]">
                      {product.pricingUrl}
                    </span>
                  </td>
                  <td>
                    <span className="badge">{product.status}</span>
                  </td>
                  <td className="text-sm text-[var(--muted)]">
                    {formatDateTime(product.snapshots[0]?.fetchedAt)}
                  </td>
                  <td className="font-semibold">{product._count.snapshots}</td>
                  <td className="font-semibold">{product._count.changes}</td>
                  <td>
                    <Link className="button button-secondary" href={`/products/${product.slug}`}>
                      Open
                      <ArrowRight size={15} />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="rounded-[8px] border border-dashed border-[var(--border)] p-5">
                    <p className="font-semibold">No products configured</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Run the seed script or add a product above.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="mt-5 panel overflow-hidden">
        <div className="border-b border-[var(--border)] p-5 sm:p-6">
          <h2 className="text-xl font-[800]">Crawl logs</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Latest crawl jobs, failure reasons, and structured log payloads.
          </p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Status</th>
              <th>Started</th>
              <th>Finished</th>
              <th>Error</th>
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
                    {formatDateTime(job.startedAt)}
                  </td>
                  <td className="text-sm text-[var(--muted)]">
                    {formatDateTime(job.finishedAt)}
                  </td>
                  <td className="max-w-[360px] text-sm text-[var(--muted)]">
                    {job.errorMessage ?? "No error"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="rounded-[8px] border border-dashed border-[var(--border)] p-5">
                    <p className="font-semibold">No crawl logs</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Trigger a crawl to create job history.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

async function loadAdminData() {
  try {
    const [products, crawlJobs] = await Promise.all([
      prisma.product.findMany({
        orderBy: { name: "asc" },
        include: {
          snapshots: {
            orderBy: { fetchedAt: "desc" },
            take: 1
          },
          _count: {
            select: { snapshots: true, changes: true }
          }
        }
      }),
      prisma.crawlJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          product: {
            select: { slug: true, name: true }
          }
        }
      })
    ]);

    return { products, crawlJobs, databaseError: null };
  } catch (error) {
    return {
      products: seedProducts.map((product) => ({
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
        _count: { snapshots: 0, changes: 0 }
      })),
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
