"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";
import { cartCopy } from "@/lib/data/cart-copy";

export default function StoreNavAction({ mobile = false, onActivate }: { mobile?: boolean; onActivate?: () => void }) {
  const inStore = usePathname() === "/store";
  const cart = useCart();
  const t = useTranslations("nav");
  const copy = cartCopy(useLocale());
  const reduced = useReducedMotion();
  const content = <span className="flex items-center justify-center gap-2">
    {inStore ? <ShoppingCart size={18} aria-hidden="true"/> : <ShoppingBag size={18} aria-hidden="true"/>}
    <span>{inStore ? copy.title : t("store")}</span>
    {inStore && <span aria-live="polite" className="rounded-full bg-black/15 px-1.5 text-xs tabular-nums">{cart.items.reduce((count, item) => count + item.quantity, 0)}</span>}
  </span>;
  const className = mobile ? "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium" : "inline-flex items-center justify-center min-w-28 text-sm font-semibold rounded-full px-5 py-2.5 transition-transform";
  const style = mobile ? { color: "var(--text-muted)" } : { background: "var(--accent)", color: "#07080B" };
  const action = inStore
    ? <button type="button" data-cursor="button" className={className} style={style} aria-haspopup="dialog" onClick={() => { cart.setOpen(true); onActivate?.(); }}>{content}</button>
    : <Link href="/store" data-cursor="button" className={className} style={style} onClick={onActivate}>{content}</Link>;
  return <span className={mobile ? "flex" : "inline-flex"}>
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={inStore ? "cart" : "store"} initial={reduced ? false : { opacity: 0, y: 8, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8, scale: .94 }} transition={{ duration: reduced ? 0 : .18 }} className={mobile ? "w-full [&>button]:w-full [&>a]:w-full" : "inline-flex"}>{action}</motion.span>
    </AnimatePresence>
  </span>;
}
