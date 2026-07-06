export default function Loading() {
  return (
    <main className="shell py-8">
      <div className="panel p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-[var(--surface-subtle)]" />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-[8px] bg-[var(--surface-subtle)]" />
          <div className="h-28 animate-pulse rounded-[8px] bg-[var(--surface-subtle)]" />
          <div className="h-28 animate-pulse rounded-[8px] bg-[var(--surface-subtle)]" />
        </div>
      </div>
    </main>
  );
}
