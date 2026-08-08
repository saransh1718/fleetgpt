import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, inr } from "@/components/Shared";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertTriangle, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Input } from "@/components/ui/input";

export default function AIInsights() {
  const [profitability, setProfitability] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("What's the biggest risk in my fleet right now?");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    api.get("/ai/truck_profitability").then(r => setProfitability(r.data));
    api.get("/ai/fuel_anomalies").then(r => setAnomalies(r.data));
  }, []);

  const generate = async () => {
    setLoading(true);
    try { const { data } = await api.post("/ai/monthly_summary"); setSummary(data.summary); }
    catch { toast.error("AI failed"); }
    setLoading(false);
  };

  const askGemini = async () => {
    setLoading(true);
    try { const { data } = await api.post("/ai/quick_alert", { prompt }); setAnswer(data.answer); }
    catch { toast.error("Gemini failed"); }
    setLoading(false);
  };

  return (
    <div>
      <PageHeader
        title="AI Insights"
        subtitle="Claude Sonnet 4.6 + Gemini 3 Flash powering business intelligence for your fleet."
        testId="insights-header"
        action={<Button onClick={generate} disabled={loading} data-testid="ai-generate-summary-btn"><Sparkles className="w-4 h-4 mr-2" /> {loading ? "Thinking…" : "Monthly Summary"}</Button>}
      />

      {summary && (
        <div className="border border-primary/40 bg-primary/5 rounded-md p-6 mb-6" data-testid="ai-summary-card">
          <div className="flex items-center gap-2 text-primary text-[11px] font-mono-tab uppercase tracking-widest"><Sparkles className="w-3 h-3" /> Claude · CFO Summary</div>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {/* Truck profitability */}
      <div className="border border-border bg-card rounded-md p-6 mb-6">
        <div className="flex items-center gap-2 text-[11px] font-mono-tab text-muted-foreground uppercase tracking-widest">
          <Trophy className="w-3 h-3 text-primary" /> Truck Profitability Leaderboard
        </div>
        <div className="h-64 mt-4">
          <ResponsiveContainer>
            <BarChart data={profitability.slice(0, 10)}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="reg_number" stroke="hsl(var(--muted-foreground))" style={{ fontSize: 11 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="profit" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {profitability.slice(0, 3).map((t, i) => (
            <div key={t.truck_id} className="border border-border rounded-sm p-3" data-testid={`prof-truck-${t.truck_id}`}>
              <div className="text-[10px] font-mono-tab uppercase text-muted-foreground">#{i + 1} · {t.reg_number}</div>
              <div className="text-2xl font-mono-tab font-bold mt-1">{inr(t.profit)}</div>
              <div className="text-xs text-muted-foreground mt-1">₹{t.profit_per_km.toFixed(1)}/km · {Math.round(t.km)} km</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fuel anomalies */}
      <div className="border border-border bg-card rounded-md p-6 mb-6">
        <div className="flex items-center gap-2 text-[11px] font-mono-tab text-muted-foreground uppercase tracking-widest">
          <AlertTriangle className="w-3 h-3 text-destructive" /> Fuel anomalies
        </div>
        {anomalies.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">No fuel anomalies detected. Add fuel entries with odometer readings for auto-detection.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {anomalies.map(a => (
              <div key={a.id} className="border-l-2 border-destructive bg-destructive/5 p-3 text-sm" data-testid={`anomaly-${a.id}`}>
                <div className="flex justify-between">
                  <span>{a.date} · Mileage {a.mileage} km/L</span>
                  <span className="font-mono-tab text-destructive">{inr(a.total_cost)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gemini quick */}
      <div className="border border-border bg-card rounded-md p-6">
        <div className="text-[11px] font-mono-tab text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-secondary-foreground" /> Ask fleet AI · Gemini 3 Flash
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} data-testid="gemini-prompt-input" />
          <Button onClick={askGemini} disabled={loading} data-testid="gemini-ask-btn">Ask</Button>
        </div>
        {answer && <p className="mt-4 text-sm text-foreground/90 whitespace-pre-wrap" data-testid="gemini-answer">{answer}</p>}
      </div>
    </div>
  );
}
