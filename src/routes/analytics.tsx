import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORIES, inRange, money, saleNet, useStore, type Range } from "@/lib/store";
import { RangeTabs } from "@/components/RangeTabs";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Toy Kiosk POS" },
      { name: "description", content: "Monthly revenue, expenses and profit charts plus category sales breakdown." },
      { property: "og:title", content: "Analytics — Toy Kiosk POS" },
      { property: "og:description", content: "Revenue vs expenses vs profit charts." },
    ],
  }),
  component: Analytics,
});

const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }, labelStyle: { color: "var(--foreground)" } };
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function Analytics() {
  const { sales } = useStore();
  const [range, setRange] = useState<Range>("all");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const monthly = new Map<string, { month: string; Revenue: number; Expenses: number; Profit: number; k: string }>();
  for (const s of sales) {
    const d = new Date(s.date), k = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    const e = monthly.get(k) ?? { k, month: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }), Revenue: 0, Expenses: 0, Profit: 0 };
    e.Revenue += s.subtotal - s.discount; e.Expenses += s.cogs; e.Profit += saleNet(s);
    monthly.set(k, e);
  }
  const mData = [...monthly.values()].sort((a, b) => a.k.localeCompare(b.k)).map((m) => ({ ...m, Revenue: +m.Revenue.toFixed(2), Expenses: +m.Expenses.toFixed(2), Profit: +m.Profit.toFixed(2) }));

  const cat = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<string, number>;
  sales.filter((s) => inRange(s.date, range)).forEach((s) => s.items.forEach((i) => (cat[i.category] += i.qty)));
  const cData = CATEGORIES.map((c) => ({ name: c, value: cat[c] }));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Analytics</h2>
      <section className="rounded-2xl border bg-card p-4">
        <h3 className="font-bold">Monthly Revenue vs Expenses vs Profit</h3>
        <div className="mt-3 h-72">
          {mounted && (
            <ResponsiveContainer>
              <BarChart data={mData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} width={40} />
                <Tooltip {...tip} formatter={(v: number) => money(v)} cursor={{ fill: "var(--secondary)" }} />
                <Legend />
                <Bar dataKey="Revenue" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Profit" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">Items Sold by Category</h3>
          <div className="w-full sm:w-80"><RangeTabs value={range} onChange={setRange} /></div>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="h-64">
            {mounted && (
              <ResponsiveContainer>
                <BarChart data={cData} layout="vertical">
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={100} />
                  <Tooltip {...tip} cursor={{ fill: "var(--secondary)" }} />
                  <Bar dataKey="value" name="Units" radius={[0, 6, 6, 0]}>{cData.map((_, i) => <Cell key={i} fill={COLORS[i] ?? "var(--chart-1)"} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="h-64">
            {mounted && (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={cData.filter((c) => c.value)} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3} stroke="none">
                    {cData.filter((c) => c.value).map((c) => <Cell key={c.name} fill={COLORS[CATEGORIES.indexOf(c.name as never)] ?? "var(--chart-1)"} />)}
                  </Pie>
                  <Tooltip {...tip} itemStyle={{ color: "var(--foreground)" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
