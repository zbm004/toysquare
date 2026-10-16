import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export function SignIn() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) toast.error(error.message);
    else if (mode === "up") toast.success("Check your email to confirm your account");
  };
  const input = "w-full rounded-xl border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary";
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold"><span className="text-primary">Toy</span>Kiosk</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "in" ? "Sign in to your kiosk" : "Create your kiosk account"}</p>
        </div>
        <button type="button" onClick={async () => { const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); if (r?.error) toast.error(String(r.error.message ?? r.error)); }}
          className="w-full rounded-xl bg-secondary py-3 text-sm font-semibold hover:bg-secondary/70">Continue with Google</button>
        <div className="text-center text-xs text-muted-foreground">or</div>
        <form onSubmit={submit} className="space-y-3">
          <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {busy ? "…" : mode === "in" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
          {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
