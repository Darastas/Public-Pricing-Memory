import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDiff, TriangleAlert } from "lucide-react";
import { toExtractedPricingPlan } from "@/lib/api/serialize";
import { buildSnapshotCompare } from "@/lib/compare/snapshot-compare";
import { prisma } from "@/lib/prisma";
import { formatDateTime, severityLabel } from "@/lib/ui/format";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { slug } = await params;
  const { from, to } = await searchParams;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 10,
        include: { pricingPlans: { orderBy: { name: "asc" } } }
      }
    }
  });

  if (!product) {
    notFound();
  }

  const fallbackTo = product.snapshots[0];
  const fallbackFrom = product.snapshots[1];
  const fromSnapshot =
    product.snapshots.find((snapshot) => snapshot.id === from) ?? fallbackFrom;
  const toSnapshot =
    product.snapshots.find((snapshot) => snapshot.id === to) ?? fallbackTo;

  if (!fromSnapshot || !toSnapshot) {
    return (
      <main className="shell py-7">
        <section className="panel p-6">
          <Link className="button button-secondary" href={`/products/${product.slug}`}>
            <ArrowLeft size={16} />
            Back to product
          </Link>
          <div className="mt-6 rounded-[8px] border border-dashed border-[var(--border)] p-6">
            <TriangleAlert className="text-[var(--amber)]" size={24} />
            <h1 className="mt-3 text-2xl font-[800]">Not enough snapshots to compare.</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Run at least two crawls for this product, then return to the compare view.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const comparison = buildSnapshotCompare({
    from: {
      id: fromSnapshot.id,
      fetchedAt: fromSnapshot.fetchedAt,
      httpStatus: fromSnapshot.httpStatus,
      contentHash: fromSnapshot.contentHash,
      normalizedText: fromSnapshot.normalizedText,
      pricingPlans: fromSnapshot.pricingPlans.map(toExtractedPricingPlan)
    },
    to: {
      id: toSnapshot.id,
      fetchedAt: toSnapshot.fetchedAt,
      httpStatus: toSnapshot.httpStatus,
      contentHash: toSnapshot.contentHash,
      normalizedText: toSnapshot.normalizedText,
      pricingPlans: toSnapshot.pricingPlans.map(toExtractedPricingPlan)
    }
  });

  return (
    <main className="shell py-7">
      <section className="panel p-5 sm:p-6">
        <Link className="button button-secondary" href={`/products/${product.slug}`}>
          <ArrowLeft size={16} />
          Back to {product.name}
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <FileDiff size={18} />
              <span className="text-sm font-bold uppercase">Snapshot compare</span>
            </div>
            <h1 className="mt-2 text-3xl font-[820] leading-tight">
              {product.name} pricing changes
            </h1>
          </div>
          <div className="grid gap-2 sm:min-w-[340px]">
            <CompareStamp label="From" value={formatDateTime(fromSnapshot.fetchedAt)} />
            <CompareStamp label="To" value={formatDateTime(toSnapshot.fetchedAt)} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 md:grid-cols-4">
        <SummaryMetric label="Added lines" value={comparison.summary.addedLines} />
        <SummaryMetric label="Removed lines" value={comparison.summary.removedLines} />
        <SummaryMetric label="High severity" value={comparison.summary.highSeverityCount} />
        <SummaryMetric label="Medium severity" value={comparison.summary.mediumSeverityCount} />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-5 sm:p-6">
          <h2 className="text-xl font-[800]">Detected pricing events</h2>
          <div className="mt-5 grid gap-3">
            {comparison.changeEvents.length ? (
              comparison.changeEvents.map((event, index) => (
                <article className="subtle-panel p-4" key={`${event.changeType}-${index}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge severity-${event.severity}`}>
                      {severityLabel(event.severity)}
                    </span>
                    <span className="badge">{event.changeType}</span>
                  </div>
                  <h3 className="mt-3 font-[760]">{event.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {event.summary}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-[8px] border border-dashed border-[var(--border)] p-5">
                <p className="font-semibold">No structured changes</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  The normalized content hash did not produce a pricing event.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-[var(--border)] p-5 sm:p-6">
            <h2 className="text-xl font-[800]">Normalized text diff</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Added and removed lines are generated from deterministic normalized text.
            </p>
          </div>
          <div className="max-h-[720px] overflow-auto bg-[#111816] p-4 font-mono text-xs leading-6">
            {comparison.diffChunks.map((chunk, index) => (
              <pre
                className={`whitespace-pre-wrap border-l-2 px-3 py-1 ${
                  chunk.type === "added"
                    ? "border-[var(--green)] bg-[rgba(47,122,79,0.18)] text-[#d7f5df]"
                    : chunk.type === "removed"
                      ? "border-[var(--red)] bg-[rgba(184,59,59,0.18)] text-[#ffd8d8]"
                      : "border-transparent text-[#a9bbb4]"
                }`}
                key={`${chunk.type}-${index}`}
              >
                {chunk.text}
              </pre>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function CompareStamp({ label, value }: { label: string; value: string }) {
  return (
    <div className="subtle-panel flex items-center justify-between gap-4 px-3 py-2">
      <span className="text-xs font-bold uppercase text-[var(--muted)]">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4">
      <p className="text-xs font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-[820]">{value}</p>
    </div>
  );
}
