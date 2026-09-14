import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { STORES, storeLabel } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const start = async () => {
    if (!selected) return;
    const store = STORES.find((s) => s.code === selected)!;
    setLoading(true);
    const { data: num, error: nErr } = await supabase.rpc("next_collection_number", { p_store_code: store.code });
    if (nErr) { toast.error(nErr.message); setLoading(false); return; }
    const { data, error } = await supabase
      .from("collections")
      .insert({ store_code: store.code, store_name: store.name, number: num as number })
      .select()
      .single();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/coleta/$id", params: { id: data.id } });
  };

  return (
    <AppShell title="Nova Coleta">
      <Toaster richColors position="top-center" />
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Selecione a loja</h2>
          <p className="mt-1 text-sm text-muted-foreground">Escolha uma loja para iniciar a coleta</p>
        </div>
        <div className="space-y-2">
          {STORES.map((s) => {
            const active = selected === s.code;
            return (
              <button
                key={s.code}
                onClick={() => setSelected(s.code)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${active ? "border-primary bg-accent shadow-[var(--shadow-elegant)]" : "border-border bg-card hover:border-primary/40"}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${active ? "text-primary-foreground" : "bg-secondary text-secondary-foreground"}`} style={active ? { background: "var(--gradient-primary)" } : undefined}>
                  {s.code}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">LOJA {s.code}</p>
                  <p className="text-sm font-semibold">{s.name}</p>
                </div>
                <Store className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
              </button>
            );
          })}
        </div>
        <div className="fixed inset-x-0 bottom-16 z-10 mx-auto max-w-md px-5 pb-3">
          <Button onClick={start} disabled={!selected || loading} className="h-14 w-full rounded-2xl text-base font-semibold shadow-[var(--shadow-elegant)]" style={selected ? { background: "var(--gradient-primary)" } : undefined}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : selected ? `Iniciar coleta — ${storeLabel(selected, STORES.find(s=>s.code===selected)!.name)}` : "Selecione uma loja"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
