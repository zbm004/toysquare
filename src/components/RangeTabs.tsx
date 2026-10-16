import type { Range } from "@/lib/store";

const opts: [Range, string][] = [["today", "Today"], ["week", "This Week"], ["month", "This Month"], ["all", "All Time"]];
export function RangeTabs({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1">
      {opts.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`rounded-lg py-1.5 text-xs font-bold ${value === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{l}</button>
      ))}
    </div>
  );
}

export function Metric({ label, value, tone }: { label: string; value: string; tone?: "primary" | "success" | "destructive" | "accent" }) {
  const c = { primary: "text-primary", success: "text-success", destructive: "text-destructive", accent: "text-accent" }[tone ?? "primary"];
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${c}`}>{value}</p>
    </div>
  );
}
