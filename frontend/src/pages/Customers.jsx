import React from "react";
import CrudTable from "@/components/CrudTable";
import { PageHeader } from "@/components/Shared";

export default function Customers() {
  return (
    <div>
      <PageHeader title="Customers & Brokers" subtitle="Consignors, brokers, direct customers — one directory." testId="customers-header" />
      <CrudTable
        endpoint="customers"
        title="Customer"
        testIdPrefix="customers"
        initial={{ type: "customer" }}
        fields={[
          { key: "name", label: "Name", required: true },
          { key: "type", label: "Type", type: "select", options: ["customer", "consignor", "broker"] },
          { key: "contact_person", label: "Contact Person" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "gstin", label: "GSTIN" },
          { key: "address", label: "Address", type: "textarea", full: true },
        ]}
        columns={[
          { key: "name", label: "Name", render: (v) => <span className="font-medium">{v}</span> },
          { key: "type", label: "Type", render: (v) => <span className="uppercase text-[10px] font-mono-tab tracking-widest text-primary">{v}</span> },
          { key: "contact_person", label: "Contact" },
          { key: "phone", label: "Phone" },
          { key: "gstin", label: "GSTIN", render: (v) => <span className="font-mono-tab text-xs">{v || "—"}</span> },
        ]}
      />
    </div>
  );
}
