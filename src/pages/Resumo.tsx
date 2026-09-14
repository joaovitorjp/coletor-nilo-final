import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { CheckCircle2, Download, History, Loader2 } from "lucide-react";
import { buildCsv, downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/coleta/$id/resumo")({ component: Resumo });

function Resumo() {
  const { id } = Route.useParams();
  const [coll, setColl] = useState<any>(null);
  const [items, setItems] = useState<Array<{ barcode: string; quantity: number }>>([]);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: it }] = await Promise.all([
        supabase.from("collections").select("*").eq("id", id).single(),
        supabase.from("collection_items").select("barcode,quantity").eq("collection_id", id).order("created_at"),
      ]);
      setColl(c);
      setItems((it ?? []) as any);
    })();
  }, [id]);

  const download = () => {
    if (!coll) return;
    const fname = `coleta_${coll.store_code}_${String(coll.number).padStart(3, "0")}.csv`;
    downloadCsv(fname, buildCsv(items));
  };

  if (!coll) return <AppShell><div className="flex justify-center pt-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AppShell>;

  const totalQty = items.reduce((s, i) => s + Number(i.quantity), 0);

  return (
    <AppShell title="Coleta finalizada">
      <Toaster richColors position="top-center" />
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--gradient-primary)" }}>
            <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">#{String(coll.number).padStart(3, "0")}</p>
            <p className="text-xs text-muted-foreground">LOJA {coll.store_code} — {coll.store_name}</p>
          </div>
          <div className="flex w-full justify-around border-t border-border pt-3">
            <div><p className="text-lg font-bold">{items.length}</p><p className="text-xs text-muted-foreground">Itens</p></div>
            <div><p className="text-lg font-bold">{totalQty}</p><p className="text-xs text-muted-foreground">Qtd total</p></div>
          </div>
        </div>

        <Button onClick={download} className="h-14 w-full rounded-2xl text-base font-semibold shadow-[var(--shadow-elegant)]" style={{ background: "var(--gradient-primary)" }}>
          <Download className="mr-2 h-5 w-5" /> Baixar CSV
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="h-12"><Link to="/">Nova coleta</Link></Button>
          <Button asChild variant="outline" className="h-12"><Link to="/historico"><History className="mr-2 h-4 w-4" /> Histórico</Link></Button>
        </div>
      </div>
    </AppShell>
  );
}
