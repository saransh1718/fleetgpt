import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Truck, MapPin, ArrowRight, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusBadge } from "@/components/CrudTable";

export default function PublicTracking() {
  const { lr } = useParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get(`/public/track/${lr}`).then(r => setD(r.data)).catch(() => setErr("Shipment not found"));
  }, [lr]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-md bg-primary grid place-items-center"><Truck className="w-4 h-4 text-primary-foreground" /></div>
          <div className="font-display font-bold">YourFleetAI · Track</div>
        </Link>
        {err && <div className="border border-destructive/40 bg-destructive/5 rounded-md p-8 text-center" data-testid="track-error">{err}</div>}
        {d && (
          <div className="border border-border bg-card rounded-md overflow-hidden" data-testid="track-card">
            <div className="p-6 border-b border-border">
              <div className="text-[11px] font-mono-tab text-primary uppercase tracking-widest">LR Number</div>
              <div className="font-display font-bold text-3xl mt-1">{d.lr_number}</div>
              <div className="text-sm text-muted-foreground mt-1">Carrier: {d.carrier}</div>
            </div>
            <div className="p-6 grid gap-6">
              <div>
                <div className="text-[11px] font-mono-tab text-muted-foreground uppercase tracking-widest">Status</div>
                <div className="mt-2">{statusBadge(d.status)}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-[11px] font-mono-tab text-muted-foreground uppercase tracking-widest">From</div>
                  <div className="font-display font-semibold text-xl mt-1 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {d.from}</div>
                </div>
                <ArrowRight className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <div className="text-[11px] font-mono-tab text-muted-foreground uppercase tracking-widest">To</div>
                  <div className="font-display font-semibold text-xl mt-1 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {d.to}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-[10px] font-mono-tab uppercase text-muted-foreground">Start</div><div className="font-mono-tab">{d.start_date}</div></div>
                <div><div className="text-[10px] font-mono-tab uppercase text-muted-foreground">End</div><div className="font-mono-tab">{d.end_date || "—"}</div></div>
                <div><div className="text-[10px] font-mono-tab uppercase text-muted-foreground">Truck</div><div className="font-mono-tab">{d.truck_reg || "—"}</div></div>
                <div><div className="text-[10px] font-mono-tab uppercase text-muted-foreground">Driver</div><div>{d.driver?.name || "—"}</div></div>
                <div><div className="text-[10px] font-mono-tab uppercase text-muted-foreground">Goods</div><div>{d.goods || "—"}</div></div>
                <div><div className="text-[10px] font-mono-tab uppercase text-muted-foreground">Weight</div><div className="font-mono-tab">{d.weight_tons ? `${d.weight_tons} T` : "—"}</div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
