import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = ["Squishies", "Walking Animals", "Anime Figures", "RC Cars", "Keychains", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_ICON: Record<Category, string> = {
  Squishies: "🍡", "Walking Animals": "🐶", "Anime Figures": "🥷", "RC Cars": "🏎️", Keychains: "🔑", Other: "🎁",
};

export type Product = { id: string; name: string; category: Category; icon: string; cost: number; price: number; stock: number };
export type SaleItem = { productId: string; name: string; category: Category; qty: number; cost: number; price: number };
export type Sale = {
  id: string; date: string; items: SaleItem[]; subtotal: number; discount: number; tax: number;
  cardFee: number; total: number; method: "Cash" | "Card"; cogs: number;
};
type State = { products: Product[]; sales: Sale[] };

const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();

export const DEFAULT_CHARGES = { discount: 0, tax: 0, cardFee: 0 } as const;

export function localSaleDate(value: string): Date {
  const date = new Date(`${value}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime())) throw new Error("Choose a valid sale date");
  return date;
}

export function buildSale(items: SaleItem[], discountPct: number, taxPct: number, cardPct: number, method: "Cash" | "Card", date = new Date()): Sale {
  const r = (n: number) => Math.round(n * 100) / 100;
  const subtotal = r(items.reduce((s, i) => s + i.qty * i.price, 0));
  const discount = r(subtotal * discountPct / 100);
  const tax = r((subtotal - discount) * taxPct / 100);
  const cardFee = method === "Card" ? r((subtotal - discount + tax) * cardPct / 100) : 0;
  return {
    id: "TX-" + uid(), date: date.toISOString(), items, subtotal, discount, tax, cardFee,
    total: r(subtotal - discount + tax + cardFee), method, cogs: r(items.reduce((s, i) => s + i.qty * i.cost, 0)),
  };
}

let state: State = { products: [], sales: [] };
let loaded = false;
let loading = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function set(next: State) { state = next; emit(); }
const EMPTY: State = { products: [], sales: [] };

const n = (v: unknown) => Number(v);
function rowToProduct(r: any): Product { return { id: r.id, name: r.name, category: r.category, icon: r.icon, cost: n(r.cost), price: n(r.price), stock: r.stock }; }
function rowToSale(r: any): Sale {
  return { id: r.id, date: r.date, items: r.items, subtotal: n(r.subtotal), discount: n(r.discount), tax: n(r.tax), cardFee: n(r.card_fee), total: n(r.total), method: r.method, cogs: n(r.cogs) };
}
const saleRow = (s: Sale) => ({ id: s.id, date: s.date, items: s.items as any, subtotal: s.subtotal, discount: s.discount, tax: s.tax, card_fee: s.cardFee, total: s.total, method: s.method, cogs: s.cogs });
const fail = (e: { message: string } | null) => { if (e) { toast.error(e.message); throw e; } };

async function fetchAll() {
  const [p, s] = await Promise.all([
    supabase.from("products").select("*").order("created_at"),
    supabase.from("sales").select("*").order("date").limit(5000),
  ]);
  fail(p.error); fail(s.error);
  return { products: (p.data ?? []).map(rowToProduct), sales: (s.data ?? []).map(rowToSale) };
}

export async function loadStore() {
  if (loading) return;
  loading = true;
  try {
    const next = await fetchAll();
    loaded = true; set(next);
  } finally { loading = false; }
}
export function clearStore() { loaded = false; set(EMPTY); }
export function useStoreLoaded() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => loaded, () => false);
}

export function useStore() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => (loaded ? state : EMPTY), () => EMPTY,
  );
}

export const actions = {
  async upsertProduct(p: Omit<Product, "id"> & { id?: string }) {
    const { id, ...rest } = p;
    if (id) {
      fail((await supabase.from("products").update(rest).eq("id", id)).error);
      set({ ...state, products: state.products.map((x) => (x.id === id ? (p as Product) : x)) });
    } else {
      const { data, error } = await supabase.from("products").insert(rest).select("*").single();
      fail(error);
      set({ ...state, products: [...state.products, rowToProduct(data)] });
    }
  },
  async deleteProduct(id: string) {
    fail((await supabase.from("products").delete().eq("id", id)).error);
    set({ ...state, products: state.products.filter((p) => p.id !== id) });
  },
  async checkout(sale: Sale) {
    fail((await supabase.from("sales").insert(saleRow(sale))).error);
    const products = state.products.map((p) => {
      const it = sale.items.find((i) => i.productId === p.id);
      return it ? { ...p, stock: Math.max(0, p.stock - it.qty) } : p;
    });
    await Promise.all(products.filter((p) => sale.items.some((i) => i.productId === p.id))
      .map((p) => supabase.from("products").update({ stock: p.stock }).eq("id", p.id)));
    set({ products, sales: [...state.sales, sale] });
  },
  async reset() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    fail((await supabase.from("sales").delete().eq("user_id", data.user.id)).error);
    fail((await supabase.from("products").delete().eq("user_id", data.user.id)).error);
    fail((await supabase.from("subcategories").delete().eq("user_id", data.user.id)).error);
    set(await fetchAll());
  },
};

export type Range = "today" | "week" | "month" | "all";
export function inRange(iso: string, r: Range) {
  if (r === "all") return true;
  const d = new Date(iso), n = new Date();
  const start = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  if (r === "week") start.setDate(start.getDate() - start.getDay());
  if (r === "month") start.setDate(1);
  return d >= start;
}
export const money = (n: number) => "$" + n.toFixed(2);
// Net profit = revenue excluding tax, minus COGS and card fees
export const saleNet = (s: Sale) => s.subtotal - s.discount - s.cogs;
