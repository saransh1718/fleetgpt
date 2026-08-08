import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import CrudTable from "@/components/CrudTable";
import { PageHeader, inr } from "@/components/Shared";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export default function FuelPage() {
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  useEffect(() => {
    api.get("/trucks").then(r => setTrucks(r.data));
    api.get("/drivers").then(r => setDrivers(r.data));
  }, []);
  return (
    <div>
      <PageHeader title="Fuel Log" subtitle="Refills with mileage tracking. Anomalies flagged automatically." testId="fuel-header" />
      <CrudTable
        endpoint="fuel"
        title="Fuel Entry"
        testIdPrefix="fuel"
        fields={[
          { key: "truck_id", label: "Truck", type: "select", required: true, options: trucks.map(t => ({ value: t.id, label: t.reg_number })) },
          { key: "driver_id", label: "Driver", type: "select", options: [{ value: "", label: "—" }, ...drivers.map(d => ({ value: d.id, label: d.name }))] },
          { key: "date", label: "Date", type: "date", required: true },
          { key: "liters", label: "Liters", type: "number", step: "0.01", required: true },
          { key: "rate_per_liter", label: "₹ / Liter", type: "number", step: "0.01", required: true },
          { key: "odometer", label: "Odometer (km)", type: "number" },
          { key: "location", label: "Location" },
          { key: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        columns={[
          { key: "date", label: "Date" },
          { key: "truck_id", label: "Truck", render: (v) => trucks.find(t => t.id === v)?.reg_number || "—" },
          { key: "liters", label: "Liters", render: (v) => <span className="font-mono-tab">{v}</span> },
          { key: "rate_per_liter", label: "Rate", render: (v) => `₹${v}` },
          { key: "total_cost", label: "Cost", render: inr },
          { key: "mileage", label: "km/L", render: (v, r) => v ? (
            <span className="font-mono-tab flex items-center gap-1">{v} {r.anomaly && <AlertTriangle className="w-3 h-3 text-destructive" />}</span>
          ) : "—" },
          { key: "anomaly", label: "Flag", render: (v) => v ? <Badge variant="outline" className="border-destructive/40 text-destructive">Anomaly</Badge> : null },
        ]}
      />
    </div>
  );
}
