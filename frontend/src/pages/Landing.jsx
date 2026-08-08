import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, ShieldCheck, Sparkles, Receipt, ArrowRight, Check, MapPin, Zap } from "lucide-react";

const FEATURES = [
  { icon: Truck, title: "Fleet Ops Command", desc: "Trucks, drivers, trips, fuel, maintenance, FASTag — one clean workspace built for Indian roads." },
  { icon: ShieldCheck, title: "Compliance Vault", desc: "Never miss an RC, Insurance, PUC, Permit or Fitness expiry. Alerts on WhatsApp + email." },
  { icon: Receipt, title: "GST Invoicing", desc: "Auto-generate GST-compliant invoices from trips. Track receivables aging (30/60/90)." },
  { icon: Sparkles, title: "AI Insights", desc: "Truck profitability leaderboard, fuel theft detection, monthly AI-written business summary." },
];

export default function Landing() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary grid place-items-center"><Truck className="w-4 h-4 text-primary-foreground" /></div>
            <div className="font-display font-bold text-lg">YourFleetAI</div>
            <span className="text-[10px] font-mono-tab text-primary uppercase tracking-widest border border-primary/30 px-1.5 py-0.5 rounded-sm ml-1">v2</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#track" className="hover:text-foreground transition-colors">Track Shipment</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => nav("/login")} data-testid="landing-login-btn">Sign in</Button>
            <Button onClick={() => nav("/signup")} data-testid="landing-signup-btn">Sign up</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 stripe-lines opacity-30" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-3 py-1 rounded-sm text-xs font-mono-tab text-primary uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3" /> Built for Indian trucking · GST · WhatsApp
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95]">
              Run your fleet like a <span className="text-primary">CFO</span>,<br />
              not a <span className="text-muted-foreground">clerk</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              Multi-tenant transport management for Indian fleets. Trips, fuel, maintenance,
              compliance, GST invoicing and AI insights — all in one workspace that pays for itself.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => nav("/signup")} data-testid="hero-signup-btn" className="text-base">
                Create your workspace <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => nav("/login")} data-testid="hero-demo-btn" className="text-base">
                Try demo (demo@yourfleetai.com)
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground font-mono-tab uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-primary" /> GST invoicing day 1</div>
              <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-primary" /> Multi-user workspaces</div>
              <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-primary" /> AI insights built-in</div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative border border-border bg-card rounded-md p-6 shadow-2xl">
              <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[10px] font-mono-tab uppercase tracking-widest px-2 py-1 rounded-sm">LIVE</div>
              <div className="text-[10px] font-mono-tab text-muted-foreground uppercase tracking-widest">Fleet snapshot</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { k: "Trucks active", v: "18/22" },
                  { k: "Trips this month", v: "142" },
                  { k: "Revenue MTD", v: "₹28.6L" },
                  { k: "Expiring docs", v: "3", danger: true },
                ].map((x) => (
                  <div key={x.k} className="border border-border rounded-sm p-3">
                    <div className="text-[10px] font-mono-tab text-muted-foreground uppercase tracking-widest">{x.k}</div>
                    <div className={`text-2xl font-mono-tab font-bold mt-1 ${x.danger ? "text-destructive" : ""}`}>{x.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <div className="text-[10px] font-mono-tab text-primary uppercase tracking-widest">AI weekly summary</div>
                <p className="text-sm mt-1 text-foreground/80">"Truck MH12AB1234 topped profitability at ₹18/km. Flag: Fuel efficiency dropped 12% on MH14CD5678 — likely leak."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest">/ features</div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mt-2 max-w-3xl">Everything a fleet owner opens 20 tabs for — one workspace.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {FEATURES.map((f) => (
              <div key={f.title} className="border border-border bg-card p-6 rounded-md hover:-translate-y-1 hover:border-primary transition-transform">
                <f.icon className="w-6 h-6 text-primary mb-4" />
                <div className="font-display font-semibold text-lg">{f.title}</div>
                <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Track shipment */}
      <section id="track" className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <MapPin className="w-8 h-8 mx-auto text-primary" />
          <h2 className="font-display text-3xl font-bold mt-3">Track a shipment</h2>
          <p className="text-muted-foreground mt-2">Enter LR number to check status.</p>
          <form onSubmit={(e) => { e.preventDefault(); const lr = e.target.lr.value.trim(); if (lr) nav(`/track/${lr}`); }} className="mt-6 flex gap-2">
            <input name="lr" placeholder="e.g. LR-2026-00001" className="flex-1 h-11 px-4 rounded-md bg-card border border-border focus:border-primary outline-none font-mono-tab" data-testid="landing-lr-input" />
            <Button size="lg" type="submit" data-testid="landing-track-btn">Track</Button>
          </form>
        </div>
      </section>

      <footer className="py-10 text-center text-xs text-muted-foreground font-mono-tab uppercase tracking-widest">
        © 2026 YourFleetAI · Made in India for Indian fleets
      </footer>
    </div>
  );
}
