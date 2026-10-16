import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ShoppingCart, Package, Receipt, BarChart3, RotateCcw } from "lucide-react";
import { actions } from "@/lib/store";
import { toast } from "sonner";

const tabs = [
  { to: "/", label: "POS", icon: ShoppingCart },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/sales", label: "Sales", icon: Receipt },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur">
        <h1 className="text-xl font-bold"><span className="text-primary">Toy</span>Kiosk</h1>
        <button
          onClick={() => { if (confirm("Reset all data to demo data?")) { actions.reset(); toast.success("Demo data restored"); } }}
          className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        ><RotateCcw className="h-3.5 w-3.5" /> Reset Demo Data</button>
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {tabs.map((t) => (
            <Link key={t.to} to={t.to} activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-1 py-3 text-xs font-semibold text-muted-foreground data-[status=active]:text-primary">
              <t.icon className="h-5 w-5" />{t.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
