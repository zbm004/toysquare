import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = ["Squishies", "Walking Animals", "Anime Figures", "RC Cars", "Keychains", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_ICON: Record<Category, string> = {
  Squishies: "🍡", "Walking Animals": "🐶", "Anime Figures": "🥷", "RC Cars": "🏎️", Keychains: "🔑", Other: "🎁",
};
export const DEFAULT_SUBS: Record<Category, string[]> = {
  Squishies: ["Crunchy Peanut Squishy", "Mochi Squishy", "Jumbo Squishy"],
  "Walking Animals": ["Puppies", "Penguins", "Bunnies"],
  "Anime Figures": ["Ninja", "Dragon"],
  "RC Cars": ["Racers", "Monster Trucks"],
  Keychains: ["Pixel", "Mini Weapons"],
  Other: ["Bubbles", "Fidgets"],
};
export type Subcategory = { id: string; category: Category; name: string };

export type Product = { id: string; name: string; category: Category; icon: string; cost: number; price: number; stock: number; subcategory: string };
export type SaleItem = { productId: string; name: string; category: Category; qty: number; cost: number; price: number };
export type Sale = {
  id: string; date: string; items: SaleItem[]; subtotal: number; discount: number; tax: number;
  cardFee: number; total: number; method: "Cash" | "Card"; cogs: number;
};
type State = { products: Product[]; sales: Sale[]; subcategories: Subcategory[] };

const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();

function demo(): State {
  const p: Product[] = [
    ["Peach Squishy", "Squishies", "🍑", 1.5, 4.99, 24], ["Cat Mochi Squishy", "Squishies", "🐱", 1.2, 3.99, 3],
    ["Jumbo Bun Squishy", "Squishies", "🥟", 2.5, 7.99, 12], ["Walking Puppy", "Walking Animals", "🐶", 4, 12.99, 8],
    ["Waddle Penguin", "Walking Animals", "🐧", 3.5, 11.99, 4], ["Hopping Bunny", "Walking Animals", "🐰", 3.8, 12.49, 10],
    ["Ninja Figure", "Anime Figures", "🥷", 6, 19.99, 6], ["Dragon Hero Figure", "Anime Figures", "🐉", 8, 24.99, 2],
    ["Speed Racer RC", "RC Cars", "🏎️", 12, 34.99, 5], ["Monster Truck RC", "RC Cars", "🚙", 15, 39.99, 7],
    ["Pixel Heart Keychain", "Keychains", "💖", 0.6, 2.99, 40], ["Mini Sword Keychain", "Keychains", "🗡️", 0.8, 3.49, 18],
    ["Bubble Wand", "Other", "🫧", 0.9, 3.99, 15], ["Fidget Spinner", "Other", "🌀", 1, 4.49, 1],
  ].map(([name, category, icon, cost, price, stock], i) => ({ id: uid(), name, category, icon, cost, price, stock,
    subcategory: ["Mochi Squishy", "Mochi Squishy", "Jumbo Squishy", "Puppies", "Penguins", "Bunnies", "Ninja", "Dragon", "Racers", "Monster Trucks", "Pixel", "Mini Weapons", "Bubbles", "Fidgets"][i] }) as Product);
  p.push({ id: uid(), name: "Crunchy Peanut Squishy", category: "Squishies", icon: "🥜", cost: 1.4, price: 4.49, stock: 20, subcategory: "Crunchy Peanut Squishy" });
  const sales: Sale[] = [];
  const now = new Date();
  for (let d = 150; d >= 0; d -= 1) {
    const n = Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const date = new Date(now.getTime() - d * 864e5 - Math.random() * 8 * 36e5);
      const items: SaleItem[] = [];
      const cnt = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < cnt; i++) {
        const pr = p[Math.floor(Math.random() * p.length)]!;
        const ex = items.find((x) => x.productId === pr.id);
        if (ex) ex.qty++; else items.push({ productId: pr.id, name: pr.name, category: pr.category, qty: 1, cost: pr.cost, price: pr.price });
      }
      const method = Math.random() > 0.5 ? "Card" : "Cash";
      sales.push(buildSale(items, 0, 8, method === "Card" ? 2.5 : 0, method, date));
    }
  }
  return { products: p, sales, subcategories: [] };
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

let state: State = EMPTY_INIT();
function EMPTY_INIT(): State { return { products: [], sales: [], subcategories: [] }; }
let loaded = false;
let loading = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function set(next: State) { state = next; emit(); }
const EMPTY: State = { products: [], sales: [], subcategories: [] };

