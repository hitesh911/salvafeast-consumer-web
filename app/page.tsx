"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ConsumerShell } from "@/components/consumer-shell";
import { ContentFeed } from "@/components/content-feed/content-feed";

export default function FeedHomePage() {
  return (
    <ConsumerShell immersive>
      <Suspense
        fallback={
          <div className="flex h-[calc(100dvh-5rem)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        }
      >
        <ContentFeed />
      </Suspense>
    </ConsumerShell>
  );
}
