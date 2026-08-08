import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Truck, Users, Route, Fuel, Wrench, FileSignature,
  UserCog, CreditCard, Calculator, ShieldCheck, Receipt, Building2,
  Sparkles, Settings, LogOut, Menu, X, Sun, Moon, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/trucks", label: "Trucks", icon: Truck },
  { to: "/app/drivers", label: "Drivers", icon: Users },
  { to: "/app/trips", label: "Trips", icon: Route },
  { to: "/app/fuel", label: "Fuel", icon: Fuel },
  { to: "/app/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/app/contracts", label: "Contracts", icon: FileSignature },
  { to: "/app/staff", label: "Staff", icon: UserCog },
  { to: "/app/fastag", label: "FASTag", icon: CreditCard },
  { to: "/app/accounting", label: "Accounting", icon: Calculator },
  { to: "/app/compliance", label: "Compliance", icon: ShieldCheck, badge: "Growth" },
  { to: "/app/invoices", label: "Invoices", icon: Receipt, badge: "Growth" },
  { to: "/app/customers", label: "Customers", icon: Building2 },
  { to: "/app/insights", label: "AI Insights", icon: Sparkles, badge: "Pro" },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const { user, company, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("yfa_theme") !== "light");
  const nav = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("yfa_theme", dark ? "dark" : "light");
  }, [dark]);

  if (!user) { nav("/login"); return null; }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-card border-r border-border z-40 transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} data-testid="sidebar">
        <div className="h-16 px-6 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary grid place-items-center">
              <Truck className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-bold tracking-tight leading-none">YourFleetAI</div>
              <div className="text-[10px] text-muted-foreground font-mono-tab">v2 · India</div>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} data-testid="sidebar-close"><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              <span className="flex-1">{n.label}</span>
              {n.badge && <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-wider">{n.badge}</Badge>}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-card">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary grid place-items-center font-semibold text-sm">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{user.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{company?.name}</div>
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-destructive" data-testid="logout-btn"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-30 flex items-center px-4 lg:px-8 gap-4">
          <button className="lg:hidden" onClick={() => setOpen(true)} data-testid="sidebar-open"><Menu className="w-5 h-5" /></button>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground font-mono-tab uppercase tracking-widest">Workspace</div>
            <div className="text-sm font-medium">{company?.name} · <span className="text-primary uppercase">{company?.plan}</span></div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} data-testid="theme-toggle">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" data-testid="notifications-btn"><Bell className="w-4 h-4" /></Button>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
