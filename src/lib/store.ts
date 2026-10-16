import { useSyncExternalStore } from "react";

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

const KEY = "toykiosk-pos-v1";
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
  ].map(([name, category, icon, cost, price, stock]) => ({ id: uid(), name, category, icon, cost, price, stock }) as Product);
  const sales: Sale[] = [];
  const now = new Date();
  for (let d = 150; d >= 0; d -= 1) {
    const n = Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const date = new Date(now.getTime() - d * 864e5 - Math.random() * 8 * 36e5);
      const items: SaleItem[] = [];
      const cnt = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < cnt; i++) {
        const pr = p[Math.floor(Math.random() * p.length)];
        const ex = items.find((x) => x.productId === pr.id);
        if (ex) ex.qty++; else items.push({ productId: pr.id, name: pr.name, category: pr.category, qty: 1, cost: pr.cost, price: pr.price });
      }
      const method = Math.random() > 0.5 ? "Card" : "Cash";
      sales.push(buildSale(items, 0, 8, method === "Card" ? 2.5 : 0, method, date));
    }
  }
  return { products: p, sales };
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
const listeners = new Set<() => void>();
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const s = localStorage.getItem(KEY); state = s ? JSON.parse(s) : demo(); } catch { state = demo(); }
  localStorage.setItem(KEY, JSON.stringify(state));
}
function set(next: State) { state = next; localStorage.setItem(KEY, JSON.stringify(state)); listeners.forEach((l) => l()); }
const EMPTY: State = { products: [], sales: [] };

export function useStore() {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); l(); return () => listeners.delete(l); },
    () => (loaded ? state : EMPTY), () => EMPTY,
  );
}

export const actions = {
  upsertProduct(p: Omit<Product, "id"> & { id?: string }) {
    const products = p.id ? state.products.map((x) => (x.id === p.id ? (p as Product) : x)) : [...state.products, { ...p, id: uid() }];
    set({ ...state, products });
  },
  deleteProduct(id: string) { set({ ...state, products: state.products.filter((p) => p.id !== id) }); },
  checkout(sale: Sale) {
    const products = state.products.map((p) => {
      const it = sale.items.find((i) => i.productId === p.id);
      return it ? { ...p, stock: Math.max(0, p.stock - it.qty) } : p;
    });
    set({ products, sales: [...state.sales, sale] });
  },
  reset() { set(demo()); },
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
