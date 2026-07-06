"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { withLocaleHref, type Locale } from "@/lib/i18n";

const languages: { locale: Locale; label: string }[] = [
  { locale: "en", label: "English" },
  { locale: "zh", label: "中文" }
];

export function LanguageSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = searchParams.get("lang") === "zh" ? "zh" : "en";
  const query = searchParams.toString();
  const currentHref = `${pathname}${query ? `?${query}` : ""}`;

  return (
    <div className="language-switcher" aria-label="Language">
      <Languages size={14} />
      {languages.map((language) => (
        <Link
          aria-current={language.locale === currentLocale ? "page" : undefined}
          className="language-option"
          href={withLocaleHref(currentHref, language.locale)}
          key={language.locale}
        >
          {language.label}
        </Link>
      ))}
    </div>
  );
}
