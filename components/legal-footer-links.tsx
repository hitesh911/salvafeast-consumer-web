import Link from "next/link";

export function LegalFooterLinks({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-xs text-stone-400 ${className}`.trim()}>
      <Link href="/privacy" className="underline hover:text-stone-600">
        Privacy
      </Link>
      {" · "}
      <Link href="/terms" className="underline hover:text-stone-600">
        Terms
      </Link>
    </p>
  );
}
