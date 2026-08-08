import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import CrudTable, { statusBadge } from "@/components/CrudTable";
import { PageHeader, inr } from "@/components/Shared";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";

export default function Trips() {
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    api.get("/trucks").then(r => setTrucks(r.data));
    api.get("/drivers").then(r => setDrivers(r.data));
    api.get("/customers").then(r => setCustomers(r.data));
  }, []);

  const shareLR = async (row) => {
    const url = `${window.location.origin}/track/${row.lr_number}`;
    try { await navigator.clipboard.writeText(url); toast.success(`Tracking link copied: ${url}`); }
    catch { toast.info(url); }
  };

  return (
    <div>
      <PageHeader title="Trips" subtitle="Loads, LR numbers, freight & advance balance." testId="trips-header" />
      <CrudTable
        endpoint="trips"
        title="Trip"
        testIdPrefix="trips"
        initial={{ status: "planned", advance: 0 }}
        fields={[
          { key: "truck_id", label: "Truck", type: "select", required: true, options: trucks.map(t => ({ value: t.id, label: t.reg_number })) },
          { key: "driver_id", label: "Driver", type: "select", options: [{ value: "", label: "—" }, ...drivers.map(d => ({ value: d.id, label: d.name }))] },
          { key: "customer_id", label: "Customer", type: "select", options: [{ value: "", label: "—" }, ...customers.map(c => ({ value: c.id, label: c.name }))] },
          { key: "from_location", label: "From", required: true },
          { key: "to_location", label: "To", required: true },
          { key: "start_date", label: "Start Date", type: "date", required: true },
          { key: "end_date", label: "End Date", type: "date" },
          { key: "distance_km", label: "Distance (km)", type: "number" },
          { key: "freight_amount", label: "Freight (₹)", type: "number", required: true },
          { key: "advance", label: "Advance (₹)", type: "number" },
          { key: "goods", label: "Goods" },
          { key: "weight_tons", label: "Weight (T)", type: "number", step: "0.1" },
          { key: "status", label: "Status", type: "select", options: ["planned", "in_transit", "delivered", "cancelled"] },
          { key: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        columns={[
          { key: "lr_number", label: "LR #", render: (v) => <span className="font-mono-tab text-primary text-xs">{v}</span> },
          { key: "from_location", label: "Route", render: (_, r) => `${r.from_location} → ${r.to_location}` },
          { key: "start_date", label: "Start" },
          { key: "truck_id", label: "Truck", render: (v) => trucks.find(t => t.id === v)?.reg_number || "—" },
          { key: "freight_amount", label: "Freight", render: inr },
          { key: "balance", label: "Balance", render: (v) => <span className="text-primary font-mono-tab">{inr(v)}</span> },
          { key: "status", label: "Status", render: statusBadge },
          { key: "id", label: "LR", render: (_, r) => (
            <Button size="sm" variant="ghost" onClick={() => shareLR(r)} data-testid={`share-lr-${r.id}`}><FileText className="w-3 h-3 mr-1" /> Share</Button>
          )},
        ]}
      />
    </div>
  );
}
