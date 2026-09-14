import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { STORES } from "@/lib/stores";
import { Download, Inbox, Loader2, Search, Trash2 } from "lucide-react";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/historico")({ component: Historico });

type Coll = { id: string; number: number; store_code: string; store_name: string; status: string; finished_at: string | null; created_at: string };

function Historico() {
  const [list, setList] = useState<Coll[] | null>(null);
  const [store, setStore] = useState<string>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("collections").select("*").order("created_at", { ascending: false });
      setList((data ?? []) as Coll[]);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!list) return [];
    return list.filter((c) => {
      if (store !== "all" && c.store_code !== store) return false;
      if (q) {
        const t = q.toLowerCase();
        const num = String(c.number).padStart(3, "0");
        return num.includes(t) || c.store_name.toLowerCase().includes(t) || c.store_code.includes(t);
      }
      return true;
    });
  }, [list, store, q]);

  const download = async (c: Coll) => {
    const { data, error } = await supabase.from("collection_items").select("barcode,quantity").eq("collection_id", c.id).order("created_at");
    if (error) { toast.error(error.message); return; }
    const fname = `coleta_${c.store_code}_${String(c.number).padStart(3, "0")}.csv`;
    downloadCsv(fname, buildCsv((data ?? []) as any));
  };

  const remove = async (c: Coll) => {
    const { error: e1 } = await supabase.from("collection_items").delete().eq("collection_id", c.id);
    if (e1) { toast.error(e1.message); return; }
    const { error: e2 } = await supabase.from("collections").delete().eq("id", c.id);
    if (e2) { toast.error(e2.message); return; }
    setList((prev) => (prev ?? []).filter((x) => x.id !== c.id));
    toast.success("Coleta excluída");
  };

  return (
    <AppShell title="Histórico">
      <Toaster richColors position="top-center" />
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por número ou loja" className="h-12 pl-10" />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          <Chip active={store === "all"} onClick={() => setStore("all")}>Todas</Chip>
          {STORES.map((s) => (
            <Chip key={s.code} active={store === s.code} onClick={() => setStore(s.code)}>LOJA {s.code}</Chip>
          ))}
        </div>

        {list === null ? (
          <div className="flex justify-center pt-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">Nenhuma coleta encontrada</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((c) => (
              <li key={c.id} className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3">
                  <Link to="/coleta/$id/resumo" params={{ id: c.id }} className="flex flex-1 items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                      <span className="text-[10px] font-medium leading-none opacity-80">N°</span>
                      <span className="text-sm font-bold leading-tight">{String(c.number).padStart(3, "0")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">LOJA {c.store_code}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.store_name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {new Date(c.finished_at ?? c.created_at).toLocaleString("pt-BR")} · {c.status === "finished" ? "Finalizada" : "Em andamento"}
                      </p>
                    </div>
                  </Link>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <Button size="icon" variant="outline" onClick={() => download(c)} className="h-9 w-9">
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="outline" className="h-9 w-9 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir coleta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Coleta N° {String(c.number).padStart(3, "0")} da LOJA {c.store_code}. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(c)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>
      {children}
    </button>
  );
}
