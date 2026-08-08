import React from "react";
import CrudTable, { statusBadge } from "@/components/CrudTable";
import { PageHeader } from "@/components/Shared";

export default function Trucks() {
  return (
    <div>
      <PageHeader title="Trucks" subtitle="Vehicle master data — registration, capacity, ownership." testId="trucks-header" />
      <CrudTable
        endpoint="trucks"
        title="Truck"
        testIdPrefix="trucks"
        initial={{ status: "active", ownership: "owned" }}
        fields={[
          { key: "reg_number", label: "Registration Number", required: true },
          { key: "truck_type", label: "Type (e.g. 10-wheeler)" },
          { key: "make", label: "Make" },
          { key: "model", label: "Model" },
          { key: "year", label: "Year", type: "number" },
          { key: "capacity_tons", label: "Capacity (tons)", type: "number", step: "0.1" },
          { key: "current_odometer", label: "Odometer (km)", type: "number" },
          { key: "ownership", label: "Ownership", type: "select", options: ["owned", "leased", "attached"] },
          { key: "status", label: "Status", type: "select", options: ["active", "idle", "in_maintenance", "retired"] },
          { key: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        columns={[
          { key: "reg_number", label: "Reg No", render: (v) => <span className="font-mono-tab font-semibold">{v}</span> },
          { key: "truck_type", label: "Type" },
          { key: "make", label: "Make/Model", render: (_, r) => `${r.make || ""} ${r.model || ""}`.trim() || "—" },
          { key: "capacity_tons", label: "Capacity", render: (v) => v ? `${v} T` : "—" },
          { key: "current_odometer", label: "Odometer", render: (v) => v ? `${Number(v).toLocaleString()} km` : "—" },
          { key: "status", label: "Status", render: statusBadge },
        ]}
      />
    </div>
  );
}
