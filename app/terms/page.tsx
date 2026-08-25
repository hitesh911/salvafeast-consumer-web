import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service | Salvafeast",
  description:
    "Terms for using Salvafeast to order from restaurants and participate in the content feed.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="August 23, 2026">
      <section className="space-y-4 text-sm leading-relaxed text-stone-700">
        <p>
          By using Salvafeast you agree to these terms. If you do not agree,
          please do not use the service.
        </p>

        <h2 className="text-base font-semibold text-stone-900">The service</h2>
        <p>
          Salvafeast connects diners with participating restaurants. We provide
          ordering, order tracking, discovery, and a social content feed. We are
          a technology platform — food preparation, pricing, and in-venue
          service are the responsibility of each restaurant.
        </p>

        <h2 className="text-base font-semibold text-stone-900">Your account</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            You must provide a valid mobile number to sign in. Keep your device
            secure; you are responsible for activity on your account.
          </li>
          <li>
            Some outlets require sign-in before ordering; others allow guest
            checkout with contact details.
          </li>
        </ul>

        <h2 className="text-base font-semibold text-stone-900">Orders and payments</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Menu items, availability, and prices are set by each restaurant and
            may change without notice.
          </li>
          <li>
            UPI payment links open your banking or UPI app; Salvafeast does not
            process card or wallet payments directly unless stated otherwise.
          </li>
          <li>
            Cancellations, refunds, and service issues for a specific order
            should be resolved with the restaurant. We may help facilitate
            communication but are not the merchant of record for food sales.
          </li>
        </ul>

        <h2 className="text-base font-semibold text-stone-900">Content feed</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            You may post captions and embed links to content you have the right
            to share. Do not post illegal, harmful, or misleading material.
          </li>
          <li>
            Posts linked to outlets that are not yet verified may be saved but
            not shown publicly until the outlet is verified.
          </li>
          <li>
            We may remove content or suspend access after reports or policy
            violations.
          </li>
        </ul>

        <h2 className="text-base font-semibold text-stone-900">
          Acceptable use
        </h2>
        <p>
          Do not abuse the platform, attempt unauthorized access, scrape data,
          or interfere with other users or restaurants. We may suspend or
          terminate access for violations.
        </p>

        <h2 className="text-base font-semibold text-stone-900">
          Disclaimer and liability
        </h2>
        <p>
          The service is provided &quot;as is&quot; to the extent permitted by
          law. Salvafeast is not liable for restaurant errors, food quality,
          allergens, or payment disputes between you and an outlet, except where
          liability cannot be excluded by applicable law.
        </p>

        <h2 className="text-base font-semibold text-stone-900">Changes</h2>
        <p>
          We may update these terms. Continued use after the updated date
          constitutes acceptance. Material changes will be reflected on this
          page.
        </p>

        <h2 className="text-base font-semibold text-stone-900">Contact</h2>
        <p>
          Questions:{" "}
          <a href="mailto:support@salva.app" className="text-brand underline">
            support@salva.app
          </a>
          . See also our{" "}
          <a href="/privacy" className="text-brand underline">
            Privacy Policy
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
