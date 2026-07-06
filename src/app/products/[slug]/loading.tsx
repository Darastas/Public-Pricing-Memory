export default function ProductLoading() {
  return (
    <main className="shell py-7">
      <section className="panel p-6">
        <div className="h-8 w-52 animate-pulse rounded bg-[var(--surface-subtle)]" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="h-20 animate-pulse rounded-[8px] bg-[var(--surface-subtle)]" />
          <div className="h-20 animate-pulse rounded-[8px] bg-[var(--surface-subtle)]" />
          <div className="h-20 animate-pulse rounded-[8px] bg-[var(--surface-subtle)]" />
        </div>
      </section>
    </main>
  );
}
