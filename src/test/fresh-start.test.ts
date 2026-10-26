import { beforeEach, describe, expect, it, vi } from "vitest";

const cloud = vi.hoisted(() => ({ from: vi.fn(), getUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: cloud.from, auth: { getUser: cloud.getUser } } }));
import { actions, buildSale, clearStore, DEFAULT_CHARGES, loadStore, localSaleDate } from "@/lib/store";

beforeEach(() => { vi.clearAllMocks(); clearStore(); });

describe("fresh start", () => {
  it("uses zero discount, tax and card fees", () => {
    expect(DEFAULT_CHARGES).toEqual({ discount: 0, tax: 0, cardFee: 0 });
    const sale = buildSale([], DEFAULT_CHARGES.discount, DEFAULT_CHARGES.tax, DEFAULT_CHARGES.cardFee, "Card");
    expect([sale.subtotal, sale.discount, sale.tax, sale.cardFee, sale.total, sale.cogs]).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it("loads an empty account without adding demo rows", async () => {
    const insert = vi.fn();
    cloud.from.mockImplementation(() => ({ insert, select: () => ({ order: () => Object.assign(Promise.resolve({ data: [], error: null }), { limit: () => Promise.resolve({ data: [], error: null }) }) }) }));
    await loadStore();
    expect(cloud.from.mock.calls.map(([table]) => table)).toEqual(["products", "sales"]);
    expect(insert).not.toHaveBeenCalled();
  });
  it("clears only the signed-in account with no replacement rows", async () => {
    cloud.getUser.mockResolvedValue({ data: { user: { id: "requesting-account" } } });
    const deletes = vi.fn().mockResolvedValue({ error: null });
    cloud.from.mockImplementation(() => ({ delete: () => ({ eq: deletes }), select: () => ({ order: () => Object.assign(Promise.resolve({ data: [], error: null }), { limit: () => Promise.resolve({ data: [], error: null }) }) }) }));
    await actions.reset();
    expect(deletes.mock.calls).toEqual(Array.from({ length: 3 }, () => ["user_id", "requesting-account"]));
    expect(cloud.from.mock.calls.slice(0, 3).map(([table]) => table)).toEqual(["sales", "products", "subcategories"]);
  });
  it("records a sale on the chosen calendar date", () => {
    const sale = buildSale([{ productId: "toy", name: "Crunchy Peanut Squishy", category: "Squishies", qty: 2, cost: 3, price: 10 }], 0, 0, 0, "Cash", localSaleDate("2026-09-15"));
    const date = new Date(sale.date);
    expect([date.getFullYear(), date.getMonth() + 1, date.getDate()]).toEqual([2026, 9, 15]);
    expect(sale.total).toBe(20);
    expect(sale.cogs).toBe(6);
  });
});