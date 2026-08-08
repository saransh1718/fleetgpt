import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import CrudTable, { statusBadge } from "@/components/CrudTable";
import { PageHeader, inr } from "@/components/Shared";

export default function Contracts() {
  const [trucks, setTrucks] = useState([]);
  const [customers, setCustomers] = useState([]);
  useEffect(() => {
    api.get("/trucks").then(r => setTrucks(r.data));
    api.get("/customers").then(r => setCustomers(r.data));
  }, []);
  return (
    <div>
      <PageHeader title="Contracts" subtitle="Fixed-term truck assignments & monthly payments." testId="contracts-header" />
      <CrudTable
        endpoint="contracts"
        title="Contract"
        testIdPrefix="contracts"
        initial={{ status: "active" }}
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "truck_id", label: "Truck", type: "select", required: true, options: trucks.map(t => ({ value: t.id, label: t.reg_number })) },
          { key: "customer_id", label: "Customer", type: "select", options: [{ value: "", label: "—" }, ...customers.map(c => ({ value: c.id, label: c.name }))] },
          { key: "start_date", label: "Start Date", type: "date", required: true },
          { key: "end_date", label: "End Date", type: "date" },
          { key: "monthly_amount", label: "Monthly Amount (₹)", type: "number", required: true },
          { key: "investment", label: "Investment (₹)", type: "number" },
          { key: "status", label: "Status", type: "select", options: ["active", "paused", "closed"] },
          { key: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        columns={[
          { key: "title", label: "Title" },
          { key: "truck_id", label: "Truck", render: (v) => trucks.find(t => t.id === v)?.reg_number || "—" },
          { key: "customer_id", label: "Customer", render: (v) => customers.find(c => c.id === v)?.name || "—" },
          { key: "monthly_amount", label: "Monthly", render: inr },
          { key: "start_date", label: "Start" },
          { key: "status", label: "Status", render: statusBadge },
        ]}
      />
    </div>
  );
}
