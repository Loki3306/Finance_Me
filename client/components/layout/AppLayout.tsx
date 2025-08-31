import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Home, Layers, PiggyBank, Settings, Wallet } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        const btn = document.getElementById("ff-fab");
        (btn as HTMLButtonElement | null)?.click();
      }
      if (e.key.toLowerCase() === "a") navigate("/accounts");
      if (e.key.toLowerCase() === "b") navigate("/budgets");
      if (e.key.toLowerCase() === "g") navigate("/goals");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  const menu = useMemo(
    () => [
      { to: "/", label: "Dashboard", icon: Home },
      { to: "/accounts", label: "Accounts", icon: Wallet },
      { to: "/transactions", label: "Transactions", icon: Layers },
      { to: "/budgets", label: "Budgets", icon: PiggyBank },
      { to: "/goals", label: "Goals", icon: PiggyBank },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
    [],
  );

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset" className="backdrop-blur bg-sidebar/60">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">FF</div>
            <span className="font-semibold">FlowFinance</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="uppercase tracking-wide text-xs">Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menu.map((m) => (
                  <SidebarMenuItem key={m.to}>
                    <SidebarMenuButton asChild isActive={location.pathname === m.to}>
                      <NavLink to={m.to} className="flex items-center gap-2">
                        <m.icon className="opacity-80" />
                        <span>{m.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="flex items-center justify-between px-2">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setIsDark((v) => !v)}>
              <span className="h-2.5 w-2.5 rounded-full bg-foreground/70" />
              {isDark ? "Dark" : "Light"}
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>LG</AvatarFallback>
            </Avatar>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-20 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-2 px-4">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="size-5" />
              </Button>
              <Button variant="default" size="sm" className="bg-primary text-primary-foreground hover:opacity-90" onClick={() => navigate("/accounts")}>Add Account</Button>
            </div>
          </div>
        </header>
        <main className="relative p-4 md:p-6 lg:p-8">{children}</main>
        <button id="ff-fab" className={cn("fixed bottom-5 right-5 h-14 w-14 rounded-full bg-success text-white shadow-lg transition hover:scale-105 active:scale-95", "backdrop-blur")}
          onClick={() => {
            const evt = new CustomEvent("ff:openQuickAdd");
            window.dispatchEvent(evt);
          }}
          aria-label="Quick add transaction"
        >
          <span className="text-2xl">＋</span>
        </button>
      </SidebarInset>
    </SidebarProvider>
  );
}
