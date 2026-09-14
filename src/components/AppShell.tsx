import { Link, useLocation } from "react-router-dom";
import { Database, Download, History, List, ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const { pathname } = useLocation();
  const [installEvent, setInstallEvent] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BIPEvent);
    };
    const installedHandler = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    if (window.matchMedia?.("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}>
            <ScanLine className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold leading-tight">{title ?? "Coletor"}</h1>
            <p className="text-xs text-muted-foreground">Coleta de produtos</p>
          </div>
          {installEvent && !installed && (
            <Button size="sm" variant="outline" onClick={handleInstall} className="gap-1">
              <Download className="h-4 w-4" />
              Instalar
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1 px-5 py-5 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-background/90 backdrop-blur-md">
        <div className="grid grid-cols-4">
          <NavItem to="/" active={pathname === "/"} icon={<ScanLine className="h-5 w-5" />} label="Coleta" />
          <NavItem to="/historico" active={pathname.startsWith("/historico")} icon={<History className="h-5 w-5" />} label="Histórico" />
          <NavItem to="/lista" active={pathname.startsWith("/lista")} icon={<List className="h-5 w-5" />} label="Lista" />
          <NavItem to="/dados" active={pathname.startsWith("/dados")} icon={<Database className="h-5 w-5" />} label="Dados" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, active, icon, label }: { to: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className={cn("flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors", active ? "text-primary" : "text-muted-foreground")}>
      {icon}
      {label}
    </Link>
  );
}
