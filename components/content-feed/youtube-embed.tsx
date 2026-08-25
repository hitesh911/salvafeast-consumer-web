"use client";

import { extractYouTubeVideoId } from "@/lib/embed-utils";

type YouTubeEmbedProps = {
  url: string;
};

export function YouTubeEmbed({ url }: YouTubeEmbedProps) {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-sm text-white/70">
        Could not load video
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <iframe
        title="YouTube video"
        src={`https://www.youtube.com/embed/${videoId}`}
        className="aspect-video w-full max-w-2xl border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
