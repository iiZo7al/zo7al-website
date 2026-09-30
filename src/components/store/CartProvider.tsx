"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { parseCartItems, MAX_CART_ITEMS, MAX_COIN_QUANTITY, type CartItem } from "@/lib/data/store-cart";
type Cart = { items: CartItem[]; ready: boolean; open: boolean; setOpen: (open: boolean) => void; add: (id: number, rankIds?: number[]) => void; changeQuantity: (id: number, delta: number) => void; remove: (id: number) => void; removePurchased: (items: CartItem[]) => void };
const Context = createContext<Cart | null>(null);
const key = "zo7al-cart-v1";
export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let saved: CartItem[] = [];
    try { saved = parseCartItems(JSON.parse(localStorage.getItem(key) ?? "[]")) ?? []; } catch { /* Storage is optional. */ }
    queueMicrotask(() => { setItems(saved); setReady(true); });
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem(key, JSON.stringify(items)); } catch { /* Keep the in-memory cart. */ } }, [items, ready]);
  const add = useCallback((id: number, rankIds: number[] = []) => setItems(current => current.some(item => item.packageId === id || rankIds.includes(item.packageId)) || current.length >= MAX_CART_ITEMS ? current : [...current, { packageId: id, quantity: 1 }]), []);
  const changeQuantity = useCallback((id: number, delta: number) => setItems(current => current.map(item => item.packageId === id ? { ...item, quantity: Math.min(MAX_COIN_QUANTITY, item.quantity + delta) } : item).filter(item => item.quantity > 0)), []);
  const remove = useCallback((id: number) => setItems(current => current.filter(item => item.packageId !== id)), []);
  const removePurchased = useCallback((purchased: CartItem[]) => setItems(current => current.map(item => ({ ...item, quantity: item.quantity - (purchased.find(entry => entry.packageId === item.packageId)?.quantity ?? 0) })).filter(item => item.quantity > 0)), []);
  return <Context.Provider value={{ items, ready, open, setOpen, add, changeQuantity, remove, removePurchased }}>{children}</Context.Provider>;
}
export function useCart() {
  const cart = useContext(Context);
  if (!cart) throw new Error("CartProvider is required");
  return cart;
}
