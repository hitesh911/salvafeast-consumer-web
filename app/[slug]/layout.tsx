import { CartProvider } from "@/lib/cart-store";

export default function OutletLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  return <CartProvider slug={params.slug}>{children}</CartProvider>;
}
