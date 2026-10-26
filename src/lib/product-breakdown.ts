import type { Category, Sale } from "@/lib/store";

export function productBreakdown(sales: Sale[], category: Category) {
  const totals = new Map<string, { name: string; value: number }>();
  for (const sale of sales) {
    for (const item of sale.items) {
      if (item.category !== category) continue;
      const key = item.name.trim().toLocaleLowerCase();
      const entry = totals.get(key) ?? { name: item.name.trim(), value: 0 };
      entry.value += item.qty;
      totals.set(key, entry);
    }
  }
  return [...totals.values()].filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}