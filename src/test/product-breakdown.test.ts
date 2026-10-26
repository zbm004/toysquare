import { describe, expect, it } from "vitest";
import { productBreakdown } from "@/lib/product-breakdown";
import type { Sale } from "@/lib/store";

const sales: Sale[] = [{
  id: "test-sale", date: "2026-10-26T08:52:00Z", subtotal: 0, discount: 0,
  tax: 0, cardFee: 0, total: 0, method: "Cash", cogs: 0,
  items: [
    { productId: "peanut", name: "Crunchy Peanut Squishy", category: "Squishies", qty: 3, cost: 1, price: 4 },
    { productId: "peanut", name: "Crunchy Peanut Squishy", category: "Squishies", qty: 2, cost: 1, price: 4 },
    { productId: "goku", name: "Goku Figure", category: "Anime Figures", qty: 4, cost: 5, price: 10 },
  ],
}];

describe("Product sales within a category", () => {
  it("counts crunchy peanut squishies only in Squishies", () => {
    expect(productBreakdown(sales, "Squishies")).toEqual([{ name: "Crunchy Peanut Squishy", value: 5 }]);
  });
  it("counts Goku figures only in Anime Figures", () => {
    expect(productBreakdown(sales, "Anime Figures")).toEqual([{ name: "Goku Figure", value: 4 }]);
  });
  it("returns no slices when there are no sales", () => {
    expect(productBreakdown([], "Squishies")).toEqual([]);
  });
});