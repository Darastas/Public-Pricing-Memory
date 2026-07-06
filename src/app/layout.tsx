import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header";
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
        <Suspense fallback={<SiteHeaderFallback />}>
          <SiteHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
