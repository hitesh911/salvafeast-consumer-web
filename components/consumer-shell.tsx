"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Compass, PlusCircle, User } from "lucide-react";
import clsx from "clsx";
import { isConsumerLoggedIn } from "@/lib/auth-store";

type ConsumerShellProps = {
  children: React.ReactNode;
  slug?: string;
  hideNav?: boolean;
  immersive?: boolean;
};

const NAV_ITEMS = [
  {
    href: "/",
    label: "Feed",
    icon: Clapperboard,
    match: (path: string) => path === "/",
  },
  {
    href: "/explore",
    label: "Explore",
    icon: Compass,
    match: (path: string) => path.startsWith("/explore"),
  },
  {
    href: "/post",
    label: "Post",
    icon: PlusCircle,
    match: (path: string) => path.startsWith("/post"),
  },
  {
    href: "/account",
    label: "Account",
    icon: User,
    match: (path: string) => path.startsWith("/account"),
  },
];

function BrandMark({ light }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/salvafeast-logo.png"
        alt=""
        className="h-8 w-8 object-contain"
      />
      <span className="min-w-0 leading-tight">
        <span
          className={clsx(
            "block text-lg font-bold",
            light ? "text-white" : "text-brand",
          )}
        >
          Salvafeast
        </span>
        <span
          className={clsx(
            "block text-[11px] font-normal",
            light ? "text-white/80" : "text-stone-500",
          )}
        >
          Acha khana.
        </span>
      </span>
    </span>
  );
}

export function ConsumerShell({
  children,
  hideNav,
  immersive,
}: ConsumerShellProps) {
  const pathname = usePathname();
  const loggedIn = isConsumerLoggedIn();
  const loginHref = loggedIn
    ? "/account"
    : `/login?returnTo=${encodeURIComponent(pathname || "/account")}`;

  return (
    <div className={hideNav ? "" : "pb-20"}>
      {!hideNav && !immersive ? (
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
            <Link href="/" className="min-w-0">
              <BrandMark />
            </Link>
            <Link
              href={loggedIn ? "/account" : loginHref}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
            >
              {loggedIn ? "Account" : "Sign in"}
            </Link>
          </div>
        </header>
      ) : null}

      {!hideNav && immersive ? (
        <header className="absolute inset-x-0 top-0 z-40 bg-gradient-to-b from-black/50 to-transparent">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
            <Link href="/" className="min-w-0">
              <BrandMark light />
            </Link>
            <Link
              href={loggedIn ? "/account" : loginHref}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              {loggedIn ? "Account" : "Sign in"}
            </Link>
          </div>
        </header>
      ) : null}

      {children}

      {!hideNav && (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white safe-bottom">
          <div className="mx-auto grid max-w-lg grid-cols-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.match(pathname);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                    active ? "text-brand" : "text-stone-400",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
