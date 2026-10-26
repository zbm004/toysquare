import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORIES, inRange, money, saleNet, useStore, type Category, type Range } from "@/lib/store";
import { RangeTabs } from "@/components/RangeTabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productBreakdown } from "@/lib/product-breakdown";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Toy Kiosk POS" },
      { name: "description", content: "Monthly revenue, expenses and profit charts plus category and individual toy sales breakdowns." },
      { property: "og:title", content: "Analytics — Toy Kiosk POS" },
      { property: "og:description", content: "Compare revenue, expenses, profit and individual toy sales within each category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Analytics,
});

const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }, labelStyle: { color: "var(--foreground)" } };
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function Analytics() {
  const { sales } = useStore();
  const [range, setRange] = useState<Range>("all");
  const [productRange, setProductRange] = useState<Range>("all");
  const [category, setCategory] = useState<Category>("Squishies");
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
  sales.filter((s) => inRange(s.date, range)).forEach((s) => s.items.forEach((i) => (cat[i.category] = (cat[i.category] ?? 0) + i.qty)));
  const cData = CATEGORIES.map((c) => ({ name: c, value: cat[c] }));
  const pData = productBreakdown(sales.filter((s) => inRange(s.date, productRange)), category);
  const productUnits = pData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Analytics</h2>
      <section className="rounded-2xl border bg-card p-4">
        <h3 className="font-bold">Monthly Revenue vs Expenses vs Profit</h3>
        <div className="mt-3 h-72">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} width={40} />
                <Tooltip {...tip} formatter={(v) => money(Number(v))} cursor={{ fill: "var(--secondary)" }} />
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
              <ResponsiveContainer width="100%" height="100%">
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
              <ResponsiveContainer width="100%" height="100%">
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
      <section className="rounded-2xl border bg-card p-4" aria-labelledby="product-sales-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="product-sales-title" className="font-bold">Items Sold Within Category</h3>
          <div className="w-full sm:w-52">
            <Select value={category} onValueChange={(value) => {
              const selected = CATEGORIES.find((item) => item === value);
              if (selected) setCategory(selected);
            }}>
              <SelectTrigger aria-label="Product sales category"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-80"><RangeTabs value={productRange} onChange={setProductRange} /></div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{category} · {productUnits} units sold</p>
        {pData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No sales in this category for this period.</div>
        ) : (
          <div className="mt-3 grid min-w-0 gap-4 md:grid-cols-2">
            <div className="min-w-0 overflow-y-auto" style={{ height: 320 }} aria-label={`${category} product sales bar graph`}>
              {mounted && <ResponsiveContainer width="100%" height={Math.max(300, pData.length * 44)}>
                <BarChart data={pData} layout="vertical" margin={{ right: 16, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={140} interval={0} tick={({ x, y, payload }) => (
                    <text x={x} y={y} dy={4} textAnchor="end" fill="var(--muted-foreground)" fontSize={11}>
                      <title>{payload.value}</title>{String(payload.value).length > 22 ? `${String(payload.value).slice(0, 21)}…` : payload.value}
                    </text>
                  )} />
                  <Tooltip {...tip} cursor={{ fill: "var(--secondary)" }} />
                  <Bar dataKey="value" name="Units" radius={[0, 6, 6, 0]}>
                    {pData.map((item, i) => <Cell key={item.name} fill={COLORS[i % COLORS.length] ?? "var(--chart-1)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>}
            </div>
            <div className="min-w-0" aria-label={`${category} product sales pie chart`}>
              <div className="h-64">
                {mounted && <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3} stroke="none">
                      {pData.map((item, i) => <Cell key={item.name} fill={COLORS[i % COLORS.length] ?? "var(--chart-1)"} />)}
                    </Pie>
                    <Tooltip {...tip} itemStyle={{ color: "var(--foreground)" }} formatter={(value) => [`${value} units (${Math.round(Number(value) / productUnits * 100)}%)`, "Sold"]} />
                  </PieChart>
                </ResponsiveContainer>}
              </div>
              <ul className="space-y-2 text-sm">
                {pData.map((item, i) => <li key={item.name} className="flex items-start gap-2">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="min-w-0 flex-1 break-words">{item.name}</span>
                  <span className="shrink-0 text-muted-foreground">{item.value} · {Math.round(item.value / productUnits * 100)}%</span>
                </li>)}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
