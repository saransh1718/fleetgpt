import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import CrudTable from "@/components/CrudTable";
import { PageHeader } from "@/components/Shared";
import { Badge } from "@/components/ui/badge";

export default function Compliance() {
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  useEffect(() => {
    api.get("/trucks").then(r => setTrucks(r.data));
    api.get("/drivers").then(r => setDrivers(r.data));
  }, []);

  const urgency = (expiry) => {
    if (!expiry) return null;
    const days = Math.floor((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return <Badge variant="outline" className="border-destructive/40 text-destructive">Expired</Badge>;
    if (days <= 7) return <Badge variant="outline" className="border-destructive/40 text-destructive">{days}d</Badge>;
    if (days <= 30) return <Badge variant="outline" className="border-yellow-500/40 text-yellow-600">{days}d</Badge>;
    return <Badge variant="outline" className="border-green-500/40 text-green-600">{days}d</Badge>;
  };

  return (
    <div>
      <PageHeader title="Compliance Vault" subtitle="Store & auto-alert on RC, Insurance, PUC, Permit, Fitness, License expiries." testId="compliance-header" />
      <CrudTable
        endpoint="compliance"
        title="Document"
        testIdPrefix="compliance"
        initial={{ doc_type: "rc" }}
        fields={[
          { key: "doc_type", label: "Doc Type", type: "select", required: true, options: ["rc", "insurance", "puc", "permit", "fitness", "road_tax", "license", "other"] },
          { key: "truck_id", label: "Truck", type: "select", options: [{ value: "", label: "—" }, ...trucks.map(t => ({ value: t.id, label: t.reg_number }))] },
          { key: "driver_id", label: "Driver", type: "select", options: [{ value: "", label: "—" }, ...drivers.map(d => ({ value: d.id, label: d.name }))] },
          { key: "number", label: "Document Number" },
          { key: "issue_date", label: "Issue Date", type: "date" },
          { key: "expiry_date", label: "Expiry Date", type: "date", required: true },
          { key: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        columns={[
          { key: "doc_type", label: "Type", render: (v) => <span className="uppercase text-[10px] font-mono-tab tracking-widest text-primary">{v}</span> },
          { key: "truck_id", label: "Truck", render: (v) => trucks.find(t => t.id === v)?.reg_number || (drivers.find(d => d.id === v)?.name) || "—" },
          { key: "number", label: "Number" },
          { key: "expiry_date", label: "Expires" },
          { key: "expiry_date", label: "Status", render: urgency },
        ]}
      />
    </div>
  );
}
