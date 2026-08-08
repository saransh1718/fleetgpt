import React from "react";

export function PageHeader({ title, subtitle, action, testId }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6" data-testid={testId}>
      <div>
        <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest mb-1">/ {title}</div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function EmptyState({ title, description, cta, testId }) {
  return (
    <div className="border border-dashed border-border rounded-md p-10 text-center bg-card/50" data-testid={testId}>
      <div className="text-5xl font-display font-black text-primary/20 mb-2">∅</div>
      <div className="text-lg font-display font-semibold">{title}</div>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">{description}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

export function StatTile({ label, value, sub, accent = "primary", testId }) {
  const accentCls = accent === "secondary" ? "text-secondary-foreground bg-secondary" : "text-primary bg-primary/10";
  return (
    <div className="border border-border rounded-md p-5 bg-card hover:-translate-y-0.5 transition-transform" data-testid={testId}>
      <div className={`inline-block text-[10px] font-mono-tab uppercase tracking-widest px-2 py-0.5 rounded-sm ${accentCls}`}>{label}</div>
      <div className="mt-3 text-3xl font-mono-tab font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export function inr(n) {
  const num = Number(n || 0);
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
