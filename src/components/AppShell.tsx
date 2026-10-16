import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ShoppingCart, Package, Receipt, BarChart3, RotateCcw, LogOut } from "lucide-react";
import { actions, clearStore, loadStore, useStoreLoaded } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { SignIn } from "@/components/SignIn";
import { toast } from "sonner";

const tabs = [
  { to: "/", label: "POS", icon: ShoppingCart },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/sales", label: "Sales", icon: Receipt },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null | undefined>(undefined);
  const loaded = useStoreLoaded();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user?.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((ev, session) => {
      if (ev === "SIGNED_IN" || ev === "SIGNED_OUT" || ev === "USER_UPDATED") setUser(session?.user.id ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (user) loadStore().catch(() => {}); else if (user === null) clearStore(); }, [user]);
  if (user === undefined || (user && !loaded)) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <SignIn />;
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur">
        <h1 className="text-xl font-bold"><span className="text-primary">Toy</span>Kiosk</h1>
        <div className="flex gap-2">
        <button onClick={() => supabase.auth.signOut()} aria-label="Sign out"
          className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><LogOut className="h-3.5 w-3.5" /></button>
        <button
          onClick={() => { if (confirm("Reset all data to demo data?")) { actions.reset().then(() => toast.success("Demo data restored")); } }}
          className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        ><RotateCcw className="h-3.5 w-3.5" /> Reset Demo Data</button>
        </div>
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
