import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { inRange, money, saleNet, useStore, type Range, type Sale } from "@/lib/store";
import { Metric, RangeTabs } from "@/components/RangeTabs";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales & Profit — Toy Kiosk POS" },
      { name: "description", content: "Monthly sales, expenses and profit breakdown for the toy kiosk." },
      { property: "og:title", content: "Sales & Profit — Toy Kiosk POS" },
      { property: "og:description", content: "Monthly sales, expenses and profit breakdown." },
    ],
  }),
  component: Sales,
});

function Sales() {
  const { sales } = useStore();
  const [range, setRange] = useState<Range>("month");
  const list = sales.filter((s) => inRange(s.date, range)).sort((a, b) => b.date.localeCompare(a.date));
  const revenue = list.reduce((s, x) => s + x.subtotal - x.discount, 0);
  const cogs = list.reduce((s, x) => s + x.cogs, 0);
  const net = revenue - cogs;

  const months = new Map<string, Map<string, Sale[]>>();
  for (const s of list) {
    const d = new Date(s.date);
    const m = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const day = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    if (!months.has(m)) months.set(m, new Map());
    const mm = months.get(m)!;
    if (!mm.has(day)) mm.set(day, []);
    mm.get(day)!.push(s);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Sales & Profit</h2>
      <RangeTabs value={range} onChange={setRange} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Total Revenue" value={money(revenue)} tone="accent" />
        <Metric label="Cost of Goods (Expenses)" value={money(cogs)} tone="destructive" />
        <Metric label="Net Profit" value={money(net)} tone="success" />
        <Metric label="Profit Margin" value={(revenue ? (net / revenue) * 100 : 0).toFixed(1) + "%"} />
      </div>
      <p className="text-xs text-muted-foreground">Revenue excludes sales tax. {list.length} transactions.</p>
      {!list.length && <p className="py-10 text-center text-muted-foreground">No sales in this period</p>}
      {[...months].map(([m, days]) => {
        const all = [...days.values()].flat();
        const mr = all.reduce((s, x) => s + x.subtotal - x.discount, 0), mn = all.reduce((s, x) => s + saleNet(x), 0);
        return (
          <section key={m} className="rounded-2xl border bg-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b p-4">
              <h3 className="text-lg font-bold">{m}</h3>
              <span className="text-sm text-muted-foreground">Revenue <b className="text-accent">{money(mr)}</b> · Net <b className="text-success">{money(mn)}</b></span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="p-3">Txn</th><th>Items sold</th><th className="text-right">Unit cost</th><th className="text-right">Sell price</th><th className="text-right">Paid</th><th className="p-3 text-right">Net</th></tr>
                </thead>
                {[...days].map(([day, ss]) => (
                  <tbody key={day}>
                    <tr className="bg-secondary/60"><td colSpan={6} className="px-3 py-1.5 text-xs font-bold text-primary">{day}</td></tr>
                    {ss.map((s) => (
                      <tr key={s.id} className="border-t align-top">
                        <td className="p-3 font-mono text-xs">{s.id}<div className="text-muted-foreground">{new Date(s.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {s.method}</div></td>
                        <td className="py-3">{s.items.map((i) => <div key={i.productId}>{i.qty}× {i.name}</div>)}</td>
                        <td className="py-3 text-right text-muted-foreground">{s.items.map((i) => <div key={i.productId}>{money(i.cost)}</div>)}</td>
                        <td className="py-3 text-right">{s.items.map((i) => <div key={i.productId}>{money(i.price)}</div>)}</td>
                        <td className="py-3 text-right">{money(s.total)}{s.discount > 0 && <div className="text-xs text-muted-foreground">−{money(s.discount)} disc</div>}</td>
                        <td className="p-3 text-right font-bold text-success">{money(saleNet(s))}</td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
