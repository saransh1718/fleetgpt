import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import CrudTable from "@/components/CrudTable";
import { PageHeader, inr } from "@/components/Shared";

export default function MaintenancePage() {
  const [trucks, setTrucks] = useState([]);
  useEffect(() => { api.get("/trucks").then(r => setTrucks(r.data)); }, []);
  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Services, tyres, oil, repairs — per truck." testId="maintenance-header" />
      <CrudTable
        endpoint="maintenance"
        title="Maintenance"
        testIdPrefix="maintenance"
        initial={{ type: "service" }}
        fields={[
          { key: "truck_id", label: "Truck", type: "select", required: true, options: trucks.map(t => ({ value: t.id, label: t.reg_number })) },
          { key: "date", label: "Date", type: "date", required: true },
          { key: "type", label: "Type", type: "select", options: ["service", "tyres", "oil", "repair", "other"] },
          { key: "description", label: "Description", required: true, full: true },
          { key: "cost", label: "Cost (₹)", type: "number", required: true },
          { key: "odometer", label: "Odometer (km)", type: "number" },
          { key: "vendor", label: "Vendor" },
          { key: "next_service_km", label: "Next Service (km)", type: "number" },
        ]}
        columns={[
          { key: "date", label: "Date" },
          { key: "truck_id", label: "Truck", render: (v) => trucks.find(t => t.id === v)?.reg_number || "—" },
          { key: "type", label: "Type", render: (v) => <span className="uppercase text-[10px] font-mono-tab tracking-widest text-primary">{v}</span> },
          { key: "description", label: "Description" },
          { key: "cost", label: "Cost", render: inr },
          { key: "vendor", label: "Vendor" },
        ]}
      />
    </div>
  );
}
