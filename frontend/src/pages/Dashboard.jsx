import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, StatTile, inr } from "@/components/Shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sparkles, TrendingUp, Fuel, Wrench, Truck, ShieldAlert } from "lucide-react";
import { Line, LineChart, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [pnl, setPnl] = useState([]);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api.get("/dashboard/summary").then(r => setS(r.data));
    api.get("/dashboard/monthly_pnl").then(r => setPnl(r.data));
  }, []);

  const genAI = async () => {
    setAiLoading(true);
    try { const { data } = await api.post("/ai/monthly_summary"); setAiText(data.summary); }
    catch (e) { toast.error("AI summary failed"); }
    setAiLoading(false);
  };

  if (!s) return <div className="text-sm text-muted-foreground">Loading dashboard…</div>;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Real-time snapshot of your fleet operations, cash flow, and compliance risk."
        testId="dashboard-header"
        action={
          <Button onClick={genAI} disabled={aiLoading} data-testid="dashboard-ai-summary-btn">
            <Sparkles className="w-4 h-4 mr-2" /> {aiLoading ? "Generating…" : "AI weekly summary"}
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile testId="stat-trucks" label="Trucks Active" value={`${s.trucks_active}/${s.trucks_total}`} sub={`${s.drivers_total} drivers`} />
        <StatTile testId="stat-trips" label="Trips This Month" value={s.trips_this_month} sub="Total loads" />
        <StatTile testId="stat-revenue" label="Revenue MTD" value={inr(s.revenue_this_month)} sub={`Fuel ${inr(s.fuel_this_month)}`} />
        <StatTile testId="stat-receivables" label="Receivables" value={inr(s.receivables_outstanding)} sub="Outstanding" accent="secondary" />
      </div>

      {aiText && (
        <div className="mt-6 border border-primary/30 bg-primary/5 rounded-md p-6" data-testid="ai-summary-card">
          <div className="flex items-center gap-2 text-primary text-[11px] font-mono-tab uppercase tracking-widest"><Sparkles className="w-3 h-3" /> AI CFO Summary · Claude Sonnet 4.6</div>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{aiText}</p>
        </div>
      )}

      {/* Chart */}
      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 border border-border bg-card rounded-md p-6">
          <div className="flex items-center gap-2 text-[11px] font-mono-tab text-muted-foreground uppercase tracking-widest"><TrendingUp className="w-3 h-3 text-primary" /> Monthly P&L trend</div>
          <div className="h-64 mt-4">
            <ResponsiveContainer>
              <AreaChart data={pnl}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6 }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revG)" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border border-border bg-card rounded-md p-6">
          <div className="flex items-center gap-2 text-[11px] font-mono-tab text-muted-foreground uppercase tracking-widest"><ShieldAlert className="w-3 h-3 text-destructive" /> Compliance risk</div>
          <div className="mt-4 space-y-2">
            {s.expired_docs.length === 0 && s.expiring_docs.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">All documents in order ✓</div>
            ) : (
              <>
                {s.expired_docs.map(d => (
                  <div key={d.id} className="border-l-2 border-destructive bg-destructive/10 p-2 text-xs" data-testid={`expired-${d.id}`}>
                    <div className="font-mono-tab uppercase text-destructive">{d.doc_type} · EXPIRED</div>
                    <div className="text-muted-foreground">Expiry: {d.expiry_date}</div>
                  </div>
                ))}
                {s.expiring_docs.map(d => (
                  <div key={d.id} className="border-l-2 border-yellow-500 bg-yellow-500/10 p-2 text-xs" data-testid={`expiring-${d.id}`}>
                    <div className="font-mono-tab uppercase text-yellow-600">{d.doc_type}</div>
                    <div className="text-muted-foreground">Expires: {d.expiry_date}</div>
                  </div>
                ))}
              </>
            )}
            <Link to="/app/compliance" className="text-primary text-xs hover:underline block mt-2">View all →</Link>
          </div>
        </div>
      </div>

      {/* Low FASTag */}
      <div className="mt-6">
        <div className="border border-border bg-card rounded-md p-6">
          <div className="text-[11px] font-mono-tab text-muted-foreground uppercase tracking-widest">Low FASTag balances</div>
          {s.low_fastag_trucks.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">All balances healthy.</div>
          ) : (
            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {s.low_fastag_trucks.map(t => (
                <div key={t.truck_id} className="flex items-center justify-between border border-border rounded-sm p-2" data-testid={`low-fastag-${t.truck_id}`}>
                  <span className="font-mono-tab text-sm">{t.truck_id.slice(0, 8)}</span>
                  <Badge variant="outline" className="border-destructive/30 text-destructive">{inr(t.balance)}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
