import type { Metadata } from "next";
import Link from "next/link";
import { Archive, Database, ShieldCheck } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Public Pricing Memory",
  description:
    "A public archive for SaaS, API, AI tool, and developer product pricing changes."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-[var(--border)] bg-white/84 backdrop-blur">
          <div className="shell flex min-h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--accent)] text-white">
                <Archive size={18} />
              </span>
              <span>
                <span className="block text-[15px] font-[760] leading-tight">
                  Public Pricing Memory
                </span>
                <span className="block text-xs font-medium text-[var(--muted)]">
                  public price history
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
              <Link className="hidden rounded-[7px] px-3 py-2 hover:bg-[var(--surface-subtle)] sm:inline-flex" href="/#products">
                Products
              </Link>
              <Link className="hidden rounded-[7px] px-3 py-2 hover:bg-[var(--surface-subtle)] sm:inline-flex" href="/#changes">
                Changes
              </Link>
              <Link className="rounded-[7px] px-3 py-2 hover:bg-[var(--surface-subtle)]" href="/admin">
                Admin
              </Link>
              <span className="hidden items-center gap-1 rounded-[7px] border border-[var(--border)] px-2.5 py-1.5 text-xs md:inline-flex">
                <ShieldCheck size={14} />
                deterministic crawler
              </span>
              <span className="hidden items-center gap-1 rounded-[7px] border border-[var(--border)] px-2.5 py-1.5 text-xs md:inline-flex">
                <Database size={14} />
                historical snapshots
              </span>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
