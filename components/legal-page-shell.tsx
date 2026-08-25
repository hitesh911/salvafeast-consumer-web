import Link from "next/link";
import type { ReactNode } from "react";

import { LegalFooterLinks } from "@/components/legal-footer-links";

type LegalPageShellProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-dvh bg-stone-50 pb-12">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/"
            className="rounded-lg p-1.5 text-sm text-stone-500 hover:bg-stone-100"
          >
            Back
          </Link>
          <h1 className="text-lg font-bold text-stone-900">{title}</h1>
        </div>
      </header>

      <article className="legal-content mx-auto max-w-2xl px-4 py-8">
        <p className="mb-6 text-sm text-stone-500">
          Last updated: {lastUpdated}
        </p>
        {children}
        <LegalFooterLinks className="mt-10" />
      </article>
    </div>
  );
}
