import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CheckCircle2, Boxes, HelpCircle, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lista")({ component: ListaPage });

type Status = "area_venda" | "estoque_virtual" | "nao_verificado";

type Item = {
  id: string;
  internal_code: string | null;
  description: string | null;
  barcode: string;
  stock_coverage_days: number | null;
  days_without_sale: number | null;
  section: string | null;
  store: string | null;
  status: Status;
};

const STATUS_LABEL: Record<Status, string> = {
  area_venda: "Já na área de venda",
  estoque_virtual: "Estoque virtual",
  nao_verificado: "Não verificado",
};

const STATUS_ICON: Record<Status, React.ReactNode> = {
  area_venda: <CheckCircle2 className="h-4 w-4" />,
  estoque_virtual: <Boxes className="h-4 w-4" />,
  nao_verificado: <HelpCircle className="h-4 w-4" />,
};

const STATUS_CLASS: Record<Status, string> = {
  area_venda: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  estoque_virtual: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  nao_verificado: "bg-muted text-muted-foreground border-border",
};

const PAGE_SIZE = 50;

function ListaPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [section, setSection] = useState<string>("__all");
  const [store, setStore] = useState<string>("__all");
  const [statusFilter, setStatusFilter] = useState<string>("__all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const loadFilters = async () => {
    const [{ data: secData, error: secErr }, { data: storeData, error: stErr }] = await Promise.all([
      supabase.rpc("inventory_distinct_sections"),
      supabase.rpc("inventory_distinct_stores"),
    ]);
    if (secErr) console.error(secErr);
    if (stErr) console.error(stErr);
    setSections(((secData ?? []) as any[]).map((r) => r.section).filter(Boolean));
    setStores(((storeData ?? []) as any[]).map((r) => r.store).filter(Boolean));
  };

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("product_inventory")
      .select("*", { count: "exact" })
      .order("description", { ascending: true })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (section !== "__all") q = q.eq("section", section);
    if (store !== "__all") q = q.eq("store", store);
    if (statusFilter !== "__all") q = q.eq("status", statusFilter);
    if (search.trim()) {
      const s = search.trim().replace(/[%,]/g, "");
      q = q.or(`description.ilike.%${s}%,barcode.ilike.%${s}%,internal_code.ilike.%${s}%`);
    }
    const { data, error, count } = await q;
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setItems((data ?? []) as Item[]);
    setTotal(count ?? 0);
  };

  useEffect(() => { loadFilters(); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [section, store, statusFilter, page]);
  useEffect(() => { setPage(0); }, [section, store, statusFilter, search]);
  useEffect(() => {
    const t = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search]);

  const updateStatus = async (id: string, next: Status) => {
    const prev = items;
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, status: next } : it)));
    const { error } = await supabase.from("product_inventory").update({ status: next }).eq("id", id);
    if (error) {
      setItems(prev);
      toast.error("Falha ao atualizar");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell title="Lista">
      <Toaster richColors position="top-center" />
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar descrição, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="pl-9 h-10"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seção" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas seções</SelectItem>
                {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={store} onValueChange={setStore}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Loja" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas lojas</SelectItem>
                {stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos status</SelectItem>
                <SelectItem value="nao_verificado">Não verificado</SelectItem>
                <SelectItem value="area_venda">Área de venda</SelectItem>
                <SelectItem value="estoque_virtual">Estoque virtual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[11px] text-muted-foreground">{total.toLocaleString("pt-BR")} produto(s)</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum produto. Importe a planilha na aba Dados.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight line-clamp-2">{it.description ?? it.barcode}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {it.internal_code ? `Cod ${it.internal_code} · ` : ""}EAN {it.barcode}
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap", STATUS_CLASS[it.status])}>
                    {STATUS_ICON[it.status]} {STATUS_LABEL[it.status]}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                  <Info label="Seção" value={it.section ?? "-"} />
                  <Info label="Loja" value={it.store ?? "-"} />
                  <Info label="Cob. estoque" value={it.stock_coverage_days != null ? `${it.stock_coverage_days} d` : "-"} />
                  <Info label="Sem venda" value={it.days_without_sale != null ? `${it.days_without_sale} d` : "-"} />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <StatusButton active={it.status === "area_venda"} onClick={() => updateStatus(it.id, "area_venda")} status="area_venda" />
                  <StatusButton active={it.status === "estoque_virtual"} onClick={() => updateStatus(it.id, "estoque_virtual")} status="estoque_virtual" />
                  <StatusButton active={it.status === "nao_verificado"} onClick={() => updateStatus(it.id, "nao_verificado")} status="nao_verificado" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-1">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-xs font-medium">{value}</p>
    </div>
  );
}

function StatusButton({ active, onClick, status }: { active: boolean; onClick: () => void; status: Status }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1 rounded-lg border px-1.5 py-1.5 text-[10px] font-medium transition-colors leading-tight text-center",
        active ? STATUS_CLASS[status] : "border-border bg-background text-muted-foreground hover:bg-muted"
      )}
    >
      {STATUS_ICON[status]}
      <span className="truncate">{STATUS_LABEL[status]}</span>
    </button>
  );
}
