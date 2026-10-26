import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { actions, CATEGORIES, CATEGORY_ICON, money, useStore, type Category, type Product } from "@/lib/store";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Toy Kiosk POS" },
      { name: "description", content: "Manage toy stock, costs, prices, margins and low-stock alerts." },
      { property: "og:title", content: "Inventory — Toy Kiosk POS" },
      { property: "og:description", content: "Manage toy stock and pricing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inventory,
});

type Draft = Omit<Product, "id"> & { id?: string };
const blank: Draft = { name: "", category: "Squishies", icon: "🍡", cost: 0, price: 0, stock: 0 };

function Inventory() {
  const { products } = useStore();
  const [edit, setEdit] = useState<Draft | null>(null);
  const low = products.filter((p) => p.stock < 5);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventory</h2>
        <button onClick={() => setEdit(blank)} className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> Add Item</button>
      </div>
      {low.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span><b>{low.length} low-stock item{low.length > 1 ? "s" : ""}:</b> {low.map((p) => `${p.name} (${p.stock})`).join(", ")}</span>
        </div>
      )}
      <div className="mt-4 space-y-2">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] gap-2 px-3 text-xs font-bold uppercase text-muted-foreground md:grid">
          <span>Item</span><span>Cost</span><span>Price</span><span>Margin</span><span>Stock</span><span>Status</span><span />
        </div>
        {products.map((p) => {
          const m = p.price - p.cost, isLow = p.stock < 5;
          return (
            <div key={p.id} className={`grid grid-cols-2 items-center gap-2 rounded-xl border bg-card p-3 text-sm md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] ${isLow ? "border-destructive/50" : ""}`}>
              <div className="col-span-2 flex items-center gap-2 md:col-span-1">
                <span className="text-2xl">{p.icon}</span>
                <div className="min-w-0"><p className="truncate font-bold">{p.name}</p><p className="text-xs text-muted-foreground">{p.category}</p></div>
              </div>
              <Cell l="Cost" v={money(p.cost)} />
              <Cell l="Price" v={money(p.price)} />
              <Cell l="Margin" v={<span className="text-success">{money(m)} · {p.price ? Math.round((m / p.price) * 100) : 0}%</span>} />
              <Cell l="Stock" v={<b>{p.stock}</b>} />
              <Cell l="Status" v={isLow
                ? <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">Low stock</span>
                : <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-bold text-success">OK</span>} />
              <div className="col-span-2 flex justify-end gap-1 md:col-span-1">
                <button onClick={() => setEdit(p)} className="rounded-lg bg-secondary p-2"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => { if (confirm(`Delete ${p.name}?`)) { actions.deleteProduct(p.id); toast("Item deleted"); } }} className="rounded-lg bg-secondary p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
      {edit && <Editor draft={edit} close={() => setEdit(null)} />}
    </div>
  );
}

function Cell({ l, v }: { l: string; v: React.ReactNode }) {
  return <div><span className="mr-1 text-xs text-muted-foreground md:hidden">{l}:</span>{v}</div>;
}

function Editor({ draft, close }: { draft: Draft; close: () => void }) {
  const [d, setD] = useState(draft);
  const f = "mt-1 w-full rounded-lg border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary";
  const save = () => {
    if (!d.name.trim()) { toast.error("Name is required"); return; }
    actions.upsertProduct(d); toast.success(d.id ? "Item updated" : "Item added"); close();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center" onClick={close}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl border bg-card p-5 sm:rounded-3xl">
        <div className="flex justify-between"><h3 className="text-lg font-bold">{d.id ? "Edit Item" : "New Item"}</h3><button onClick={close}><X className="h-5 w-5" /></button></div>
        <div className="mt-4 grid grid-cols-4 gap-3 text-xs font-semibold text-muted-foreground">
          <label className="col-span-1">Icon<input value={d.icon} onChange={(e) => setD({ ...d, icon: e.target.value })} className={f + " text-center"} /></label>
          <label className="col-span-3">Name<input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={f} /></label>
          <label className="col-span-4">Category
            <select value={d.category} onChange={(e) => { const c = e.target.value as Category; setD({ ...d, category: c, icon: d.id ? d.icon : CATEGORY_ICON[c] }); }} className={f}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          {(["cost", "price", "stock"] as const).map((k) => (
            <label key={k} className={k === "stock" ? "col-span-4" : "col-span-2"}>{k === "cost" ? "Cost / unit ($)" : k === "price" ? "Selling price ($)" : "Stock qty"}
              <input type="number" min={0} step={k === "stock" ? 1 : 0.01} value={d[k]} onChange={(e) => setD({ ...d, [k]: Math.max(0, +e.target.value) })} className={f} />
            </label>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Unit margin: <b className="text-success">{money(d.price - d.cost)}</b></p>
        <button onClick={save} className="mt-4 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground">Save</button>
      </div>
    </div>
  );
}
