"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="shell py-10">
      <section className="panel max-w-2xl p-6">
        <p className="text-sm font-semibold text-[var(--red)]">Data load failed</p>
        <h1 className="mt-2 text-2xl font-[780]">The pricing archive could not load.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{error.message}</p>
        <button className="button button-primary mt-5" onClick={reset}>
          <RotateCcw size={16} />
          Retry
        </button>
      </section>
    </main>
  );
}
