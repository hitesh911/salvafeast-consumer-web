"use client";

import { useEffect } from "react";
import Script from "next/script";
import { normalizeInstagramPermalink } from "@/lib/embed-utils";

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export function InstagramEmbedScript() {
  return (
    <Script
      src="https://www.instagram.com/embed.js"
      strategy="lazyOnload"
      onLoad={() => {
        window.instgrm?.Embeds?.process();
      }}
    />
  );
}

type InstagramEmbedProps = {
  url: string;
};

export function InstagramEmbed({ url }: InstagramEmbedProps) {
  const permalink = normalizeInstagramPermalink(url);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.instgrm?.Embeds?.process();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [permalink]);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-black">
      <blockquote
        className="instagram-media mx-auto max-h-full max-w-full"
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        style={{
          background: "#FFF",
          border: 0,
          margin: 0,
          maxWidth: "540px",
          minWidth: "280px",
          width: "100%",
        }}
      />
    </div>
  );
}