const n = (v: unknown) => Number(v);
function rowToProduct(r: any): Product { return { id: r.id, name: r.name, category: r.category, icon: r.icon, cost: n(r.cost), price: n(r.price), stock: r.stock, subcategory: r.subcategory ?? "" }; }
function rowToSale(r: any): Sale {
  return { id: r.id, date: r.date, items: r.items, subtotal: n(r.subtotal), discount: n(r.discount), tax: n(r.tax), cardFee: n(r.card_fee), total: n(r.total), method: r.method, cogs: n(r.cogs) };
}
const saleRow = (s: Sale) => ({ id: s.id, date: s.date, items: s.items as any, subtotal: s.subtotal, discount: s.discount, tax: s.tax, card_fee: s.cardFee, total: s.total, method: s.method, cogs: s.cogs });
const fail = (e: { message: string } | null) => { if (e) { toast.error(e.message); throw e; } };

async function fetchAll() {
  const [p, s, c] = await Promise.all([
    supabase.from("products").select("*").order("created_at"),
    supabase.from("sales").select("*").order("date").limit(5000),
    supabase.from("subcategories").select("*").order("created_at"),
  ]);
  fail(p.error); fail(s.error); fail(c.error);
  return { products: (p.data ?? []).map(rowToProduct), sales: (s.data ?? []).map(rowToSale),
    subcategories: (c.data ?? []).map((r) => ({ id: r.id, category: r.category as Category, name: r.name })) };
}
async function seedSubs() {
  fail((await supabase.from("subcategories").insert(CATEGORIES.flatMap((category) => DEFAULT_SUBS[category].map((name) => ({ category, name }))))).error);
}

async function seedDemo() {
  const d = demo();
  await seedSubs();
  const { data, error } = await supabase.from("products").insert(d.products.map(({ id: _id, ...x }) => x)).select("*");
  fail(error);
  const idMap = new Map(d.products.map((p, i) => [p.id, data![i]!.id as string]));
  const sales = d.sales.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, productId: idMap.get(i.productId)! })) }));
  for (let i = 0; i < sales.length; i += 200) fail((await supabase.from("sales").insert(sales.slice(i, i + 200).map(saleRow))).error);
}

export async function loadStore() {
  if (loading) return;
  loading = true;
  try {
    let next = await fetchAll();
    if (next.products.length === 0 && next.sales.length === 0) { await seedDemo(); next = await fetchAll(); }
    else if (next.subcategories.length === 0) { await seedSubs(); next = await fetchAll(); }
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
  async addSub(category: Category, name: string) {
    const { data, error } = await supabase.from("subcategories").insert({ category, name }).select("*").single();
    fail(error);
    set({ ...state, subcategories: [...state.subcategories, { id: data!.id, category, name }] });
  },
  async renameSub(id: string, name: string) {
    const sub = state.subcategories.find((x) => x.id === id); if (!sub) return;
    fail((await supabase.from("subcategories").update({ name }).eq("id", id)).error);
    fail((await supabase.from("products").update({ subcategory: name }).eq("category", sub.category).eq("subcategory", sub.name)).error);
    set({ ...state, subcategories: state.subcategories.map((x) => (x.id === id ? { ...x, name } : x)),
      products: state.products.map((p) => (p.category === sub.category && p.subcategory === sub.name ? { ...p, subcategory: name } : p)) });
  },
  async deleteSub(id: string) {
    const sub = state.subcategories.find((x) => x.id === id); if (!sub) return;
    fail((await supabase.from("subcategories").delete().eq("id", id)).error);
    fail((await supabase.from("products").update({ subcategory: "" }).eq("category", sub.category).eq("subcategory", sub.name)).error);
    set({ ...state, subcategories: state.subcategories.filter((x) => x.id !== id),
      products: state.products.map((p) => (p.category === sub.category && p.subcategory === sub.name ? { ...p, subcategory: "" } : p)) });
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
    set({ ...state, products, sales: [...state.sales, sale] });
  },
  async reset() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    fail((await supabase.from("sales").delete().eq("user_id", data.user.id)).error);
    fail((await supabase.from("products").delete().eq("user_id", data.user.id)).error);
    fail((await supabase.from("subcategories").delete().eq("user_id", data.user.id)).error);
    await seedDemo();
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
