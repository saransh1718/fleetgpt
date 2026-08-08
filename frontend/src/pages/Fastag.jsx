import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import CrudTable from "@/components/CrudTable";
import { PageHeader, StatTile, inr } from "@/components/Shared";

export default function Fastag() {
  const [trucks, setTrucks] = useState([]);
  const [entries, setEntries] = useState([]);
  useEffect(() => {
    api.get("/trucks").then(r => setTrucks(r.data));
    api.get("/fastag").then(r => setEntries(r.data));
  }, []);

  const balances = {};
  entries.forEach(e => {
    balances[e.truck_id] = balances[e.truck_id] || 0;
    balances[e.truck_id] += e.type === "recharge" ? Number(e.amount) : -Number(e.amount);
  });

  return (
    <div>
      <PageHeader title="FASTag" subtitle="Recharges & toll deductions with per-truck balance." testId="fastag-header" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {trucks.slice(0, 4).map(t => (
          <StatTile key={t.id} testId={`fastag-balance-${t.id}`} label={t.reg_number} value={inr(balances[t.id] || 0)} sub="Balance" accent={balances[t.id] < 1000 ? "secondary" : "primary"} />
        ))}
      </div>
      <CrudTable
        endpoint="fastag"
        title="FASTag Entry"
        testIdPrefix="fastag"
        initial={{ type: "recharge" }}
        fields={[
          { key: "truck_id", label: "Truck", type: "select", required: true, options: trucks.map(t => ({ value: t.id, label: t.reg_number })) },
          { key: "date", label: "Date", type: "date", required: true },
          { key: "type", label: "Type", type: "select", options: ["recharge", "toll"] },
          { key: "amount", label: "Amount (₹)", type: "number", required: true },
          { key: "location", label: "Location / Plaza" },
        ]}
        columns={[
          { key: "date", label: "Date" },
          { key: "truck_id", label: "Truck", render: (v) => trucks.find(t => t.id === v)?.reg_number || "—" },
          { key: "type", label: "Type", render: (v) => <span className={`uppercase text-[10px] font-mono-tab tracking-widest ${v === "recharge" ? "text-green-500" : "text-yellow-600"}`}>{v}</span> },
          { key: "amount", label: "Amount", render: inr },
          { key: "location", label: "Location" },
        ]}
      />
    </div>
  );
}
