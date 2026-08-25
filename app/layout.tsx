import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PwaProvider } from "@/components/pwa-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Salvafeast — Acha khana.",
  description: "Acha khana. Scan & order from your table.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand/salvafeast-mark.png",
    apple: "/brand/salvafeast-mark.png",
  },
  appleWebApp: {
    capable: true,
    title: "Salvafeast",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a5c4a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-dvh`}>
        <PwaProvider />
        {children}
      </body>
    </html>
  );
}
