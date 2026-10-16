import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { actions, buildSale, CATEGORIES, CATEGORY_ICON, money, useStore, type SaleItem } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Checkout — Toy Kiosk POS" },
      { name: "description", content: "Fast checkout for the toy kiosk: search, cart, discounts, tax and payment." },
      { property: "og:title", content: "Checkout — Toy Kiosk POS" },
      { property: "og:description", content: "Fast checkout for the toy kiosk." },
    ],
  }),
  component: POS,
});

function POS() {
  const { products } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<"Cash" | "Card">("Cash");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(8);
  const [cardFee, setCardFee] = useState(2.5);
  const [open, setOpen] = useState(false);

  const list = products.filter((p) => (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()));
  const items: SaleItem[] = useMemo(() => Object.entries(cart).flatMap(([id, qty]) => {
    const p = products.find((x) => x.id === id);
    return p ? [{ productId: id, name: p.name, category: p.category, qty, cost: p.cost, price: p.price }] : [];
  }), [cart, products]);
  const sale = buildSale(items, discount, tax, cardFee, method);
  const count = items.reduce((s, i) => s + i.qty, 0);

  const add = (id: string, d: number) => {
    const p = products.find((x) => x.id === id)!;
    setCart((c) => {
      const n = Math.min(p.stock, (c[id] ?? 0) + d);
      const next = { ...c };
      if (n <= 0) delete next[id]; else next[id] = n;
      return next;
    });
  };
  const checkout = () => {
    if (!items.length) return;
    actions.checkout(sale);
    setCart({}); setDiscount(0); setOpen(false);
    toast.success(`Sale complete · ${money(sale.total)} (${method})`);
  };

  const cartPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-lg font-bold">Cart ({count})</h2>
        {items.length > 0 && <button onClick={() => setCart({})} className="text-xs text-destructive">Clear</button>}
      </div>
      <div className="flex-1 space-y-2 overflow-auto">
        {!items.length && <p className="py-8 text-center text-sm text-muted-foreground">Tap a toy to add it</p>}
        {items.map((i) => (
          <div key={i.productId} className="flex items-center gap-2 rounded-xl bg-secondary p-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{i.name}</p>
              <p className="text-xs text-muted-foreground">{money(i.price)} × {i.qty} = {money(i.price * i.qty)}</p>
            </div>
            <button onClick={() => add(i.productId, -1)} className="rounded-lg bg-muted p-1.5"><Minus className="h-3.5 w-3.5" /></button>
            <span className="w-5 text-center text-sm font-bold">{i.qty}</span>
            <button onClick={() => add(i.productId, 1)} className="rounded-lg bg-muted p-1.5"><Plus className="h-3.5 w-3.5" /></button>
            <button onClick={() => add(i.productId, -999)} className="p-1.5 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-3 border-t pt-3">
        <div className="grid grid-cols-2 gap-2">
          {(["Cash", "Card"] as const).map((m) => (
            <button key={m} onClick={() => setMethod(m)}
              className={`rounded-xl py-2 text-sm font-bold ${method === m ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
              {m === "Cash" ? "💵" : "💳"} {m}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Num label="Discount %" v={discount} set={setDiscount} />
          <Num label="Tax %" v={tax} set={setTax} />
          <Num label="Card fee %" v={cardFee} set={setCardFee} disabled={method !== "Card"} />
        </div>
        <div className="space-y-1 text-sm">
          <Row l="Subtotal" r={money(sale.subtotal)} />
          {sale.discount > 0 && <Row l="Discount" r={"−" + money(sale.discount)} />}
          <Row l={`Tax (${tax}%)`} r={money(sale.tax)} />
          {method === "Card" && <Row l={`Card machine fee (${cardFee}%)`} r={money(sale.cardFee)} />}
          <div className="flex justify-between pt-1 text-lg font-bold"><span>Total</span><span className="text-primary">{money(sale.total)}</span></div>
        </div>
        <button disabled={!items.length} onClick={checkout}
          className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-40">
          Complete Checkout
        </button>
      </div>
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-4">
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search toys..."
            className="w-full rounded-xl border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary" />
        </div>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {["All", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{c}</button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => {
            const out = p.stock - (cart[p.id] ?? 0) <= 0;
            return (
              <button key={p.id} disabled={out} onClick={() => add(p.id, 1)}
                className="relative rounded-2xl border bg-card p-3 text-left transition active:scale-95 disabled:opacity-40">
                <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.stock < 5 ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {p.stock} left
                </span>
                {cart[p.id] && <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">×{cart[p.id]}</span>}
                <div className="py-3 text-center text-5xl">{CATEGORY_ICON[p.category]}</div>
                <p className="truncate text-sm font-bold">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.category}</p>
                <p className="mt-1 font-display text-lg font-bold text-primary">{money(p.price)}</p>
              </button>
            );
          })}
          {!list.length && <p className="col-span-full py-10 text-center text-muted-foreground">No toys found</p>}
        </div>
      </div>
      <aside className="hidden lg:block"><div className="sticky top-20 h-[calc(100vh-11rem)] rounded-2xl border bg-card p-4">{cartPanel}</div></aside>
      {count > 0 && (
        <button onClick={() => setOpen(true)} className="fixed inset-x-4 bottom-20 z-20 flex justify-between rounded-2xl bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-2xl lg:hidden">
          <span>View Cart · {count}</span><span>{money(sale.total)}</span>
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="absolute inset-x-0 bottom-0 h-[85vh] rounded-t-3xl border bg-card p-4">
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4"><X className="h-5 w-5" /></button>
            {cartPanel}
          </div>
        </div>
      )}
    </div>
  );
}

function Num({ label, v, set, disabled }: { label: string; v: number; set: (n: number) => void; disabled?: boolean }) {
  return (
    <label className={`text-[10px] font-semibold text-muted-foreground ${disabled ? "opacity-40" : ""}`}>{label}
      <input type="number" min={0} step="0.5" value={v} disabled={disabled} onChange={(e) => set(Math.max(0, +e.target.value))}
        className="mt-1 w-full rounded-lg border bg-secondary px-2 py-1.5 text-sm text-foreground outline-none" />
    </label>
  );
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex justify-between text-muted-foreground"><span>{l}</span><span>{r}</span></div>;
}
