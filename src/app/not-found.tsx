import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell py-10">
      <section className="panel max-w-xl p-6">
        <p className="text-sm font-semibold text-[var(--muted)]">404</p>
        <h1 className="mt-2 text-2xl font-[800]">This archive entry does not exist.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          The product or snapshot may not have been seeded yet.
        </p>
        <Link className="button button-primary mt-5" href="/">
          Back to archive
        </Link>
      </section>
    </main>
  );
}
