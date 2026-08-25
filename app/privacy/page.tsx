import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | Salvafeast",
  description:
    "How Salvafeast collects, uses, and protects your information when you order food or use the content feed.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="August 23, 2026">
      <section className="space-y-4 text-sm leading-relaxed text-stone-700">
        <p>
          Salvafeast (&quot;we&quot;, &quot;us&quot;) operates the consumer web
          app at order.salva.app where you can discover restaurants, place
          orders, track order status, and share food content. This policy
          describes what we collect and how we use it.
        </p>

        <h2 className="text-base font-semibold text-stone-900">
          Information we collect
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account:</strong> mobile phone number and optional name when
            you sign in with a WhatsApp OTP.
          </li>
          <li>
            <strong>Orders:</strong> items ordered, outlet visited, order type
            (dine-in, pickup, counter), table selection when applicable, and
            guest contact details if you order without signing in.
          </li>
          <li>
            <strong>Content you post:</strong> captions, linked menu items,
            outlet tags, and third-party embed URLs you submit to the feed.
          </li>
          <li>
            <strong>Device data:</strong> basic technical logs (browser type,
            IP address, timestamps) needed to operate and secure the service.
          </li>
          <li>
            <strong>Push tokens (optional):</strong> if you enable
            notifications in a future app version, we store a device token to
            send order updates.
          </li>
        </ul>

        <h2 className="text-base font-semibold text-stone-900">
          How we use information
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Authenticate you and keep you signed in.</li>
          <li>Place, fulfil, and display your orders to you and the restaurant.</li>
          <li>Show your order history in your account.</li>
          <li>Operate the public content feed, likes, and moderation reports.</li>
          <li>Improve reliability, prevent abuse, and comply with law.</li>
        </ul>

        <h2 className="text-base font-semibold text-stone-900">
          Restaurant partners
        </h2>
        <p>
          When you order from a restaurant on Salvafeast, that outlet receives
          the order details needed to prepare and serve your food. Each
          restaurant may have its own practices for in-venue service; contact
          them directly for outlet-specific questions.
        </p>

        <h2 className="text-base font-semibold text-stone-900">
          Marketing preferences
        </h2>
        <p>
          Restaurants may record whether you opted in to marketing
          communications from that outlet. You can update preferences when
          offered in the product or by contacting the restaurant.
        </p>

        <h2 className="text-base font-semibold text-stone-900">Retention</h2>
        <p>
          We keep account and order records while your account is active and as
          needed for legal, tax, and dispute purposes. You may request deletion
          of your account by emailing{" "}
          <a
            href="mailto:support@salva.app?subject=Account%20Deletion%20Request"
            className="text-brand underline"
          >
            support@salva.app
          </a>
          . We will process verified requests within 30 days, subject to records
          we must retain by law.
        </p>

        <h2 className="text-base font-semibold text-stone-900">Contact</h2>
        <p>
          Questions about this policy:{" "}
          <a href="mailto:support@salva.app" className="text-brand underline">
            support@salva.app
          </a>
        </p>
      </section>
    </LegalPageShell>
  );
}
