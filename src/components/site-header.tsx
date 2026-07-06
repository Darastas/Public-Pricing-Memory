"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Archive, Database, ShieldCheck } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { dictionary, withLocaleHref, type Locale } from "@/lib/i18n";

export function SiteHeader() {
  const searchParams = useSearchParams();
  const locale: Locale = searchParams.get("lang") === "zh" ? "zh" : "en";
  const t = dictionary[locale];

  return (
    <header className="border-b border-[var(--border)] bg-white/84 backdrop-blur">
      <div className="shell flex min-h-16 items-center justify-between gap-4">
        <Link href={withLocaleHref("/", locale)} className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--accent)] text-white">
            <Archive size={18} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-[760] leading-tight">
              Public Pricing Memory
            </span>
            <span className="hidden text-xs font-medium text-[var(--muted)] sm:block">
              {locale === "zh" ? "公开价格历史" : "public price history"}
            </span>
          </span>
        </Link>
        <nav className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--muted)]">
          <Link
            className="hidden rounded-[7px] px-3 py-2 hover:bg-[var(--surface-subtle)] sm:inline-flex"
            href={withLocaleHref("/#products", locale)}
          >
            {t.products}
          </Link>
          <Link
            className="hidden rounded-[7px] px-3 py-2 hover:bg-[var(--surface-subtle)] sm:inline-flex"
            href={withLocaleHref("/#changes", locale)}
          >
            {t.changes}
          </Link>
          <Link
            className="hidden rounded-[7px] px-3 py-2 hover:bg-[var(--surface-subtle)] md:inline-flex"
            href={withLocaleHref("/admin", locale)}
          >
            {t.admin}
          </Link>
          <span className="hidden items-center gap-1 rounded-[7px] border border-[var(--border)] px-2.5 py-1.5 text-xs xl:inline-flex">
            <ShieldCheck size={14} />
            {t.deterministicCrawler}
          </span>
          <span className="hidden items-center gap-1 rounded-[7px] border border-[var(--border)] px-2.5 py-1.5 text-xs xl:inline-flex">
            <Database size={14} />
            {t.historicalSnapshotsShort}
          </span>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}

export function SiteHeaderFallback() {
  return (
    <header className="border-b border-[var(--border)] bg-white/84 backdrop-blur">
      <div className="shell flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--accent)] text-white">
            <Archive size={18} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-[760] leading-tight">
              Public Pricing Memory
            </span>
          </span>
        </Link>
        <span className="language-switcher">English</span>
      </div>
    </header>
  );
}
